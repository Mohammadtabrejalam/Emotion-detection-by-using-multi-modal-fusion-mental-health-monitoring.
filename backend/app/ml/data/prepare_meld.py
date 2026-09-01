"""
Official MELD Dataset Ingestion & Manifest Generator — MindSense
Usage:
    python -m backend.app.ml.data.prepare_meld [--meld-root PATH] [--output PATH] [--speaker-split] [--full-validation]
"""

import os
import sys
import csv
import json
import re
import argparse
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

from .manifest import SampleRecord, DatasetManifest
from .label_mapping import normalize_label
from .splits import partition_dataset_by_speaker
from .config import (
    get_meld_root, RAW_DATA_DIR, MELD_MANIFEST_PATH, DATASET_STATS_PATH,
    MELD_OFFICIAL_COUNTS
)


def parse_timestamp_duration(start_time: str, end_time: str) -> Optional[float]:
    """
    Parses timestamps like '00:00:15,200' to duration in seconds.
    """
    def to_seconds(ts: str) -> Optional[float]:
        if not ts or not isinstance(ts, str) or not ts.strip():
            return None
        clean_ts = ts.strip().replace(",", ".")
        match = re.match(r"(\d+):(\d+):(\d+(?:\.\d+)?)", clean_ts)
        if match:
            h, m, s = match.groups()
            return int(h) * 3600 + int(m) * 60 + float(s)
        try:
            return float(clean_ts)
        except ValueError:
            return None

    s = to_seconds(start_time)
    e = to_seconds(end_time)
    if s is not None and e is not None and e >= s:
        return round(e - s, 3)
    return None


def inspect_media_streams(mp4_path: Path) -> Tuple[bool, bool, Optional[float]]:
    """
    Inspects an MP4 file to verify video and audio stream availability.
    Strictly verifies streams using ffprobe.
    Returns (has_video, has_audio, duration_sec).
    Never infers audio or video availability merely from file size or broken probes.
    """
    if not mp4_path.exists() or mp4_path.stat().st_size < 128:
        return False, False, None

    # Binary sanity check: reject files starting with null bytes or corrupt headers
    try:
        with open(mp4_path, "rb") as f:
            header = f.read(64)
        if header.startswith(b"\x00" * 8):
            return False, False, None
    except Exception:
        return False, False, None

    has_video = False
    has_audio = False
    duration_sec = None

    # Use ffprobe for precise stream inspection
    try:
        cmd = [
            "ffprobe", "-v", "error", "-print_format", "json",
            "-show_format", "-show_streams", str(mp4_path)
        ]
        startupinfo = None
        if os.name == "nt":
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW

        res = subprocess.run(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            text=True, startupinfo=startupinfo, timeout=10
        )
        if res.returncode == 0 and res.stdout:
            data = json.loads(res.stdout)
            streams = data.get("streams", [])
            video_streams = [s for s in streams if s.get("codec_type") == "video"]
            audio_streams = [s for s in streams if s.get("codec_type") == "audio"]

            if video_streams:
                v = video_streams[0]
                if int(v.get("width", 0)) > 0 and int(v.get("height", 0)) > 0:
                    has_video = True

            if audio_streams:
                a = audio_streams[0]
                if int(a.get("sample_rate", 0)) > 0 or a.get("codec_name"):
                    has_audio = True

            dur = data.get("format", {}).get("duration")
            if dur:
                duration_sec = round(float(dur), 3)

            return has_video, has_audio, duration_sec
    except Exception:
        pass

    # OpenCV fallback ONLY for video stream inspection (never assumes audio)
    try:
        import cv2
        cap = cv2.VideoCapture(str(mp4_path))
        if cap.isOpened():
            w = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
            h = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
            fc = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            fps = cap.get(cv2.CAP_PROP_FPS)
            cap.release()
            if w > 0 and h > 0 and fc > 0:
                has_video = True
                if fps > 0:
                    duration_sec = round(fc / fps, 3)
    except Exception:
        pass

    # Strictly do NOT infer audio/video merely from file size.
    return has_video, has_audio, duration_sec


