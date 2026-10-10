-- V19: Add the Calculate Amount Paid in Taxes problem

INSERT INTO problems (slug, title, difficulty, time_limit_ms, mem_limit_mb, statement, starter_code, tests)
VALUES (
  'calculate-amount-paid-in-taxes',
  'Calculate Amount Paid in Taxes',
  'easy',
  2000,
  256,
  $$Each bracket [upper, percent] in brackets taxes the income up to upper that the brackets before it did not cover at percent percent. The first bracket covers income from 0 to its upper. The upper bounds are increasing, and the last one is at least income. Return the total tax on income.

Input: the first line is the number of brackets, then one bracket per line as upper percent. The last line is income.
Output: the tax with two decimal places, for example 2.65.$$,
  $$from typing import List


class Solution:
    def calculateTax(self, brackets: List[List[int]], income: int) -> float:
        """
        brackets[i] is [upper, percent], sorted by upper. Return the tax
        owed on income.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
n = int(lines[0])
brackets = [list(map(int, lines[1 + i].split())) for i in range(n)]
income = int(lines[1 + n])
print(f"{Solution().calculateTax(brackets, income):.2f}")
$$,
  $$[
    {"input": "3\n3 50\n7 10\n12 25\n10\n", "expected": "2.65", "hidden": false},
    {"input": "3\n1 0\n4 25\n5 50\n2\n", "expected": "0.25", "hidden": false},
    {"input": "1\n2 50\n0\n", "expected": "0.00", "hidden": true},
    {"input": "1\n1000 100\n1000\n", "expected": "1000.00", "hidden": true},
    {"input": "2\n5 10\n10 20\n5\n", "expected": "0.50", "hidden": true},
    {"input": "4\n10 1\n20 3\n30 7\n40 99\n37\n", "expected": "8.03", "hidden": true},
    {"input": "3\n1 100\n2 0\n100 33\n100\n", "expected": "33.34", "hidden": true}
  ]$$::jsonb
);
