"""Assemble the full academic source and figures from recorded real experiments."""

import hashlib
import json
from pathlib import Path
import numpy as np
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
P = ROOT / "research/fusion_v2"
A = ROOT / "docs/report_assets"
NAMES = {
    "face": "Face only",
    "audio_zero_padded": "Audio only seven labels",
    "legacy_support_average": "Existing fusion",
    "zero_padded_average": "Zero padded average",
    "calibrated_face": "Calibrated face",
    "hierarchical_static": "Hierarchical static",
    "adaptive_reliability": "Adaptive reliability",
}


def table(headers, rows):
    return "\n".join(
        [
            "| " + " | ".join(headers) + " |",
            "| " + " | ".join(["---"] * len(headers)) + " |",
        ]
        + ["| " + " | ".join(map(str, row)) + " |" for row in rows]
    )


def diagram(name, nodes, edges):
    fig, ax = plt.subplots(figsize=(9, 5))
    ax.set(xlim=(0, 10), ylim=(0, 6))
    ax.axis("off")
    for x, y, w, h, label in nodes.values():
        ax.add_patch(
            FancyBboxPatch(
                (x, y), w, h, boxstyle="round,pad=.08", fc="#edf2f7", ec="#52677c"
            )
        )
        ax.text(x + w / 2, y + h / 2, label, ha="center", va="center", fontsize=10)
    for a, b in edges:
        x, y, w, h, _ = nodes[a]
        xx, yy, ww, hh, _ = nodes[b]
        start, end = (
            ((x + w, y + h / 2), (xx, yy + hh / 2))
            if abs(y - yy) < 0.3
            else ((x + w / 2, y), (xx + ww / 2, yy + hh))
        )
        ax.annotate(
            "",
            xy=end,
            xytext=start,
            arrowprops={"arrowstyle": "->", "color": "#34495e"},
        )
    fig.tight_layout()
    fig.savefig(A / name, dpi=180)
    plt.close(fig)


