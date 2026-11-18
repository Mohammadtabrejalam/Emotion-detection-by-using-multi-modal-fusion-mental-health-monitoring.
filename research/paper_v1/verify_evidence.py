"""Verify saved CI evidence and reproduce fitting/evaluation without neural inference."""
import argparse
import json
from pathlib import Path

import numpy as np
from research.paper_v1 import study as s
from research.paper_v1.ctmc_check import stationary


def compare(actual, expected, trail='root'):
    if isinstance(expected, dict):
        if set(actual) != set(expected):
            raise AssertionError(f'{trail}: keys differ')
        for k in expected: compare(actual[k], expected[k], trail+'.'+str(k))
    elif isinstance(expected, list):
        if len(actual) != len(expected): raise AssertionError(f'{trail}: lengths differ')
        for i, (a, b) in enumerate(zip(actual, expected)): compare(a, b, trail+f'[{i}]')
    elif isinstance(expected, (int, float)):
        if not np.isclose(actual, expected, rtol=1e-10, atol=1e-12):
            raise AssertionError(f'{trail}: {actual} != {expected}')
    elif actual != expected:
        raise AssertionError(f'{trail}: values differ')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--evidence',type=Path,default=s.ROOT/'evidence')
    parser.add_argument('--output',type=Path,default=s.ROOT/'evidence/reproduction_check.json')
    args=parser.parse_args()
    root=args.evidence
    fitted_path=root/'fitted-parameters/fitted.json'
    fitted=json.loads(fitted_path.read_text())
    result=json.loads((root/'paper-study-evaluation/results.json').read_text())
    if result['fitted_sha256'] != s.digest(fitted_path): raise AssertionError('Fitted hash mismatch')
    for mapping in [fitted['development_sha256'], result['test_score_sha256']]:
        for name, expected in mapping.items():
            if s.digest(root/Path(name).parent.name/'scores.jsonl') != expected:
                raise AssertionError('Score hash mismatch: '+name)
    devpaths=sorted(root.glob('development-*/scores.jsonl'))
    testpaths=sorted(root.glob('test-*/scores.jsonl'))
    reproduced_fit=s.fit(devpaths)
    for key in ['protocol_sha256','parameters','selected','selection_trace','validation','coverage']:
        compare(reproduced_fit[key],fitted[key],key)
    reproduced_test=s.evaluate(testpaths,fitted_path)
    for key in ['protocol','protocol_sha256','fitted_sha256','coverage','test','by_actor',
                'primary_uncertainty','stress','diagnostics','held_out_predictions']:
        compare(reproduced_test[key],result[key],key)
    rows=s.read_records(testpaths,s.protocol()['test_actors'])
    _,_,_,a,v=s.arrays(rows)
    a=s.temperature(a,fitted['parameters']['audio_temperature'])
    v=s.temperature(v,fitted['parameters']['face_temperature'])
    ra=np.array(fitted['parameters']['audio_reliability'])[a.argmax(1)]
    rv=np.array(fitted['parameters']['face_reliability'])[v.argmax(1)]
    prior=fitted['selected']['adaptive_hierarchy']['weight']
    w=prior*ra/(prior*ra+(1-prior)*rv)
    if np.any(w >= 1):
        # The endpoint has no unique CTMC solution; do not manufacture one.
        ctmc={'checked':False,'reason':'At least one weight is the non-unique CTMC endpoint'}
    else:
        direct=np.array([stationary([(aa,list(s.S)),(vv,list(range(7)))],[ww,1-ww],7)
                         for aa,vv,ww in zip(a,v,w)])
        analytical=s.hierarchical(a,v,w)
        error=float(np.max(np.abs(direct-analytical)))
        if error > 1e-10: raise AssertionError('CTMC equivalence check failed')
        ctmc={'checked':True,'samples':len(a),'maximum_absolute_probability_difference':error,
              'interpretation':'Numerical verification of an algebraic identity, not a new performance result'}
    summary={'status':'passed','protocol_commit':'8734d75bd5a54918b4befd1990a3c592a4edc0a6',
             'source_run':44282962746,'protocol_sha256':s.digest(s.ROOT/'protocol.json'),
             'fitted_sha256':s.digest(fitted_path),'result_sha256':s.digest(root/'paper-study-evaluation/results.json'),
             'fitting_and_validation_samples':fitted['coverage']['overall']['accepted'],
             'test_samples':result['coverage']['overall']['accepted'],'methods':len(result['test']),
             'reproduced':'All selected settings, validation metrics, test metrics, actor results, uncertainty, stress, diagnostics and held-out probabilities',
             'tolerance':{'relative':1e-10,'absolute':1e-12},'ctmc_relationship':ctmc}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps(summary,indent=2))


if __name__=='__main__':
    main()
