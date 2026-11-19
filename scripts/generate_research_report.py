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

The protocol assigns Actors 02 and 03 to fitting, Actor 04 to validation, and Actors 05 and 06 to testing. Actor 01 is left out because its errors were used to develop the hypothesis. This is a project-defined subset, not an official RAVDESS split. From each official Video_Speech_Actor archive, the collector keeps audiovisual speech filenames beginning 01-01 and excludes calm without relabelling it as neutral. Each actor supplies 52 clips: four neutral and eight for each of the other retained classes. The test set therefore contains eight neutral clips and sixteen for each other class. Repeated statements, intensities and takes create dependence within an actor; 104 clips do not represent 104 independent people.

For each clip, the collector extracts the midpoint frame, converts it from BGR to RGB and passes it through the same one-face cropper and classifier used by the application. Audio comes from that clip and is converted to mono at 16 kHz. It must contain finite, audible samples and last between 0.1 and 30 seconds. Frame selection does not use the emotion label, and a failed input is recorded rather than replaced with a more favourable example. Each record contains the actor, true label, filename, SHA-256 hash and either model outputs or an error. All methods are compared on the same successfully processed pairs.

![Research split and data flow](report_assets/research_flow.png)

Figure 6. Actor boundaries separate fitting, selection and final evaluation.

### Frozen models and architecture

The experiment uses published checkpoints with their neural weights fixed. The speech configuration is Wav2Vec2ForSequenceClassification: 12 transformer layers, 768 hidden dimensions, 12 attention heads and a 256-dimensional classifier projection. The facial configuration is ViTForImageClassification: 12 layers, 768 hidden dimensions, 12 heads, a 224-pixel input and 16-pixel patches. These specifications are taken from the downloaded configuration files. The application also uses a RoBERTa multi-label text classifier, but text is outside this audiovisual experiment.

Audio and image use softmax over their respective logits. Label aliases are explicitly mapped by name. Text uses sigmoid over its original fine-grained labels, then group maxima and normalization. The canonical seven-label order is happy, sad, angry, fear, surprise, disgust, neutral. The audio order used in the experiment is happy, sad, angry, neutral.

Only the post-processing temperatures and class-reliability estimates are fitted; the neural weights are not updated. After the earlier local artifacts were lost, the original procedure was restored from the execution record and committed as ceb03a1 before rescoring. Its search grid and objective were unchanged. The resulting run reproduces an already observed experiment rather than providing a new independent test.

### Temperature and empirical reliability

Temperature scaling converts each model score p_c into a value proportional to max(p_c, 10^-12) raised to 1/T, then normalizes the values. The candidates are 0.5, 1, 2 and 4. The temperature with the lowest fitting-set negative log likelihood is selected. Audio fitting uses only true labels that the speech model supports; face fitting uses all labels. A positive temperature keeps an individual model's class order unchanged, although the changed scores can affect a fusion decision.

Class reliability estimates how often a predicted category was correct in the fitting data. The estimate is r_c = (1 + correct predictions of c) / (2 + total predictions of c), equivalent to Beta(1,1) smoothing of precision. A class that is never predicted receives 0.5. For audio, this estimate is conditional on supported true labels; it may therefore be optimistic when the model is used within the full seven-class task.

### Hierarchical and adaptive fusion

Let m denote the calibrated facial probability mass on the four labels in S. The hierarchy keeps the facial scores outside S. Within S, it returns m[(1-w) times normalized face scores on S + w times audio scores]. Audio can change which supported label is preferred without changing the total mass assigned to that group. The constant weight w is selected by validation macro F1 from 0, 0.25, 0.5, 0.75 and 1.

Adaptive weighting uses the predicted class reliability together with a measure of score concentration. Entropy is H(p) = -sum p_c log p_c. For a model with K outputs, define Q = r_argmax(p) times max(1-H(p)/log(K), 10^-6)^gamma. The audio weight for a sample is alpha Q_audio / [alpha Q_audio + (1-alpha)Q_face], with a numerical floor on the denominator. Validation searches the same five alpha values and gamma values 0, 1 and 2. Ties select the first grid value deterministically. Gamma zero removes the entropy term; alpha zero returns calibrated face-only inference.

Seven methods are compared: face-only, audio-only padded to seven labels, the existing support-aware average, an ordinary average with zero-padded audio, calibrated face-only, a constant-weight hierarchy and adaptive reliability weighting. The audio-only control is scored against all seven true categories so that every method has the same denominator. Its inability to predict three classes is counted as part of its error.

### Metrics robustness and uncertainty

Accuracy is exact top-label correctness. Macro F1 averages all seven per-class F1 values with zero for undefined classes. Confusion matrices use true labels as rows and predicted labels as columns. NLL averages -log p_true with a 10^-12 floor. The multiclass Brier score sums squared errors over classes before averaging examples; it is not divided by seven.

Expected calibration error (ECE) divides maximum confidence into ten equal-width bins. It sums each bin's frequency multiplied by the absolute gap between accuracy and confidence. Selective accuracy instead orders examples by maximum score and retains approximately 50%, 80% or 100% of them. This shows how accuracy changes when lower-confidence cases are excluded, but does not establish a clinical rejection threshold. Entropy measures how concentrated a score vector is, rather than every source of model uncertainty.

