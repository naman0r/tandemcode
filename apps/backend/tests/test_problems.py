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


def test_problem_without_content_still_lists(client, signed_up):
    signed_up("user_alice")
    response = client.get("/api/problems/slug/three-sum", headers=auth("user_alice"))
    assert response.status_code == 200, response.text
    problem = response.json()
    assert problem["statement"] is None
    assert problem["samples"] == []