def figures(r):
    plt.rcParams.update(
        {
            "font.size": 10,
            "font.family": "DejaVu Sans",
            "axes.spines.top": False,
            "axes.spines.right": False,
        }
    )
    diagram(
        "architecture.png",
        {
            "ui": (0.5, 4.65, 3, 1, "React and TypeScript\nConsent and input capture"),
            "api": (6, 4.65, 3, 1, "FastAPI\nIdentity and validation"),
            "models": (
                6,
                2.35,
                3,
                1.25,
                "Local inference engine\nText / audio / face\nPublished checkpoints",
            ),
            "db": (
                0.5,
                0.2,
                3,
                1.3,
                "SQLite private records\nJournals / check-ins\nResults / share links",
            ),
            "result": (
                6,
                0.2,
                3,
                1.3,
                "Per-modality scores\nServing late fusion\nResponse to browser",
            ),
        },
        [("ui", "api"), ("api", "models"), ("models", "result"), ("api", "db")],
    )
    diagram(
        "database.png",
        {
            "user": (3.6, 4.8, 2.8, 0.8, "users"),
            "analysis": (0.4, 2.7, 2.7, 1, "analyses\nuser_id / result_json"),
            "journal": (3.65, 2.7, 2.7, 1, "daily_notes\nuser_id / content"),
            "checkin": (6.9, 2.7, 2.7, 1, "daily_checkins\nuser_id / scores"),
            "modality": (0.4, 0.35, 2.7, 1, "modality_results\nanalysis_id"),
            "share": (6.9, 0.35, 2.7, 1, "share_links\nowner_id / result_id"),
        },
        [
            ("user", "analysis"),
            ("user", "journal"),
            ("user", "checkin"),
            ("analysis", "modality"),
            ("analysis", "share"),
        ],
    )
    diagram(
        "research_flow.png",
        {
            "media": (
                3.2,
                4.8,
                3.6,
                0.85,
                "Official RAVDESS clips\nFrozen experts and fixed frames",
            ),
            "train": (
                0.2,
                2.55,
                2.8,
                1.1,
                "Actors 02 and 03\nFit temperatures\nand class reliability",
            ),
            "val": (
                3.6,
                2.55,
                2.8,
                1.1,
                "Actor 04\nSelect fusion weights\nby macro F1",
            ),
            "test": (
                7,
                2.55,
                2.8,
                1.1,
                "Actors 05 and 06\nHeld-out comparison\nNo fitting",
            ),
            "output": (
                3.2,
                0.25,
                3.6,
                1.05,
                "Saved scores and parameters\nMetrics / figures / report",
            ),
        },
        [
            ("media", "train"),
            ("media", "val"),
            ("media", "test"),
            ("train", "output"),
            ("val", "output"),
            ("test", "output"),
        ],
    )
    keys = list(NAMES)
    x = np.arange(len(keys))
    fig, ax = plt.subplots(figsize=(10, 4.5))
    ax.bar(
        x - 0.18,
        [r["test"][k]["accuracy"] for k in keys],
        0.36,
        label="Accuracy",
        color="#365f91",
    )
    ax.bar(
        x + 0.18,
        [r["test"][k]["macro_f1"] for k in keys],
        0.36,
        label="Macro F1",
        color="#4b9586",
    )
    ax.set_xticks(x, [NAMES[k].replace(" ", "\n", 1) for k in keys], fontsize=8)
    ax.set(
        ylim=(0, 1), ylabel="Score", title="Actors 05 and 06: same 104 held-out clips"
    )
    ax.legend(frameon=False)
    fig.tight_layout()
    fig.savefig(A / "fusion_comparison.png", dpi=180)
    plt.close(fig)
    for k in ["face", "legacy_support_average", "adaptive_reliability"]:
        cm = np.array(r["test"][k]["confusion_matrix"])
        fig, ax = plt.subplots(figsize=(6.6, 5.2))
        im = ax.imshow(cm, cmap="Blues", vmin=0, vmax=16)
        ax.set_xticks(range(7), r["labels"], rotation=35, ha="right")
        ax.set_yticks(range(7), r["labels"])
        ax.set(
            xlabel="Predicted label",
            ylabel="True label",
            title=NAMES[k] + " confusion counts",
        )
        for (i, j), v in np.ndenumerate(cm):
            ax.text(
                j,
                i,
                str(v),
                ha="center",
                va="center",
                color="white" if v >= 9 else "black",
            )
        fig.colorbar(im, ax=ax, fraction=0.045)
        fig.tight_layout()
        fig.savefig(A / f"confusion_{k}.png", dpi=180)
        plt.close(fig)
    fig, axes = plt.subplots(1, 2, figsize=(9, 3.7))
    for k in ["face", "legacy_support_average", "adaptive_reliability"]:
        axes[0].plot(
            ["05", "06"],
            [r["test_by_actor"][a][k]["macro_f1"] for a in ["5", "6"]],
            "o-",
            label=NAMES[k],
        )
        axes[1].plot(
            [0.5, 0.8, 1],
            [r["test"][k]["selective_accuracy"][str(c)] for c in [0.5, 0.8, 1.0]],
            "o-",
            label=NAMES[k],
        )
    axes[0].set(xlabel="Actor", ylabel="Macro F1", ylim=(0, 1))
    axes[1].set(
        xlabel="Confidence-ranked coverage", ylabel="Selective accuracy", ylim=(0, 1)
    )
    axes[1].legend(fontsize=8, frameon=False)
    fig.tight_layout()
    fig.savefig(A / "actor_uncertainty.png", dpi=180)
    plt.close(fig)
    Image.open(A / "real-text-result.png").crop((120, 1120, 1160, 1800)).save(
        A / "actual_result_crop.png"
    )


