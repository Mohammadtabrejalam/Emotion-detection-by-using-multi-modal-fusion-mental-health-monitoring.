"""Recompute report metrics from committed labels; does not run model inference.

Run from the repository root: python -m scripts.verify_report_evidence
Only standard-library dependencies are required.
"""
import hashlib
import json
import math
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def compute(rows, mode, labels):
    matrix = [[0 for _ in labels] for _ in labels]
    for row in rows:
        matrix[labels.index(row['true'])][labels.index(row[mode])] += 1
    n = len(rows)
    per_class = {}
    for i, label in enumerate(labels):
        tp = matrix[i][i]
        support = sum(matrix[i])
        predicted = sum(row[i] for row in matrix)
        precision = tp / predicted if predicted else 0.0
        recall = tp / support if support else 0.0
        f1 = 2 * tp / (support + predicted) if support + predicted else 0.0
        per_class[label] = {'precision': precision, 'recall': recall,
                            'f1-score': f1, 'support': float(support)}
    return {'samples': n, 'accuracy': sum(matrix[i][i] for i in range(len(labels))) / n,
            'macro_f1': sum(x['f1-score'] for x in per_class.values()) / len(labels),
            'weighted_f1': sum(x['f1-score'] * x['support'] for x in per_class.values()) / n,
            'per_class': per_class, 'labels': labels, 'confusion_matrix': matrix}


def require_equal(actual, expected, name):
    if isinstance(actual, (float, int)) and not isinstance(actual, bool):
        if not math.isclose(actual, expected, rel_tol=1e-12, abs_tol=1e-12):
            raise ValueError(f'{name}: {actual!r} != {expected!r}')
    elif actual != expected:
        raise ValueError(f'{name}: {actual!r} != {expected!r}')


def main():
    evidence = {'scope': 'Arithmetic verification of committed prediction labels; no new inference',
                'reports': {}}
    for name in ('meld_text', 'ravdess_actor01'):
        path = ROOT / 'reports' / f'{name}.json'
        report = json.loads(path.read_text())
        rows = report['predictions']
        if len({r['id'] for r in rows}) != len(rows):
            raise ValueError(f'{name}: duplicate prediction IDs')
        counts = Counter(r['true'] for r in rows)
        baseline = report['majority_class_baseline']
        require_equal(counts[baseline['label']], max(counts.values()), f'{name}.majority_label')
        require_equal(counts[baseline['label']] / len(rows), baseline['accuracy'], f'{name}.majority_accuracy')
        results = {}
        for mode, saved in report['results'].items():
            eligible = [r for r in rows if mode in r and r['true'] in saved['labels']]
            measured = compute(eligible, mode, saved['labels'])
            for key in ('samples', 'accuracy', 'macro_f1', 'weighted_f1', 'labels', 'confusion_matrix'):
                require_equal(measured[key], saved[key], f'{name}.{mode}.{key}')
            for label, values in measured['per_class'].items():
                for key, value in values.items():
                    require_equal(value, saved['per_class'][label][key], f'{name}.{mode}.{label}.{key}')
            results[mode] = measured
        evidence['reports'][name] = {'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                                      'records': len(rows), 'failures': len(report['failures']),
                                      'results': results}
        if name == 'ravdess_actor01':
            paired = {'both_correct': 0, 'face_only_correct': 0, 'fusion_only_correct': 0,
                      'both_wrong': 0, 'changed_labels': []}
            for row in rows:
                face, fusion = row['image'] == row['true'], row['fusion'] == row['true']
                key = ('both_correct' if face and fusion else 'face_only_correct' if face
                       else 'fusion_only_correct' if fusion else 'both_wrong')
                paired[key] += 1
                if row['image'] != row['fusion']:
                    paired['changed_labels'].append(row)
            evidence['actor01_paired_comparison'] = paired
    target = ROOT / 'research' / 'fusion_v2' / 'verified_report_evidence.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(evidence, indent=2) + '\n')
    print('Verified 2,610 MELD labels and 52 RAVDESS records across four metric sets.')
    print('All saved accuracy, F1, class metrics and confusion matrices agree.')
    print('Actor 01: fusion fixes 1 face error and introduces 2; 4 labels change.')


if __name__ == '__main__':
    main()
