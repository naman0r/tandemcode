"""Submitting code and getting a verdict back."""

from __future__ import annotations

from datetime import datetime

from app.dao.problems import ProblemDAO
from app.dao.submissions import SubmissionDAO
from app.runner.__main__ import judge_next
from tests.rig import auth, room_socket, roster

TWO_SUM = """import sys
lines = sys.stdin.read().split("\\n")
nums = list(map(int, lines[0].split()))
target = int(lines[1])
seen = {}
for i, n in enumerate(nums):
    if target - n in seen:
        print(seen[target - n], i)
        break
    seen[n] = i
"""


def two_sum(client) -> dict:
    response = client.get("/api/problems/slug/two-sum", headers=auth("user_alice"))
    assert response.status_code == 200, response.text
    return response.json()


def submit(client, room, code: str, language: str = "python"):
    return client.post(
        "/api/submissions",
        json={"roomId": room["id"], "problemId": two_sum(client)["id"], "language": language, "code": code},
        headers=auth("user_alice"),
    )


def drain_queue(client) -> int:
    """Judge everything pending, including leftovers from earlier tests."""
    pool = client.app.state.db_pool
    judged = 0
    while client.portal.call(judge_next, SubmissionDAO(pool), ProblemDAO(pool)):
        judged += 1
    return judged


def test_submission_starts_pending_with_no_result(client, room):
    response = submit(client, room, TWO_SUM)
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "pending"
    assert response.json()["result"] is None


def test_only_python_is_accepted(client, room):
    response = submit(client, room, "console.log(1)", language="javascript")
    assert response.status_code == 400
    assert "javascript" in response.json()["detail"]


def test_runner_judges_the_submission(client, room):
    submission = submit(client, room, TWO_SUM).json()

    assert drain_queue(client) >= 1
    assert drain_queue(client) == 0

    response = client.get(f"/api/submissions/{submission['id']}", headers=auth("user_alice"))
    assert response.status_code == 200, response.text
    judged = response.json()
    assert judged["status"] == "accepted"
    assert judged["result"]["passed"] == judged["result"]["total"] == 5
    assert judged["result"]["tests"][2]["hidden"] is True


def test_wrong_answer_reports_the_failing_test(client, room):
    submission = submit(client, room, "print('0 0')\n").json()
    drain_queue(client)

    judged = client.get(f"/api/submissions/{submission['id']}", headers=auth("user_alice")).json()
    assert judged["status"] == "wrong_answer"
    assert judged["result"]["passed"] == 0
    assert judged["result"]["tests"][0]["stdout"].strip() == "0 0"


def test_a_run_left_running_by_a_dead_runner_is_requeued(client, room):
    submission = submit(client, room, TWO_SUM).json()
    pool = client.app.state.db_pool
    dao = SubmissionDAO(pool)
    assert str(client.portal.call(dao.claim_pending)["id"]) == submission["id"]
    assert drain_queue(client) == 0

    assert client.portal.call(dao.requeue_running) == 1
    assert drain_queue(client) == 1
    judged = client.get(f"/api/submissions/{submission['id']}", headers=auth("user_alice")).json()
    assert judged["status"] == "accepted"


def next_submission_event(socket) -> dict:
    while True:
        event = socket.receive_json()
        if event["type"] == "submission":
            return event["submission"]


def test_the_whole_room_hears_the_run_start_and_the_verdict(client, room):
    with room_socket(client, room["id"], "user_bob") as bob:
        roster(bob)

        submitted = submit(client, room, TWO_SUM).json()
        started = next_submission_event(bob)
        assert started["id"] == submitted["id"]
        assert started["status"] == "pending"
        assert started["userName"] == "Alice"

        drain_queue(client)
        judged = next_submission_event(bob)
        assert judged["id"] == submitted["id"]
        assert judged["status"] == "accepted"
        assert judged["result"]["passed"] == 5

        # Browsers only promise to parse ISO 8601 with a "T"; a space breaks
        # Safari and puts live runs out of order against the fetched history.
        listed = client.get(f"/api/submissions/room/{room['id']}", headers=auth("user_alice")).json()
        assert "T" in judged["createdAt"]
        assert datetime.fromisoformat(judged["createdAt"]) == datetime.fromisoformat(listed[0]["createdAt"])


def test_one_run_in_flight_per_person_across_rooms(client, room):
    assert submit(client, room, TWO_SUM).status_code == 200
    other = client.post("/api/rooms", json={"name": "Other"}, headers=auth("user_alice")).json()
    assert submit(client, other, TWO_SUM).status_code == 429


def test_a_verdict_that_cannot_be_stored_still_finishes_the_run(client, room, monkeypatch):
    """Left running, the row would be requeued and fail the same way forever."""
    submission = submit(client, room, TWO_SUM).json()
    real_complete = SubmissionDAO.complete
    calls = []

    async def complete_once_failing(self, submission_id, status, time_ms, result):
        calls.append(status)
        if len(calls) == 1:
            raise ValueError("unstorable")
        await real_complete(self, submission_id, status, time_ms, result)

    monkeypatch.setattr(SubmissionDAO, "complete", complete_once_failing)
    drain_queue(client)

    judged = client.get(f"/api/submissions/{submission['id']}", headers=auth("user_alice")).json()
    assert judged["status"] == "runtime_error"
    assert judged["result"]["tests"] == []


def test_runner_will_not_judge_in_process_unless_told(monkeypatch):
    import asyncio

    import pytest

    from app.runner import __main__ as runner

    monkeypatch.setattr(runner, "SANDBOX_IMAGE", None)
    monkeypatch.setattr(runner, "ALLOW_UNSANDBOXED", False)
    with pytest.raises(SystemExit):
        asyncio.run(runner.main())
