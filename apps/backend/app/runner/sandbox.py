"""Run the judge inside a throwaway container with no network.

The judge's rlimits stop a program from eating the machine, but a subprocess
of the runner still shares its network namespace and could reach the database
host or the internet. Here each submission gets its own container instead:
the judge module is passed as the program text, the spec goes in on stdin,
and the verdict comes back on stdout. The container has no network, a
read-only root, a small tmpfs, and runs as nobody.
"""

from __future__ import annotations

import json
import logging
import subprocess
import uuid
from pathlib import Path

from app.runner.judge import RUNTIME_ERROR, TestOutcome, Verdict

logger = logging.getLogger(__name__)

JUDGE_SOURCE = (Path(__file__).parent / "judge.py").read_text()

# Room for the interpreter and the judge on top of the program's own limit.
CONTAINER_MEMORY_OVERHEAD_MB = 64
# Container start and interpreter start, on top of the tests' own limits.
STARTUP_ALLOWANCE_SECONDS = 20


def pull(image: str) -> None:
    subprocess.run(["docker", "pull", "--quiet", image], check=True, capture_output=True)


def judge_in_container(
    image: str, code: str, tests: list[dict], time_limit_ms: int, mem_limit_mb: int
) -> Verdict:
    name = f"judge-{uuid.uuid4().hex[:12]}"
    command = [
        "docker", "run", "--rm", "--interactive", "--name", name,
        "--network", "none",
        "--read-only",
        "--tmpfs", "/tmp:rw,size=64m,mode=1777",
        "--user", "65534:65534",
        "--memory", f"{mem_limit_mb + CONTAINER_MEMORY_OVERHEAD_MB}m",
        "--cpus", "1",
        "--pids-limit", "32",
        "--cap-drop", "ALL",
        "--security-opt", "no-new-privileges",
        "--env", "PYTHONDONTWRITEBYTECODE=1",
        image,
        "python", "-I", "-c", JUDGE_SOURCE,
    ]
    spec = json.dumps(
        {"code": code, "tests": tests, "timeLimitMs": time_limit_ms, "memLimitMb": mem_limit_mb}
    )
    timeout = len(tests) * time_limit_ms / 1000 + STARTUP_ALLOWANCE_SECONDS
    try:
        completed = subprocess.run(
            command, input=spec.encode(), capture_output=True, timeout=timeout
        )
    except subprocess.TimeoutExpired:
        # The judge inside enforces per-test limits; reaching this means the
        # container itself hung. Make sure it is gone.
        subprocess.run(["docker", "rm", "--force", name], capture_output=True)
        logger.error("Sandbox %s exceeded %.0fs and was removed", name, timeout)
        return Verdict(status=RUNTIME_ERROR, timeMs=0, passed=0, total=len(tests))

    if completed.returncode != 0:
        raise RuntimeError(f"Sandbox exited {completed.returncode}: {completed.stderr.decode(errors='replace')[:500]}")

    data = json.loads(completed.stdout)
    return Verdict(
        status=data["status"],
        timeMs=data["timeMs"],
        passed=data["passed"],
        total=data["total"],
        tests=[TestOutcome(**outcome) for outcome in data["tests"]],
    )
