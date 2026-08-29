"""
CLI Command: Dataset Validation & Integrity Audit — MindSense
Usage:
    python -m backend.app.ml.data.validate_dataset [--manifest PATH]
"""

import sys
import argparse
from pathlib import Path
from .manifest import DatasetManifest
from .validation import DatasetValidator
from .config import MELD_MANIFEST_PATH


def main():
    parser = argparse.ArgumentParser(description="MindSense Dataset Integrity & Leakage Validator")
    parser.add_argument(
        "--manifest",
        type=str,
        default=str(MELD_MANIFEST_PATH),
        help="Path to manifest JSON file to validate."
    )
    parser.add_argument(
        "--check-files",
        action="store_true",
        help="Verify physical existence of media files on disk."
    )
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    print("=" * 70)
    print("MINDSENSE DATASET INTEGRITY & LEAKAGE AUDIT")
    print("=" * 70)
    print(f"Target Manifest: {manifest_path.resolve()}")

    if not manifest_path.exists():
        print(f"\n[ERROR] Manifest file not found at: {manifest_path}")
        print("Please generate the dataset manifest first.")
        sys.exit(1)

    try:
        manifest = DatasetManifest.load_json(manifest_path)
    except Exception as e:
        print(f"\n[ERROR] Failed to load JSON manifest: {e}")
        sys.exit(1)

    print(f"Loaded {len(manifest)} sample records. Running validation...")
    report = DatasetValidator.validate_manifest(manifest, check_disk_files=args.check_files)

    print("\n" + "-" * 70)
    print("VALIDATION SUMMARY REPORT")
    print("-" * 70)
    print(f"Total Samples:            {report.total_samples}")
    print(f"Valid Samples:            {report.valid_samples}")
    print(f"Invalid Samples:          {report.invalid_samples}")
    print(f"Duplicate Sample IDs:     {report.duplicate_sample_ids}")
    print(f"Unknown / Unmapped Labels:{report.unknown_labels}")
    print(f"Total Unique Speakers:    {report.total_speakers}")
    print(f"Missing Text Count:       {report.missing_text_count}")
    print(f"Missing Audio Count:      {report.missing_audio_count}")
    print(f"Missing Vision Count:     {report.missing_vision_count}")
    print(f"Complete Triples (T+A+V): {report.complete_triples_count}")

    print("\nSPLIT DISTRIBUTION:")
    for split_name, count in sorted(report.split_distribution.items()):
        pct = (count / report.total_samples) * 100 if report.total_samples > 0 else 0
        print(f"  - {split_name.upper():<10}: {count:>6} samples ({pct:.1f}%)")

    print("\nCLASS DISTRIBUTION:")
    for cls_name, count in sorted(report.class_distribution.items()):
        pct = (count / report.total_samples) * 100 if report.total_samples > 0 else 0
        print(f"  - {cls_name:<10}: {count:>6} samples ({pct:.1f}%)")

    print("\nSPEAKER LEAKAGE STATUS:")
    if report.speaker_leakage_detected:
        print("  [FAIL] SPEAKER IDENTITY LEAKAGE DETECTED!")
        for err in report.leakage_errors:
            print(f"    - {err}")
    else:
        print("  [PASS] Zero speaker leakage across train/val/test splits.")

    if report.validation_errors:
        print(f"\nVALIDATION ERRORS ({len(report.validation_errors)} found):")
        for err in report.validation_errors[:10]:
            print(f"  - {err}")
        if len(report.validation_errors) > 10:
            print(f"  ... and {len(report.validation_errors) - 10} more errors.")

    print("\n" + "=" * 70)
    if report.is_passed:
        print("RESULT: VALIDATION PASSED - Dataset is clean, aligned, and leakage-free.")
        print("=" * 70)
        sys.exit(0)
    else:
        print("RESULT: VALIDATION FAILED - Fix errors before proceeding.")
        print("=" * 70)
        sys.exit(1)


if __name__ == "__main__":
    main()
