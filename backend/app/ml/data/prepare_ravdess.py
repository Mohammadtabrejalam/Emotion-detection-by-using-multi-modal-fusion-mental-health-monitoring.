"""
Official RAVDESS Dataset Ingestion & Manifest Generator — MindSense
Phase 6: Cross-Dataset Zero-Shot Evaluation Subsystem

Usage:
    python -m backend.app.ml.data.prepare_ravdess [--ravdess-root PATH] [--archives-dir PATH] [--output PATH] [--extract]
"""

import os
import sys
import wave
import json
import re
import argparse
import logging
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple, Union

logger = logging.getLogger("mindsense.ravdess")

from .manifest import SampleRecord, DatasetManifest
from .label_mapping import normalize_label, LabelMappingResult
from .config import (
    get_ravdess_root, RAW_DATA_DIR, MANIFESTS_DIR,
    RAVDESS_MANIFEST_PATH, RAVDESS_STATS_PATH, RAVDESS_OFFICIAL_COUNTS
)

# Canonical RAVDESS Filename Specification:
# MM-VC-EE-II-SS-RR-AA.[ext]
# Modality (01 = full-AV, 02 = video-only, 03 = audio-only)
# Vocal channel (01 = speech, 02 = song)
# Emotion (01 = neutral, 02 = calm, 03 = happy, 04 = sad, 05 = angry, 06 = fearful, 07 = disgust, 08 = surprised)
# Emotional intensity (01 = normal, 02 = strong) -- Note: neutral has only 01 (normal)
# Statement (01 = "Kids are talking by the door", 02 = "Dogs are sitting by the door")
# Repetition (01 = 1st repetition, 02 = 2nd repetition)
# Actor (01 to 24. Odd = male, Even = female)


@dataclass
class RavdessFilenameMeta:
    filename: str
    modality: str
    vocal_channel: str
    emotion_code: str
    intensity: str
    statement: str
    repetition: str
    actor_id: str
    is_speech: bool
    is_calm: bool

    @property
    def trial_key(self) -> str:
        """Unique trial identifier regardless of modality (channel, emotion, intensity, statement, repetition, actor)."""
        return f"{self.vocal_channel}-{self.emotion_code}-{self.intensity}-{self.statement}-{self.repetition}-{self.actor_id}"

    @property
    def canonical_audio_filename(self) -> str:
        return f"03-{self.trial_key}.wav"

    @property
    def canonical_full_av_video_filename(self) -> str:
        return f"01-{self.trial_key}.mp4"


def parse_ravdess_filename(file_identifier: Union[str, Path]) -> RavdessFilenameMeta:
    """
    Strictly parses a RAVDESS filename according to the official specification.
    Does not infer labels or actor IDs from arbitrary text; parses only the standardized 7 tokens.

    Args:
        file_identifier: Filename string or Path (e.g. '03-01-06-01-02-01-12.wav').

    Returns:
        RavdessFilenameMeta dataclass with validated fields.

    Raises:
        ValueError: If filename does not conform to the 7-token RAVDESS specification.
    """
    path_obj = Path(file_identifier)
    stem = path_obj.stem.strip()
    parts = stem.split("-")

    if len(parts) != 7:
        raise ValueError(
            f"Invalid RAVDESS filename format '{path_obj.name}'. Expected exactly 7 hyphen-separated tokens, got {len(parts)}."
        )

    modality, vocal_channel, emotion_code, intensity, statement, repetition, actor_id = parts

    # Strict token validation
    if modality not in {"01", "02", "03"}:
        raise ValueError(f"Invalid modality token '{modality}' in '{path_obj.name}'. Valid: 01, 02, 03.")

    if vocal_channel not in {"01", "02"}:
        raise ValueError(f"Invalid vocal channel token '{vocal_channel}' in '{path_obj.name}'. Valid: 01 (speech), 02 (song).")

    if emotion_code not in {"01", "02", "03", "04", "05", "06", "07", "08"}:
        raise ValueError(f"Invalid emotion token '{emotion_code}' in '{path_obj.name}'. Valid: 01 to 08.")

    if intensity not in {"01", "02"}:
        raise ValueError(f"Invalid emotional intensity token '{intensity}' in '{path_obj.name}'. Valid: 01, 02.")

    if statement not in {"01", "02"}:
        raise ValueError(f"Invalid statement token '{statement}' in '{path_obj.name}'. Valid: 01, 02.")

    if repetition not in {"01", "02"}:
        raise ValueError(f"Invalid repetition token '{repetition}' in '{path_obj.name}'. Valid: 01, 02.")

    try:
        actor_num = int(actor_id)
        if not (1 <= actor_num <= 24):
            raise ValueError()
    except ValueError:
        raise ValueError(f"Invalid actor ID token '{actor_id}' in '{path_obj.name}'. Expected integer in 01..24.")

    return RavdessFilenameMeta(
        filename=path_obj.name,
        modality=modality,
        vocal_channel=vocal_channel,
        emotion_code=emotion_code,
        intensity=intensity,
        statement=statement,
        repetition=repetition,
        actor_id=actor_id,
        is_speech=(vocal_channel == "01"),
        is_calm=(emotion_code == "02")
    )


