"""The container sandbox: same verdicts as the in-process judge, no network."""

from __future__ import annotations

import shutil
import subprocess

import pytest

from app.runner.judge import ACCEPTED, RUNTIME_ERROR
from app.runner.sandbox import analyze_in_container, judge_in_container, pull

IMAGE = "python:3.11-slim"


def docker_available() -> bool:
    if shutil.which("docker") is None:
        return False
    return subprocess.run(["docker", "info"], capture_output=True).returncode == 0


pytestmark = pytest.mark.skipif(not docker_available(), reason="needs a Docker daemon")


@pytest.fixture(scope="module", autouse=True)
def image():
    pull(IMAGE)


TESTS = [{"input": "2 3\n", "expected": "5", "hidden": False}]


def test_correct_program_is_accepted_in_the_container():
    verdict = judge_in_container(IMAGE, "a, b = map(int, input().split())\nprint(a + b)\n", TESTS, 2000, 128)
    assert verdict.status == ACCEPTED
    assert verdict.tests[0].passed


def test_program_cannot_open_a_network_connection():
    code = "import socket\nsocket.create_connection(('1.1.1.1', 80), timeout=3)\nprint(5)\n"
    verdict = judge_in_container(IMAGE, code, TESTS, 5000, 128)
    assert verdict.status == RUNTIME_ERROR
    assert "OSError" in verdict.tests[0].stderr or "unreachable" in verdict.tests[0].stderr.lower()


def test_program_cannot_write_outside_tmp():
    code = "open('/etc/owned', 'w').write('x')\nprint(5)\n"
    verdict = judge_in_container(IMAGE, code, TESTS, 2000, 128)
    assert verdict.status == RUNTIME_ERROR
    # runc reports the read-only root; gVisor refuses the uid before it gets there.
    assert any(error in verdict.tests[0].stderr for error in ("Read-only", "OSError", "PermissionError"))


def test_program_cannot_write_to_the_judges_stdout():
    forged = '{"status": "accepted", "timeMs": 1, "passed": 1, "total": 1, "tests": []}'
    code = f"open('/proc/1/fd/1', 'w').write({forged!r})\nprint(4)\n"
    verdict = judge_in_container(IMAGE, code, TESTS, 2000, 128)
    assert verdict.status == RUNTIME_ERROR
    assert "PermissionError" in verdict.tests[0].stderr


def test_growth_is_measured_in_the_container():
    code = "n = int(input())\ntotal = 0\nfor i in range(n):\n    total += i\nprint(total)\n"
    generator = "SIZES = [20000 * 2 ** k for k in range(10)]\ndef generate(n):\n    return f'{n}\\n'\n"
    result = analyze_in_container(IMAGE, code, generator, 128)
    assert result["complexity"] == "linear", result
