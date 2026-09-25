"""Asking for a complexity analysis of an accepted run."""

from __future__ import annotations

from pathlib import Path


from app.dao.problems import ProblemDAO
from app.dao.submissions import SubmissionDAO
from app.runner.__main__ import analyze_next
from app.runner.complexity import analyze
from tests.rig import auth, room_socket, roster
from tests.test_submissions import TWO_SUM, drain_queue, next_submission_event, submit

SOLUTIONS = Path(__file__).parent / "solutions"


def analyze_queue(client) -> int:
    pool = client.app.state.db_pool
    done = 0
    while client.portal.call(analyze_next, SubmissionDAO(pool), ProblemDAO(pool)):
        done += 1
    return done


def accepted_run(client, room) -> dict:
    submission = submit(client, room, TWO_SUM).json()
    drain_queue(client)
    return submission


def ask(client, room, submission_id: str, user_id: str = "user_alice"):
    with room_socket(client, room["id"], user_id):
        return client.post(f"/api/submissions/{submission_id}/analysis", headers=auth(user_id))


def test_an_accepted_run_is_analyzed_and_the_room_hears_it(client, room):
    submission = accepted_run(client, room)
    with room_socket(client, room["id"], "user_bob") as bob:
        roster(bob)
        response = ask(client, room, submission["id"])
        assert response.status_code == 200, response.text
        assert response.json()["analysisStatus"] == "pending"
        assert next_submission_event(bob)["analysisStatus"] == "pending"

        assert analyze_queue(client) == 1
        analyzed = next_submission_event(bob)
        assert analyzed["analysisStatus"] == "done"
        assert analyzed["analysis"]["complexity"] == "linear"
        assert len(analyzed["analysis"]["points"]) >= 2


def test_asking_twice_does_not_queue_a_second_analysis(client, room):
    submission = accepted_run(client, room)
    assert ask(client, room, submission["id"]).status_code == 200
    again = ask(client, room, submission["id"], "user_bob")
    assert again.status_code == 200, again.text
    assert again.json()["analysisStatus"] == "pending"
    assert analyze_queue(client) == 1


def test_only_accepted_runs_can_be_analyzed(client, room):
    submission = submit(client, room, "print('0 0')\n").json()
    drain_queue(client)
    response = ask(client, room, submission["id"])
    assert response.status_code == 409
    assert "accepted" in response.json()["detail"]


def test_only_people_in_the_room_can_ask(client, room):
    submission = accepted_run(client, room)
    response = client.post(f"/api/submissions/{submission['id']}/analysis", headers=auth("user_bob"))
    assert response.status_code == 403


def test_a_problem_without_a_generator_cannot_be_analyzed(client, room):
    problem = client.get("/api/problems/slug/climbing-stairs", headers=auth("user_alice")).json()
    assert problem["analyzable"] is False
    with room_socket(client, room["id"], "user_alice"):
        submission = client.post(
            "/api/submissions",
            json={
                "roomId": room["id"],
                "problemId": problem["id"],
                "language": "python",
                "code": (SOLUTIONS / "climbing-stairs.py").read_text(),
            },
            headers=auth("user_alice"),
        ).json()
    drain_queue(client)
    response = ask(client, room, submission["id"])
    assert response.status_code == 409
    assert "does not support" in response.json()["detail"]


def test_an_analysis_left_running_by_a_dead_runner_is_requeued(client, room):
    submission = accepted_run(client, room)
    ask(client, room, submission["id"])
    dao = SubmissionDAO(client.app.state.db_pool)
    assert str(client.portal.call(dao.claim_pending_analysis)["id"]) == submission["id"]
    assert analyze_queue(client) == 0
    assert client.portal.call(dao.requeue_running_analyses) == 1
    assert analyze_queue(client) == 1


def test_every_reference_solution_has_the_expected_growth(client):
    """A problem's generator is only right if its reference solution measures as expected."""
    dao = ProblemDAO(client.app.state.db_pool)
    analyzable = [problem for problem in client.portal.call(dao.list_all) if problem["analyzable"]]
    assert analyzable
    for problem in analyzable:
        spec = client.portal.call(dao.get_analysis_spec, problem["id"])
        result = analyze((SOLUTIONS / f"{problem['slug']}.py").read_text(), spec["generator"], spec["memLimitMb"])
        assert result["complexity"] == problem["expectedComplexity"], (problem["slug"], result)
