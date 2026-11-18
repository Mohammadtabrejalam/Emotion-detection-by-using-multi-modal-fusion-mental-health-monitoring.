"""Video decoder boundaries and HTTP input selection. Fixtures contain no model predictions."""
import shutil
import subprocess

import pytest
from fastapi.testclient import TestClient
from backend.app.inference.video import decode_clip, InvalidClip
from backend.app.main import app

client = TestClient(app)


@pytest.mark.parametrize("form,expected", [
    ({"text": "different moment"}, "on its own"),
    ({"video_mode": "unknown"}, "Unknown video"),
])
def test_video_rejects_ambiguous_inputs_before_inference(form, expected):
    response = client.post("/api/analyze", files={"video": ("clip.mp4", b"invalid", "video/mp4")}, data=form)
    assert expected in response.json()["error"]["message"]


def test_oversize_video_rejected():
    response = client.post("/api/analyze", files={"video": ("clip.mp4", b"0" * (10 * 1024 * 1024 + 1))})
    assert response.status_code == 413


@pytest.mark.skipif(not shutil.which("ffmpeg") or not shutil.which("ffprobe"), reason="Needs system FFmpeg")
def test_video_sampling_and_no_speech_track(tmp_path):
    path = tmp_path / "signal.mp4"
    # Test pattern and sine wave verify the media decoder only.
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-f", "lavfi", "-i", "testsrc2=size=160x100:rate=12",
                    "-f", "lavfi", "-i", "sine=frequency=440:sample_rate=16000", "-t", "1",
                    "-c:v", "mpeg4", "-c:a", "aac", str(path)], check=True)
    audio, frames, duration = decode_clip(path.read_bytes(), "sequence")
    assert 15000 < len(audio) < 17000 and duration == pytest.approx(1.0, abs=0.1)
    assert [f for f, _ in frames] == [0.25, 0.5, 0.75]
    assert len({frame.tobytes() for _, frame in frames}) == 3
    silent = tmp_path / "no-track.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-an", "-c:v", "copy", str(silent)], check=True)
    with pytest.raises(InvalidClip, match="speech track"):
        decode_clip(silent.read_bytes(), "midpoint")
