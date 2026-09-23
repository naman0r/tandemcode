from __future__ import annotations

from fastapi import HTTPException, status

from app.dao.problems import ProblemDAO


class ProblemService:
    def __init__(self, problem_dao: ProblemDAO) -> None:
        self.problem_dao = problem_dao

    async def list_problems(self, difficulty: str | None) -> list[dict]:
        if difficulty:
            return await self.problem_dao.list_by_difficulty(difficulty)
        return await self.problem_dao.list_all()

    async def get_problem(self, problem_id) -> dict:
        problem = await self.problem_dao.get_by_id(problem_id)
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Problem not found: {problem_id}",
            )
        return problem

    async def get_problem_by_slug(self, slug: str) -> dict:
        problem = await self.problem_dao.get_by_slug(slug)
        if not problem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Problem not found: {slug}",
            )
        return problem
