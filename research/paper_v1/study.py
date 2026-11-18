"""Prospective frozen-expert study: selection and evaluation are separate commands."""
import argparse
import hashlib
import itertools
import json
from pathlib import Path

import numpy as np
from sklearn.metrics import confusion_matrix, precision_recall_fscore_support

ROOT = Path(__file__).parent
LABELS = ['happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral']
AUDIO = ['happy', 'sad', 'angry', 'neutral']
S = np.array([LABELS.index(x) for x in AUDIO])
O = np.array([3, 4, 5])


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def protocol():
    return json.loads((ROOT / 'protocol.json').read_text())


def norm(p):
    p = np.asarray(p, dtype=float)
    return p / p.sum(axis=-1, keepdims=True)


def temperature(p, t):
    return norm(np.maximum(p, 1e-12) ** (1 / t))


def entropy(p):
    return -(p * np.log(np.maximum(p, 1e-12))).sum(axis=-1)


def hierarchical(a, v, w):
    # Algebraically equivalent to conditional blending; safe even at zero mass.
    q = v.copy()
    w = np.asarray(w).reshape(-1, 1)
    mass = v[:, S].sum(axis=1, keepdims=True)
    q[:, S] = (1 - w) * v[:, S] + w * mass * a
    return q


def zero_blend(a, v, w):
    w = np.asarray(w).reshape(-1, 1)
    q = (1 - w) * v
    q[:, S] += w * a
    return q


def reliability(p, y):
    pred = p.argmax(1)
    return np.array([(1 + ((pred == c) & (y == c)).sum()) /
                     (2 + (pred == c).sum()) for c in range(p.shape[1])])


def macro_f1(y, pred):
    cm = confusion_matrix(y, pred, labels=range(7))
    denominator = cm.sum(0) + cm.sum(1)
    return float(np.divide(2 * cm.diagonal(), denominator,
                          out=np.zeros(7), where=denominator != 0).mean())


def metrics(y, p):
    pred, conf = p.argmax(1), p.max(1)
    correct = pred == y
    bins = np.minimum((conf * 10).astype(int), 9)
    ece = sum((bins == b).mean() * abs(correct[bins == b].mean() - conf[bins == b].mean())
              for b in range(10) if (bins == b).any())
    precision, recall, f1, support = precision_recall_fscore_support(
        y, pred, labels=range(7), zero_division=0)
    return dict(n=len(y), accuracy=float(correct.mean()), macro_f1=macro_f1(y, pred),
                confusion_matrix=confusion_matrix(y, pred, labels=range(7)).tolist(),
                per_class={label: dict(precision=float(precision[i]), recall=float(recall[i]),
                                      f1=float(f1[i]), support=int(support[i]))
                           for i, label in enumerate(LABELS)},
                nll=float(-np.log(np.maximum(p[np.arange(len(y)), y], 1e-12)).mean()),
                brier=float(((p - np.eye(7)[y]) ** 2).sum(1).mean()), ece_10=float(ece),
                mean_entropy=float(entropy(p).mean()),
                selective_accuracy={str(c): float(correct[np.argsort(-conf, kind='stable')[:max(1, int(c * len(y)))]].mean())
                                    for c in [0.5, 0.8, 1.0]})


def expected_ids(actor):
    # Neutral has normal intensity only; the other six categories have two.
    return {f'01-01-{e:02}-{i:02}-{s:02}-{r:02}-{actor:02}.mp4'
            for e in [1, 3, 4, 5, 6, 7, 8]
            for i in ([1] if e == 1 else [1, 2]) for s in [1, 2] for r in [1, 2]}


def read_records(paths, allowed, complete=True):
    rows = [json.loads(line) for path in paths for line in Path(path).read_text().splitlines() if line.strip()]
    ids = [r['id'] for r in rows]
    if len(ids) != len(set(ids)):
        raise ValueError('Duplicate sample IDs')
    if any(r['actor'] not in allowed for r in rows):
        raise ValueError('Actor outside permitted split; refusing potential leakage')
    cfg = protocol()
    mapping = {'01': 'neutral', '03': 'happy', '04': 'sad', '05': 'angry',
               '06': 'fear', '07': 'disgust', '08': 'surprise'}
    for r in rows:
        if r['id'] not in expected_ids(r['actor']) or mapping[r['id'].split('-')[2]] != r['true']:
            raise ValueError('Sample identity/label mismatch')
        if len(r.get('sha256', '')) != 64 or any(x not in '0123456789abcdef' for x in r['sha256']):
            raise ValueError('Missing input content hash')
        if ('failure' in r) == ('modalities' in r):
            raise ValueError('Exactly one of modalities or failure is required')
        if 'failure' in r:
            continue
        for key, labels in [('audio', AUDIO), ('image', LABELS)]:
            m = r['modalities'][key]
            if any(m.get(k) != v for k, v in cfg['models'][key].items()):
                raise ValueError('Unexpected model provenance')
            p = m['probabilities']
            if set(p) != set(labels):
                raise ValueError('Unexpected label support')
            values = np.array(list(p.values()), dtype=float)
            if not np.isfinite(values).all() or (values < 0).any() or not np.isclose(values.sum(), 1, atol=1e-5):
                raise ValueError('Invalid probability distribution')
    if complete:
        for actor in allowed:
            ar = [r for r in rows if r['actor'] == actor]
            if {r['id'] for r in ar} != expected_ids(actor):
                raise ValueError(f'Incomplete actor {actor}; all 52 attempted clips required')
            if not any('modalities' in r for r in ar):
                raise ValueError(f'No successful pairs for actor {actor}')
    return sorted(rows, key=lambda r: (r['actor'], r['id']))


