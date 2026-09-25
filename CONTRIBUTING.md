# Contributing

Pull requests are welcome. [docs/development.md](docs/development.md) explains
how to run the app locally and make common changes. Run `make check`, which is
what CI runs, before opening a pull request. For anything larger than a small
fix, open an issue first so we can agree on the approach.

## Adding a problem

A problem is one SQL migration and one reference solution, submitted as a
pull request. CI runs your solution against your tests, so a problem cannot be
merged if its tests are wrong.

### 1. Write the migration

Find the highest migration number in `apps/backend/migrations/` and add the
next one, named after your problem:

```
apps/backend/migrations/V13__add_move_zeroes.sql
```

```sql
-- V13: Add the Move Zeroes problem

INSERT INTO problems (slug, title, difficulty, time_limit_ms, mem_limit_mb, statement, starter_code, tests)
VALUES (
  'move-zeroes',
  'Move Zeroes',
  'easy',
  2000,
  256,
  $$Given a list of integers nums, return it with every 0 moved to the end and the other numbers in their original order.

Input: one line containing nums, space-separated.
Output: the rearranged numbers separated by spaces.$$,
  $$from typing import List


class Solution:
    def moveZeroes(self, nums: List[int]) -> List[int]:
        """
        Return nums with every 0 moved to the end, keeping the other
        numbers in their original order.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

nums = list(map(int, sys.stdin.readline().split()))
print(*Solution().moveZeroes(nums))
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

The migration must be exactly this one `INSERT` and nothing else: no other
statements, subqueries or comments between the values. Migrations run on
deploy, so CI refuses a problem migration of any other shape. Name it
`V<n>__add_<slug>.sql`.

| Field | Rules |
|---|---|
| `slug` | lowercase words joined by hyphens; unique; the solution file is named after it |
| `difficulty` | `easy`, `medium` or `hard` |
| `time_limit_ms`, `mem_limit_mb` | per test; leave `2000` and `256` unless the problem needs otherwise. At most `10000` and `512` |
| `statement` | the task in terms of the function's arguments and return value, then an `Input:` line and an `Output:` line describing the example format |
| `starter_code` | see below |
| `tests` | see below |

### 2. Write the starter code

The starter code is what people see in the editor, and it has two parts:

1. A `Solution` class with one method for them to fill in, typed, with a
   docstring saying what it takes and what it returns. Leave the body empty
   apart from the docstring.
2. Below it, the comment `# Reads the input, calls your solution and prints
   the result. You do not need to change anything below this line.`, followed
   by the code that reads a test's input from stdin, calls the method and
   prints the return value in the exact form of your tests' `expected`.

If the answer can come back in any order, sort it in the second part before
printing, as `three-sum` and `merge-intervals` do, so people are not marked
wrong for a valid order. Problems about linked lists or trees define `ListNode`
or `TreeNode` at the top, as `add-two-numbers` and `serialize-deserialize-tree`
do.

### 3. Write the tests

Programs read a test's `input` on stdin and print their answer. A test passes
when the program exits cleanly and its output, trimmed of whitespace at both
ends, equals `expected`, also trimmed.

- At least 5 tests. Every test with `"hidden": false` is shown as an example,
  so include at least 2 of those, and put them first. The rest are hidden:
  people see only whether each passed, never its input or their output.
- Write `input` exactly as stdin would receive it, including the final `\n`.
- Every input has exactly one correct output. If several orders are valid,
  say in the statement which one to print, such as "sorted ascending".
- Hidden tests cover the edge cases: empty input, one element, the largest
  input your limits allow, negative numbers, duplicates.

### 4. Add a reference solution

Save your starter code with the method filled in as
`apps/backend/tests/solutions/<slug>.py`, for example
`tests/solutions/move-zeroes.py`. The test suite judges it against every test
in your migration, hidden ones included. It fails if:

- any test does not pass
- a problem has no solution, or fewer than 2 examples
- the starter code does not compile, has no `Solution` class, or passes the
  tests without being filled in

### Optional: support complexity analysis

An accepted run can be rerun on bigger inputs to estimate how its time grows.
A problem supports this when its migration also sets two columns:

- `complexity_generator`: Python source defining `SIZES`, the input sizes to
  try in order, and `generate(n)`, which returns the stdin for an input of
  size `n`. Make the inputs force a full solve, for example by putting the
  answer at the end.
- `expected_complexity`: the class your reference solution achieves, one of
  `constant`, `linear`, `quadratic` or `cubic`.

The test suite measures your reference solution with your generator and fails
if it does not land in the expected class. `V13__complexity_analysis.sql` has
examples.

### 5. Check it

Run `make test`. To see the problem in the app,
restart the API so the migration runs:

```bash
cd apps/backend && docker compose up -d --build backend
```

Then open http://localhost:5173/problems, create a room with your problem, and
run your solution there.

### 6. Open the pull request

One problem per pull request. Say where the problem comes from. Write the
statement in your own words: do not copy text from other sites.

If another problem is merged first and takes your migration number, rename your
file to the next free number. Two migrations with the same number fail CI.

Contributions are licensed under the Apache License 2.0, like the rest of the
project.
