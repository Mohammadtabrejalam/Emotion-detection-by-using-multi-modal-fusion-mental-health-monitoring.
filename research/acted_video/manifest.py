"""Select reproducible real video IDs using only the authors' pinned Git LFS pointers."""
import argparse
import csv
import hashlib
import json
import subprocess
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CODES = {"ANG": "angry", "DIS": "disgust", "FEA": "fear", "HAP": "happy", "NEU": "neutral", "SAD": "sad"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("checkout", type=Path, help="Official CREMA-D Git checkout; LFS smudge can be skipped")
    args = parser.parse_args()
    cfg = json.loads((ROOT / "protocol.json").read_text())
    def git(*arguments):
        return subprocess.check_output(["git", "-C", str(args.checkout), *arguments], text=True)
    def rank(name):
        return hashlib.sha256(f"{cfg['selection_seed']}:{name}".encode()).digest()
    revision = cfg["revision"]
    groups = defaultdict(lambda: defaultdict(list))
    for path in git("ls-tree", "-r", "--name-only", revision, "VideoFlash").splitlines():
        if path.endswith(".flv"):
            actor, _, code, _ = Path(path).stem.split("_")
            groups[actor][CODES[code]].append(path)
    selected = sorted(groups, key=rank)[:cfg["actors"]]
    with (ROOT / "clips.csv").open("w", newline="") as file:
        writer = csv.writer(file, lineterminator="\n")
        writer.writerow(["actor", "label", "filename", "bytes", "sha256"])
        for actor in sorted(selected):
            for label in cfg["target_labels"]:
                paths = sorted(groups[actor][label], key=lambda p: rank(Path(p).name))
                if len(paths) < cfg["clips_per_actor_per_label"]:
                    raise ValueError(f"Insufficient clips for {actor} {label}")
                for path in paths[:cfg["clips_per_actor_per_label"]]:
                    version, oid, size = git("show", f"{revision}:{path}").strip().splitlines()
                    if version != "version https://git-lfs.github.com/spec/v1" or not oid.startswith("oid sha256:"):
                        raise ValueError("Expected an official Git LFS pointer")
                    writer.writerow([actor, label, Path(path).name, int(size.split()[1]), oid.split(":")[1]])


if __name__ == "__main__":
    main()
