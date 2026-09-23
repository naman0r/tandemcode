"""Problem content: what a client may see, and what it may not."""

from __future__ import annotations

from tests.rig import auth


def test_seeded_problem_exposes_statement_and_samples_only(client, signed_up):
    signed_up("user_alice")
    response = client.get("/api/problems/slug/two-sum", headers=auth("user_alice"))
    assert response.status_code == 200, response.text
    problem = response.json()

    assert "indices" in problem["statement"]
    assert problem["starterCode"].startswith("import sys")
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
        assert problem["starterCode"], problem["slug"]
        assert len(problem["samples"]) >= 2, problem["slug"]
