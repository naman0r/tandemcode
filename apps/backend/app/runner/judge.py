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

# The runner's own environment holds database and Clerk secrets. The program
# gets none of it: a submission that prints os.environ would otherwise land
# those secrets in its verdict.
PROGRAM_ENV = {"PATH": "/usr/local/bin:/usr/bin:/bin", "LANG": "C.UTF-8"}


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
    # Postgres rejects NUL in jsonb, and a verdict that cannot be stored
    # would put the runner in a crash loop on the same row.
    decoded = text.decode("utf-8", errors="replace").replace("\x00", "")
    if len(decoded) > OUTPUT_LIMIT:
        return decoded[:OUTPUT_LIMIT] + "\n[output truncated]"
    return decoded


def _outcome(index: int, test: dict, passed: bool, elapsed: int, stdout: bytes, stderr: bytes) -> TestOutcome:
    hidden = bool(test.get("hidden"))
    # A failing hidden test's output can echo its stdin, which is the test.
    if hidden:
        return TestOutcome(index, True, passed, elapsed, "", "")
    return TestOutcome(index, False, passed, elapsed, _clip(stdout), _clip(stderr))


def judge(code: str, tests: list[dict], time_limit_ms: int, mem_limit_mb: int) -> Verdict:
    # A problem with no tests would otherwise accept anything.
    status = ACCEPTED if tests else RUNTIME_ERROR
    verdict = Verdict(status=status, timeMs=0, passed=0, total=len(tests))
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
                    env=PROGRAM_ENV,
                    preexec_fn=_limits(mem_limit_mb),
                )
            except subprocess.TimeoutExpired as exc:
                elapsed = int((time.perf_counter() - started) * 1000)
                verdict.tests.append(
                    _outcome(index, test, False, elapsed, exc.stdout or b"", exc.stderr or b"")
                )
                verdict.status = TIME_LIMIT_EXCEEDED
                break

            elapsed = int((time.perf_counter() - started) * 1000)
            verdict.timeMs = max(verdict.timeMs, elapsed)
            passed = (
                completed.returncode == 0
                and completed.stdout.decode("utf-8", errors="replace").strip()
                == test["expected"].strip()
            )
            verdict.tests.append(
                _outcome(index, test, passed, elapsed, completed.stdout, completed.stderr)
            )
            if passed:
                verdict.passed += 1
                continue
            verdict.status = RUNTIME_ERROR if completed.returncode != 0 else WRONG_ANSWER
            break

    return verdict


if __name__ == "__main__":
    # Entry point when this file is shipped into a sandbox container: the
    # spec arrives on stdin and the verdict leaves on stdout, both as JSON.
    import ctypes
    import json

    # The program runs under our uid, so without this it could open
    # /proc/1/fd/1 and print a verdict of its own. A non-dumpable process's
    # /proc entries belong to root; the program regains dumpability on exec.
    PR_SET_DUMPABLE = 4
    ctypes.CDLL(None).prctl(PR_SET_DUMPABLE, 0)

    spec = json.load(sys.stdin)
    result = judge(spec["code"], spec["tests"], spec["timeLimitMs"], spec["memLimitMb"])
    print(json.dumps(result.as_dict()))
