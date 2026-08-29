import sys
import os
import numpy as np

# Ensure app package is in python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ml.preprocessing.text import tokenize, check_crisis_keywords, clean_text
from app.ml.preprocessing.audio import preprocess_audio
from app.ml.preprocessing.vision import preprocess_image

def test_clean_text():
    assert clean_text("Hello, World!!!") == "hello world"
    assert clean_text("  I'm   stressed-out... ") == "i'm stressed-out"

def test_tokenize():
    tokens = tokenize("I am feeling fine and okay", max_length=10)
    assert len(tokens) == 10
    assert tokens[0] == 2  # "i"
    assert tokens[1] == 19 # "am"
    assert tokens[6] == 0  # padding index

def test_crisis_keywords():
    assert check_crisis_keywords("I want to commit suicide") is True
    assert check_crisis_keywords("I am just tired and going to sleep") is False
    assert check_crisis_keywords("Self-harm is dangerous") is True

def test_audio_preprocessing_fallback():
    # Test that empty or corrupted audio returns a fallback matrix of shape (200, 13)
    corrupted_bytes = b"not_a_wav_file_at_all"
    mfccs = preprocess_audio(corrupted_bytes, ".wav")
    assert mfccs.shape == (200, 13)
    assert np.all(mfccs == 0)

def test_vision_preprocessing_no_face():
    # Test with blank image bytes (or 1x1 image)
    blank_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
    face_crop, status = preprocess_image(blank_png)
    assert face_crop is None
    assert status == "no_face"
