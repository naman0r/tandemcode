"""Reference solutions: the check a new problem's pull request has to pass.

A problem's tests are only worth something if a correct program passes every
one of them, hidden ones included. Each file in tests/solutions/ is named after
a problem's slug and is judged against that problem exactly as a run would be.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from app.dao.problems import ProblemDAO
from app.runner.judge import ACCEPTED, judge
from tests.rig import auth

SOLUTIONS = sorted((Path(__file__).parent / "solutions").glob("*.py"))

# The original problems predate this check. New problems must bring a
# solution; delete a slug from here when its solution is added.
# ponytail: shrinks as solutions land; drop the set once it is empty.
WITHOUT_SOLUTIONS = {
    "best-time-to-buy-sell-stock",
    "climbing-stairs",
    "coin-change",
    "container-with-most-water",
    "longest-substring-no-repeat",
    "median-two-sorted-arrays",
    "merge-intervals",
    "reverse-linked-list",
    "serialize-deserialize-tree",
    "three-sum",
    "trapping-rain-water",
    "two-sum",
    "valid-parentheses",
    "word-search",
}


@pytest.mark.parametrize("solution", SOLUTIONS, ids=[path.stem for path in SOLUTIONS])
def test_reference_solution_passes_every_test(client, solution):
    dao = ProblemDAO(client.app.state.db_pool)
    problem = client.portal.call(dao.get_by_slug, solution.stem)
    assert problem, f"{solution.name} does not match any problem slug"
    spec = client.portal.call(dao.get_judge_spec, problem["id"])

    verdict = judge(solution.read_text(), spec["tests"], spec["timeLimitMs"], spec["memLimitMb"])

    failed = next((test for test in verdict.tests if not test.passed), None)
    assert verdict.status == ACCEPTED, f"test {failed.index if failed else '?'} failed: {failed}"
    assert verdict.passed == verdict.total >= 5


def test_every_problem_has_a_reference_solution(client, signed_up):
    signed_up("user_alice")
    slugs = {problem["slug"] for problem in client.get("/api/problems", headers=auth("user_alice")).json()}
    missing = slugs - {path.stem for path in SOLUTIONS} - WITHOUT_SOLUTIONS
    assert not missing, f"add tests/solutions/<slug>.py for: {sorted(missing)}"