def get_matching_full_av_filename(audio_filename: Union[str, Path]) -> str:
    """
    Given a speech audio filename (03-01-EE-II-SS-RR-AA.wav), returns the
    corresponding full-AV video filename (01-01-EE-II-SS-RR-AA.mp4).
    """
    meta = parse_ravdess_filename(audio_filename)
    return meta.canonical_full_av_video_filename


def get_wav_duration_seconds(wav_path: Path) -> Optional[float]:
    """Computes exact audio duration in seconds using standard wave header parsing."""
    try:
        with wave.open(str(wav_path), "rb") as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            if rate > 0:
                return round(frames / float(rate), 3)
    except Exception as err:
        logger.debug("Failed to read WAV duration for %s: %s", wav_path, err)
    return None


def locate_ravdess_archives(archives_dir: Optional[Union[str, Path]] = None) -> Tuple[Optional[Path], List[Path]]:
    """
    Locates the official audio zip and 24 video zip archives.

    Search priority for archives:
      1. Explicit archives_dir argument
      2. Environment variable MINDSENSE_RAVDESS_ARCHIVES
      3. User Downloads directory (~/Downloads)
      4. data/raw/ravdess directory

    Returns:
        (audio_archive_path, list_of_24_video_archive_paths)
    """
    candidate_dirs: List[Path] = []
    if archives_dir:
        candidate_dirs.append(Path(archives_dir).resolve())

    env_dir = os.environ.get("MINDSENSE_RAVDESS_ARCHIVES")
    if env_dir and env_dir.strip():
        candidate_dirs.append(Path(env_dir.strip()).resolve())

    candidate_dirs.append(Path(os.path.expanduser(r"~\Downloads")).resolve())
    candidate_dirs.append((RAW_DATA_DIR / "ravdess").resolve())

    audio_archive: Optional[Path] = None
    video_archives: List[Path] = []

    for d in candidate_dirs:
        if not d.exists() or not d.is_dir():
            continue

        # Look for audio archive: Audio_Speech_Actors_01-24.zip
        candidate_audio = d / "Audio_Speech_Actors_01-24.zip"
        if candidate_audio.exists() and audio_archive is None:
            audio_archive = candidate_audio

        # Look for all 24 video archives: Video_Speech_Actor_01.zip .. Video_Speech_Actor_24.zip
        found_videos = []
        for i in range(1, 25):
            vp = d / f"Video_Speech_Actor_{i:02d}.zip"
            if vp.exists():
                found_videos.append(vp)

        if len(found_videos) == 24 and not video_archives:
            video_archives = found_videos

        if audio_archive is not None and len(video_archives) == 24:
            break

    return audio_archive, video_archives


