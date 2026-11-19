"""Deterministic mathematical examples, never performance/evaluation samples."""
import unittest
import numpy as np
from research.paper_v1.ctmc_check import stationary
from research.paper_v1.study import hierarchical, S


class CTMCRelationshipTests(unittest.TestCase):
    def test_generalist_and_specialist_equal_hierarchy(self):
        for offset in [0, 2, 5]:
            a = np.roll(np.array([.1, .2, .3, .4]), offset)
            v = np.roll(np.arange(1, 8, dtype=float)/28, offset)
            for w in [0, .25, .5, .75, .99]:
                actual = stationary([(a, list(S)), (v, list(range(7)))], [w, 1-w], 7)
                expected = hierarchical(a[None,:], v[None,:], w)[0]
                np.testing.assert_allclose(actual, expected, atol=1e-12)

    def test_overlapping_specialists_stationary_symmetry(self):
        actual = stationary([(np.array([.5, .5]), [0,1]), (np.array([.5, .5]), [1,2])], [1,1], 3)
        np.testing.assert_allclose(actual, np.ones(3)/3)

    def test_no_generalist_is_not_unique(self):
        with self.assertRaisesRegex(ValueError, 'not uniquely identified'):
            stationary([(np.ones(4)/4, list(S)), (np.ones(7)/7, list(range(7)))], [1,0], 7)


if __name__ == '__main__':
    unittest.main()
