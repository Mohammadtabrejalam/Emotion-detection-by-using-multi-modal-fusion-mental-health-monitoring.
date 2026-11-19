"""Mathematical and leakage safeguards. Fixtures are NOT experimental evidence."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
from research.paper_v1 import study as s


class StudyTests(unittest.TestCase):
    def test_hierarchy_preserves_unsupported_mass(self):
        a = np.array([[.1, .2, .3, .4]])
        v = np.array([[.1, .1, .1, .2, .2, .2, .1]])
        for w in [0, .5, 1]:
            p = s.hierarchical(a, v, w)
            np.testing.assert_allclose(p[:, s.O], v[:, s.O])
            np.testing.assert_allclose(p.sum(1), 1)
        np.testing.assert_allclose(s.hierarchical(a, v, 0), v)

    def test_zero_shared_mass_is_finite(self):
        p = s.hierarchical(np.ones((1, 4))/4, np.array([[0, 0, 0, 1, 0, 0, 0.]]), .75)
        np.testing.assert_array_equal(p, [[0, 0, 0, 1, 0, 0, 0]])

    def test_unsupported_audio_truth_counts_as_error(self):
        p = np.array([[.9, .1], [.8, .2]])
        np.testing.assert_allclose(s.reliability(p, np.array([0, -1])), [.5, .5])
        self.assertAlmostEqual(s.reliability(p[:1], np.array([0]))[0], 2/3)

    def test_ece_includes_exact_one_and_boundary(self):
        p = np.array([[1., 0, 0, 0, 0, 0, 0], [.9, .1, 0, 0, 0, 0, 0]])
        self.assertAlmostEqual(s.metrics(np.array([1, 0]), p)['ece_10'], .45)

    def test_label_support_and_legacy(self):
        a, v = np.array([[.4, .3, .2, .1]]), np.ones((1, 7))/7
        fitted = {'parameters': {'audio_temperature': 1, 'face_temperature': 1}}
        p = s.predict('legacy', a, v, fitted)
        manual = v.copy()
        manual[:, s.S] = (v[:, s.S] + a)/2
        np.testing.assert_allclose(p, manual/manual.sum())
        np.testing.assert_allclose(s.zero_blend(a, v, 1)[:, s.O], 0)

    def test_protocol_partitions(self):
        p = s.protocol()
        groups = [set(p[k]) for k in ['train_actors', 'validation_actors', 'test_actors', 'excluded_exploratory_actors']]
        self.assertEqual(set.union(*groups), set(range(1, 25)))
        for i, g in enumerate(groups):
            for h in groups[i+1:]:
                self.assertFalse(g & h)
        self.assertEqual(len(s.expected_ids(7)), 52)

    def test_fit_rejects_test_actor_before_reading_scores(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'test.jsonl'
            path.write_text(json.dumps({'id': 'x', 'actor': 17})+'\n')
            with self.assertRaisesRegex(ValueError, 'outside permitted'):
                s.fit([path])

    def test_evaluate_rejects_changed_protocol(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'fitted.json'
            path.write_text(json.dumps({'protocol_sha256': 'wrong'}))
            with self.assertRaisesRegex(ValueError, 'different protocol'):
                s.evaluate([], path)

    def test_incomplete_and_duplicate_records_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/'scores.jsonl'
            row = dict(id=sorted(s.expected_ids(7))[0], actor=7, true='neutral', sha256='0'*64, failure='fixture')
            path.write_text(json.dumps(row)+'\n')
            with self.assertRaisesRegex(ValueError, 'Incomplete actor'):
                s.read_records([path], [7])
            path.write_text((json.dumps(row)+'\n')*2)
            with self.assertRaisesRegex(ValueError, 'Duplicate'):
                s.read_records([path], [7])

    def test_fit_selection_has_no_test_input(self):
        # Minimal synthetic arrays exercise parameter selection only.
        cfg = s.protocol()
        actors = np.array([a for a in cfg['train_actors']+cfg['validation_actors'] for _ in range(7)])
        y = np.tile(np.arange(7), 10)
        a = np.ones((70, 4))/4
        v = np.eye(7)[y]*.8 + .2/7
        rows = [{'actor': int(actor), 'true': s.LABELS[int(label)], 'modalities': {}} for actor, label in zip(actors, y)]
        with patch.object(s, 'read_records', return_value=rows), patch.object(s, 'arrays', return_value=(rows, actors, y, a, v)):
            fitted = s.fit([])
        self.assertEqual(fitted['selected']['adaptive_hierarchy'], {'weight': 0, 'gamma': 0})
        self.assertEqual(set(fitted['validation']), set(cfg['methods']))
        self.assertNotIn('test', fitted)

    def test_identical_methods_uncertainty_is_zero(self):
        cfg = s.protocol()
        cfg['uncertainty']['actor_bootstrap_replicates'] = 10
        y, actors = np.array([0, 1, 0, 1]), np.array([17, 17, 18, 18])
        p = np.eye(7)[y]
        result = s.uncertainty(y, actors, p, p, cfg)
        self.assertEqual(result['percentile_95'], [0, 0])
        self.assertEqual(result['two_sided_actor_permutation_p'], 1)


if __name__ == '__main__':
    unittest.main()