When audio is missing, the method returns calibrated facial scores. When the face is missing, it returns raw audio scores padded to seven labels. A further stress condition replaces calibrated audio probabilities with 0.5a + 0.5/4, moving them towards a uniform distribution. The selected parameters remain fixed. This tests a known change to the scores; it does not simulate physical microphone noise, compression or facial occlusion.

The uncertainty calculation resamples the two test actors with replacement for 1000 replicates using seed 20261116. Each actor's clips stay together, and each replicate measures adaptive-minus-face macro F1. Pairing the methods preserves their comparison on the same samples. However, two actor clusters provide a very limited basis for resampling, so the interval is descriptive and cannot support a population-level significance claim.

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
            f"Adaptive reliability classified {round(a['accuracy']*104)} of 104 clips correctly; existing fusion classified {round(b['accuracy']*104)}, and face-only classified {round(f['accuracy']*104)}. The adaptive change over existing fusion is {(a['accuracy']-b['accuracy'])*100:.2f} percentage points in accuracy and {a['macro_f1']-b['macro_f1']:.4f} in macro F1. The gain is small and needs to be considered alongside the actor-level results below.",
            "Validation chose zero audio weight for the static hierarchy, making it identical to calibrated face-only inference. It also chose an entropy exponent of zero for adaptive fusion. The selected adaptive method therefore uses class reliability without an entropy contribution; these results provide no evidence that the entropy term helped.",
            f"Existing fusion damaged {r['legacy_diagnostics']['face_correct_fusion_wrong']} correct facial decisions and repaired {r['legacy_diagnostics']['face_wrong_fusion_correct']} wrong ones on these test actors. Its disagreement rate with face-only was {r['legacy_diagnostics']['disagreement_rate']*100:.2f}%. In contrast to Actor 01, existing fusion has a net gain over face-only inference on these actors. The effect of the normalization rule can be derived mathematically, but these results do not establish it as the cause of every error.",
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
            "Adaptive fusion improves macro F1 for Actor 05. For Actor 06, it performs worse than both face-only inference and existing fusion. The overall improvement is therefore not consistent across the two actors.",
            f"The descriptive actor-bootstrap 95% interval for adaptive-minus-face macro F1 is [{r['paired_actor_bootstrap_delta_f1']['percentile_95'][0]:.4f}, {r['paired_actor_bootstrap_delta_f1']['percentile_95'][1]:.4f}]. The interval includes zero. With only two test actors, it is too unstable to establish a population advantage or statistical significance.",
            table(
                ["Method", "NLL", "Brier", "ECE"],
                [
                    [NAMES[k]] + [f"{t[k][m]:.4f}" for m in ["nll", "brier", "ece_10"]]
                    for k in NAMES
                ],
            ),
            "Adaptive fusion has lower NLL and Brier loss than existing fusion, but higher ECE. The calibration measures therefore give a mixed result. As expected, temperature scaling leaves the face-only top labels unchanged.",
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
            "Moving the audio scores towards a uniform distribution improves the adaptive result in this test. This was observed after evaluation and was not used to retune the method. Because the selected entropy power is zero, the result cannot be credited to entropy-based rejection of unreliable audio. Without the face input, performance remains poor because the speech model cannot predict three of the target classes.",
            "### Research finding and serving decision",
            "This experiment contributes an inspectable comparison of the actual models and an adaptation that preserves label-group probability mass while weighting speech by class reliability. It does not introduce uncertainty-aware fusion as a new idea, reproduce COLD Fusion or establish clinical usefulness. Given the mixed findings and small test set, the application keeps its existing fusion rule. The experimental method remains available separately for further evaluation.",
        ]
    )


def main():
    r = json.loads((P / "results.json").read_text())
    figures(r)
    source = (ROOT / "docs/report_source/report_template.md").read_text()
    a = r["test"]["adaptive_reliability"]
    b = r["test"]["legacy_support_average"]
    f = r["test"]["face"]
    abstract = f"The follow-up uses 260 real clips with separate actors for fitting, validation and testing. On 104 test clips, adaptive class-reliability fusion achieved {a['accuracy']*100:.2f}% accuracy and {a['macro_f1']:.4f} macro F1. Existing fusion achieved {b['accuracy']*100:.2f}% and {b['macro_f1']:.4f}, while face-only inference achieved {f['accuracy']*100:.2f}% and {f['macro_f1']:.4f}. Validation selected no entropy contribution. Results varied between actors, calibration measures were mixed and the two-actor uncertainty interval included zero. The study therefore reports a small improvement on this subset, without claiming a new algorithm or a general advantage. The application remains an educational expression-analysis tool rather than a clinical assessment system."
    conclusion = "Adaptive class-reliability fusion improved the overall result on this subset, but the detailed findings qualify that improvement. Static weighting selected no audio contribution, the entropy term was not selected, one actor lost macro F1 and ECE worsened relative to existing fusion. These outcomes show why average accuracy alone is insufficient when deciding whether to replace the application method. The existing default is retained until a larger evaluation establishes a more consistent benefit."
    tests = "At commit ff1fba7, CI passed 149 Python tests: 143 existing backend tests and six research tests, with five legacy tests skipped. The frontend passed 10 tests and its production build; all six Playwright browser tests passed as well. The research tests also passed locally on 17 November. They check probability-mass conservation, limiting weights, temperature ordering, reliability smoothing, equivalence to the application baseline, metrics and actor separation. Test fixtures verify these properties; they are not samples used to measure model accuracy. The screenshots are tied to [R7] and the regression results to [R8]."
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