def arrays(rows):
    good = [r for r in rows if 'modalities' in r]
    return (good, np.array([r['actor'] for r in good]),
            np.array([LABELS.index(r['true']) for r in good]),
            norm([[r['modalities']['audio']['probabilities'][c] for c in AUDIO] for r in good]),
            norm([[r['modalities']['image']['probabilities'][c] for c in LABELS] for r in good]))


def coverage(rows):
    def count(rs):
        return dict(attempted=len(rs), accepted=sum('modalities' in r for r in rs))
    return dict(overall=count(rows), by_actor={str(a): count([r for r in rows if r['actor'] == a])
                                             for a in sorted({r['actor'] for r in rows})},
                by_class={c: count([r for r in rows if r['true'] == c]) for c in LABELS},
                failures=[r for r in rows if 'failure' in r])


def predict(method, a, v, fitted, setting=None, contaminate=False):
    raw_a, raw_v = a, v
    p = fitted['parameters']
    a, v = temperature(a, p['audio_temperature']), temperature(v, p['face_temperature'])
    if method == 'uncalibrated_hierarchy':
        a, v = raw_a, raw_v
    # Stress is explicitly applied to expert scores, not raw media.
    if contaminate:
        a = 0.5 * a + 0.5 / 4
        raw_a = 0.5 * raw_a + 0.5 / 4
    if method == 'face':
        return raw_v
    if method == 'audio':
        return zero_blend(raw_a, raw_v, 1)
    if method == 'legacy':
        q = raw_v.copy()
        q[:, S] = (raw_v[:, S] + raw_a) / 2
        return norm(q)
    if method == 'equal_zero':
        return zero_blend(raw_a, raw_v, 0.5)
    if method == 'calibrated_face':
        return v
    setting = setting if setting is not None else fitted['selected'][method]
    w, gamma = setting['weight'], setting['gamma']
    if not method.startswith('static_'):
        ra = np.array(p['conditional_audio_reliability'] if method == 'conditional_hierarchy' else p['audio_reliability'])
        rv = np.array(p['face_reliability'])
        qa = ra[a.argmax(1)] * np.maximum(1 - entropy(a) / np.log(4), 1e-6) ** gamma
        qv = rv[v.argmax(1)] * np.maximum(1 - entropy(v) / np.log(7), 1e-6) ** gamma
        w = w * qa / np.maximum(w * qa + (1 - w) * qv, 1e-12)
    return zero_blend(a, v, w) if method.endswith('_zero') else hierarchical(a, v, w)


def fit(paths):
    cfg = protocol()
    rows = read_records(paths, cfg['train_actors'] + cfg['validation_actors'])
    _, actors, y, a, v = arrays(rows)
    train, val = np.isin(actors, cfg['train_actors']), np.isin(actors, cfg['validation_actors'])
    ay = np.array([list(S).index(c) if c in S else -1 for c in y])
    supported_train = train & (ay >= 0)
    if not supported_train.any():
        raise ValueError('Audio fitting requires supported ground truths')
    trace = {}
    for name, probs, truths, mask in [('audio', a, ay, supported_train), ('face', v, y, train)]:
        trace[name] = [{'temperature': t, 'nll': float(-np.log(temperature(probs[mask], t)[np.arange(mask.sum()), truths[mask]]).mean())}
                       for t in cfg['temperature_grid']]
    ta, tv = [min(trace[k], key=lambda r: r['nll'])['temperature'] for k in ['audio', 'face']]
    ac, vc = temperature(a, ta), temperature(v, tv)
    result = dict(protocol_sha256=digest(ROOT / 'protocol.json'),
                  development_sha256={str(path): digest(path) for path in paths},
                  coverage=coverage(rows), parameters=dict(audio_temperature=ta, face_temperature=tv,
                  audio_reliability=reliability(ac[train], ay[train]).tolist(),
                  conditional_audio_reliability=reliability(ac[supported_train], ay[supported_train]).tolist(),
                  face_reliability=reliability(vc[train], y[train]).tolist()),
                  selected={}, selection_trace={'temperature_training_nll': trace}, validation={})
    for method in cfg['methods']:
        if method not in ['face', 'audio', 'legacy', 'equal_zero', 'calibrated_face']:
            trials = []
            for w, g in itertools.product(cfg['weight_grid'], cfg['entropy_grid'] if method == 'entropy_hierarchy' else [0]):
                setting = dict(weight=w, gamma=g)
                score = macro_f1(y[val], predict(method, a[val], v[val], result, setting).argmax(1))
                trials.append(dict(**setting, macro_f1=score))
            best = max(trials, key=lambda x: x['macro_f1'])
            result['selected'][method] = {k: best[k] for k in ['weight', 'gamma']}
            result['selection_trace'][method] = trials
        result['validation'][method] = metrics(y[val], predict(method, a[val], v[val], result))
    return result


