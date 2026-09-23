"""The judge contract, with no database in sight."""

from __future__ import annotations

from app.runner.judge import (
    ACCEPTED,
    RUNTIME_ERROR,
    TIME_LIMIT_EXCEEDED,
    WRONG_ANSWER,
    judge,
)

TESTS = [
    {"input": "2 3\n", "expected": "5", "hidden": False},
    {"input": "10 -4\n", "expected": "6", "hidden": True},
]
ADD = "a, b = map(int, input().split())\nprint(a + b)\n"


def run(code: str, time_limit_ms: int = 2000, mem_limit_mb: int = 256):
    return judge(code, TESTS, time_limit_ms, mem_limit_mb)


def test_correct_program_passes_every_test():
    verdict = run(ADD)
    assert verdict.status == ACCEPTED
    assert (verdict.passed, verdict.total) == (2, 2)
    assert [t.passed for t in verdict.tests] == [True, True]
    assert verdict.tests[1].hidden is True


def test_trailing_whitespace_does_not_matter():
    assert run("a, b = map(int, input().split())\nprint(a + b, end='  \\n\\n')\n").status == ACCEPTED


def test_wrong_output_stops_at_the_first_failure():
    verdict = run("a, b = map(int, input().split())\nprint(a - b)\n")
    assert verdict.status == WRONG_ANSWER
    assert (verdict.passed, verdict.total) == (0, 2)
    assert len(verdict.tests) == 1
    assert verdict.tests[0].stdout.strip() == "-1"


def test_exception_is_a_runtime_error_with_the_traceback():
    verdict = run("print(1 / 0)\n")
    assert verdict.status == RUNTIME_ERROR
    assert "ZeroDivisionError" in verdict.tests[0].stderr


def test_infinite_loop_hits_the_time_limit():
    verdict = run("while True:\n    pass\n", time_limit_ms=300)
    assert verdict.status == TIME_LIMIT_EXCEEDED
    assert verdict.tests[0].timeMs >= 300


def test_memory_hog_is_stopped_by_the_limit():
    verdict = run("x = bytearray(400 * 1024 * 1024)\nprint(len(x))\n", mem_limit_mb=128)
    assert verdict.status == RUNTIME_ERROR
    assert "MemoryError" in verdict.tests[0].stderr


def test_output_is_truncated():
    verdict = run("print('x' * 100000)\n")
    assert verdict.status == WRONG_ANSWER
    assert verdict.tests[0].stdout.endswith("[output truncated]")
    assert len(verdict.tests[0].stdout) < 5000


def test_program_cannot_read_the_runner_secrets(monkeypatch):
    monkeypatch.setenv("DB_PASSWORD", "hunter2")
    verdict = run("import os\nprint(os.environ.get('DB_PASSWORD', 'unset'))\n")
    assert verdict.tests[0].stdout.strip() == "unset"


def test_long_expected_output_can_still_pass():
    long_tests = [{"input": "", "expected": "y" * 10000, "hidden": False}]
    verdict = judge("print('y' * 10000)\n", long_tests, 2000, 256)
    assert verdict.status == ACCEPTED
    assert verdict.tests[0].stdout.endswith("[output truncated]")
