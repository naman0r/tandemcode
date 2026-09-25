"""Estimating growth from timed runs, with no database in sight."""

from __future__ import annotations

from app.runner.complexity import analyze, classify

COUNT_TO_N = "n = int(input())\ntotal = 0\nfor i in range(n):\n    total += i\nprint(total)\n"
PAIRS_UP_TO_N = (
    "n = int(input())\ntotal = 0\nfor i in range(n):\n    for j in range(n):\n        total += 1\nprint(total)\n"
)


def sizes(start: int, factor: float, count: int) -> str:
    return f"SIZES = [int({start} * {factor} ** k) for k in range({count})]\ndef generate(n):\n    return f'{{n}}\\n'\n"


def test_classify_reads_the_power_of_n():
    for power, name in [(0, "constant"), (1, "linear"), (2, "quadratic"), (3, "cubic"), (4, "worse")]:
        points = [(n, float(n**power)) for n in (1000, 2000, 4000, 8000)]
        assert classify(points)[0] == name, power


def test_a_single_loop_is_linear():
    result = analyze(COUNT_TO_N, sizes(20_000, 2, 10), 256)
    assert result["complexity"] == "linear", result


def test_a_nested_loop_is_quadratic():
    result = analyze(PAIRS_UP_TO_N, sizes(300, 2**0.5, 14), 256)
    assert result["complexity"] == "quadratic", result


def test_a_program_that_crashes_on_big_inputs_says_where():
    code = "n = int(input())\nif n > 5000:\n    raise ValueError('too big')\nprint(n)\n"
    result = analyze(code, sizes(1000, 2, 5), 256)
    assert result["complexity"] is None
    assert "n = 8000" in result["note"] and "too big" in result["note"]


def test_a_program_too_fast_to_measure_barely_grows():
    result = analyze("input()\nprint(1)\n", sizes(1000, 2, 5), 256)
    assert result["complexity"] == "constant"
    assert result["points"] == []
