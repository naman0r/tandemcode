"""Estimate how a program's running time grows with the size of its input.

The program runs on inputs of doubling size from the problem's generator, and
the CPU time of each run is fitted to a power of n. CPU time, not a count of
executed lines, because a line count sees `x in some_list` or `sorted(xs)` as
one step and would call a quadratic brute force linear. It is measured from
outside the program, so the program cannot report a time of its own.

Like the judge, this file is shipped into a sandbox container as the program
text, so it imports nothing from the app.
"""

from __future__ import annotations

import math
import resource
import subprocess
import sys
import tempfile
import time
from pathlib import Path

# Runner time one analysis may use, and the most one size may take. A run
# that reaches a second has shown its growth; bigger inputs only cost time.
BUDGET_SECONDS = 6.0
PER_RUN_SECONDS = 2.5
ENOUGH_SECONDS = 1.0

# Below this a run is mostly noise, not the solution.
MIN_MEASURABLE_MS = 20.0

# Fitted exponent of n -> growth class, split halfway between the powers.
# n log n fits at about 1.1 over the sizes used, too close to n to tell
# apart, so they share a class.
CLASSES = [(0.5, "constant"), (1.5, "linear"), (2.5, "quadratic"), (3.5, "cubic")]
WORSE = "worse"

PROGRAM_ENV = {"PATH": "/usr/local/bin:/usr/bin:/bin", "LANG": "C.UTF-8"}


def _limits(mem_limit_mb: int):
    # The same limits the judge applies; this file cannot import them.
    def apply() -> None:
        mem = mem_limit_mb * 1024 * 1024
        resource.setrlimit(resource.RLIMIT_AS, (mem, mem))
        resource.setrlimit(resource.RLIMIT_NPROC, (0, 0))
        resource.setrlimit(resource.RLIMIT_FSIZE, (0, 0))

    return apply


def _children_cpu() -> float:
    usage = resource.getrusage(resource.RUSAGE_CHILDREN)
    return usage.ru_utime + usage.ru_stime


def classify(points: list[tuple[int, float]]) -> tuple[str, float]:
    """Least-squares slope of log(ms) against log(n), and its class."""
    xs = [math.log(n) for n, _ in points]
    ys = [math.log(ms) for _, ms in points]
    mean_x, mean_y = sum(xs) / len(xs), sum(ys) / len(ys)
    spread = sum((x - mean_x) ** 2 for x in xs)
    slope = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys)) / spread
    for bound, name in CLASSES:
        if slope < bound:
            return name, slope
    return WORSE, slope


def _run(program: Path, workdir: str, stdin: str, timeout: float, mem_limit_mb: int):
    """CPU and wall seconds for one run, or None and a reason if it did not finish."""
    cpu_before, started = _children_cpu(), time.perf_counter()
    try:
        completed = subprocess.run(
            [sys.executable, "-I", str(program)],
            input=stdin.encode(),
            # Nothing is checked here, and a large input can mean a large answer.
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            timeout=timeout,
            cwd=workdir,
            env=PROGRAM_ENV,
            preexec_fn=_limits(mem_limit_mb),
        )
    except subprocess.TimeoutExpired:
        return None, f"took over {timeout:.1f} s"
    wall = time.perf_counter() - started
    if completed.returncode != 0:
        # Postgres rejects NUL in jsonb, and a result that cannot be stored
        # would leave the runner retrying the same analysis forever.
        last = completed.stderr.decode("utf-8", errors="replace").replace("\x00", "").strip().splitlines()
        return None, f"crashed: {last[-1][:200]}" if last else "crashed"
    # Some sandboxes do not account children's CPU; wall time is the fallback.
    cpu = _children_cpu() - cpu_before
    return (cpu if cpu > 0 else wall), None


def analyze(code: str, generator: str, mem_limit_mb: int) -> dict:
    namespace: dict = {}
    exec(generator, namespace)
    generate, sizes = namespace["generate"], namespace["SIZES"]

    points: list[tuple[int, float]] = []
    note = None
    spent = 0.0
    with tempfile.TemporaryDirectory() as workdir:
        program = Path(workdir) / "main.py"
        program.write_text(code)
        # Every run pays for starting the interpreter, the program's imports
        # and reading its input. The program on a tiny input costs about that
        # and nothing more; left in, it flattens the growth of every run.
        tiny = generate(max(4, sizes[0] // 32))
        startup = min(_run(program, workdir, tiny, PER_RUN_SECONDS, mem_limit_mb)[0] or 0.0 for _ in range(3))

        for n in sizes:
            remaining = BUDGET_SECONDS - spent
            if remaining <= 0.1:
                note = f"Stopped before n = {n}: out of time for this analysis."
                break
            seconds, failure = _run(program, workdir, generate(n), min(PER_RUN_SECONDS, remaining), mem_limit_mb)
            if seconds is None:
                note = f"Stopped at n = {n}: it {failure}."
                break
            spent += seconds
            ms = (seconds - startup) * 1000
            if ms >= MIN_MEASURABLE_MS:
                points.append((n, ms))
            if seconds >= ENOUGH_SECONDS:
                break

    result = {
        "points": [{"n": n, "ms": round(ms, 1)} for n, ms in points],
        "complexity": None,
        "slope": None,
        "note": note,
    }
    if len(points) >= 2:
        result["complexity"], slope = classify(points)
        result["slope"] = round(slope, 2)
        if len(points) == 2:
            result["note"] = (note + " " if note else "") + "Only two sizes were measurable, so this is rough."
    elif not points and note is None:
        # Even the largest input ran too fast to measure: it barely grows.
        result["complexity"], result["slope"] = "constant", 0.0
    elif note is None:
        result["note"] = "Only one size was measurable, which is not enough to see growth."
    return result


if __name__ == "__main__":
    # Entry point inside a sandbox container: the spec arrives on stdin and
    # the result leaves on stdout, both as JSON.
    import ctypes
    import json

    # As in the judge: the program must not be able to print our result for us.
    PR_SET_DUMPABLE = 4
    ctypes.CDLL(None).prctl(PR_SET_DUMPABLE, 0)

    spec = json.load(sys.stdin)
    print(json.dumps(analyze(spec["code"], spec["generator"], spec["memLimitMb"])))
