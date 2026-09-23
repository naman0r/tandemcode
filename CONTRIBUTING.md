# Contributing

Pull requests are welcome. `README.md` explains how to run the app locally and
which checks CI runs; run those before opening a pull request.

## Adding a problem

A problem is one SQL migration and one reference solution, submitted as a
pull request. CI runs your solution against your tests, so a problem cannot be
merged if its tests are wrong.

### 1. Write the migration

Find the highest migration number in `apps/backend/migrations/` and add the
next one, named after your problem:

```
apps/backend/migrations/V11__add_move_zeroes.sql
```

```sql
-- V11: Add the Move Zeroes problem

INSERT INTO problems (slug, title, difficulty, time_limit_ms, mem_limit_mb, statement, starter_code, tests)
VALUES (
  'move-zeroes',
  'Move Zeroes',
  'easy',
  2000,
  256,
  $$Given a list of integers, move every 0 to the end while keeping the other numbers in their original order.

Input: one line of space-separated integers.
Output: the rearranged integers separated by spaces.$$,
  $$import sys

nums = list(map(int, sys.stdin.readline().split()))

# print the numbers with every 0 moved to the end
$$,
  $$[
    {"input": "0 1 0 3 12\n", "expected": "1 3 12 0 0", "hidden": false},
    {"input": "0\n", "expected": "0", "hidden": false},
    {"input": "1 2 3\n", "expected": "1 2 3", "hidden": true},
    {"input": "0 0 1\n", "expected": "1 0 0", "hidden": true},
    {"input": "4 0 5 0 0 6\n", "expected": "4 5 6 0 0 0", "hidden": true}
  ]$$::jsonb
);
```

Text between `$$` markers needs no escaping. If your statement itself contains
`$$`, use a tagged marker such as `$body$ ... $body$` instead.

| Field | Rules |
|---|---|
| `slug` | lowercase words joined by hyphens; unique; the solution file is named after it |
| `difficulty` | `easy`, `medium` or `hard` |
| `time_limit_ms`, `mem_limit_mb` | per test; leave `2000` and `256` unless the problem needs otherwise |
| `statement` | the task, then an `Input:` line and an `Output:` line that describe the exact format |
| `starter_code` | Python 3.11 that reads the input in that format, ending with a comment saying what to print |
| `tests` | see below |

### 2. Write the tests

Programs read a test's `input` on stdin and print their answer. A test passes
when the program exits cleanly and its output, trimmed of whitespace at both
ends, equals `expected`, also trimmed.

- At least 5 tests. Every test with `"hidden": false` is shown as an example,
  so include at least 2 of those. The rest are hidden: people see only whether
  each passed, never its input or their output.
- Write `input` exactly as stdin would receive it, including the final `\n`.
- Every input has exactly one correct output. If several orders are valid,
  say in the statement which one to print, such as "sorted ascending".
- Hidden tests cover the edge cases: empty input, one element, the largest
  input your limits allow, negative numbers, duplicates.

### 3. Add a reference solution

Save a correct solution as `apps/backend/tests/solutions/<slug>.py`, for
example `tests/solutions/move-zeroes.py`. It reads stdin and prints the answer,
like any submission. The test suite judges it against every test in your
migration, hidden ones included, and fails if any test does not pass, if a
problem has no solution, or if a problem has fewer than 2 examples.

### 4. Check it

Run the backend checks from `README.md`. To see the problem in the app,
restart the API so the migration runs:

```bash
cd apps/backend && docker compose up -d --build backend
```

Then open http://localhost:5173/problems, create a room with your problem, and
run your solution there.

### 5. Open the pull request

One problem per pull request. Say where the problem comes from. Write the
statement in your own words: do not copy text from other sites.

If another problem is merged first and takes your migration number, rename your
file to the next free number. Two migrations with the same number fail CI.

Contributions are licensed under the Apache License 2.0, like the rest of the
project.
