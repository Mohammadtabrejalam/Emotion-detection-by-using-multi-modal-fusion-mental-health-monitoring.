"""Independent stationary-equation check of the hierarchy's prior-art relationship.

Reference: Li and Lin, IJCAI 2017, doi:10.24963/ijcai.2017/312.
The authors' CTMCEnsemble.jl build() sums embedded weighted generators.
We use row generators and solve the stationary equations directly, rather than
copying their Julia implementation. This is a mathematical verification, not a
new trained model or a numerical reproduction of their published benchmarks.
"""
import numpy as np


def stationary(experts, weights, classes):
    """Solve pi Q=0, sum pi=1; require an identifiable stationary distribution."""
    if len(experts) != len(weights) or any(w < 0 for w in weights):
        raise ValueError('Provide one nonnegative weight per expert')
    q = np.zeros((classes, classes), dtype=float)
    for (p, labels), weight in zip(experts, weights):
        p = np.asarray(p, dtype=float)
        if len(p) != len(labels) or not np.isfinite(p).all() or (p < 0).any() or not np.isclose(p.sum(), 1):
            raise ValueError('Invalid expert distribution')
        if len(set(labels)) != len(labels) or any(c < 0 or c >= classes for c in labels):
            raise ValueError('Invalid class indices')
        # From any covered state i, transitions to j have rate weight*p[j].
        block = np.tile(p, (len(p), 1)) - np.eye(len(p))
        q[np.ix_(labels, labels)] += weight * block
    equations = np.vstack([q.T, np.ones(classes)])
    rhs = np.r_[np.zeros(classes), 1.]
    solution, _, rank, _ = np.linalg.lstsq(equations, rhs, rcond=None)
    if rank != classes or np.max(np.abs(solution @ q)) > 1e-9 or (solution < -1e-9).any():
        raise ValueError('Stationary distribution is not uniquely identified')
    solution = np.maximum(solution, 0)
    return solution / solution.sum()