def uncertainty(y, actors, proposed, baseline, cfg):
    actor_ids = sorted(set(actors))
    pred, base = proposed.argmax(1), baseline.argmax(1)
    observed = macro_f1(y, pred) - macro_f1(y, base)
    rng = np.random.default_rng(cfg['uncertainty']['seed'])
    delta = []
    for _ in range(cfg['uncertainty']['actor_bootstrap_replicates']):
        ix = np.concatenate([np.flatnonzero(actors == a) for a in rng.choice(actor_ids, len(actor_ids), replace=True)])
        delta.append(macro_f1(y[ix], pred[ix]) - macro_f1(y[ix], base[ix]))
    perm = []
    for bits in itertools.product([False, True], repeat=len(actor_ids)):
        swap = np.isin(actors, [a for a, b in zip(actor_ids, bits) if b])
        perm.append(macro_f1(y, np.where(swap, base, pred)) - macro_f1(y, np.where(swap, pred, base)))
    return dict(delta_macro_f1=observed, actor_clusters=len(actor_ids), bootstrap_replicates=len(delta),
                percentile_95=np.percentile(delta, [2.5, 97.5]).tolist(), exact_permutations=len(perm),
                two_sided_actor_permutation_p=float((np.abs(perm) >= abs(observed) - 1e-12).mean()),
                caveat='Limited actor population; block exchangeability is assumed. Not clinical or cross-dataset evidence.')


def evaluate(paths, fitted_path):
    cfg = protocol()
    fitted = json.loads(Path(fitted_path).read_text())
    if fitted['protocol_sha256'] != digest(ROOT / 'protocol.json'):
        raise ValueError('Fitted artifact belongs to a different protocol')
    rows = read_records(paths, cfg['test_actors'])
    good, actors, y, a, v = arrays(rows)
    methods = {m: predict(m, a, v, fitted) for m in cfg['methods']}
    result = dict(protocol=cfg, protocol_sha256=digest(ROOT / 'protocol.json'), fitted_sha256=digest(fitted_path),
                  test_score_sha256={str(p): digest(p) for p in paths}, coverage=coverage(rows),
                  test={m: metrics(y, p) for m, p in methods.items()},
                  by_actor={str(actor): {m: metrics(y[actors == actor], p[actors == actor]) for m, p in methods.items()}
                            for actor in cfg['test_actors']},
                  primary_uncertainty=uncertainty(y, actors, methods[cfg['primary_method']], methods[cfg['primary_comparator']], cfg))
    result['stress'] = dict(missing_audio=metrics(y, temperature(v, fitted['parameters']['face_temperature'])),
                           missing_face=metrics(y, zero_blend(temperature(a, fitted['parameters']['audio_temperature']), v, 1)),
                           uniform_audio_mixing={m: metrics(y, predict(m, a, v, fitted, contaminate=True)) for m in cfg['methods']})
    result['diagnostics'] = {}
    for m, p in methods.items():
        pf, pm = methods['face'].argmax(1), p.argmax(1)
        result['diagnostics'][m] = dict(face_correct_method_wrong=int(((pf == y) & (pm != y)).sum()),
                                       face_wrong_method_correct=int(((pf != y) & (pm == y)).sum()),
                                       unsupported_truth=metrics(y[np.isin(y, O)], p[np.isin(y, O)]),
                                       supported_truth=metrics(y[np.isin(y, S)], p[np.isin(y, S)]))
    result['held_out_predictions'] = [dict(id=r['id'], actor=r['actor'], true=r['true'],
                                         scores={m: p[i].tolist() for m, p in methods.items()}) for i, r in enumerate(good)]
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['fit', 'evaluate'])
    parser.add_argument('--scores', nargs='+', required=True, type=Path)
    parser.add_argument('--fitted', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.command == 'evaluate' and args.fitted is None:
        parser.error('evaluate requires --fitted')
    result = fit(args.scores) if args.command == 'fit' else evaluate(args.scores, args.fitted)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, allow_nan=False) + '\n')
    print(json.dumps({k: v for k, v in result.items() if k in ['parameters', 'selected', 'primary_uncertainty']}, indent=2))
    if 'test' in result:
        print(json.dumps({m: {k: v[k] for k in ['accuracy', 'macro_f1']} for m, v in result['test'].items()}, indent=2))


if __name__ == '__main__':
    main()