def find_mp4_for_sample(
    meld_root: Path,
    split_key: str,
    dia_id: int,
    utt_id: int
) -> Tuple[Optional[Path], Optional[str]]:
    """
    Resolves exact MELD MP4 file path based on dialogue and utterance IDs.
    Directories mapped:
      train -> train_splits/
      val   -> dev_splits_complete/
      test  -> output_repeated_splits_test/
    """
    filename = f"dia{dia_id}_utt{utt_id}.mp4"

    # Split-specific primary directory mapping
    split_dir_map = {
        "train": ["train_splits", "train", "train_splits_complete"],
        "val": ["dev_splits_complete", "dev_splits", "dev", "val"],
        "test": ["output_repeated_splits_test", "test_splits", "test"]
    }

    primary_subdirs = split_dir_map.get(split_key, [])
    candidate_paths: List[Path] = []

    # 1. Primary split subdirectories in meld_root
    for sub in primary_subdirs:
        candidate_paths.append(meld_root / sub / filename)

    # 2. Root directory of meld_root
    candidate_paths.append(meld_root / filename)

    # 3. Fallback across all other split subdirectories
    all_subdirs = ["train_splits", "dev_splits_complete", "output_repeated_splits_test", "dev_splits", "test_splits"]
    for sub in all_subdirs:
        if sub not in primary_subdirs:
            candidate_paths.append(meld_root / sub / filename)

    # Check candidates
    for p in candidate_paths:
        if p.exists() and p.stat().st_size > 0:
            return p.resolve(), None

    return None, f"File not found: dia{dia_id}_utt{utt_id}.mp4"


