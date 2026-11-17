"""Audit regenerated aggregates against the recorded earlier execution.

Reference values never enter fitting or selection. This rerun is reproduction
of a previously observed experiment, not independent validation.
"""
import hashlib
import json
import math
from pathlib import Path

P = Path(__file__).resolve().parents[1] / 'research/fusion_v2'
EXPECTED = {
    'face': (0.4807692307692308, 0.48483123517606275),
    'audio_zero_padded': (0.2403846153846154, 0.15722404382861588),
    'legacy_support_average': (0.5, 0.49325228780764174),
    'zero_padded_average': (0.4807692307692308, 0.45851949381903306),
    'calibrated_face': (0.4807692307692308, 0.48483123517606275),
    'hierarchical_static': (0.4807692307692308, 0.48483123517606275),
    'adaptive_reliability': (0.5288461538461539, 0.5148282273282273),
}


def main():
    r = json.loads((P / 'results.json').read_text())
    checks = {
        method: {
            key: {'prior_execution_value': expected,
                  'regenerated_value': r['test'][method][key],
                  'matches': math.isclose(expected, r['test'][method][key], rel_tol=0, abs_tol=1e-10)}
            for key, expected in zip(['accuracy', 'macro_f1'], values)
        } for method, values in EXPECTED.items()
    }
    matched = all(c['matches'] for m in checks.values() for c in m.values())
    result = {
        'reference': 'Earlier execution transcript in this conversation',
        'restored_procedure_commit': 'ceb03a1f534ad8b8080ab4a75705e40e79415082',
        'all_aggregate_metrics_match': matched, 'checks': checks,
        'score_sha256': r['score_sha256'],
        'result_sha256': hashlib.sha256((P / 'results.json').read_bytes()).hexdigest(),
        'caution': 'Original score bytes were lost; comparison is of recorded aggregate metrics, not original per-clip bytes. No test-guided retuning.'
    }
    (P / 'reproduction_check.json').write_text(json.dumps(result, indent=2) + '\n')
    print('Aggregate reproduction:', 'MATCH' if matched else 'DIFFERENCES; report without retuning')


if __name__ == '__main__':
    main()