def extract_ravdess_archives(
    audio_zip: Path,
    video_zips: List[Path],
    target_root: Path,
    full_av_only: bool = True
) -> Dict[str, int]:
    """
    Extracts the official RAVDESS audio speech archive and 24 video archives.
    Extracts:
      - Audio: all .wav speech files into target_root/audio/
      - Video: full-AV .mp4 (01-*.mp4) files into target_root/video/

    Args:
        audio_zip: Path to Audio_Speech_Actors_01-24.zip.
        video_zips: List of 24 video zip file paths.
        target_root: Destination directory (e.g. data/raw/ravdess).
        full_av_only: If True, skips 02-*.mp4 (video-only) files to save disk space.

    Returns:
        Dictionary with extraction counts.
    """
    target_root = Path(target_root).resolve()
    audio_dest = target_root / "audio"
    video_dest = target_root / "video"
    audio_dest.mkdir(parents=True, exist_ok=True)
    video_dest.mkdir(parents=True, exist_ok=True)

    counts = {"audio_extracted": 0, "video_extracted": 0}

    logger.info("Extracting RAVDESS audio speech archive from %s...", audio_zip)
    with zipfile.ZipFile(audio_zip, "r") as za:
        for member in za.namelist():
            fname = Path(member).name
            if fname.endswith(".wav"):
                # Extract into target_root/audio/Actor_XX/filename.wav
                za.extract(member, audio_dest)
                counts["audio_extracted"] += 1

    logger.info("Extracted %d audio speech files.", counts["audio_extracted"])

    logger.info("Extracting RAVDESS full-AV video archives (24 actors)...")
    for vz in video_zips:
        with zipfile.ZipFile(vz, "r") as zv:
            for member in zv.namelist():
                fname = Path(member).name
                if not fname.endswith(".mp4"):
                    continue
                # Full-AV begins with '01-'
                if full_av_only and not fname.startswith("01-"):
                    continue
                zv.extract(member, video_dest)
                counts["video_extracted"] += 1

    logger.info("Extracted %d full-AV video files.", counts["video_extracted"])
    return counts


