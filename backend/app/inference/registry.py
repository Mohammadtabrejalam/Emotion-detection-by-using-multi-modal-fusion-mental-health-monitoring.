from pathlib import Path
import os
from dotenv import load_dotenv
load_dotenv()

LABELS = ('happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral')
MODEL_ROOT = Path(os.environ.get('MINDSENSE_MODELS_DIR', Path(__file__).resolve().parents[3] / 'models')).resolve()
MODELS = {
    'text': {'repo': 'SamLowe/roberta-base-go_emotions', 'revision': 'd75048347613a25d77de8cf6412eaae9fa7b26be', 'license': 'MIT', 'weight': 'model.safetensors'},
    'audio': {'repo': 'superb/wav2vec2-base-superb-er', 'revision': '441a7599c3b22107314dcbd9166621c5c83f2cc5', 'license': 'Apache-2.0', 'weight': 'pytorch_model.bin'},
    'image': {'repo': 'trpakov/vit-face-expression', 'revision': 'ef0bc6fc34241b6587e7e009e7711357be28c024', 'license': 'Apache-2.0', 'weight': 'model.safetensors'},
}
# Explicit Ekman-style grouping. This is a serving adapter, not retraining/calibration.
TEXT_GROUPS = {
    'happy': ['admiration', 'amusement', 'approval', 'caring', 'desire', 'excitement', 'gratitude', 'joy', 'love', 'optimism', 'pride', 'relief'],
    'sad': ['disappointment', 'embarrassment', 'grief', 'remorse', 'sadness'],
    'angry': ['anger', 'annoyance', 'disapproval'],
    'fear': ['fear', 'nervousness'], 'surprise': ['confusion', 'curiosity', 'realization', 'surprise'],
    'disgust': ['disgust'], 'neutral': ['neutral'],
}
ALIASES = {'ang': 'angry', 'hap': 'happy', 'neu': 'neutral', 'sad': 'sad', 'anger': 'angry', 'joy': 'happy', 'sadness': 'sad'}
