"""
High-Fidelity Audio Preprocessing & MFCC Extraction Engine — MindSense
Version: 1.2.0 (Direct Streaming & Resilient PCM Extraction)
"""

import io
import os
import logging
import subprocess  # nosec: B404 # subprocess required for direct FFmpeg audio extraction
import tempfile
from pathlib import Path
from typing import Union, Optional
import numpy as np
import scipy.io.wavfile as wav
import scipy.fftpack as fftpack

logger = logging.getLogger("mindsense.audio")


def extract_audio_waveform(
    source: Union[str, Path, bytes],
    target_sample_rate: int = 16000
) -> np.ndarray:
    """
    Extracts 1D normalized float32 audio waveform [-1.0, 1.0] at target_sample_rate (mono)
    directly from an MP4/WAV/MP3/M4A/etc file path or in-memory audio bytes.
    Directly streams raw PCM from FFmpeg stdout to avoid temporary WAV headers or disk degradation.
    """
    startupinfo = None
    if os.name == 'nt':
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

    # Case 1: Direct File Path (Preferred — zero temp files, full seeking support for MP4)
    if isinstance(source, (str, Path)):
        file_path = Path(source).resolve()
        if not file_path.exists():
            raise FileNotFoundError(f"Audio file not found: {file_path}")
        if file_path.stat().st_size == 0:
            raise ValueError(f"Audio file is 0 bytes: {file_path}")

        cmd = [
            "ffmpeg", "-y", "-v", "error",
            "-i", str(file_path),
            "-vn", "-ar", str(target_sample_rate), "-ac", "1",
            "-f", "s16le", "pipe:1"
        ]

        result = subprocess.run(  # nosec: B603 # fixed argument list with validated file path
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            startupinfo=startupinfo
        )

        if result.returncode != 0:
            err_msg = result.stderr.decode("utf-8", errors="ignore").strip()
            raise RuntimeError(f"FFmpeg audio extraction failed for '{file_path}': {err_msg}")

        if len(result.stdout) == 0:
            raise RuntimeError(f"FFmpeg extracted 0 audio bytes from '{file_path}' (possibly no audio stream)")

        signal = np.frombuffer(result.stdout, dtype=np.int16).astype(np.float32) / 32768.0
        return signal

    # Case 2: In-Memory Bytes
    elif isinstance(source, bytes):
        if len(source) == 0:
            raise ValueError("Audio byte buffer is empty (0 bytes)")

        # Fast path: If standard WAV format (starts with 'RIFF'), try scipy directly
        if source[:4] == b"RIFF":
            try:
                rate, raw_sig = wav.read(io.BytesIO(source))
                if len(raw_sig.shape) > 1:
                    raw_sig = np.mean(raw_sig, axis=1)

                if raw_sig.dtype == np.int16:
                    sig = raw_sig.astype(np.float32) / 32768.0
                elif raw_sig.dtype == np.int32:
                    sig = raw_sig.astype(np.float32) / 2147483648.0
                elif raw_sig.dtype == np.uint8:
                    sig = (raw_sig.astype(np.float32) - 128.0) / 128.0
                else:
                    sig = raw_sig.astype(np.float32)

                if rate != target_sample_rate and len(sig) > 0:
                    num_samples = int(len(sig) * target_sample_rate / rate)
                    sig = np.interp(np.linspace(0, len(sig) - 1, num_samples), np.arange(len(sig)), sig)
                return sig.astype(np.float32)
            except Exception as err:
                logger.debug("In-memory WAV parsing fallback to FFmpeg: %s", err)

        # Fallback for complex container formats in memory (e.g., MP4/AAC/OGG):
        # Write to temporary file and CLOSE handle immediately so FFmpeg can seek on Windows
        suffix = ".mp4" if (b"ftyp" in source[:32] or b"moov" in source[:1024]) else ".audio"
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        temp_path = temp_file.name
        try:
            temp_file.write(source)
            temp_file.flush()
            temp_file.close()

            cmd = [
                "ffmpeg", "-y", "-v", "error",
                "-i", temp_path,
                "-vn", "-ar", str(target_sample_rate), "-ac", "1",
                "-f", "s16le", "pipe:1"
            ]

            result = subprocess.run(  # nosec: B603 # fixed argument list with system temporary file path
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                startupinfo=startupinfo
            )

            if result.returncode != 0:
                err_msg = result.stderr.decode("utf-8", errors="ignore").strip()
                raise RuntimeError(f"FFmpeg failed to decode audio bytes: {err_msg}")

            if len(result.stdout) == 0:
                raise RuntimeError("FFmpeg extracted 0 audio bytes from bytes input")

            signal = np.frombuffer(result.stdout, dtype=np.int16).astype(np.float32) / 32768.0
            return signal
        finally:
            if os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except OSError as err:
                    logger.debug("Failed to remove temporary file %s: %s", temp_path, err)

    else:
        raise TypeError(f"Unsupported audio source type: {type(source)}")


