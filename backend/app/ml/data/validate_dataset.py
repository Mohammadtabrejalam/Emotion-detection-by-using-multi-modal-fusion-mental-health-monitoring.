"""
CLI Command: Dataset Validation & Integrity Audit — MindSense
Usage:
    python -m backend.app.ml.data.validate_dataset [--manifest PATH] [--skip-disk-check]
"""

import sys
import argparse
from pathlib import Path
from .manifest import DatasetManifest
from .validation import DatasetValidator
from .config import MELD_MANIFEST_PATH, get_meld_root


def main():
    parser = argparse.ArgumentParser(description="MindSense Real Dataset Integrity & Leakage Validator")
    parser.add_argument(
        "--manifest",
        type=str,
        default=str(MELD_MANIFEST_PATH),
        help="Path to manifest JSON file to validate."
    )
    parser.add_argument(
        "--skip-disk-check",
        action="store_true",
        help="Skip checking physical existence of referenced audio/video files on disk."
    )
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    print("=" * 75)
    print("MINDSENSE REAL DATASET INTEGRITY & LEAKAGE AUDIT")
    print("=" * 75)
    print(f"Target Manifest: {manifest_path.resolve()}")

    if not manifest_path.exists():
        print(f"\n[ERROR] REAL MELD DATASET NOT INSTALLED / MANIFEST NOT FOUND!")
        print(f"Expected manifest at: {manifest_path}")
        print("\nPlease acquire the official MELD dataset and run the ingestion pipeline:")
        print("  1. Download MELD following instructions in docs/MELD_SETUP.md")
        print("  2. Run ingestion: python -m backend.app.ml.data.prepare_meld")
        print("  3. Run validation: python -m backend.app.ml.data.validate_dataset")
        print("=" * 75)
        sys.exit(1)

    try:
        manifest = DatasetManifest.load_json(manifest_path)
    except Exception as e:
        print(f"\n[ERROR] Failed to load JSON manifest: {e}")
        sys.exit(1)

    # Check for empty or mock manifest
    if len(manifest) == 0:
        print("\n[ERROR] Manifest contains 0 records. Dataset is empty.")
        sys.exit(1)

    # Check if manifest is accidentally using demo records
    if any(r.dataset == "demo" or r.label_source == "demo_fixture" for r in manifest.records):
        print("\n[WARNING] This manifest contains DEMO/TEST FIXTURE records.")
        print("Demo fixtures are for unit testing only and must NOT be used as research benchmark data.")

    print(f"Loaded {len(manifest)} sample records. Running comprehensive audit...")
    report = DatasetValidator.validate_manifest(manifest, check_disk_files=not args.skip_disk_check)

    print("\n" + "-" * 75)
    print("VALIDATION SUMMARY REPORT")
    print("-" * 75)
    print(f"Dataset:                  MELD")
    print(f"Manifest Path:            {manifest_path}")
    print(f"Dataset Completeness:     {report.completeness_status}")
    print(f"Total Samples:            {report.total_samples}")
    print(f"Valid Samples:            {report.valid_samples}")
    print(f"Invalid Samples:          {report.invalid_samples}")
    print(f"Unique Speakers:          {report.total_speakers}")
    print(f"Unique Dialogues:         {report.total_dialogues}")

    print(f"\nMODALITY INTEGRITY:")
    print(f"  • Text Available:       {report.total_samples - report.missing_text_count}")
    print(f"  • Audio Available:      {report.total_samples - report.missing_audio_count}")
    print(f"  • Vision Available:     {report.total_samples - report.missing_vision_count}")
    print(f"  • Complete Triples:     {report.complete_triples_count}")
    print(f"  • Broken Audio Paths:   {report.broken_audio_paths}")
    print(f"  • Broken Video Paths:   {report.broken_video_paths}")
    print(f"  • Empty Text Errors:    {report.empty_text_errors}")

    print("\nSPLIT DISTRIBUTION:")
    for split_name, count in sorted(report.split_distribution.items()):
        pct = (count / report.total_samples) * 100 if report.total_samples > 0 else 0
        print(f"  - {split_name.upper():<10}: {count:>6} samples ({pct:.1f}%)")

    print("\nCLASS DISTRIBUTION:")
    for cls_name, count in sorted(report.class_distribution.items()):
        pct = (count / report.total_samples) * 100 if report.total_samples > 0 else 0
        print(f"  - {cls_name:<10}: {count:>6} samples ({pct:.1f}%)")

    print("\nSPEAKER LEAKAGE & ISOLATION:")
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

    print("\n" + "=" * 75)
    if report.is_passed:
        print("RESULT: PASS - Dataset manifest is verified, clean, and leakage-free.")
        print("=" * 75)
        sys.exit(0)
    else:
        print("RESULT: FAIL - Critical dataset validation errors detected.")
        print("=" * 75)
        sys.exit(1)


if __name__ == "__main__":
    main()