def experiment_section(r):
    t = r["test"]
    v = r["validation"]
    params = r["parameters"]
    a = t["adaptive_reliability"]
    f = t["face"]
    b = t["legacy_support_average"]
    return "\n\n".join(
        [
            """## 6 Actor separated experiment

### Dataset roles and preprocessing

The fixed protocol assigns Actors 02 and 03 to fitting, Actor 04 to validation, and Actors 05 and 06 to testing. Actor 01 is excluded because its errors motivated the method. The allocation is a project subset, not an official RAVDESS split. Each actor contributes 52 non-calm audiovisual speech clips. Only filenames starting 01-01 are retained from official Video_Speech_Actor archives. Calm is excluded, not relabeled as neutral. Each actor contributes four neutral clips and eight clips for each other retained class. Thus the test set contains eight neutral clips and sixteen for each of the other six classes. The two repeated statements and intensity/repetition structure create within-actor dependence; 104 clips are not 104 independent people.

The collector takes the midpoint video frame, converts BGR to RGB, and invokes the production one-face cropper and published model. The same clip supplies mono 16 kHz audio. Audio must be finite, audible and between 0.1 and 30 seconds. No frame is selected using its emotion label; no favorable examples replace failed inputs. Every record includes actor, truth, filename, SHA-256 and either actual model outputs or a failure. The full paired comparison retains the same successfully processed samples for every method.

![Research split and data flow](report_assets/research_flow.png)

Figure 6. Actor boundaries separate fitting, selection and final evaluation.

### Frozen models and architecture

The experts are published checkpoints, not networks trained from scratch here. The audio configuration is Wav2Vec2ForSequenceClassification with 12 transformer layers, 768 hidden dimensions, 12 attention heads and a 256-dimensional classifier projection. The image configuration is ViTForImageClassification with 12 layers, 768 hidden dimensions, 12 heads, 224-pixel input and 16-pixel patches. These values come from the downloaded checkpoint configuration files. The text expert is a RoBERTa multi-label classifier; it is not part of this audiovisual experiment.

Audio and image use softmax over their respective logits. Label aliases are explicitly mapped by name. Text uses sigmoid over its original fine-grained labels, then group maxima and normalization. The canonical seven-label order is happy, sad, angry, fear, surprise, disgust, neutral. The audio order used in the experiment is happy, sad, angry, neutral.

The neural weights remain frozen. Fitting learns only post-processing temperatures and class reliability. The code from the original execution record was restored and committed as ceb03a1 before rescoring. No test-guided parameter or grid change was made. The rerun reproduces a previously observed evaluation, not new independent validation.

### Temperature and empirical reliability

For each model, temperature scaling computes p_c(T) proportional to max(p_c, 10^-12) raised to 1/T. Candidates are 0.5, 1, 2 and 4. Training negative log likelihood selects the minimum; audio fitting includes only training truth labels it supports, while face fitting includes all training labels. A positive temperature preserves the ordering of an individual expert but can change a fused decision.

Predicted-class reliability is r_c = (1 + correct predictions of c) / (2 + total predictions of c), a Beta(1,1)-smoothed precision estimate. An unseen predicted class receives 0.5, not certainty. Audio reliability is fitted conditional on supported truth labels. That condition can overestimate its usefulness on the full seven-class problem and is an explicit limitation.

### Hierarchical and adaptive fusion

Let m be calibrated facial probability mass on the four audio-supported labels S. The hierarchy retains face probabilities outside S and returns m[(1-w) times normalized face scores on S + w times audio scores] within S. It preserves total group mass while allowing audio to change the relative supported-class allocation. Its constant weight is selected from 0, 0.25, 0.5, 0.75 and 1 using validation macro F1.

For adaptive weighting, entropy is H(p) = -sum p_c log p_c. Define Q = r_argmax(p) times max(1-H(p)/log(K), 10^-6)^gamma. The per-sample audio weight is alpha Q_audio / [alpha Q_audio + (1-alpha)Q_face], with a numerical denominator floor. The validation search uses the same five alpha values and gamma in 0, 1 and 2. First-grid-value tie breaking is deterministic. Gamma zero removes entropy; alpha zero returns calibrated face-only inference.

The controls are face-only, audio-only zero-padded to seven categories, existing support-aware averaging, ordinary zero-padded averaging, calibrated face, hierarchical constant weighting, and adaptive reliability. Audio-only is evaluated on all seven truth categories to keep the denominator identical; its unsupported classes remain visible as errors.

### Metrics robustness and uncertainty

Accuracy is exact top-label correctness. Macro F1 averages all seven per-class F1 values with zero for undefined classes. Confusion matrices use true labels as rows and predicted labels as columns. NLL averages -log p_true with a 10^-12 floor. The multiclass Brier score sums squared errors over classes before averaging examples; it is not divided by seven.

ECE uses ten equal-width bins of maximum confidence and sums bin frequency times the absolute difference between accuracy and confidence. Selective accuracy ranks by maximum score and retains approximately 50%, 80% or 100% of cases. Neither metric establishes a clinical abstention threshold. Entropy describes predictive score concentration, not all forms of uncertainty.

Missing audio falls back to calibrated face; missing face falls back to raw audio padded to seven classes. The deterministic contamination condition replaces calibrated audio scores with 0.5a + 0.5/4. This is a score-level stress test, not an experiment with noisy microphones, compression or occluded faces. The selected parameters are not retuned after contamination.

A paired actor bootstrap samples the two test actors with replacement for 1000 replicates, seed 20261116, retaining each actor's clips together. It reports adaptive-minus-face macro F1. With only two clusters, its interval is unstable and descriptive; it does not establish population significance.

### Completed sample counts and selected parameters""",
            table(
                ["Role", "Actors", "Complete samples"],
                [
                    ["Fitting", "02 and 03", r["counts"]["train"]],
                    ["Validation", "04", r["counts"]["validation"]],
                    ["Test", "05 and 06", r["counts"]["test"]],
                ],
            ),
            f"Recorded input failures: {len(r['failures'])}. No random predictions, replacement weights or fabricated labels were used.",
            table(
                ["Parameter", "Selected value"],
                [
                    [k, params[k]]
                    for k in [
                        "audio_temperature",
                        "face_temperature",
                        "static_audio_weight",
                        "adaptive_prior",
                        "entropy_power",
                    ]
                ],
            ),
            "### Baseline comparison on identical held out samples",
            table(
                ["Method", "Validation F1", "Test accuracy", "Test macro F1"],
                [
                    [
                        NAMES[k],
                        f"{v[k]['macro_f1']:.4f}",
                        f"{t[k]['accuracy']*100:.2f}%",
                        f"{t[k]['macro_f1']:.4f}",
                    ]
                    for k in NAMES
                ],
            ),
            "![Held out method comparison](report_assets/fusion_comparison.png)\n\nFigure 7. Same-sample accuracy and macro F1 for the seven methods.",
            f"Adaptive reliability classified {round(a['accuracy']*104)} of 104 clips correctly; existing fusion classified {round(b['accuracy']*104)}, and face-only classified {round(f['accuracy']*104)}. The adaptive change over existing fusion is {(a['accuracy']-b['accuracy'])*100:.2f} percentage points in accuracy and {a['macro_f1']-b['macro_f1']:.4f} in macro F1. These are sample-specific differences, not a general superiority claim.",
            "Validation selected zero audio weight for the static hierarchy, so that method equals calibrated face. The adaptive entropy exponent is zero: the selected variant uses class-conditioned reliability, and the result does not establish a benefit from the entropy term.",
            f"Existing fusion damaged {r['legacy_diagnostics']['face_correct_fusion_wrong']} correct facial decisions and repaired {r['legacy_diagnostics']['face_wrong_fusion_correct']} wrong ones on these test actors. Its disagreement rate with face-only was {r['legacy_diagnostics']['disagreement_rate']*100:.2f}%. The earlier Actor 01 accuracy loss therefore does not recur as a universal ordering. The support-normalization mechanism is real, but it is not proved to be the cause of every error.",
            "![Face only confusion](report_assets/confusion_face.png)\n\nFigure 8. Face-only confusion counts for Actors 05 and 06.",
            "![Existing fusion confusion](report_assets/confusion_legacy_support_average.png)\n\nFigure 9. Existing fusion on the same held-out records.",
            "![Adaptive confusion](report_assets/confusion_adaptive_reliability.png)\n\nFigure 10. Adaptive reliability on the same held-out records.",
            "### Actor variation and score uncertainty",
            table(
                ["Actor", "Face F1", "Existing F1", "Adaptive F1"],
                [
                    [actor]
                    + [
                        f"{r['test_by_actor'][actor][k]['macro_f1']:.4f}"
                        for k in [
                            "face",
                            "legacy_support_average",
                            "adaptive_reliability",
                        ]
                    ]
                    for actor in ["5", "6"]
                ],
            ),
            "Adaptive macro F1 improves on Actor 05 but decreases on Actor 06 relative to both face-only and existing fusion. Aggregate improvement hides heterogeneous class behavior.",
            f"The descriptive actor-bootstrap 95% interval for adaptive-minus-face macro F1 is [{r['paired_actor_bootstrap_delta_f1']['percentile_95'][0]:.4f}, {r['paired_actor_bootstrap_delta_f1']['percentile_95'][1]:.4f}]. It crosses zero. Only two test actors make this too fragile for a population confidence or significance claim.",
            table(
                ["Method", "NLL", "Brier", "ECE"],
                [
                    [NAMES[k]] + [f"{t[k][m]:.4f}" for m in ["nll", "brier", "ece_10"]]
                    for k in NAMES
                ],
            ),
            "The adaptive method lowers NLL and Brier loss relative to existing fusion but has higher ECE. Uncertainty quality therefore does not improve under every measure. Calibration changes no face-only top labels, as expected.",
            "![Actor and selective accuracy](report_assets/actor_uncertainty.png)\n\nFigure 11. Actor variation and confidence-ranked selective accuracy.",
            "<!-- PAGEBREAK -->\n\n### Prespecified stress conditions",
            table(
                ["Condition", "Accuracy", "Macro F1"],
                [
                    [
                        k.replace("_", " "),
                        f"{m['accuracy']*100:.2f}%",
                        f"{m['macro_f1']:.4f}",
                    ]
                    for k, m in r["stress"].items()
                ],
            ),
            "Flatter audio scores improve the selected adaptive result here. That is a post-evaluation observation, not permission to tune the method on test data. Since entropy power is zero, this improvement does not demonstrate entropy-aware corruption rejection. Missing-face performance remains poor because audio cannot predict three target labels.",
            "### Research finding and serving decision",
            "The bounded contribution is a reproducible comparison and support-preserving class-reliability adaptation around heterogeneous frozen experts. It is not invention of uncertainty-aware fusion, reproduction of COLD Fusion, or evidence of clinical utility. The existing application fusion remains unchanged while the experimental module and its limitations are made available for review.",
        ]
    )


