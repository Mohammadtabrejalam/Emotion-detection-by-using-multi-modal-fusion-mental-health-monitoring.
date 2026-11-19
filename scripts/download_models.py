"""Download pinned public checkpoints. No user input is sent to model providers."""
import argparse
import hashlib
import json
from pathlib import Path
from huggingface_hub import snapshot_download
from backend.app.inference.registry import MODELS, MODEL_ROOT


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--modalities', nargs='+', choices=list(MODELS), default=list(MODELS))
    parser.add_argument('--output', type=Path, default=MODEL_ROOT)
    args = parser.parse_args()
    for kind in args.modalities:
        spec = MODELS[kind]
        target = args.output/kind
        snapshot_download(spec['repo'], revision=spec['revision'], local_dir=target,
            allow_patterns=['*.json', 'merges.txt', 'vocab.json', 'README.md', 'LICENSE*', spec['weight']],
            max_workers=2)
        weights = target/spec['weight']
        with weights.open('rb') as handle:
            digest = hashlib.file_digest(handle, 'sha256').hexdigest()
        (target/'provenance.json').write_text(json.dumps({**spec, 'sha256': digest}, indent=2))
        print(f'{kind}: installed {spec["repo"]}@{spec["revision"]}', flush=True)

if __name__ == '__main__':
    main()
