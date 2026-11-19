"""Bounded local decoding for short, single-speaker video clips."""
import io
import json
import math
import shutil
import subprocess  # nosec B404: local media utilities with fixed argument lists
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image

MAX_BYTES = 10 * 1024 * 1024
FRACTIONS = {"midpoint": (0.5,), "sequence": (0.25, 0.5, 0.75)}
# FLV is needed for the official CREMA-D recordings. Playlists are excluded.
INPUT_OPTIONS = ["-protocol_whitelist", "file,pipe", "-format_whitelist", "mov,matroska,webm,flv"]


class InvalidClip(ValueError):
    pass


class DecoderUnavailable(RuntimeError):
    pass


def _run(executable, arguments):
    program = shutil.which(executable)
    if not program:
        raise DecoderUnavailable("Install FFmpeg and ffprobe to analyze video.")
    try:
        return subprocess.run(  # nosec B603: program resolved locally; no shell or user-supplied arguments
            [program, "-v", "error", *arguments], check=True, timeout=12,
            stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
        ).stdout
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError) as error:
        raise InvalidClip("Could not decode this clip. Use a short video with one face and audible speech.") from error


def decode_clip(content, sampling):
    if sampling not in FRACTIONS:
        raise InvalidClip("Choose midpoint or three-frame video sampling.")
    if not content or len(content) > MAX_BYTES:
        raise InvalidClip("Video must be nonempty and at most 10 MB.")
    with tempfile.TemporaryDirectory(prefix="mindsense-video-") as folder:
        path = Path(folder) / "clip"
        path.write_bytes(content)
        info = json.loads(_run("ffprobe", [
            *INPUT_OPTIONS, "-show_entries", "format=duration:stream=codec_type,width,height",
            "-of", "json", str(path),
        ]))
        streams = info.get("streams", [])
        pictures = [stream for stream in streams if stream.get("codec_type") == "video"]
        audio_count = sum(stream.get("codec_type") == "audio" for stream in streams)
        if len(pictures) != 1 or audio_count != 1:
            raise InvalidClip("Use a video containing one video track and one speech track.")
        try:
            duration = float(info["format"]["duration"])
        except (KeyError, TypeError, ValueError) as error:
            raise InvalidClip("The video duration could not be determined.") from error
        if not math.isfinite(duration) or not 0.1 <= duration <= 30:
            raise InvalidClip("Video must last between 0.1 and 30 seconds.")
        width, height = pictures[0].get("width", 0), pictures[0].get("height", 0)
        if min(width, height) < 1 or width * height > 3840 * 2160:
            raise InvalidClip("Video resolution must be at most 8.3 megapixels.")
        options = ["-nostdin", "-threads", "1", *INPUT_OPTIONS]
        frames = []
        for fraction in FRACTIONS[sampling]:
            timestamp = duration * fraction
            data = _run("ffmpeg", [
                *options, "-ss", f"{timestamp:.6f}", "-i", str(path), "-map", "0:v:0",
                "-frames:v", "1", "-vf", "scale=w='min(960,iw)':h='min(960,ih)':force_original_aspect_ratio=decrease",
                "-threads", "1", "-c:v", "png", "-f", "image2pipe", "pipe:1",
            ])
            if data:
                with Image.open(io.BytesIO(data)) as frame:
                    frames.append((fraction, frame.convert("RGB")))
        pcm = _run("ffmpeg", [
            *options, "-i", str(path), "-map", "0:a:0", "-t", "30.1", "-ac", "1",
            "-ar", "16000", "-f", "s16le", "pipe:1",
        ])
    waveform = np.frombuffer(pcm, dtype="<i2").astype(np.float32) / 32768.0
    return waveform, frames, duration
