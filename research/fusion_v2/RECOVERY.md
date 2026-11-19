# Recovery and reproduction provenance

The transient workspace was reset after the initial experiment and before its artifacts were pushed. Commit `2f39728` correctly described the follow-up as provisional because only its summary was available in that continuation.

This continuation has the earlier execution transcript, including the complete `experiment.py` tool input/output and collector implementation. The experiment procedure has been restored from that record: the same training NLL temperature objective, smoothed predicted-class precision, hierarchical mass rule, validation grid ordering and first-minimum tie rule, metric definitions, stress conditions, and seeded actor bootstrap. Formatting and comments do not alter the calculations. The collector has portable paths and concurrent archive downloads; model calls, midpoint selection, clip eligibility, ordering, and preprocessing remain the same.

The restored code is committed before regenerating scores and inspecting the rerun results. No search grid or selection objective is changed to improve the previously observed test outcome. A rerun is **reproduction of an already observed test**, not a newly blinded experiment or additional independent validation. Any future method change needs untouched actors.

Original protocol commit: `03fc2fd978adc071bb8685c1216bd4a03911da0e`.
Application base: `a2d7b8e9737b8ae013dc0a325115e707d964b673`.
The original per-clip score bytes were lost; regenerated scores and their new hash must be distinguished from recovery of those exact bytes. Environment versions and recovered aggregate results will be checked against the execution record, with discrepancies reported rather than tuned away.

A second interruption cleared the regenerated local score files after aggregate reproduction had matched. The restored procedure was then run in GitHub Actions without retuning. That workflow preserves actual scores and results as artifacts. Its committed outputs are a new reproduction, not recovery of the original floating-point bytes. The publication includes the CI package list and an aggregate comparison against the earlier execution transcript.
