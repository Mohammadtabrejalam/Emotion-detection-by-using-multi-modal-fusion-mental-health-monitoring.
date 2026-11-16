"""Regenerate real score records using the original fixed preprocessing.

Raw media are downloaded from official RAVDESS archives; never committed.
Run from the repository root after installing inference dependencies/models.
"""

import hashlib
import io
import json
import os
from pathlib import Path
import zipfile
from concurrent.futures import ThreadPoolExecutor
import requests

P = Path(__file__).parent
MAPPING = {
    "01": "neutral",
    "03": "happy",
    "04": "sad",
    "05": "angry",
    "06": "fear",
    "07": "disgust",
    "08": "surprise",
}


def fetch_actor(root, actor):
    folder = root / f"Actor_{actor:02}"
    folder.mkdir(parents=True, exist_ok=True)
    if len(list(folder.glob("01-01-*.mp4"))) != 60:
        archive = root / f"actor{actor}.zip"
        url = f"https://zenodo.org/records/1188976/files/Video_Speech_Actor_{actor:02}.zip?download=1"
        print("Downloading", actor, flush=True)
        with requests.get(url, stream=True, timeout=120) as response:
            response.raise_for_status()
            with archive.open("wb") as output:
                for chunk in response.iter_content(1048576):
                    output.write(chunk)
        with zipfile.ZipFile(archive) as source:
            for name in source.namelist():
                basename = Path(name).name
                if basename.startswith("01-01-") and basename.endswith(".mp4"):
                    temporary = folder / (basename + ".partial")
                    temporary.write_bytes(source.read(name))
                    temporary.replace(folder / basename)
        archive.unlink()
    files = sorted(folder.glob("01-01-*.mp4"))
    if len(files) != 60:
        raise RuntimeError(f"Incomplete actor {actor}: {len(files)}")
    print("Ready", actor, flush=True)
    return files


def main():
    import cv2
    from PIL import Image
    from backend.app.inference.service import engine, InputError

    root = Path(os.environ.get("RAVDESS_CACHE", "data/raw/ravdess-fusion-v2"))
    root.mkdir(parents=True, exist_ok=True)
    out = P / "scores.jsonl"
    records = (
        [json.loads(x) for x in out.read_text().splitlines()] if out.exists() else []
    )
    done = {r["id"] for r in records}
    if len(done) != len(records):
        raise ValueError("Duplicate score IDs")
    protocol = json.loads((P / "protocol.json").read_text())
    actors = (
        protocol["train_actors"]
        + protocol["validation_actors"]
        + protocol["test_actors"]
    )
    needed = [a for a in actors if sum(r["actor"] == a for r in records) != 52]
    with ThreadPoolExecutor(max_workers=5) as pool:
        fetched = dict(zip(needed, pool.map(lambda a: fetch_actor(root, a), needed)))
    for actor in needed:
        for path in fetched[actor]:
            label = MAPPING.get(path.stem.split("-")[2])
            if not label or path.name in done:
                continue
            clip = path.read_bytes()
            cap = cv2.VideoCapture(str(path))
            cap.set(
                cv2.CAP_PROP_POS_FRAMES, int(cap.get(cv2.CAP_PROP_FRAME_COUNT) // 2)
            )
            ok, frame = cap.read()
            cap.release()
            row = {
                "id": path.name,
                "actor": actor,
                "true": label,
                "sha256": hashlib.sha256(clip).hexdigest(),
            }
            try:
                if not ok:
                    raise InputError("frame_decode")
                buf = io.BytesIO()
                Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)).save(
                    buf, format="PNG"
                )
                result = engine.analyze(audio=clip, image=buf.getvalue())
                row["modalities"] = result["modality_predictions"]
            except InputError as error:
                row["failure"] = str(error)
            with out.open("a") as output:
                output.write(json.dumps(row) + "\n")
            done.add(path.name)
            print(path.name, "done", flush=True)


if __name__ == "__main__":
    main()
