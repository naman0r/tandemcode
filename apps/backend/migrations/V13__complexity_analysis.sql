-- V13: Complexity analysis of accepted runs
--
-- On request, an accepted run is rerun on inputs of growing size to estimate
-- how its running time grows (app/runner/complexity.py). A problem opts in
-- with a generator: Python source defining SIZES, the input sizes to try in
-- order, and generate(n), the stdin for an input of size n. Its expected
-- class is what the reference solution achieves.

ALTER TABLE problems
  ADD COLUMN complexity_generator TEXT,
  ADD COLUMN expected_complexity TEXT,
  ADD CONSTRAINT problems_expected_complexity_known
    CHECK (expected_complexity IN ('constant', 'linear', 'quadratic', 'cubic')),
  ADD CONSTRAINT problems_complexity_needs_both
    CHECK ((complexity_generator IS NULL) = (expected_complexity IS NULL));

ALTER TABLE submissions
  ADD COLUMN analysis_status TEXT
    CHECK (analysis_status IN ('pending', 'running', 'done', 'failed')),
  ADD COLUMN analysis JSONB,
  ADD COLUMN analysis_requested_by TEXT REFERENCES users(id),
  ADD COLUMN analysis_requested_at TIMESTAMPTZ;

-- One analysis in flight per person, for the same reason as one run.
CREATE UNIQUE INDEX submissions_one_analysis_in_flight_per_user
  ON submissions (analysis_requested_by)
  WHERE analysis_status IN ('pending', 'running');

-- The only matching pair is the last two numbers, so every solution has to
-- read to the end. Every other number is even and the target is odd, which
-- makes that pair the only answer.
UPDATE problems SET expected_complexity = 'linear', complexity_generator = $gen$
import random

SIZES = [1000 * 2 ** k for k in range(10)]


def generate(n):
    rng = random.Random(n)
    evens = [2 * v for v in rng.sample(range(1, 10 * n), n - 1)]
    even = evens.pop()
    odd = 2 * rng.randrange(10 * n) + 1
    nums = evens + [even, odd]
    return " ".join(map(str, nums)) + "\n" + str(even + odd) + "\n"
$gen$
WHERE slug = 'two-sum';

-- Balanced, so a correct solution reads every bracket.
UPDATE problems SET expected_complexity = 'linear', complexity_generator = $gen$
import random

SIZES = [1000 * 2 ** k for k in range(13)]
PAIRS = {"(": ")", "[": "]", "{": "}"}


def generate(n):
    rng = random.Random(n)
    out, stack = [], []
    for i in range(n):
        if stack and (len(stack) == n - i or rng.random() < 0.5):
            out.append(PAIRS[stack.pop()])
        else:
            stack.append(rng.choice("([{"))
            out.append(stack[-1])
    return "".join(out) + "\n"
$gen$
WHERE slug = 'valid-parentheses';

UPDATE problems SET expected_complexity = 'linear', complexity_generator = $gen$
import random

SIZES = [1000 * 2 ** k for k in range(11)]


def generate(n):
    rng = random.Random(n)
    return " ".join(str(rng.randint(1, 10000)) for _ in range(n)) + "\n"
$gen$
WHERE slug = 'best-time-to-buy-sell-stock';

-- A wide range of values keeps the number of zero-sum triplets small, so the
-- time is the search, not the answer. Sizes grow by a factor of about 1.4, as
-- a cubic brute force outgrows its budget within a few doublings.
UPDATE problems SET expected_complexity = 'quadratic', complexity_generator = $gen$
import random

SIZES = [int(100 * 2 ** (k / 2)) for k in range(14)]


def generate(n):
    rng = random.Random(n)
    return " ".join(str(rng.randint(-10 ** 6, 10 ** 6)) for _ in range(n)) + "\n"
$gen$
WHERE slug = 'three-sum';
