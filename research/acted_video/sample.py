"""Download one verified, licensed example for a local MindSense demonstration."""
import argparse
import csv
import json
from pathlib import Path

from research.acted_video.collect import download
from research.acted_video.manifest import ROOT


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--clip", help="A filename from clips.csv; defaults to its first entry")
    parser.add_argument("--directory", type=Path, default=Path("data/raw/crema-video"))
    args = parser.parse_args()
    with (ROOT / "clips.csv").open() as handle:
        clips = list(csv.DictReader(handle))
    row = next((r for r in clips if r["filename"] == args.clip), None) if args.clip else clips[0]
    if row is None:
        parser.error("Choose a filename listed in clips.csv.")
    cfg = json.loads((ROOT / "protocol.json").read_text())
    args.directory.mkdir(parents=True, exist_ok=True)
    download(row, cfg["revision"], args.directory)
    print(f'{args.directory / row["filename"]} (acted label: {row["label"]})')


if __name__ == "__main__":
    main()
