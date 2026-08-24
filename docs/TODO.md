# TO-DOs for TandemCode

<br>

## Priority 1

- [ ] Think about what each page should look like... i'm not sure if the flow makes the most sense at the moment but think about it later and come to a decision.

- [ ] Room lifecycle: they should be deleted after the initial user 'ends the meeting room' or when both the people (and in the future, all the people) leave the room.

- [ ] User Profile page, they can configure a social profile for like the social aspect of it.

- [ ] Each room can have a tag, and also an indication if it is a private or public room. On the /rooms page anyone should be able to search for a room with th description or title that they had in mind.

- [ ] Where does AWS come into the picture here?

<br/>

## Priority 2

- [ ] **Bring back the backend test suite.** It was written during the Python
      migration (43 tests: route contracts, websocket lifecycle, migration
      discovery) and then removed to keep the refactor PR small. Re-add under
      `apps/backend/tests/` with `pytest` + `pytest-asyncio` + `httpx`, in a
      `requirements-dev.txt`. Recoverable from git history if wanted.

- [ ] **GitHub Action to run the tests on every PR.** Needs a workflow at
      `.github/workflows/backend.yml`: Python 3.11, a Postgres service
      container, `pip install -r requirements-dev.txt`, then `pytest`. There is
      no CI at all right now, so nothing checks a PR before merge.

- [ ] Fix the presence race: the room websocket accepts the connection before
      the `room_members` row is committed, so a `GET /members` fired straight
      after joining can miss the user who just joined.

- [x] Build frontend
- [ ] Figure out how the backend eployment would work (render is a good option, so can use that)
- [ ] Prod vs dev environments (what is actually differnt? )
- [ ]

<br/>

## Priority 3:

- [ ]
- [ ]
- [ ]

<br/>

# General:

- [ ]
- [ ]
- [ ]

<br/>
