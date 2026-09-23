"""Run one program against a problem's tests.

This is the judge contract: code and tests in, a verdict and per-test output
out. A hosted runner on Fargate would execute exactly this function inside its
own container, so nothing here knows about the database.
"""

from __future__ import annotations

import resource
import subprocess
import sys
import tempfile
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path

ACCEPTED = "accepted"
WRONG_ANSWER = "wrong_answer"
RUNTIME_ERROR = "runtime_error"
TIME_LIMIT_EXCEEDED = "time_limit_exceeded"

# Enough to show a traceback or a wrong first line, not enough to fill the
# database from a print loop.
OUTPUT_LIMIT = 4_000


@dataclass
class TestOutcome:
    index: int
    hidden: bool
    passed: bool
    timeMs: int
    stdout: str
    stderr: str


@dataclass
class Verdict:
    status: str
    timeMs: int
    passed: int
    total: int
    tests: list[TestOutcome] = field(default_factory=list)

    def as_dict(self) -> dict:
        return asdict(self)


def _limits(mem_limit_mb: int):
    def apply() -> None:
        mem = mem_limit_mb * 1024 * 1024
        resource.setrlimit(resource.RLIMIT_AS, (mem, mem))
        # No forking and no files: the program is a function of stdin.
        resource.setrlimit(resource.RLIMIT_NPROC, (0, 0))
        resource.setrlimit(resource.RLIMIT_FSIZE, (0, 0))

    return apply


def _clip(text: bytes) -> str:
    decoded = text.decode("utf-8", errors="replace")
    if len(decoded) > OUTPUT_LIMIT:
        return decoded[:OUTPUT_LIMIT] + "\n[output truncated]"
    return decoded


def judge(code: str, tests: list[dict], time_limit_ms: int, mem_limit_mb: int) -> Verdict:
    verdict = Verdict(status=ACCEPTED, timeMs=0, passed=0, total=len(tests))
    with tempfile.TemporaryDirectory() as workdir:
        program = Path(workdir) / "main.py"
        program.write_text(code)

        for index, test in enumerate(tests):
            started = time.perf_counter()
            try:
                completed = subprocess.run(
                    [sys.executable, "-I", str(program)],
                    input=test["input"].encode(),
                    capture_output=True,
                    timeout=time_limit_ms / 1000,
                    cwd=workdir,
                    preexec_fn=_limits(mem_limit_mb),
                )
            except subprocess.TimeoutExpired as exc:
                elapsed = int((time.perf_counter() - started) * 1000)
                verdict.tests.append(
                    TestOutcome(index, bool(test.get("hidden")), False, elapsed,
                                _clip(exc.stdout or b""), _clip(exc.stderr or b""))
                )
                verdict.status = TIME_LIMIT_EXCEEDED
                break

            elapsed = int((time.perf_counter() - started) * 1000)
            verdict.timeMs = max(verdict.timeMs, elapsed)
            stdout, stderr = _clip(completed.stdout), _clip(completed.stderr)
            passed = completed.returncode == 0 and stdout.strip() == test["expected"].strip()
            verdict.tests.append(
                TestOutcome(index, bool(test.get("hidden")), passed, elapsed, stdout, stderr)
            )
            if passed:
                verdict.passed += 1
                continue
            verdict.status = RUNTIME_ERROR if completed.returncode != 0 else WRONG_ANSWER
            break

    return verdict