def ingest_ravdess_dataset(
    ravdess_root: Optional[Union[str, Path]] = None,
    output_manifest_path: Optional[Union[str, Path]] = None,
    output_stats_path: Optional[Union[str, Path]] = None,
    archives_dir: Optional[Union[str, Path]] = None,
    extract_if_needed: bool = True,
    strict_official_counts: bool = True
) -> Tuple[DatasetManifest, Dict[str, Any]]:
    """
    Ingests official RAVDESS speech dataset, verifies matching audiovisual pairs,
    enforces modality contracts (has_text=False, text_content=""), and writes manifest JSON.

    Adheres strictly to the Phase 6 Zero-Shot Evaluation Protocol:
      - Split is strictly 'test' (external zero-shot evaluation only; no training/tuning/calibration).
      - Speaker ID preserves actor ID from filename.
      - Exactly 1,440 speech trials discovered, 192 calm excluded, 1,248 eligible remaining.
      - Exactly 7 Ekman affective classes mapped.

    Returns:
        (DatasetManifest, statistics_dict)
    """
    resolved_root = get_ravdess_root(ravdess_root)
    output_path = Path(output_manifest_path or RAVDESS_MANIFEST_PATH).resolve()

    # Step 1: Check if audio and video files already exist on disk
    wav_files = list(resolved_root.rglob("*.wav")) if resolved_root.exists() else []

    if len(wav_files) < RAVDESS_OFFICIAL_COUNTS["total_speech_audio"] and extract_if_needed:
        logger.info("Fewer than 1,440 WAV files found in %s (%d found). Searching archives...", resolved_root, len(wav_files))
        audio_archive, video_archives = locate_ravdess_archives(archives_dir)
        if audio_archive and len(video_archives) == 24:
            logger.info("Found official archives. Extracting to %s...", resolved_root)
            extract_ravdess_archives(audio_archive, video_archives, resolved_root, full_av_only=True)
            wav_files = list(resolved_root.rglob("*.wav"))
        else:
            missing_items = []
            if not audio_archive:
                missing_items.append("Audio_Speech_Actors_01-24.zip")
            if len(video_archives) != 24:
                missing_items.append(f"24 video archives (found {len(video_archives)})")
            logger.warning("Could not auto-extract archives: missing %s.", ", ".join(missing_items))

    # Step 2: Discover and index all full-AV MP4 video files
    mp4_files = list(resolved_root.rglob("*.mp4")) if resolved_root.exists() else []
    full_av_video_map: Dict[str, Path] = {}

    for mp4_p in mp4_files:
        fname = mp4_p.name
        try:
            meta = parse_ravdess_filename(fname)
            # Only store full-AV modality (01) and speech (01)
            if meta.modality == "01" and meta.is_speech:
                # Key by canonical audio counterpart filename
                full_av_video_map[meta.canonical_audio_filename] = mp4_p
        except ValueError:
            continue

    # Step 3: Discover all speech audio files and filter
    discovered_speech_audio: List[Tuple[Path, RavdessFilenameMeta]] = []
    excluded_calm_count = 0
    excluded_song_count = 0
    parse_errors = 0

    for wav_p in wav_files:
        try:
            meta = parse_ravdess_filename(wav_p.name)
        except ValueError as err:
            logger.debug("Skipping non-conforming file '%s': %s", wav_p.name, err)
            parse_errors += 1
            continue

        if not meta.is_speech:
            excluded_song_count += 1
            continue

        discovered_speech_audio.append((wav_p, meta))

        if meta.is_calm:
            excluded_calm_count += 1

    total_speech_audio = len(discovered_speech_audio)
    eligible_speech_audio = [item for item in discovered_speech_audio if not item[1].is_calm]
    eligible_count = len(eligible_speech_audio)

    logger.info("RAVDESS Discovery Summary:")
    logger.info("  • Total speech audio discovered: %d", total_speech_audio)
    logger.info("  • Excluded calm (02) trials:    %d", excluded_calm_count)
    logger.info("  • Eligible 7-class trials:      %d", eligible_count)
    logger.info("  • Excluded song trials:         %d", excluded_song_count)

    # Step 4: Validate benchmark integrity constraints
    if strict_official_counts:
        if total_speech_audio != RAVDESS_OFFICIAL_COUNTS["total_speech_audio"]:
            raise ValueError(
                f"RAVDESS integrity violation: Expected exactly {RAVDESS_OFFICIAL_COUNTS['total_speech_audio']} "
                f"speech audio files, discovered {total_speech_audio} in '{resolved_root}'."
            )
        if excluded_calm_count != RAVDESS_OFFICIAL_COUNTS["excluded_calm"]:
            raise ValueError(
                f"RAVDESS integrity violation: Expected exactly {RAVDESS_OFFICIAL_COUNTS['excluded_calm']} "
                f"calm trials to be excluded, excluded {excluded_calm_count}."
            )
        if eligible_count != RAVDESS_OFFICIAL_COUNTS["eligible_trials"]:
            raise ValueError(
                f"RAVDESS integrity violation: Expected exactly {RAVDESS_OFFICIAL_COUNTS['eligible_trials']} "
                f"eligible 7-class trials, retained {eligible_count}."
            )

    # Step 5: Build manifest records for eligible trials
    records: List[SampleRecord] = []
    seen_sample_ids = set()
    actors_seen = set()

    for wav_p, meta in eligible_speech_audio:
        # Verify matching full-AV video
        canonical_audio_name = meta.canonical_audio_filename
        video_p = full_av_video_map.get(canonical_audio_name)

        if video_p is None:
            # Try looking adjacent or by standard path
            candidate_video_name = meta.canonical_full_av_video_filename
            candidate_p = wav_p.parent / candidate_video_name
            if candidate_p.exists():
                video_p = candidate_p
            else:
                # Check video/Actor_XX/candidate
                candidate_video_dir = resolved_root / "video" / f"Actor_{meta.actor_id}" / candidate_video_name
                if candidate_video_dir.exists():
                    video_p = candidate_video_dir

        if video_p is None or not video_p.exists():
            raise RuntimeError(
                f"Integrity violation: Eligible audio trial '{wav_p.name}' lacks a matching full-AV video MP4 "
                f"('{meta.canonical_full_av_video_filename}') in '{resolved_root}'."
            )

        # Map label using standardized MindSense 7-class taxonomy
        # 01->neutral(6), 03->happy(0), 04->sad(1), 05->angry(2), 06->fear(3), 07->disgust(5), 08->surprise(4)
        mapping_res: LabelMappingResult = normalize_label(meta.emotion_code, dataset="ravdess")
        if not mapping_res.is_valid or mapping_res.label_id is None:
            raise ValueError(
                f"Invalid label mapping for RAVDESS trial '{wav_p.name}' (code '{meta.emotion_code}'): {mapping_res.rejection_reason}"
            )

        if not (0 <= mapping_res.label_id <= 6):
            raise ValueError(f"Label ID {mapping_res.label_id} out of bounds [0, 6] for '{wav_p.name}'.")

        # Unique sample identifier
        sample_id = f"ravdess_{wav_p.stem}"
        if sample_id in seen_sample_ids:
            raise ValueError(f"Duplicate sample_id detected: '{sample_id}'")
        seen_sample_ids.add(sample_id)

        # Actor ID extracted directly from final filename field (e.g. '01', '24')
        actor_id = meta.actor_id
        actors_seen.add(actor_id)

        # Audio duration via header
        dur_sec = get_wav_duration_seconds(wav_p)

        record = SampleRecord(
            sample_id=sample_id,
            dataset="ravdess",
            speaker_id=actor_id,
            session_id=f"Actor_{actor_id}",
            utterance_id=wav_p.stem,
            text_content="",  # Genuinely unavailable; never hallucinated or inferred from label
            has_text=False,
            has_audio=True,
            has_vision=True,
            label=mapping_res.normalized_label,
            label_id=mapping_res.label_id,
            original_label=meta.emotion_code,
            label_source="ravdess_filename_annotation",
            split="test",  # External zero-shot evaluation only
            quality_status="valid",
            text_path=None,
            audio_path=str(wav_p.resolve()),
            video_path=str(video_p.resolve()),
            audio_source_path=str(wav_p.resolve()),
            image_source_path=str(video_p.resolve()),
            dialogue_id=f"Actor_{actor_id}",
            duration_sec=dur_sec,
            sample_rate=16000,
            frame_count=200
        )
        records.append(record)

    manifest = DatasetManifest(records)

    if strict_official_counts:
        if len(manifest) != RAVDESS_OFFICIAL_COUNTS["eligible_trials"]:
            raise ValueError(f"Manifest record count {len(manifest)} != expected {RAVDESS_OFFICIAL_COUNTS['eligible_trials']}")
        if len(actors_seen) != RAVDESS_OFFICIAL_COUNTS["actors"]:
            raise ValueError(f"Actor count {len(actors_seen)} != expected {RAVDESS_OFFICIAL_COUNTS['actors']}")

    # Save manifest
    manifest.save_json(output_path)
    logger.info("RAVDESS manifest saved to: %s (%d records)", output_path, len(manifest))

    # Compute and save statistics
    stats = manifest.compute_statistics()
    stats["dataset"] = "ravdess"
    stats["evaluation_role"] = "external_zero_shot"
    stats["speech_audio_discovered"] = total_speech_audio
    stats["calm_trials_excluded"] = excluded_calm_count
    stats["song_trials_excluded"] = excluded_song_count
    stats["eligible_trials"] = eligible_count
    stats["actors_count"] = len(actors_seen)

    stats_path = Path(output_stats_path or RAVDESS_STATS_PATH).resolve()
    stats_path.parent.mkdir(parents=True, exist_ok=True)
    with open(stats_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    logger.info("RAVDESS statistics saved to: %s", stats_path)
    return manifest, stats


def main():
    parser = argparse.ArgumentParser(description="MindSense Official RAVDESS Dataset Ingestion & Manifest Generator")
    parser.add_argument(
        "--ravdess-root",
        type=str,
        default=None,
        help="Root directory containing extracted RAVDESS files (defaults to data/raw/ravdess)."
    )
    parser.add_argument(
        "--archives-dir",
        type=str,
        default=None,
        help="Directory containing official zip archives (defaults to ~/Downloads)."
    )
    parser.add_argument(
        "--output",
        type=str,
        default=str(RAVDESS_MANIFEST_PATH),
        help="Output path for generated manifest JSON."
    )
    parser.add_argument(
        "--extract",
        action="store_true",
        help="Force extraction from archives if present."
    )
    parser.add_argument(
        "--stats-output",
        type=str,
        default=str(RAVDESS_STATS_PATH),
        help="Output path for generated statistics JSON."
    )
    parser.add_argument(
        "--no-strict",
        action="store_true",
        help="Disable strict 1,440/192/1,248 count validation (for partial mock tests)."
    )

    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

    manifest, stats = ingest_ravdess_dataset(
        ravdess_root=args.ravdess_root,
        output_manifest_path=args.output,
        output_stats_path=args.stats_output,
        archives_dir=args.archives_dir,
        extract_if_needed=True,
        strict_official_counts=not args.no_strict
    )

    print("\n========================================================")
    print("  MindSense RAVDESS Phase 6 Manifest Generator Summary")
    print("========================================================")
    print(f"  • Total Speech Audio Discovered: {stats['speech_audio_discovered']}")
    print(f"  • Excluded Calm (02) Trials:    {stats['calm_trials_excluded']}")
    print(f"  • Eligible 7-Class Trials:      {stats['eligible_trials']}")
    print(f"  • Active Actors:                {stats['actors_count']}")
    print(f"  • Modality: Text=0, Audio={stats['modality_availability']['audio_available']}, Vision={stats['modality_availability']['vision_available']}")
    print(f"  • Manifest Written to:          {args.output}")
    print(f"  • Class Distribution:           {stats['class_distribution']}")
    print("========================================================\n")


if __name__ == "__main__":
    main()
