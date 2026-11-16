"""No network calls, random weights, or heuristic fallbacks during serving."""
import io
import threading
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError
from .registry import LABELS, MODELS, MODEL_ROOT, TEXT_GROUPS, ALIASES
from ..ml.preprocessing.audio import extract_audio_waveform


class InputError(ValueError):
    pass


class ModelUnavailable(RuntimeError):
    pass


def normalize(scores):
    values = np.asarray(list(scores.values()), dtype=float)
    if not len(values) or not np.isfinite(values).all() or (values < 0).any() or values.sum() <= 0:
        raise ValueError('Model returned invalid scores')
    total = float(values.sum())
    return {label: float(value / total) for label, value in scores.items()}


def fuse(predictions):
    """Equal-weight late fusion over each label's supporting modalities."""
    if not predictions:
        raise InputError('Provide at least one input modality.')
    scores = {}
    for label in LABELS:
        available = [p['probabilities'][label] for p in predictions.values() if label in p['probabilities']]
        if available:
            scores[label] = sum(available) / len(available)
    return normalize(scores)


def face_crop(image_bytes):
    import cv2
    try:
        with Image.open(io.BytesIO(image_bytes)) as source:
            if source.width * source.height > 12_000_000:
                raise InputError('Image must be at most 12 megapixels.')
            image = ImageOps.exif_transpose(source).convert('RGB')
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as exc:
        raise InputError('Upload a valid PNG, JPEG, or WebP image.') from exc
    detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    if detector.empty():
        raise ModelUnavailable('Face detector is unavailable.')
    # Detect at bounded resolution, then crop the original RGB image.
    thumbnail = image.copy()
    thumbnail.thumbnail((1000, 1000))
    boxes = detector.detectMultiScale(cv2.cvtColor(np.array(thumbnail), cv2.COLOR_RGB2GRAY), 1.1, 5, minSize=(40, 40))
    if len(boxes) != 1:
        raise InputError('Upload an image containing exactly one clearly visible face.')
    x, y, w, h = boxes[0]
    sx, sy = image.width / thumbnail.width, image.height / thumbnail.height
    return image.crop((int(x*sx), int(y*sy), int((x+w)*sx), int((y+h)*sy)))


class EmotionEngine:
    def __init__(self, root=MODEL_ROOT):
        self.root = root
        self.loaded = {}
        self.errors = {}
        self.lock = threading.RLock()

    def status(self):
        return {kind: {**spec, 'installed': (self.root/kind/spec['weight']).is_file() and (self.root/kind/'config.json').is_file(),
                       'loaded': kind in self.loaded, 'error': self.errors.get(kind)} for kind, spec in MODELS.items()}

    def _load(self, kind):
        if kind in self.loaded:
            return self.loaded[kind]
        if not self.status()[kind]['installed']:
            raise ModelUnavailable(f'{kind.title()} model is not installed. Run python -m scripts.download_models --modalities {kind}.')
        try:
            from transformers import (AutoTokenizer, AutoFeatureExtractor, AutoImageProcessor,
                AutoModelForSequenceClassification, AutoModelForAudioClassification, AutoModelForImageClassification)
            path = str(self.root/kind)
            kwargs = {'local_files_only': True, 'trust_remote_code': False}
            # These are local directories only; pinned downloads happen in scripts/download_models.py.
            if kind == 'text':
                processor = AutoTokenizer.from_pretrained(path, **kwargs)  # nosec B615
                model = AutoModelForSequenceClassification.from_pretrained(path, **kwargs)  # nosec B615
            elif kind == 'audio':
                processor = AutoFeatureExtractor.from_pretrained(path, **kwargs)  # nosec B615
                model = AutoModelForAudioClassification.from_pretrained(path, **kwargs)  # nosec B615
            else:
                processor = AutoImageProcessor.from_pretrained(path, use_fast=False, **kwargs)  # nosec B615
                model = AutoModelForImageClassification.from_pretrained(path, **kwargs)  # nosec B615
            model.eval()
            self.loaded[kind] = (processor, model)
            self.errors.pop(kind, None)
            return processor, model
        except Exception as exc:
            self.errors[kind] = 'Checkpoint could not be loaded; check installation and dependency versions.'
            raise ModelUnavailable(self.errors[kind]) from exc

    def _predict(self, kind, value):
        import torch
        processor, model = self._load(kind)
        if kind == 'text':
            inputs = processor(value, return_tensors='pt', truncation=True, max_length=256)
        elif kind == 'audio':
            inputs = processor(value, sampling_rate=16000, return_tensors='pt', padding=True)
        else:
            inputs = processor(images=value, return_tensors='pt')
        with torch.inference_mode():
            logits = model(**inputs).logits[0]
            vector = torch.sigmoid(logits) if kind == 'text' else torch.softmax(logits, -1)
        raw = {model.config.id2label[i].lower(): float(v) for i, v in enumerate(vector.tolist())}
        if kind == 'text':
            # Max avoids giving groups with more fine-grained labels an automatic sum advantage.
            scores = {label: max(raw[k] for k in group) for label, group in TEXT_GROUPS.items()}
        else:
            scores = {ALIASES.get(k, k): v for k, v in raw.items()}
            if not set(scores).issubset(LABELS):
                raise ModelUnavailable('Checkpoint label contract is incompatible.')
        probs = normalize(scores)
        top = max(probs, key=probs.get)
        return {'emotion': top, 'confidence': probs[top], 'probabilities': probs,
                'raw_scores': raw, 'model': MODELS[kind]['repo'], 'revision': MODELS[kind]['revision']}

    def analyze(self, text=None, audio=None, image=None):
        values = {}
        if text and text.strip():
            if len(text) > 5000:
                raise InputError('Text must be at most 5,000 characters.')
            values['text'] = text.strip()
        if audio is not None:
            try:
                waveform = extract_audio_waveform(audio)
            except Exception as exc:
                raise InputError('Audio could not be decoded. Use WAV or install FFmpeg for compressed audio.') from exc
            if not 1600 <= len(waveform) <= 480000:
                raise InputError('Audio must be between 0.1 and 30 seconds.')
            if not np.isfinite(waveform).all() or np.max(np.abs(waveform)) < 1e-5:
                raise InputError('Audio is silent or invalid. Record audible speech.')
            values['audio'] = waveform
        if image is not None:
            values['image'] = face_crop(image)
        if not values:
            raise InputError('Provide text, recorded speech, or one facial image.')
        with self.lock:
            predictions = {kind: self._predict(kind, value) for kind, value in values.items()}
        probabilities = fuse(predictions)
        top = max(probabilities, key=probabilities.get)
        warnings = ['Scores are not calibrated probabilities of a person’s internal emotional state.']
        if 'text' in values:
            warnings.append('Text model supports English; only the first 256 tokens are analyzed.')
        if 'audio' in values:
            warnings.append('Speech model supports happy, sad, angry, and neutral only.')
        if len(set(p['emotion'] for p in predictions.values())) > 1:
            warnings.append('Modalities disagree. Review each result separately.')
        return {'final_emotion': top, 'confidence': probabilities[top], 'probabilities': probabilities,
                'modalities_used': list(predictions), 'modality_predictions': predictions,
                'model_version': 'published-late-fusion-v1', 'warnings': warnings,
                'fusion_method': 'Equal-weight, support-aware late fusion; not jointly trained or calibrated.'}

engine = EmotionEngine()
