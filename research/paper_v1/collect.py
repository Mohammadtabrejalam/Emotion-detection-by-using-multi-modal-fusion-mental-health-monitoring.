"""Collect real frozen-expert predictions; resumable, with explicit failures."""
import argparse
import hashlib
import io
import json
import shutil
import time
from pathlib import Path

from research.fusion_v2.collect import fetch_actor, MAPPING
from research.paper_v1.study import protocol, digest, ROOT, read_records, expected_ids


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--actors', type=int, nargs='+', required=True, choices=range(7, 25))
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--cache', type=Path, default=Path('data/raw/paper-v1'))
    parser.add_argument('--fitted', type=Path, help='Required before collecting any test actors')
    args = parser.parse_args()
    cfg = protocol()
    if set(args.actors) & set(cfg['test_actors']):
        if not args.fitted:
            parser.error('Test collection requires the previously frozen --fitted artifact')
        fitted = json.loads(args.fitted.read_text())
        if fitted['protocol_sha256'] != digest(ROOT / 'protocol.json'):
            parser.error('Fitted artifact has a different protocol hash')
    import cv2
    from PIL import Image
    from backend.app.inference.service import engine, InputError

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.cache.mkdir(parents=True, exist_ok=True)
    rows = read_records([args.output], args.actors, complete=False) if args.output.exists() else []
    done = {r['id'] for r in rows}
    for actor in args.actors:
        if expected_ids(actor) <= done:
            continue
        for attempt in range(3):
            try:
                files = fetch_actor(args.cache, actor)
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(5 * (attempt + 1))
        for path in files:
            label = MAPPING.get(path.stem.split('-')[2])
            if not label or path.name in done:
                continue
            clip = path.read_bytes()
            row = dict(id=path.name, actor=actor, true=label, sha256=hashlib.sha256(clip).hexdigest())
            started = time.monotonic()
            try:
                cap = cv2.VideoCapture(str(path))
                try:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, int(cap.get(cv2.CAP_PROP_FRAME_COUNT) // 2))
                    ok, frame = cap.read()
                finally:
                    cap.release()
                if not ok:
                    raise InputError('frame_decode')
                buf = io.BytesIO()
                Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)).save(buf, format='PNG')
                row['modalities'] = engine.analyze(audio=clip, image=buf.getvalue())['modality_predictions']
            except InputError as error:
                row['failure'] = str(error)
            row['processing_seconds'] = time.monotonic() - started
            with args.output.open('a') as output:
                output.write(json.dumps(row, allow_nan=False) + '\n')
                output.flush()
            done.add(path.name)
            print(path.name, row.get('failure', 'ok'), flush=True)
        # Process one actor at a time to bound runner disk usage.
        shutil.rmtree(args.cache / f'Actor_{actor:02}')
    read_records([args.output], args.actors)
    print(f'Validated {len(done)} attempted records', flush=True)


if __name__ == '__main__':
    main()
