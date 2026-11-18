"""Generate paper tables and plots exclusively from completed study evidence."""
import argparse
import json
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

from research.paper_v1.study import digest, ROOT, LABELS


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--results', type=Path, required=True)
    parser.add_argument('--fitted', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    r, f = json.loads(args.results.read_text()), json.loads(args.fitted.read_text())
    if r['fitted_sha256'] != digest(args.fitted) or r['protocol_sha256'] != digest(ROOT/'protocol.json'):
        raise ValueError('Evidence provenance mismatch')
    args.output.mkdir(parents=True, exist_ok=True)
    names = list(r['test'])
    n = r['coverage']['overall']
    lines = ['# Prospective study results', '',
             f"Generated from actual score evidence: {n['accepted']} accepted pairs / {n['attempted']} attempted test clips.", '',
             '| Method | Accuracy | Macro F1 | NLL | Brier | ECE (10 bins) |',
             '|---|---:|---:|---:|---:|---:|']
    for m, value in r['test'].items():
        lines.append('| '+m+' | '+' | '.join(f'{value[k]:.4f}' for k in ['accuracy', 'macro_f1', 'nll', 'brier', 'ece_10'])+' |')
    u = r['primary_uncertainty']
    lines += ['', f"Primary adaptive-hierarchy minus legacy macro F1: **{u['delta_macro_f1']:+.4f}**.",
              f"Paired actor-bootstrap 95% interval: [{u['percentile_95'][0]:+.4f}, {u['percentile_95'][1]:+.4f}]; {u['bootstrap_replicates']} replicates.",
              f"Exact two-sided actor-block permutation p = {u['two_sided_actor_permutation_p']:.4f} ({u['exact_permutations']} assignments).",
              '', u['caveat'], '', '## Selected settings', '', '```json',
              json.dumps({'parameters': f['parameters'], 'selected': f['selected']}, indent=2), '```', '',
              '## Actor results', '', '| Actor | Pairs | Face macro F1 | Legacy macro F1 | Adaptive hierarchy macro F1 |',
              '|---|---:|---:|---:|---:|']
    for actor, methods in r['by_actor'].items():
        lines.append(f"| {actor} | {methods['face']['n']} | "+' | '.join(f"{methods[k]['macro_f1']:.4f}" for k in ['face','legacy','adaptive_hierarchy'])+' |')
    lines += ['', '## Scope', '',
              'All twelve prespecified methods are reported. The primary comparison and its uncertainty were fixed before test collection. Secondary comparisons remain descriptive. Score mixing is not physical noise testing. One acted dataset and one checkpoint pair do not establish generalization or clinical validity.', '',
              f"Results SHA-256: `{digest(args.results)}`", f"Fitted artifact SHA-256: `{digest(args.fitted)}`", '']
    (args.output/'RESULTS.md').write_text('\n'.join(lines))
    plt.rcParams.update({'font.size': 10, 'savefig.dpi': 180})
    fig, ax = plt.subplots(figsize=(10, 6))
    y = np.arange(len(names))
    ax.barh(y-.18, [r['test'][m]['accuracy'] for m in names], .35, label='Accuracy', color='#3274a1')
    ax.barh(y+.18, [r['test'][m]['macro_f1'] for m in names], .35, label='Macro F1', color='#e1812c')
    ax.set(yticks=y, yticklabels=names, xlim=(0, 1), xlabel='Held-out score', title=f"Same {n['accepted']} test pairs: all prespecified methods")
    ax.set_yticklabels([m.replace('_', ' ') for m in names])
    ax.invert_yaxis(); ax.legend(); fig.tight_layout(); fig.savefig(args.output/'method_comparison.png'); plt.close(fig)
    for method in ['face', 'legacy', 'adaptive_zero', 'adaptive_hierarchy']:
        cm = np.array(r['test'][method]['confusion_matrix'])
        fig, ax = plt.subplots(figsize=(7, 6))
        im = ax.imshow(cm, cmap='Blues', vmin=0)
        for i in range(7):
            for j in range(7):
                ax.text(j, i, str(cm[i, j]), ha='center', va='center', color='white' if cm[i,j] > cm.max()/2 else 'black')
        ax.set(xticks=range(7), yticks=range(7), xticklabels=LABELS, yticklabels=LABELS,
               xlabel='Predicted category', ylabel='True category', title=f'{method}: test confusion counts')
        plt.setp(ax.get_xticklabels(), rotation=35, ha='right')
        fig.colorbar(im, ax=ax); fig.tight_layout(); fig.savefig(args.output/f'confusion_{method}.png'); plt.close(fig)
    fig, ax = plt.subplots(figsize=(9, 5))
    actors = list(r['by_actor'])
    x = np.arange(len(actors))
    for offset, method in zip([-.25, 0, .25], ['face','legacy','adaptive_hierarchy']):
        ax.bar(x+offset, [r['by_actor'][a][method]['macro_f1'] for a in actors], .24, label=method)
    ax.set(xticks=x, xticklabels=actors, xlabel='Held-out actor', ylabel='Macro F1', ylim=(0,1), title='Between-actor variation')
    ax.legend(); fig.tight_layout(); fig.savefig(args.output/'actor_comparison.png'); plt.close(fig)
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.plot([0, 1], [0, 1], '--', color='gray', label='Perfect calibration reference')
    records = r['held_out_predictions']
    truth = np.array([LABELS.index(x['true']) for x in records])
    for method in ['face', 'legacy', 'adaptive_hierarchy']:
        probabilities = np.array([x['scores'][method] for x in records])
        conf = probabilities.max(1); correct = probabilities.argmax(1) == truth
        bins = np.minimum((conf * 10).astype(int), 9)
        points = [(conf[bins==b].mean(), correct[bins==b].mean(), int((bins==b).sum())) for b in range(10) if (bins==b).any()]
        ax.plot([p[0] for p in points], [p[1] for p in points], marker='o', label=method.replace('_', ' '))
    ax.set(xlim=(0, 1), ylim=(0, 1), xlabel='Mean confidence in bin', ylabel='Observed accuracy in bin', title='Held-out reliability curves with ten fixed bins')
    ax.legend(); fig.tight_layout(); fig.savefig(args.output/'calibration.png'); plt.close(fig)
    print(args.output/'RESULTS.md')


if __name__ == '__main__':
    main()
