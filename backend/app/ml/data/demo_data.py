"""
Demo & Unit-Test Data Fixture Generator — MindSense
STATUS: PROTOTYPE / TEST FIXTURE ONLY

IMPORTANT RESEARCH NOTICE:
This module generates small synthetic test fixtures for unit tests and local UI demonstrations.
It MUST NOT be used as a research benchmark dataset or presented as MELD experimental data.
"""

import json
from pathlib import Path
from typing import List, Optional
from .manifest import SampleRecord, DatasetManifest
from .label_mapping import normalize_label
from .config import DEMO_MANIFEST_PATH

# Isolated demo turns for developer test fixtures only
DEMO_REFERENCE_TURNS = [
    ("dia01", "utt01", "chandler", "Alright, so I'm back in high school, standing in middle of the cafeteria.", "neutral", 2.8),
    ("dia01", "utt02", "joey", "And I realize I am totally naked.", "surprise", 1.9),
    ("dia01", "utt03", "chandler", "Then I look down, and I realize there's a phone... there.", "neutral", 3.1),
    ("dia02", "utt01", "rachel", "Oh God, Monica, hi! Thank God you are here!", "joy", 2.5),
    ("dia02", "utt02", "monica", "Rachel?! What are you doing here in a wedding dress?!", "surprise", 2.2),
    ("dia02", "utt03", "ross", "Hi.", "sadness", 1.0),
    ("dia03", "utt01", "phoebe", "Smelly cat, smelly cat, what are they feeding you?", "neutral", 3.8),
    ("dia03", "utt02", "chandler", "Riveting. Truly heartbreaking.", "anger", 2.0),
    ("dia04", "utt01", "ross", "We were on a break!", "anger", 1.7),
    ("dia04", "utt02", "rachel", "You slept with another woman three hours later!", "anger", 2.6),
    ("dia05", "utt01", "janice", "OH. MY. GAWWWD! Chandler Bing!", "surprise", 2.4),
    ("dia05", "utt02", "chandler", "No, please, this can't be happening.", "fear", 2.3),
    ("dia06", "utt01", "joey", "What is that smell?! Did somebody leave raw fish in the sink?", "disgust", 2.7),
    ("dia06", "utt02", "ross", "It's my special sandwich! Do not touch it!", "anger", 2.5)
]


def build_demo_manifest(output_path: Optional[Path] = None) -> DatasetManifest:
    """
    Constructs an isolated demo test fixture manifest.
    Explicitly tags all records with dataset='demo' and label_source='demo_fixture'.
    """
    out_file = output_path or DEMO_MANIFEST_PATH
    records: List[SampleRecord] = []

    for dia_id, utt_id, speaker, raw_text, original_emo, dur in DEMO_REFERENCE_TURNS:
        norm_res = normalize_label(original_emo, dataset="meld")
        record = SampleRecord(
            sample_id=f"demo_{dia_id}_{utt_id}",
            dataset="demo",
            speaker_id=f"demo_speaker_{speaker}",
            session_id=dia_id,
            utterance_id=utt_id,
            text_content=raw_text,
            has_text=True,
            has_audio=False,  # Demo fixtures have no media on disk
            has_vision=False,
            label=norm_res.normalized_label,
            label_id=norm_res.label_id,
            original_label=original_emo,
            label_source="demo_fixture",
            split="train" if dia_id in ["dia01", "dia02", "dia03"] else "test",
            quality_status="valid",
            text_path=None,
            audio_path=None,
            video_path=None,
            duration_sec=dur,
            sample_rate=16000,
            frame_count=200
        )
        records.append(record)

    manifest = DatasetManifest(records)
    manifest.save_json(out_file)
    return manifest


if __name__ == "__main__":
    print("Building MindSense Demo Test Fixture...")
    manifest = build_demo_manifest()
    print(f"Demo manifest saved to: {DEMO_MANIFEST_PATH} ({len(manifest)} test samples)")