def main():
    r = json.loads((P / "results.json").read_text())
    figures(r)
    source = (ROOT / "docs/report_source/report_template.md").read_text()
    a = r["test"]["adaptive_reliability"]
    b = r["test"]["legacy_support_average"]
    f = r["test"]["face"]
    abstract = f"The restored actor-disjoint procedure was rerun on 260 real clips with separate fitting, validation and test actors. On the 104 test clips, adaptive class-reliability fusion achieved {a['accuracy']*100:.2f}% accuracy and {a['macro_f1']:.4f} macro F1, compared with {b['accuracy']*100:.2f}% and {b['macro_f1']:.4f} for existing fusion and {f['accuracy']*100:.2f}% and {f['macro_f1']:.4f} for face-only. The selected entropy contribution was zero; actor-level results and calibration measures were mixed, and the two-actor interval crossed zero. This is a limited empirical finding, not a novel algorithm or broad superiority claim."
    conclusion = "The reproduced study supports a modest aggregate improvement for calibrated, support-preserving class-reliability fusion on this small subset. It also supplies reasons for restraint: the static method rejected audio, entropy was not selected, one actor lost macro F1, and ECE worsened relative to existing fusion. Those findings remain part of the contribution. The serving default is retained; a larger evaluation is needed before recommending a general replacement."
    tests = "The restored code passed 149 backend/research tests with five legacy skips in CI at ff1fba7. This includes the 143 existing backend tests and six research checks; the frontend suite passed 10 tests and the production build, and all six Playwright browser tests passed. The research checks also passed locally on 17 November. They cover mass conservation, limiting weights, temperature ordering, reliability smoothing, exact serving-baseline equivalence, metrics and actor separation. These deterministic fixtures are not performance samples. The original screenshot provenance remains tied to [R7]; the restored-code verification is linked in [R8]."
    for key, val in {
        "ABSTRACT_RESULT": abstract,
        "EXPERIMENT_SECTION": experiment_section(r),
        "CONCLUSION": conclusion,
        "TEST_STATUS": tests,
    }.items():
        source = source.replace("{{" + key + "}}", val)
    source = source.replace(
        "<!-- PAGEBREAK -->\n\n## 8 Security",
        "![Actual guest text result crop](report_assets/actual_result_crop.png)\n\nFigure 12. Actual guest text inference from the preserved CI screenshot; cropped for readability, with original pixels and source image retained.\n\n<!-- PAGEBREAK -->\n\n## 8 Security",
    )
    lines = source.splitlines()
    number = 0
    for i, line in enumerate(lines):
        if line.startswith("Figure "):
            number += 1
            lines[i] = "Figure " + str(number) + ". " + line.split(". ", 1)[1]
    source = "\n".join(lines) + "\n"
    if "{{" in source:
        raise ValueError("Unfilled report slot")
    (ROOT / "docs/ACADEMIC_REPORT.md").write_text(source)
    print("Report source words", len(source.split()))


if __name__ == "__main__":
    main()
