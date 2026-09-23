"""Problem content: what a client may see, and what it may not."""

from __future__ import annotations

from app.dao.problems import ProblemDAO
from tests.rig import auth


def test_seeded_problem_exposes_statement_and_samples_only(client, signed_up):
    signed_up("user_alice")
    response = client.get("/api/problems/slug/two-sum", headers=auth("user_alice"))
    assert response.status_code == 200, response.text
    problem = response.json()

    assert "indices" in problem["statement"]
    assert "def twoSum(self, nums: List[int], target: int) -> List[int]:" in problem["starterCode"]
    assert problem["samples"] == [
        {"input": "2 7 11 15\n9\n", "expected": "0 1"},
        {"input": "3 2 4\n6\n", "expected": "1 2"},
    ]
    assert "tests" not in problem
    assert "hidden" not in response.text


def test_multi_line_expected_output_survives_the_round_trip(client, signed_up):
    signed_up("user_alice")
    response = client.get("/api/problems/slug/three-sum", headers=auth("user_alice"))
    assert response.status_code == 200, response.text
    assert response.json()["samples"][0]["expected"] == "-1 -1 2\n-1 0 1"


def test_every_problem_is_complete(client, signed_up):
    signed_up("user_alice")
    problems = client.get("/api/problems", headers=auth("user_alice")).json()
    assert len(problems) >= 15
    for problem in problems:
        assert problem["difficulty"] in {"easy", "medium", "hard"}, problem["slug"]
        assert problem["statement"], problem["slug"]
        # A function to fill in, not a script: the starter is a class with
        # a documented method, and it must at least compile.
        assert "class Solution" in problem["starterCode"] or "class Codec" in problem["starterCode"], problem["slug"]
        compile(problem["starterCode"], problem["slug"], "exec")
        assert len(problem["samples"]) >= 2, problem["slug"]


def test_hidden_tests_come_after_the_examples(client):
    """Tests run in order in one container, so a hidden test that ran before a
    visible one could leave its input in /tmp for the visible run to print."""
    dao = ProblemDAO(client.app.state.db_pool)
    for problem in client.portal.call(dao.list_all):
        spec = client.portal.call(dao.get_judge_spec, problem["id"])
        hidden = [bool(test.get("hidden")) for test in spec["tests"]]
        assert hidden == sorted(hidden), problem["slug"]
