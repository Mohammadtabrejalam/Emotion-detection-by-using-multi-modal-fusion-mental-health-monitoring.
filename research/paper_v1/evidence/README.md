# Completed real-model evidence

Source: GitHub Actions run 44282962746, frozen protocol commit
8734d75bd5a54918b4befd1990a3c592a4edc0a6. All eleven jobs succeeded.

Five development shards contain fitting and validation actors 07–16; four test
shards contain actors 17–24. Fitting completed before test collection began.
Each artifact.json records the downloaded archive digest and retained files.
Archive hashes were checked against GitHub metadata before extraction. Only
paper-study files were retained; unrelated older baseline files in the original
broad CI upload were excluded. No raw videos or application user data are here.

Scores record per-file hashes, labels, actor IDs, checkpoint revisions and real
inference outputs. The fitted artifact fixes all selections; results.json holds
all twelve comparisons, per-actor and per-class metrics, confusion counts,
probabilities, uncertainty and stress diagnostics. Environment snapshots record
the execution packages. Do not tune against these now-observed test actors.

Run `python -m research.paper_v1.verify_evidence` from the repository root.
The checked summary is reproduction_check.json. Reproducing saved-score metrics
is not a new independent experiment or a repeat of neural model inference.
