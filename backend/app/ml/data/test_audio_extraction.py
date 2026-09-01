"""
Audio Extraction Validation & Smoke Test Suite — MindSense
Tests real MELD MP4 files across train, dev, and test splits.
Usage:
    python -m backend.app.ml.data.test_audio_extraction
"""

import sys
import os
from pathlib import Path
from typing import List, Dict, Any
import numpy as np

from .config import get_meld_root, AUDIO_SAMPLE_RATE, AUDIO_TARGET_FRAMES, AUDIO_NUM_MFCC
from .prepare_meld import inspect_media_streams
from ..preprocessing.audio import extract_audio_waveform, extract_mfcc, preprocess_audio


def run_audio_extraction_smoke_test() -> bool:
    meld_root = get_meld_root()
    print("=" * 80)
    print("MINDSENSE REAL MELD AUDIO EXTRACTION SMOKE TEST")
    print("=" * 80)
    print(f"MELD Root: {meld_root}")
    print(f"Target Specs: SampleRate={AUDIO_SAMPLE_RATE}Hz | Frames={AUDIO_TARGET_FRAMES} | MFCC_Dim={AUDIO_NUM_MFCC}")
    print("-" * 80)

    if not meld_root.exists():
        print(f"[ERROR] MELD Root directory does not exist: {meld_root}")
        return False

    # Define test candidate directories and sample files
    split_subdirs = [
        ("train", "train_splits", ["dia0_utt0.mp4", "dia0_utt1.mp4", "dia0_utt2.mp4", "dia1_utt0.mp4"]),
        ("val", "dev_splits_complete", ["dia0_utt0.mp4", "dia0_utt1.mp4", "dia1_utt0.mp4"]),
        ("test", "output_repeated_splits_test", ["dia0_utt0.mp4", "dia0_utt1.mp4", "dia1_utt0.mp4"])
    ]

    all_passed = True
    tested_count = 0
    results: List[Dict[str, Any]] = []

    for split_name, subdir_name, sample_filenames in split_subdirs:
        split_dir = meld_root / subdir_name
        print(f"\nEvaluating Split: {split_name.upper()} ({subdir_name})")
        if not split_dir.exists():
            print(f"  [WARNING] Split directory not found: {split_dir}")
            continue

        for fn in sample_filenames:
            sample_path = split_dir / fn
            sample_label = f"{subdir_name}/{fn}"

            if not sample_path.exists():
                print(f"  [SKIP] File not found: {sample_label}")
                continue

            tested_count += 1
            file_size_kb = round(sample_path.stat().st_size / 1024, 1)

            # 1. FFprobe media streams inspection
            has_video, has_audio, duration_sec = inspect_media_streams(sample_path)
            mp4_valid = sample_path.stat().st_size > 0 and (has_video or has_audio)
            audio_stream_valid = has_audio

            # 2. Extract 16kHz mono waveform directly from MP4
            try:
                waveform = extract_audio_waveform(sample_path, target_sample_rate=AUDIO_SAMPLE_RATE)
                waveform_len = len(waveform)
                waveform_nonzero = int(np.count_nonzero(waveform))
                max_amplitude = round(float(np.max(np.abs(waveform))), 4) if waveform_len > 0 else 0.0
                waveform_ok = (waveform_len > 0) and (waveform_nonzero > 0)
            except Exception as e:
                waveform_ok = False
                waveform = np.array([])
                waveform_len = 0
                max_amplitude = 0.0
                print(f"  [ERROR] Waveform extraction failed for {sample_label}: {e}")

            # 3. Calculate MFCC features and standard padded representation
            try:
                mfcc_features = preprocess_audio(
                    sample_path,
                    target_frames=AUDIO_TARGET_FRAMES,
                    num_mfcc=AUDIO_NUM_MFCC,
                    strict=True
                )
                mfcc_shape = tuple(mfcc_features.shape)
                mfcc_ok = (mfcc_shape == (AUDIO_TARGET_FRAMES, AUDIO_NUM_MFCC)) and not (mfcc_features == 0).all()
            except Exception as e:
                mfcc_ok = False
                mfcc_shape = (0, 0)
                print(f"  [ERROR] MFCC extraction failed for {sample_label}: {e}")

            status_ok = mp4_valid and audio_stream_valid and waveform_ok and mfcc_ok
            if not status_ok:
                all_passed = False

            results.append({
                "sample": sample_label,
                "size_kb": file_size_kb,
                "mp4_valid": mp4_valid,
                "audio_stream_valid": audio_stream_valid,
                "duration_sec": duration_sec,
                "sample_rate": AUDIO_SAMPLE_RATE,
                "max_amp": max_amplitude,
                "mfcc_shape": mfcc_shape,
                "status": "PASS" if status_ok else "FAIL"
            })

            print(
                f"  • {sample_label:<38} | MP4: {'YES' if mp4_valid else 'NO'} | "
                f"Audio Stream: {'YES' if audio_stream_valid else 'NO'} | "
                f"Dur: {duration_sec or 0.0:.2f}s | "
                f"MaxAmp: {max_amplitude:.3f} | "
                f"MFCC: {mfcc_shape} -> {'[PASS]' if status_ok else '[FAIL]'}"
            )

    print("\n" + "=" * 80)
    print("SUMMARY REPORT")
    print("=" * 80)
    print(f"{'Sample File':<40} | {'MP4':<4} | {'Audio':<5} | {'Duration':<8} | {'SR':<5} | {'MFCC Shape':<10} | {'Status'}")
    print("-" * 80)
    for r in results:
        dur_str = f"{r['duration_sec']:.2f}s" if r['duration_sec'] is not None else "N/A"
        print(
            f"{r['sample']:<40} | "
            f"{'YES' if r['mp4_valid'] else 'NO':<4} | "
            f"{'YES' if r['audio_stream_valid'] else 'NO':<5} | "
            f"{dur_str:<8} | "
            f"{r['sample_rate']:<5} | "
            f"{str(r['mfcc_shape']):<10} | "
            f"{r['status']}"
        )
    print("-" * 80)
    print(f"Total Samples Tested: {tested_count} | All Passed: {all_passed}")
    print("=" * 80)

    return all_passed and tested_count > 0


if __name__ == "__main__":
    success = run_audio_extraction_smoke_test()
    if not success:
        print("\n[FATAL] Audio extraction smoke test failed. Fix errors before proceeding with baseline training.")
        sys.exit(1)
    else:
        print("\n[SUCCESS] All audio extraction smoke tests passed successfully!")
        sys.exit(0)
