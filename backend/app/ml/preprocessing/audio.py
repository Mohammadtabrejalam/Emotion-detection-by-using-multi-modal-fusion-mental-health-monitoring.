import numpy as np
import scipy.io.wavfile as wav
import scipy.fftpack as fftpack
import io
import subprocess
import os
import tempfile

def convert_to_wav_ffmpeg(input_bytes: bytes, file_ext: str) -> bytes:
    """
    Attempts to convert input audio bytes of any format (webm, mp3, m4a, ogg) to 16kHz mono WAV using ffmpeg.
    """
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_in:
        temp_in.write(input_bytes)
        temp_in_path = temp_in.name

    temp_out_path = temp_in_path + ".wav"
    try:
        # Call ffmpeg to convert to 16kHz WAV, mono, 16-bit PCM
        cmd = [
            "ffmpeg", "-y", "-i", temp_in_path,
            "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", temp_out_path
        ]
        # Hide output window on Windows
        startupinfo = None
        if os.name == 'nt':
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, startupinfo=startupinfo)
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg failed: {result.stderr.decode('utf-8', errors='ignore')}")
            
        with open(temp_out_path, "rb") as f:
            wav_bytes = f.read()
        return wav_bytes
    finally:
        # Cleanup
        if os.path.exists(temp_in_path):
            os.remove(temp_in_path)
        if os.path.exists(temp_out_path):
            os.remove(temp_out_path)

def extract_mfcc(signal: np.ndarray, samplerate: int, num_cepstra: int = 13,
                 frame_size: float = 0.025, frame_stride: float = 0.010,
                 num_filters: int = 26, nfft: int = 512) -> np.ndarray:
    """
    Extracts MFCC features from a raw 1D audio signal using pure NumPy/SciPy.
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
    mag_frames = np.absolute(np.fft.rfft(frames, nfft))  # Magnitude Spectrum
    pow_frames = ((1.0 / nfft) * ((mag_frames) ** 2))    # Power Spectrum
    
    # 5. Filterbanks (Mel Scale)
    low_freq_mel = 0
    # Convert samplerate to Mel
    high_freq_mel = (2595 * np.log10(1 + (samplerate / 2) / 700))
    mel_points = np.linspace(low_freq_mel, high_freq_mel, num_filters + 2)
    # Convert Mel points back to Hz
    hz_points = (700 * (10**(mel_points / 2595) - 1))
    bin = np.floor((nfft + 1) * hz_points / samplerate)
    
    fbank = np.zeros((num_filters, int(np.floor(nfft / 2 + 1))))
    for m in range(1, num_filters + 1):
        f_m_minus = int(bin[m - 1])   # left
        f_m = int(bin[m])             # center
        f_m_plus = int(bin[m + 1])    # right
        
        for k in range(f_m_minus, f_m):
            fbank[m - 1, k] = (k - bin[m - 1]) / (bin[m] - bin[m - 1])
        for k in range(f_m, f_m_plus):
            fbank[m - 1, k] = (bin[m + 1] - k) / (bin[m + 1] - bin[m])
            
    filter_banks = np.dot(pow_frames, fbank.T)
    filter_banks = np.where(filter_banks == 0, np.finfo(float).eps, filter_banks) # Numerical Stability
    filter_banks = 20 * np.log10(filter_banks) # dB scale
    
    # 6. Discrete Cosine Transform (DCT) to get MFCCs
    # Apply DCT-II and keep the first num_cepstra
    mfcc = fftpack.dct(filter_banks, type=2, axis=1, norm='ortho')[:, :num_cepstra]
    
    # 7. Mean Normalization
    mfcc -= (np.mean(mfcc, axis=0) + 1e-8)
    
    return mfcc.astype(np.float32)

def preprocess_audio(audio_bytes: bytes, file_ext: str = ".wav") -> np.ndarray:
    """
    Decodes audio bytes, extracts MFCC features, and returns a feature representation.
    Returns: numpy array of shape (num_frames, 13)
    """
    wav_bytes = audio_bytes
    # If the file format is not a standard wav, try to convert it using ffmpeg
    if file_ext.lower() not in [".wav", "audio/wav", "audio/wave"]:
        try:
            wav_bytes = convert_to_wav_ffmpeg(audio_bytes, file_ext)
        except Exception as e:
            print(f"Warning: ffmpeg conversion failed. Attempting to parse as raw wav. Error: {e}")
            
    # Read WAV file
    try:
        rate, signal = wav.read(io.BytesIO(wav_bytes))
        
        # Convert stereo to mono
        if len(signal.shape) > 1:
            signal = np.mean(signal, axis=1)
            
        # Normalize amplitude to [-1.0, 1.0]
        if signal.dtype == np.int16:
            signal = signal / 32768.0
        elif signal.dtype == np.int32:
            signal = signal / 2147483648.0
        elif signal.dtype == np.uint8:
            signal = (signal - 128.0) / 128.0
            
        # Downsample/Resample if rate is not 16000
        # If resampling library is not available, we can do simple decimation or linear interpolation
        if rate != 16000 and len(signal) > 0:
            num_samples = int(len(signal) * 16000 / rate)
            signal = np.interp(np.linspace(0, len(signal) - 1, num_samples), np.arange(len(signal)), signal)
            rate = 16000
            
        # Extract features
        mfccs = extract_mfcc(signal, rate)
        
        # Pad or truncate frames to a fixed size, e.g. 200 frames (approx 2 seconds of audio)
        target_frames = 200
        if mfccs.shape[0] < target_frames:
            pad_width = ((0, target_frames - mfccs.shape[0]), (0, 0))
            mfccs = np.pad(mfccs, pad_width, mode='constant')
        else:
            mfccs = mfccs[:target_frames, :]
            
        return mfccs
    except Exception as e:
        print(f"Error reading WAV: {e}")
        # Return a mock zero feature matrix if corrupted, so we never crash
        return np.zeros((200, 13), dtype=np.float32)
