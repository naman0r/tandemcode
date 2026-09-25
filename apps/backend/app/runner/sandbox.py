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
import os
import subprocess
import uuid
from pathlib import Path

from app.runner import complexity
from app.runner.judge import RUNTIME_ERROR, TestOutcome, Verdict

logger = logging.getLogger(__name__)

JUDGE_SOURCE = (Path(__file__).parent / "judge.py").read_text()
COMPLEXITY_SOURCE = (Path(__file__).parent / "complexity.py").read_text()

# Room for the interpreter and the judge on top of the program's own limit.
CONTAINER_MEMORY_OVERHEAD_MB = 64
# Container start and interpreter start, on top of the program's own limits.
STARTUP_ALLOWANCE_SECONDS = 20

# `runsc` in production: gVisor answers the program's system calls itself, so
# escaping the container takes a gVisor bug and then a kernel bug, not one
# kernel bug. Unset, Docker's default runtime is used, as on a laptop.
SANDBOX_RUNTIME = os.getenv("SANDBOX_RUNTIME")


def pull(image: str) -> None:
    # Bounded like every docker call here: a hung daemon should fail loudly
    # rather than leave the runner waiting forever with runs piling up.
    subprocess.run(["docker", "pull", "--quiet", image], check=True, capture_output=True, timeout=600)


def _run_in_container(image: str, source: str, spec: dict, mem_limit_mb: int, timeout: float) -> dict | None:
    """Run a program file from this package in a fresh container; its JSON result, or None if it hung."""
    name = f"judge-{uuid.uuid4().hex[:12]}"
    command = [
        "docker", "run", "--rm", "--interactive", "--name", name,
        "--network", "none",
        "--read-only",
        "--tmpfs", "/tmp:rw,size=64m,mode=1777",
        "--user", "65534:65534",
        "--memory", f"{mem_limit_mb + CONTAINER_MEMORY_OVERHEAD_MB}m",
        # Without this Docker grants as much swap again, and a program
        # flooding its output would push the host into swap before the kill.
        "--memory-swap", f"{mem_limit_mb + CONTAINER_MEMORY_OVERHEAD_MB}m",
        "--cpus", "1",
        "--pids-limit", "32",
        "--cap-drop", "ALL",
        "--security-opt", "no-new-privileges",
        "--env", "PYTHONDONTWRITEBYTECODE=1",
        *(["--runtime", SANDBOX_RUNTIME] if SANDBOX_RUNTIME else []),
        image,
        "python", "-I", "-c", source,
    ]
    try:
        completed = subprocess.run(
            command, input=json.dumps(spec).encode(), capture_output=True, timeout=timeout
        )
    except subprocess.TimeoutExpired:
        # The program inside enforces its own limits; reaching this means the
        # container itself hung. Make sure it is gone.
        subprocess.run(["docker", "rm", "--force", name], capture_output=True, timeout=60)
        logger.error("Sandbox %s exceeded %.0fs and was removed", name, timeout)
        return None

    if completed.returncode != 0:
        raise RuntimeError(f"Sandbox exited {completed.returncode}: {completed.stderr.decode(errors='replace')[:500]}")
    return json.loads(completed.stdout)


def judge_in_container(
    image: str, code: str, tests: list[dict], time_limit_ms: int, mem_limit_mb: int
) -> Verdict:
    spec = {"code": code, "tests": tests, "timeLimitMs": time_limit_ms, "memLimitMb": mem_limit_mb}
    timeout = len(tests) * time_limit_ms / 1000 + STARTUP_ALLOWANCE_SECONDS
    data = _run_in_container(image, JUDGE_SOURCE, spec, mem_limit_mb, timeout)
    if data is None:
        return Verdict(status=RUNTIME_ERROR, timeMs=0, passed=0, total=len(tests))
    return Verdict(
        status=data["status"],
        timeMs=data["timeMs"],
        passed=data["passed"],
        total=data["total"],
        tests=[TestOutcome(**outcome) for outcome in data["tests"]],
    )


def analyze_in_container(image: str, code: str, generator: str, mem_limit_mb: int) -> dict:
    spec = {"code": code, "generator": generator, "memLimitMb": mem_limit_mb}
    # Generating the inputs takes a moment on top of the measured runs.
    timeout = complexity.BUDGET_SECONDS + complexity.PER_RUN_SECONDS + STARTUP_ALLOWANCE_SECONDS
    data = _run_in_container(image, COMPLEXITY_SOURCE, spec, mem_limit_mb, timeout)
    if data is None:
        return {"points": [], "complexity": None, "slope": None, "note": "The analysis did not finish in time."}
    return data
