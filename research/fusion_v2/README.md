# Fusion study evidence status

The fixed protocol is unchanged. At the inspected PR head `03fc2fd978adc071bb8685c1216bd4a03911da0e`, this directory contained only `protocol.json`. The continuation recovered earlier prediction reports and browser evidence, but did not recover the actor 02–06 scores, fusion implementation, fitted parameters, selection log or follow-up result files.

## Available evidence

- `../../reports/meld_text.json`: 2,610 saved text predictions.
- `../../reports/ravdess_actor01.json`: 52 saved audiovisual prediction records, including 28 audio-supported clips.
- `verified_report_evidence.json`: metrics recomputed from those saved labels, with source SHA256 hashes and paired Actor 01 decisions.
- `../../docs/ACADEMIC_REPORT.md`: academic report separating verified findings, mathematical analysis and provisional supplied outcomes.
- `../../docs/report_assets/`: unchanged GitHub-hosted browser screenshots and a derived confusion-matrix figure.

Run `python -m scripts.verify_report_evidence` from the repository root. This uses only the Python standard library and does not rerun model inference. Build the DOCX with `python -m scripts.build_academic_report --output /path/to/report.docx`; authoring dependencies are python-docx, matplotlib and Pillow. A DOCX renderer is required separately for PDF export.

## Reported follow-up results awaiting artifacts

The user's continuation supplied the following summary. It is retained as a claim to verify, not as a reproduced experiment:

| Method on Actors 05–06 | Reported accuracy | Reported macro F1 |
| --- | ---: | ---: |
| Face | 48.08% | 0.485 |
| Existing fusion | 50.00% | 0.493 |
| Adaptive fusion | 52.88% | 0.515 |

The summary also reports 260 new clips scored; no entropy contribution selected on validation; lower adaptive macro F1 on Actor 06; worse calibration error than existing fusion; an actor-cluster interval crossing zero; and 149 passing local tests with five legacy skips. None of these follow-up claims has a recovered numerical artifact or local test log. Do not invent exact parameters, per-actor values, calibration definitions or interval endpoints.

Because the test outcomes are already known, do not tune a replacement implementation on Actors 05–06 and call it held out. Recover the original implementation/configuration and score records, or designate any reconstructed experiment exploratory and reserve fresh actors for a subsequent frozen evaluation. The current protocol alone does not define the fitting objective, reliability function or tie-breaking rules.

## Browser provenance and CI

- Inspected commit: `03fc2fd978adc071bb8685c1216bd4a03911da0e`.
- [Audit workflow 43871924375](https://github.com/Mohammadtabrejalam/Emotion-detection-by-using-multi-modal-fusion-mental-health-monitoring./actions/runs/43871924375): 143 backend tests passed, 5 skipped; 10 frontend tests passed; 6 browser tests passed.
- [Companion workflow 43871924186](https://github.com/Mohammadtabrejalam/Emotion-detection-by-using-multi-modal-fusion-mental-health-monitoring./actions/runs/43871924186): succeeded.
- Browser artifact: `14227524645`, name `mindsense-browser-evidence`.
- ZIP SHA256, matched against the GitHub artifact digest: `7d9e3bce8ffecffba5e4407064b4669d7851a3550836ec792bca2629405e133c`.
- Files: `home.png`, `mobile-analysis.png`, `real-text-result.png`.
- The result image shows actual text inference; audio and face models are absent in that CI environment. It is not a three-modality browser-inference demonstration.

The application and frozen protocol are unchanged by this report continuation. PR #3 remains draft; nothing is merged or deployed.
