"""Run actual warm CPU inference on the pinned CREMA-D test clips."""
import argparse
import csv
import hashlib
import json
import platform
import time
import urllib.error
import urllib.request
from pathlib import Path

from backend.app.inference.service import engine, InputError
from backend.app.inference.video_fusion import transfer_probabilities
from research.acted_video.manifest import ROOT


def download(row, revision, cache):
    name = row["filename"]
    expected_size = int(row["bytes"])
    path = cache / name

    def verified(data):
        return len(data) == expected_size and hashlib.sha256(data).hexdigest() == row["sha256"]

    if path.is_file() and verified(data := path.read_bytes()):
        return data
    urls = [
        f"https://media.githubusercontent.com/media/CheyneyComputerScience/CREMA-D/{revision}/VideoFlash/{name}",
        f"https://github.com/CheyneyComputerScience/CREMA-D/raw/{revision}/VideoFlash/{name}",
    ]
    for attempt in range(3):
        for url in urls:
            try:
                with urllib.request.urlopen(url, timeout=30) as response:
                    data = response.read(expected_size + 1)
                if not verified(data):
                    raise ValueError("Official media digest mismatch")
                path.write_bytes(data)
                return data
            except (OSError, ValueError) as error:
                last_error = error
        time.sleep(1 + attempt)
    raise RuntimeError(f"Could not verify {name}") from last_error


def record(data, sampling):
    start = time.perf_counter()
    try:
        output = engine.analyze_video(data, sampling)
    except InputError as error:
        return {"input_error": str(error), "seconds": time.perf_counter() - start}
    elapsed = time.perf_counter() - start
    predictions = output["modality_predictions"]
    audio, face = [predictions[k]["probabilities"] for k in ("audio", "image")]
    head_start = time.perf_counter()
    transfer = transfer_probabilities(audio, face)
    return {"seconds": elapsed, "transfer_seconds": time.perf_counter() - head_start,
            "samples": output["video_summary"], "audio": audio, "face": face,
            "legacy": output["probabilities"], "transfer": transfer}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--shard", type=int, required=True, choices=range(4))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--cache", type=Path, default=Path("data/raw/crema-video"))
    args = parser.parse_args()
    import cv2
    import torch
    cv2.setNumThreads(1)
    torch.set_num_threads(2)
    cfg = json.loads((ROOT / "protocol.json").read_text())
    manifest = list(csv.DictReader((ROOT / "clips.csv").read_text().splitlines()))
    args.cache.mkdir(parents=True, exist_ok=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    head = Path(__file__).resolve().parents[2] / "backend/app/inference/acted_video_head.json"
    hashes = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in (ROOT / "protocol.json", ROOT / "clips.csv", head)}
    # Preload both models; setup/download and warm-up times are excluded.
    for kind in ("audio", "image"):
        engine._load(kind)
    from backend.app.inference.registry import MODEL_ROOT
    provenance = {k: json.loads((MODEL_ROOT / k / "provenance.json").read_text()) for k in ("audio", "image")}
    metadata = {"hashes": hashes, "models": provenance, "python": platform.python_version(), "torch": torch.__version__,
                "opencv": cv2.__version__, "platform": platform.platform(), "shard": args.shard}
    args.output.with_suffix(".meta.json").write_text(json.dumps(metadata, indent=2) + "\n")
    shard_rows = [(i, row) for i, row in enumerate(manifest) if i // 12 % 4 == args.shard]
    # Warm up on a real clip without evaluating a target label. No tuning, even if this clip fails.
    first = download(shard_rows[0][1], cfg["revision"], args.cache)
    for sampling in ("midpoint", "sequence"):
        try:
            engine.analyze_video(first, sampling)
        except InputError as error:
            print(f"Warm-up input unavailable for {sampling}: {error}", flush=True)
    with args.output.open("w") as output:
        for index, row in shard_rows:
            data = download(row, cfg["revision"], args.cache)
            trial = {**row}
            order = ["midpoint", "sequence"] if index % 2 == 0 else ["sequence", "midpoint"]
            for mode in order:
                trial[mode] = record(data, mode)
            output.write(json.dumps(trial, allow_nan=False, separators=(",", ":")) + "\n")
            output.flush()
            print(row["filename"], " ".join(f"{k}={trial[k].get('input_error','ok')}" for k in order), flush=True)


if __name__ == "__main__":
    main()
