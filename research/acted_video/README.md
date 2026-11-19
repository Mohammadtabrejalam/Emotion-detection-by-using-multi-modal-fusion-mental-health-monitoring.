# MindSense on acted video

On the 190 CREMA-D performances usable in both sampling modes, the learned one-frame rule matched 92 intended expressions and the original one-frame rule matched 72. Median warm processing time was 0.567 seconds for each. This was a secondary comparison. The prespecified three-frame learned rule matched 89, took 1.129 seconds at the median, and missed all 31 paired fear clips. Its macro F1 gain of 0.071 had a paired actor-bootstrap 95% interval of −0.011 to +0.158.

## Classroom materials

- [Study PDF](../../frontend/public/acted-video/MindSense_Acted_Video_Study.pdf) and [editable Word version](../../frontend/public/acted-video/MindSense_Acted_Video_Study.docx)
- [Playable MP4 preview](../../frontend/public/acted-video/1004_TAI_HAP_XX.mp4) and [original study clip](https://media.githubusercontent.com/media/CheyneyComputerScience/CREMA-D/1658cd342dff90010aa843eaeebd53610a08b1dc/VideoFlash/1004_TAI_HAP_XX.flv)
- [All six paired comparisons, failures, per-actor matrices and local inference timings](evidence/results.json)

On the Analyze screen choose **Video clip → Classroom example**. The preview plays locally. Use the original FLV as the analysis input to reproduce the study. Actor 1004 performs happiness while saying “The airplane is almost full.” In the saved midpoint run the original rule scored anger 49.66% and happiness 49.61%. The learned rule scored happiness 64.20%. The paper uses the intended performance label as ground truth.

## Reproduce the study

From the repository root, with NumPy installed, run the evaluator against the four saved shards. It checks the clip manifest, model revisions, protocol and fitted head, then recomputes fusion scores, all six comparisons and actor-level uncertainty.

```sh
python -m research.acted_video.evaluate \
  --scores research/acted_video/evidence/crema-video-*/scores.jsonl \
  --output /tmp/mindsense-acted-video-results.json
```

The manifest includes 192 clips from 16 actors. Each actor contributes two examples per target expression. All midpoints passed. The three-frame face check rejected two clips. Both methods use the same audio and frozen face and voice models. The head used 312 RAVDESS fitting clips and 208 RAVDESS validation clips. The external evaluation used no CREMA-D fitting data.

[Evaluation workflow](https://github.com/Mohammadtabrejalam/Emotion-detection-by-using-multi-modal-fusion-mental-health-monitoring./actions/runs/44351887725) · [Browser test of the original through all four modes](https://github.com/Mohammadtabrejalam/Emotion-detection-by-using-multi-modal-fusion-mental-health-monitoring./actions/runs/44540872240/job/135618525409)

## Media attribution

Cao et al., [CREMA-D](https://github.com/CheyneyComputerScience/CREMA-D), 2014, [doi:10.1109/TAFFC.2014.2336244](https://doi.org/10.1109/TAFFC.2014.2336244). Database under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/), individual contents under [DbCL 1.0](https://opendatacommons.org/licenses/dbcl/1-0/). The MP4 is a transcoded viewing copy of the first manifest entry, 1004_TAI_HAP_XX.flv. The supplement includes a still from that copy. Study measurements use the checksum-verified original. To retrieve it with the application dependencies installed, run `python -m research.acted_video.sample`.
