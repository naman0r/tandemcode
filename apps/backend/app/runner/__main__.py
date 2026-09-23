"""Claim pending submissions and judge them, one at a time.

The submissions table is the queue: a row is claimed by moving it to
``running`` under ``FOR UPDATE SKIP LOCKED``, so several runners can share a
database without judging the same submission twice.
"""

from __future__ import annotations

import asyncio
import logging

from app.dao.problems import ProblemDAO
from app.dao.submissions import SubmissionDAO
from app.database import create_pool
from app.runner.judge import RUNTIME_ERROR, Verdict, judge

logger = logging.getLogger(__name__)

POLL_SECONDS = 1.0


async def judge_next(submissions: SubmissionDAO, problems: ProblemDAO) -> bool:
    """Judge one submission if there is one waiting. Returns whether it did."""
    submission = await submissions.claim_pending()
    if submission is None:
        return False

    try:
        spec = await problems.get_judge_spec(submission["problemId"])
        verdict = await asyncio.to_thread(
            judge, submission["code"] or "", spec["tests"], spec["timeLimitMs"], spec["memLimitMb"]
        )
    except Exception:
        # The judge, not the program, failed. The row must not stay "running"
        # forever, and the user gets told rather than left polling.
        logger.exception("Judge failed for submission %s", submission["id"])
        verdict = Verdict(status=RUNTIME_ERROR, timeMs=0, passed=0, total=0)

    await submissions.complete(submission["id"], verdict.status, verdict.timeMs, verdict.as_dict())
    logger.info("Submission %s: %s", submission["id"], verdict.status)
    return True


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    pool = await create_pool()
    submissions, problems = SubmissionDAO(pool), ProblemDAO(pool)
    # Rows left "running" by a runner that died mid-judge would never be
    # claimed again. One runner at a time is the local setup, so on boot
    # anything still running is ours from before and goes back in the queue.
    await submissions.requeue_running()
    try:
        while True:
            if not await judge_next(submissions, problems):
                await asyncio.sleep(POLL_SECONDS)
    finally:
        await pool.close()


if __name__ == "__main__":
    asyncio.run(main())