def ingest_meld_dataset(
    meld_root: Path,
    output_manifest_path: Path = MELD_MANIFEST_PATH,
    enforce_speaker_split: bool = False,
    split_seed: int = 42,
    full_validation: bool = False
) -> DatasetManifest:
    """
    Parses official MELD dataset annotations and media files into a validated DatasetManifest.
    """
    meld_root = meld_root.resolve()
    fallback_csv_root = (RAW_DATA_DIR / "meld").resolve()

    print("=" * 75)
    print("MINDSENSE REAL MELD INGESTION PIPELINE")
    print("=" * 75)
    print(f"Target MELD Root Directory: {meld_root}")
    print(f"Fallback CSV Search Path:   {fallback_csv_root}")

    # Search for official annotation CSV files across meld_root and fallback_csv_root
    split_files: Dict[str, Optional[Path]] = {
        "train": None,
        "val": None,
        "test": None
    }

    csv_candidates = {
        "train": ["train_sent_emo.csv", "train_sent_emo_dff.csv", "train.csv"],
        "val": ["dev_sent_emo.csv", "dev_sent_emo_dff.csv", "val.csv", "dev.csv"],
        "test": ["test_sent_emo.csv", "test_sent_emo_dff.csv", "test.csv"]
    }

    found_in_meld_root = False
    for split_key, filenames in csv_candidates.items():
        for fn in filenames:
            p = meld_root / fn
            if p.exists() and p.stat().st_size > 0:
                split_files[split_key] = p
                found_in_meld_root = True
                break

    if not found_in_meld_root and meld_root != fallback_csv_root:
        for split_key, filenames in csv_candidates.items():
            for fn in filenames:
                p = fallback_csv_root / fn
                if p.exists() and p.stat().st_size > 0:
                    split_files[split_key] = p
                    break

    if not any(split_files.values()):
        print(f"\n[ERROR] REAL MELD DATASET ANNOTATIONS NOT FOUND!")
        print(f"Searched in: {meld_root} and {fallback_csv_root}")
        print("Expected at least one of: train_sent_emo.csv, dev_sent_emo.csv, test_sent_emo.csv")
        print("\nPlease follow the instructions in docs/MELD_SETUP.md.")
        print("=" * 75)
        sys.exit(1)

    print("\nDiscovered Annotation Files:")
    for sp, fp in split_files.items():
        status_str = str(fp) if fp else "Not Found"
        print(f"  • {sp.upper():<6} CSV: {status_str}")

    records: List[SampleRecord] = []
    seen_sample_ids = set()
    skipped_rows = 0
    missing_media_count = 0
    valid_media_count = 0

    # Parse each CSV file
    def parse_csv_file(csv_path: Path, split_key: str):
        nonlocal skipped_rows, missing_media_count, valid_media_count
        with open(csv_path, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            if not reader.fieldnames:
                return

            field_map = {fn.strip().lower().replace(" ", "_"): fn for fn in reader.fieldnames}

            for row in reader:
                try:
                    dia_key = field_map.get("dialogue_id") or field_map.get("dialogue") or field_map.get("dia")
                    utt_key = field_map.get("utterance_id") or field_map.get("utterance") or field_map.get("utt")
                    spk_key = field_map.get("speaker")
                    txt_key = field_map.get("utterance") or field_map.get("text")
                    emo_key = field_map.get("emotion")
                    st_key = field_map.get("starttime") or field_map.get("start_time")
                    et_key = field_map.get("endtime") or field_map.get("end_time")

                    if not (dia_key and utt_key and emo_key):
                        skipped_rows += 1
                        continue

                    dia_raw = row[dia_key].strip()
                    utt_raw = row[utt_key].strip()
                    dia_id = int(re.sub(r"\D", "", dia_raw)) if re.search(r"\d", dia_raw) else 0
                    utt_id = int(re.sub(r"\D", "", utt_raw)) if re.search(r"\d", utt_raw) else 0

                    # Prefix sample_id with split_key to ensure uniqueness across train, val, and test splits
                    sample_id = f"meld_{split_key}_dia{dia_id}_utt{utt_id}"
                    if sample_id in seen_sample_ids:
                        skipped_rows += 1
                        continue
                    seen_sample_ids.add(sample_id)

                    raw_speaker = row[spk_key].strip() if spk_key and row.get(spk_key) else "unknown"
                    clean_spk = re.sub(r"[^a-zA-Z0-9_]", "_", raw_speaker.lower()).strip("_") or "unknown"
                    speaker_id = f"speaker_{clean_spk}"

                    raw_text = row[txt_key].strip() if txt_key and row.get(txt_key) else ""
                    raw_emo = row[emo_key].strip()

                    norm_res = normalize_label(raw_emo, dataset="meld")
                    if not norm_res.is_valid:
                        skipped_rows += 1
                        continue

                    # Media resolution
                    mp4_path, _ = find_mp4_for_sample(meld_root, split_key, dia_id, utt_id)

                    has_audio = False
                    has_vision = False
                    dur_sec = None

                    if mp4_path:
                        valid_media_count += 1
                        if full_validation:
                            has_vision, has_audio, dur_sec = inspect_media_streams(mp4_path)
                        else:
                            has_vision = True
                            has_audio = True
                    else:
                        missing_media_count += 1

                    has_text = len(raw_text) > 0

                    # Parse timestamps if duration not already extracted
                    if dur_sec is None:
                        start_ts = row.get(st_key, "") if st_key else ""
                        end_ts = row.get(et_key, "") if et_key else ""
                        dur_sec = parse_timestamp_duration(start_ts, end_ts)

                    # Determine quality status
                    if has_text and has_audio and has_vision:
                        quality_status = "valid"
                    elif has_text and not has_audio and not has_vision:
                        quality_status = "text_only"
                    else:
                        quality_status = "partial"

                    media_str = str(mp4_path) if mp4_path else None

                    record = SampleRecord(
                        sample_id=sample_id,
                        dataset="meld",
                        speaker_id=speaker_id,
                        session_id=f"{split_key}_dia{dia_id}",
                        utterance_id=f"utt{utt_id}",
                        text_content=raw_text,
                        has_text=has_text,
                        has_audio=has_audio,
                        has_vision=has_vision,
                        label=norm_res.normalized_label,
                        label_id=norm_res.label_id,
                        original_label=raw_emo,
                        label_source="meld_official",
                        split=split_key,
                        quality_status=quality_status,
                        text_path=None,
                        audio_path=media_str if has_audio else None,
                        video_path=media_str if has_vision else None,
                        audio_source_path=media_str if has_audio else None,
                        image_source_path=media_str if has_vision else None,
                        dialogue_id=f"{split_key}_dia{dia_id}",
                        duration_sec=dur_sec,
                        sample_rate=16000 if has_audio else None,
                        frame_count=200 if (has_audio or has_vision) else None
                    )
                    records.append(record)
                except Exception:
                    skipped_rows += 1
                    continue

    for sp_key, fp in split_files.items():
        if fp:
            parse_csv_file(fp, split_key=sp_key)

    if not records:
        print("\n[ERROR] Failed to parse any valid records from CSV files.")
        sys.exit(1)

    # Optional speaker-independent partitioning
    if enforce_speaker_split:
        print("\nApplying strict subject-independent partitioning across speakers...")
        records = partition_dataset_by_speaker(
            records,
            train_ratio=0.70,
            val_ratio=0.15,
            test_ratio=0.15,
            seed=split_seed
        )

    # Construct manifest
    manifest = DatasetManifest(records)
    manifest.save_json(output_manifest_path)

    # Compute statistics
    stats = manifest.compute_statistics()
    stats["meld_completeness"] = (
        "FULL_DATASET" if len(manifest) >= 13000 else f"PARTIAL_DATASET ({len(manifest)}/{MELD_OFFICIAL_COUNTS['total_utterances']} samples)"
    )
    stats["source_meld_root"] = str(meld_root)
    stats["media_counts"] = {
        "matched_mp4s": valid_media_count,
        "missing_mp4s": missing_media_count,
        "skipped_csv_rows": skipped_rows
    }

    with open(DATASET_STATS_PATH, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    print("\n" + "-" * 75)
    print("MELD INGESTION COMPLETE")
    print("-" * 75)
    print(f"Total Discovered Samples:   {len(manifest)}")
    print(f"Total Discovered Speakers:  {stats['speaker_count']}")
    print(f"Modality Availability:")
    print(f"  • Text available:         {stats['modality_availability']['text_available']}")
    print(f"  • Audio files on disk:    {stats['modality_availability']['audio_available']}")
    print(f"  • Video files on disk:    {stats['modality_availability']['vision_available']}")
    print(f"  • Complete Triples:       {stats['modality_availability']['complete_triples']}")
    print(f"Dataset Completeness:       {stats['meld_completeness']}")
    print(f"Manifest written to:        {output_manifest_path}")
    print(f"Statistics written to:      {DATASET_STATS_PATH}")
    print("=" * 75)

    return manifest


def main():
    parser = argparse.ArgumentParser(description="MindSense Official MELD Ingestion CLI")
    parser.add_argument(
        "--meld-root",
        type=str,
        default=None,
        help="Path to local MELD dataset directory (overrides MINDSENSE_MELD_ROOT)."
    )
    parser.add_argument(
        "--output",
        type=str,
        default=str(MELD_MANIFEST_PATH),
        help="Output path for generated manifest JSON."
    )
    parser.add_argument(
        "--speaker-split",
        action="store_true",
        help="Enforce strict speaker-independent split instead of preserving official dialogue splits."
    )
    parser.add_argument(
        "--full-validation",
        action="store_true",
        help="Perform ffprobe/cv2 stream inspection on all MP4 files."
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for speaker partitioning."
    )
    args = parser.parse_args()

    meld_dir = get_meld_root(args.meld_root)
    ingest_meld_dataset(
        meld_root=meld_dir,
        output_manifest_path=Path(args.output),
        enforce_speaker_split=args.speaker_split,
        split_seed=args.seed,
        full_validation=args.full_validation
    )


if __name__ == "__main__":
    main()
