"""Evaluate actual installed models; write metrics only from completed inference.

Text: official MELD CSV. Audiovisual: RAVDESS full-AV videos, midpoint frame.
No model training or threshold selection uses these evaluation labels.
"""
import argparse
import csv
import hashlib
import io
import json
import platform
from pathlib import Path
from datetime import datetime, timezone
import numpy as np
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix
from backend.app.inference.service import engine, InputError
from backend.app.inference.registry import LABELS, MODELS, ALIASES


def metrics(actual, predicted, labels):
    return {'samples': len(actual), 'accuracy': accuracy_score(actual, predicted),
            'macro_f1': f1_score(actual, predicted, labels=labels, average='macro', zero_division=0),
            'weighted_f1': f1_score(actual, predicted, labels=labels, average='weighted', zero_division=0),
            'per_class': classification_report(actual, predicted, labels=labels, output_dict=True, zero_division=0),
            'labels': list(labels), 'confusion_matrix': confusion_matrix(actual, predicted, labels=labels).tolist()}


def main():
    parser = argparse.ArgumentParser()
    inputs = parser.add_mutually_exclusive_group(required=True)
    inputs.add_argument('--meld-csv', type=Path)
    inputs.add_argument('--ravdess-videos', type=Path)
    parser.add_argument('--limit', type=int, default=0, help='0 means all eligible records')
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    rows, failures = [], []
    if args.meld_csv:
        dataset = list(csv.DictReader(args.meld_csv.open(encoding='utf-8-sig')))
        for i, row in enumerate(dataset[:args.limit or None]):
            truth = ALIASES.get(row['Emotion'].lower(), row['Emotion'].lower())
            prediction = engine.analyze(text=row['Utterance'])
            rows.append({'id': f"{row['Dialogue_ID']}_{row['Utterance_ID']}", 'true': truth, 'text': prediction['final_emotion']})
            if i % 100 == 0: print(f'Text: {i}/{len(dataset)}', flush=True)
        source = {'dataset': 'MELD official test CSV', 'sha256': hashlib.sha256(args.meld_csv.read_bytes()).hexdigest(),
                  'url': 'https://github.com/declare-lab/MELD', 'split': 'test', 'evaluation_type': 'cross-dataset transfer from GoEmotions, seven-class serving adapter'}
    else:
        import cv2
        from PIL import Image
        from backend.app.ml.preprocessing.audio import extract_audio_waveform
        mapping = {'01': 'neutral', '03': 'happy', '04': 'sad', '05': 'angry', '06': 'fear', '07': 'disgust', '08': 'surprise'}
        paths = sorted(args.ravdess_videos.rglob('01-01-*.mp4'))[:args.limit or None]
        for path in paths:
            truth = mapping.get(path.stem.split('-')[2])
            if not truth: continue  # calm is not collapsed into neutral
            cap = cv2.VideoCapture(str(path))
            cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, int(cap.get(cv2.CAP_PROP_FRAME_COUNT)//2)))
            ok, frame = cap.read(); cap.release()
            if not ok:
                failures.append({'id': path.name, 'reason': 'frame_decode'}); continue
            buffer = io.BytesIO(); Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)).save(buffer, format='PNG')
            try:
                result = engine.analyze(audio=path.read_bytes(), image=buffer.getvalue())
            except InputError as exc:
                failures.append({'id': path.name, 'reason': str(exc)}); continue
            rows.append({'id': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'true': truth,
                         'audio': result['modality_predictions']['audio']['emotion'],
                         'image': result['modality_predictions']['image']['emotion'], 'fusion': result['final_emotion']})
            print(f'AV: {len(rows)} {path.name}', flush=True)
        source = {'dataset': 'RAVDESS acted speech audiovisual subset', 'url': 'https://zenodo.org/records/1188976',
                  'license': 'CC BY-NC-SA 4.0', 'frame_selection': 'fixed midpoint', 'excluded_label': 'calm',
                  'actors': sorted({r['id'].split('-')[-1].split('.')[0] for r in rows}),
                  'evaluation_type': 'external diagnostic subset; not a population-level benchmark'}
    if not rows:
        raise RuntimeError('No completed real-model predictions; no metric report written.')
    results = {}
    for mode in ('text', 'audio', 'image', 'fusion'):
        eligible = [r for r in rows if mode in r and (mode != 'audio' or r['true'] in ('happy','sad','angry','neutral'))]
        if eligible:
            labels = ('happy','sad','angry','neutral') if mode == 'audio' else LABELS
            results[mode] = metrics([r['true'] for r in eligible], [r[mode] for r in eligible], labels)
    report = {'measured_at': datetime.now(timezone.utc).isoformat(), 'source': source, 'models': MODELS,
              'python': platform.python_version(), 'results': results, 'failures': failures, 'predictions': rows,
              'limitations': ['No calibration or clinical validation.', 'No thresholds or model weights tuned on this evaluation.',
                             'Audio metrics exclude labels outside its four-class label space; fusion/image use seven classes.']}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2))
    print(json.dumps(results, indent=2), flush=True)

if __name__ == '__main__': main()
