"""
Unified Research Metric Computation & Confusion Matrix Generator — MindSense
"""

import numpy as np
from typing import Dict, Any, List
from .config import EMOTION_CLASSES, NUM_CLASSES


def compute_comprehensive_metrics(
    y_true: List[int],
    y_pred: List[int],
    class_names: List[str] = EMOTION_CLASSES
) -> Dict[str, Any]:
    """
    Computes Accuracy, Macro/Weighted Precision, Recall, F1, per-class metrics, and confusion matrix.
    All calculations are done deterministically using NumPy without hardcoding.
    """
    y_true_arr = np.array(y_true, dtype=np.int64)
    y_pred_arr = np.array(y_pred, dtype=np.int64)
    total_samples = len(y_true_arr)

    if total_samples == 0:
        raise ValueError("Cannot compute metrics for 0 samples.")

    # Overall Accuracy
    accuracy = float(np.mean(y_true_arr == y_pred_arr))

    # Confusion Matrix (rows = true, cols = pred)
    num_cls = len(class_names)
    conf_matrix = np.zeros((num_cls, num_cls), dtype=np.int64)
    for t, p in zip(y_true_arr, y_pred_arr):
        if 0 <= t < num_cls and 0 <= p < num_cls:
            conf_matrix[t, p] += 1

    per_class = {}
    macro_p_sum = 0.0
    macro_r_sum = 0.0
    macro_f1_sum = 0.0

    weighted_p_sum = 0.0
    weighted_r_sum = 0.0
    weighted_f1_sum = 0.0

    for i, cls_name in enumerate(class_names):
        tp = int(conf_matrix[i, i])
        fp = int(np.sum(conf_matrix[:, i]) - tp)
        fn = int(np.sum(conf_matrix[i, :]) - tp)
        support = int(np.sum(conf_matrix[i, :]))

        precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        recall = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        f1 = float(2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

        per_class[cls_name] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1": round(f1, 4),
            "support": support
        }

        macro_p_sum += precision
        macro_r_sum += recall
        macro_f1_sum += f1

        weighted_p_sum += precision * support
        weighted_r_sum += recall * support
        weighted_f1_sum += f1 * support

    macro_precision = float(macro_p_sum / num_cls)
    macro_recall = float(macro_r_sum / num_cls)
    macro_f1 = float(macro_f1_sum / num_cls)

    weighted_precision = float(weighted_p_sum / total_samples) if total_samples > 0 else 0.0
    weighted_recall = float(weighted_r_sum / total_samples) if total_samples > 0 else 0.0
    weighted_f1 = float(weighted_f1_sum / total_samples) if total_samples > 0 else 0.0

    return {
        "accuracy": round(accuracy, 4),
        "macro_precision": round(macro_precision, 4),
        "macro_recall": round(macro_recall, 4),
        "macro_f1": round(macro_f1, 4),
        "weighted_precision": round(weighted_precision, 4),
        "weighted_recall": round(weighted_recall, 4),
        "weighted_f1": round(weighted_f1, 4),
        "total_samples": total_samples,
        "per_class": per_class,
        "confusion_matrix": conf_matrix.tolist()
    }
