"""HTTP contract tests.

These lock down the surface the React client calls (apps/web/src/lib/api.ts):
paths, status codes and the camelCase response keys the Spring API produced.
Real services run against in-memory DAOs, so service-level 404s are covered too.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

import pytest

from app.dependencies import (
    get_problem_service,
    get_room_service,
    get_submission_service,
    get_user_service,
)
from app.main import app
from app.services.problems import ProblemService
from app.services.rooms import RoomService
from app.services.submissions import SubmissionService
from app.services.users import UserService

NOW = datetime(2026, 8, 23, 12, 0, tzinfo=timezone.utc)
PROBLEM_ID = UUID("11111111-1111-1111-1111-111111111111")
MISSING_ID = UUID("99999999-9999-9999-9999-999999999999")


def make_problem(**overrides) -> dict:
    problem = {
        "id": PROBLEM_ID,
        "slug": "two-sum",
        "title": "Two Sum",
        "difficulty": "easy",
        "timeLimitMs": 2000,
        "memLimitMb": 256,
    }
    problem.update(overrides)
    return problem


def make_room(**overrides) -> dict:
    room = {
        "id": "room-1",
        "name": "Pairing",
        "description": "desc",
        "createdBy": "user-1",
        "isActive": True,
        "createdAt": NOW,
        "currentProblemId": None,
    }
    room.update(overrides)
    return room


class FakeUserDAO:
    def __init__(self) -> None:
        self.users = {
            "user-1": {"id": "user-1", "email": "a@b.com", "name": "Ada", "createdAt": NOW},
            "user-2": {"id": "user-2", "email": "b@b.com", "name": "Bo", "createdAt": NOW},
        }

    async def create(self, user_id, email, name):
        self.users[user_id] = {
            "id": user_id,
            "email": email,
            "name": name,
            "createdAt": NOW,
        }
        return self.users[user_id]

    async def get_by_id(self, user_id):
        return self.users.get(user_id)

    async def exists(self, user_id):
        return user_id in self.users

    async def list_all(self):
        return list(self.users.values())


class FakeProblemDAO:
    def __init__(self) -> None:
        self.problems = [make_problem(), make_problem(
            id=uuid4(), slug="three-sum", title="3Sum", difficulty="medium"
        )]

    async def list_all(self):
        return self.problems

    async def list_by_difficulty(self, difficulty):
        return [p for p in self.problems if p["difficulty"] == difficulty]

    async def get_by_id(self, problem_id):
        return next((p for p in self.problems if p["id"] == problem_id), None)

    async def get_by_slug(self, slug):
        return next((p for p in self.problems if p["slug"] == slug), None)

    async def exists(self, problem_id):
        return any(p["id"] == problem_id for p in self.problems)

    async def create(self, slug, title, difficulty, time_limit_ms, mem_limit_mb):
        created = make_problem(
            id=uuid4(),
            slug=slug,
            title=title,
            difficulty=difficulty,
            timeLimitMs=time_limit_ms,
            memLimitMb=mem_limit_mb,
        )
        self.problems.append(created)
        return created


class FakeRoomDAO:
    def __init__(self) -> None:
        self.rooms = {"room-1": make_room()}

    async def create(self, room_id, name, description, created_by):
        self.rooms[room_id] = make_room(
            id=room_id, name=name, description=description, createdBy=created_by
        )
        return self.rooms[room_id]

    async def get_by_id(self, room_id):
        return self.rooms.get(room_id)

    async def list_active(self):
        return [r for r in self.rooms.values() if r["isActive"]]

    async def list_active_by_creator(self, user_id):
        return [r for r in self.rooms.values() if r["createdBy"] == user_id and r["isActive"]]

    async def exists(self, room_id):
        return room_id in self.rooms

    async def set_current_problem(self, room_id, problem_id):
        room = self.rooms.get(room_id)
        if room is None:
            return None
        room["currentProblemId"] = problem_id
        return room


class FakeRoomMemberDAO:
    async def list_members(self, room_id):
        return [
            {
                "userId": "user-1",
                "name": "Ada",
                "email": "a@b.com",
                "role": "participant",
                "joinedAt": NOW,
            }
        ]


class FakeSubmissionDAO:
    def __init__(self) -> None:
        self.submissions: list[dict] = []

    async def create(self, room_id, user_id, problem_id, language, code):
        submission = {
            "id": uuid4(),
            "roomId": room_id,
            "userId": user_id,
            "problemId": problem_id,
            "language": language,
            "code": code,
            "status": "pending",
            "timeMs": None,
            "createdAt": NOW,
            "s3KeyStdout": None,
            "s3KeyStderr": None,
            "s3KeyResultJson": None,
        }
        self.submissions.append(submission)
        return submission

    async def get_by_id(self, submission_id):
        return next((s for s in self.submissions if s["id"] == submission_id), None)

    async def list_by_room(self, room_id):
        return [s for s in self.submissions if s["roomId"] == room_id]

    async def list_by_room_and_user(self, room_id, user_id):
        return [
            s for s in self.submissions if s["roomId"] == room_id and s["userId"] == user_id
        ]


@pytest.fixture
def daos():
    return {
        "users": FakeUserDAO(),
        "problems": FakeProblemDAO(),
        "rooms": FakeRoomDAO(),
        "members": FakeRoomMemberDAO(),
        "submissions": FakeSubmissionDAO(),
    }


@pytest.fixture
def api(client, daos):
    app.dependency_overrides[get_user_service] = lambda: UserService(daos["users"])
    app.dependency_overrides[get_problem_service] = lambda: ProblemService(daos["problems"])
    app.dependency_overrides[get_room_service] = lambda: RoomService(
        room_dao=daos["rooms"],
        room_member_dao=daos["members"],
        problem_dao=daos["problems"],
        user_dao=daos["users"],
    )
    app.dependency_overrides[get_submission_service] = lambda: SubmissionService(
        submission_dao=daos["submissions"],
        room_dao=daos["rooms"],
        problem_dao=daos["problems"],
        user_dao=daos["users"],
    )
    return client


# --- health -----------------------------------------------------------------


def test_health(api):
    assert api.get("/health").json() == {"status": "ok"}


# --- users ------------------------------------------------------------------


def test_create_user_returns_200_like_spring(api):
    response = api.post(
        "/api/users", json={"id": "user-9", "email": "n@e.com", "name": "New"}
    )
    assert response.status_code == 200
    assert response.json() == {
        "id": "user-9",
        "email": "n@e.com",
        "name": "New",
        "createdAt": "2026-08-23T12:00:00Z",
    }


def test_get_user(api):
    assert api.get("/api/users/user-1").json()["email"] == "a@b.com"


def test_get_missing_user_is_404(api):
    assert api.get("/api/users/nope").status_code == 404


def test_list_users(api):
    assert len(api.get("/api/users").json()) == 2


# --- problems ---------------------------------------------------------------


def test_list_problems_uses_camel_case_keys(api):
    body = api.get("/api/problems").json()
    assert len(body) == 2
    assert set(body[0]) == {"id", "slug", "title", "difficulty", "timeLimitMs", "memLimitMb"}


def test_list_problems_filtered_by_difficulty(api):
    body = api.get("/api/problems", params={"difficulty": "medium"}).json()
    assert [p["slug"] for p in body] == ["three-sum"]


def test_get_problem_by_id(api):
    assert api.get(f"/api/problems/{PROBLEM_ID}").json()["slug"] == "two-sum"


def test_get_problem_by_slug_is_not_shadowed_by_the_id_route(api):
    assert api.get("/api/problems/slug/two-sum").json()["title"] == "Two Sum"


def test_get_missing_problem_is_404(api):
    assert api.get(f"/api/problems/{MISSING_ID}").status_code == 404


def test_create_problem_applies_schema_defaults(api):
    response = api.post(
        "/api/problems",
        json={"slug": "new-one", "title": "New One", "difficulty": "hard"},
    )
    assert response.status_code == 200
    assert response.json()["timeLimitMs"] == 2000
    assert response.json()["memLimitMb"] == 256


# --- rooms ------------------------------------------------------------------


def test_create_room_generates_an_id(api):
    response = api.post(
        "/api/rooms",
        json={"name": "Interview", "description": "d", "createdBy": "user-1"},
    )
    assert response.status_code == 200
    body = response.json()
    assert UUID(body["id"])
    assert body["isActive"] is True


def test_list_active_rooms(api):
    assert [r["id"] for r in api.get("/api/rooms").json()] == ["room-1"]


def test_list_rooms_by_creator(api):
    assert len(api.get("/api/rooms/user/user-1").json()) == 1
    assert api.get("/api/rooms/user/nobody").json() == []


def test_get_room(api):
    assert api.get("/api/rooms/room-1").json()["name"] == "Pairing"


def test_get_missing_room_is_404(api):
    assert api.get("/api/rooms/nope").status_code == 404


def test_list_room_members(api):
    body = api.get("/api/rooms/room-1/members").json()
    assert body == [
        {
            "userId": "user-1",
            "name": "Ada",
            "email": "a@b.com",
            "role": "participant",
            "joinedAt": "2026-08-23T12:00:00Z",
        }
    ]


def test_set_current_problem(api):
    response = api.patch(
        "/api/rooms/room-1/problem", json={"problemId": str(PROBLEM_ID)}
    )
    assert response.status_code == 200
    assert response.json()["currentProblemId"] == str(PROBLEM_ID)


def test_set_current_problem_rejects_unknown_problem(api):
    response = api.patch(
        "/api/rooms/room-1/problem", json={"problemId": str(MISSING_ID)}
    )
    assert response.status_code == 404


def test_set_current_problem_rejects_unknown_room(api):
    response = api.patch(
        "/api/rooms/nope/problem", json={"problemId": str(PROBLEM_ID)}
    )
    assert response.status_code == 404


# --- submissions ------------------------------------------------------------


def submit_payload(**overrides) -> dict:
    payload = {
        "roomId": "room-1",
        "userId": "user-1",
        "problemId": str(PROBLEM_ID),
        "language": "python",
        "code": "print(1)",
    }
    payload.update(overrides)
    return payload


def test_submit_starts_as_pending(api):
    response = api.post("/api/submissions", json=submit_payload())
    assert response.status_code == 200
    assert response.json()["status"] == "pending"
    assert response.json()["code"] == "print(1)"


def test_submit_rejects_unknown_room(api):
    response = api.post("/api/submissions", json=submit_payload(roomId="nope"))
    assert response.status_code == 404


def test_submit_rejects_unknown_problem(api):
    response = api.post("/api/submissions", json=submit_payload(problemId=str(MISSING_ID)))
    assert response.status_code == 404


def test_get_submission_round_trip(api):
    created = api.post("/api/submissions", json=submit_payload()).json()
    assert api.get(f"/api/submissions/{created['id']}").json()["id"] == created["id"]


def test_get_missing_submission_is_404(api):
    assert api.get(f"/api/submissions/{MISSING_ID}").status_code == 404


def test_list_submissions_for_room_and_optional_user_filter(api):
    api.post("/api/submissions", json=submit_payload())
    api.post("/api/submissions", json=submit_payload(userId="user-2"))

    assert len(api.get("/api/submissions/room/room-1").json()) == 2
    filtered = api.get("/api/submissions/room/room-1", params={"userId": "user-2"}).json()
    assert [s["userId"] for s in filtered] == ["user-2"]


def test_submit_rejects_malformed_body(api):
    assert api.post("/api/submissions", json={"roomId": "room-1"}).status_code == 422


# --- foreign key validation (was a raw 500 from Postgres) -------------------


def test_create_room_with_unknown_creator_is_404_not_500(api):
    response = api.post(
        "/api/rooms", json={"name": "x", "description": "y", "createdBy": "ghost"}
    )
    assert response.status_code == 404
    assert "ghost" in response.json()["detail"]


def test_submit_with_unknown_user_is_404_not_500(api):
    response = api.post("/api/submissions", json=submit_payload(userId="ghost"))
    assert response.status_code == 404
    assert "ghost" in response.json()["detail"]
