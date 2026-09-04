"""
Visual & Metadata Sample Inspection Utility — MindSense
Usage:
    python -m backend.app.ml.data.inspect_samples [--manifest PATH] [--count N] [--split SPLIT]
"""

import sys
import random
import argparse
from pathlib import Path
from .manifest import DatasetManifest
from .config import MELD_MANIFEST_PATH


def inspect_samples(manifest_path: Path, count: int = 5, split: str = None):
    if not manifest_path.exists():
        print(f"\n[ERROR] Manifest file does not exist: {manifest_path}")
        print("Please ingest real MELD data first: python -m backend.app.ml.data.prepare_meld")
        sys.exit(1)

    try:
        manifest = DatasetManifest.load_json(manifest_path)
    except Exception as e:
        print(f"[ERROR] Failed to load JSON manifest: {e}")
        sys.exit(1)

    records = manifest.records
    if split:
        records = manifest.filter_by_split(split)

    if not records:
        print(f"No records found matching split '{split}'.")
        return

    sample_pool = random.sample(records, min(count, len(records)))  # nosec: B311 # non-cryptographic sampling for terminal inspection

    print("=" * 80)
    print(f"MINDSENSE REAL MULTIMODAL SAMPLE INSPECTOR ({len(sample_pool)} of {len(manifest)} samples)")
    print("=" * 80)

    for i, r in enumerate(sample_pool, 1):
        # Verify physical file existence
        audio_exists = Path(r.audio_path).exists() if r.audio_path else False
        video_exists = Path(r.video_path).exists() if r.video_path else False

        print(f"\n[Sample #{i:02d}] ID: {r.sample_id} | Dataset: {r.dataset.upper()} | Split: {r.split.upper()}")
        print("-" * 80)
        print(f"  • Speaker ID:         {r.speaker_id}")
        print(f"  • Dialogue / Turn:    {r.session_id} / {r.utterance_id}")
        print(f"  • Raw Dialogue Text:  \"{r.text_content}\"")
        print(f"  • Target Emotion:     {r.label.upper()} (Class ID: {r.label_id}) [Original: '{r.original_label}']")
        print(f"  • Modality Mask:      Text={r.has_text} | Audio={r.has_audio} | Vision={r.has_vision}")
        print(f"  • Audio Path:         {r.audio_path or 'None'} (File On Disk: {audio_exists})")
        print(f"  • Video Path:         {r.video_path or 'None'} (File On Disk: {video_exists})")
        print(f"  • Duration:           {r.duration_sec}s" if r.duration_sec else "  • Duration:           Unknown / Unspecified")
        print(f"  • Quality Status:     {r.quality_status}")

    print("\n" + "=" * 80)


def main():
    parser = argparse.ArgumentParser(description="MindSense Real Multimodal Sample Inspector")
    parser.add_argument("--manifest", type=str, default=str(MELD_MANIFEST_PATH))
    parser.add_argument("--count", type=int, default=5, help="Number of random samples to inspect.")
    parser.add_argument("--split", type=str, default=None, help="Filter by split ('train', 'val', 'test').")
    args = parser.parse_args()

    inspect_samples(Path(args.manifest), count=args.count, split=args.split)


if __name__ == "__main__":
    main()
