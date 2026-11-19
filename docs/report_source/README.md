# Reproduce the academic report

The report is generated from the committed score cache and experimental results, not manually entered performance tables. It documents the existing application and the bounded audiovisual study. No raw participant media or neural weights are redistributed.

From the repository root, with Python 3.11 or 3.12:

```bash
python -m pip install -r research/fusion_v2/requirements.txt
python -m scripts.verify_report_evidence
python -m research.fusion_v2.experiment
python -m scripts.check_fusion_reproduction
python -m scripts.generate_research_report
python -m scripts.build_academic_report
```

The inputs are `report_template.md`, `research/fusion_v2/results.json`, earlier committed evaluation reports, and the genuine browser screenshots in `docs/report_assets`. The Markdown output is `docs/ACADEMIC_REPORT.md`; the Word output is `docs/MindSense_Academic_Report.docx`.

To export the PDF, install LibreOffice and run:

```bash
soffice --headless --convert-to pdf --outdir docs docs/MindSense_Academic_Report.docx
```

Review all rendered pages after changing the template or document toolchain. Font versions can change pagination. The committed PDF was rendered from the committed DOCX and visually reviewed. The report contains no invented supervisor approval, signatures, roll number or institutional certification; add any college-required administrative pages with genuine details before submission.

For full neural inference, see `research/fusion_v2/README.md`. Cached-score reproduction is much faster and does not require checkpoints or raw video. Changing a method after observing the current test actors requires fresh untouched evaluation data.