def convert_to_wav_ffmpeg(input_bytes: bytes, file_ext: str = ".wav") -> bytes:
    """
    Converts audio bytes to 16kHz mono WAV using ffmpeg.
    Closes temporary file handle before invoking subprocess for Windows compatibility.
    """
    temp_in = tempfile.NamedTemporaryFile(delete=False, suffix=file_ext)
    temp_in_path = temp_in.name
    temp_out_path = temp_in_path + ".wav"

    try:
        temp_in.write(input_bytes)
        temp_in.flush()
        temp_in.close()

        cmd = [
            "ffmpeg", "-y", "-i", temp_in_path,
            "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", temp_out_path
        ]
        startupinfo = None
        if os.name == 'nt':
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

        result = subprocess.run(  # nosec: B603 # fixed argument list with system temporary file path
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            startupinfo=startupinfo
        )
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg failed: {result.stderr.decode('utf-8', errors='ignore')}")

        with open(temp_out_path, "rb") as f:
            wav_bytes = f.read()
        return wav_bytes
    finally:
        if os.path.exists(temp_in_path):
            try:
                os.remove(temp_in_path)
            except OSError as err:
                logger.debug("Failed to remove temporary file %s: %s", temp_in_path, err)
        if os.path.exists(temp_out_path):
            try:
                os.remove(temp_out_path)
            except OSError as err:
                logger.debug("Failed to remove temporary file %s: %s", temp_out_path, err)


def extract_mfcc(
    signal: np.ndarray,
    samplerate: int = 16000,
    num_cepstra: int = 13,
    frame_size: float = 0.025,
    frame_stride: float = 0.010,
    num_filters: int = 26,
    nfft: int = 512
) -> np.ndarray:
    """
    Extracts MFCC features from a raw 1D audio signal using pure NumPy/SciPy.
    Returns: numpy array of shape (num_frames, num_cepstra) in float32.
    """
    if len(signal) == 0:
        return np.zeros((1, num_cepstra), dtype=np.float32)

    # 1. Pre-emphasis
    signal = np.append(signal[0], signal[1:] - 0.97 * signal[:-1])

    # 2. Framing
    frame_length = int(round(frame_size * samplerate))
    frame_step = int(round(frame_stride * samplerate))
    signal_length = len(signal)

    if signal_length <= frame_length:
        num_frames = 1
    else:
        num_frames = int(np.ceil(float(np.abs(signal_length - frame_length)) / frame_step)) + 1

    pad_signal_length = num_frames * frame_step + frame_length
    z = np.zeros((pad_signal_length - signal_length))
    pad_signal = np.append(signal, z)

    indices = np.tile(np.arange(0, frame_length), (num_frames, 1)) + \
              np.tile(np.arange(0, num_frames * frame_step, frame_step), (frame_length, 1)).T
    frames = pad_signal[indices.astype(np.int32, copy=False)]

    # 3. Windowing (Hamming Window)
    frames *= np.hamming(frame_length)

    # 4. Fourier Transform and Power Spectrum
    mag_frames = np.absolute(np.fft.rfft(frames, nfft))
    pow_frames = ((1.0 / nfft) * ((mag_frames) ** 2))

    # 5. Filterbanks (Mel Scale)
    low_freq_mel = 0
    high_freq_mel = (2595 * np.log10(1 + (samplerate / 2) / 700))
    mel_points = np.linspace(low_freq_mel, high_freq_mel, num_filters + 2)
    hz_points = (700 * (10 ** (mel_points / 2595) - 1))
    bin = np.floor((nfft + 1) * hz_points / samplerate)

    fbank = np.zeros((num_filters, int(np.floor(nfft / 2 + 1))))
    for m in range(1, num_filters + 1):
        f_m_minus = int(bin[m - 1])
        f_m = int(bin[m])
        f_m_plus = int(bin[m + 1])

        for k in range(f_m_minus, f_m):
            fbank[m - 1, k] = (k - bin[m - 1]) / (bin[m] - bin[m - 1])
        for k in range(f_m, f_m_plus):
            fbank[m - 1, k] = (bin[m + 1] - k) / (bin[m + 1] - bin[m])

    filter_banks = np.dot(pow_frames, fbank.T)
    filter_banks = np.where(filter_banks == 0, np.finfo(float).eps, filter_banks)
    filter_banks = 20 * np.log10(filter_banks)

    # 6. Discrete Cosine Transform (DCT) to get MFCCs
    mfcc = fftpack.dct(filter_banks, type=2, axis=1, norm='ortho')[:, :num_cepstra]

    # 7. Mean Normalization
    mfcc -= (np.mean(mfcc, axis=0) + 1e-8)

    return mfcc.astype(np.float32)


def preprocess_audio(
    audio_source: Union[str, Path, bytes],
    file_ext: Optional[str] = None,
    target_frames: int = 200,
    num_mfcc: int = 13,
    strict: bool = False
) -> np.ndarray:
    """
    Decodes audio source (Path, str, or bytes), extracts MFCC features,
    and returns a standardized representation of shape (target_frames, num_mfcc).
    """
    try:
        signal = extract_audio_waveform(audio_source, target_sample_rate=16000)
        if len(signal) == 0:
            if strict:
                raise RuntimeError("Extracted audio waveform is empty (0 samples)")
            return np.zeros((target_frames, num_mfcc), dtype=np.float32)

        mfccs = extract_mfcc(signal, samplerate=16000, num_cepstra=num_mfcc)

        # Pad or truncate to fixed frame length
        if mfccs.shape[0] < target_frames:
            pad_width = ((0, target_frames - mfccs.shape[0]), (0, 0))
            mfccs = np.pad(mfccs, pad_width, mode='constant')
        else:
            mfccs = mfccs[:target_frames, :num_mfcc]

        return mfccs.astype(np.float32)

    except Exception as e:
        if strict:
            raise RuntimeError(f"Audio preprocessing failed: {e}") from e
        return np.zeros((target_frames, num_mfcc), dtype=np.float32)
