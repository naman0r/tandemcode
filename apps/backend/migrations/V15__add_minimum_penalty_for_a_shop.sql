-- V15: Add the Minimum Penalty for a Shop problem

INSERT INTO problems (slug, title, difficulty, time_limit_ms, mem_limit_mb, statement, starter_code, tests)
VALUES (
  'minimum-penalty-for-a-shop',
  'Minimum Penalty for a Shop',
  'medium',
  2000,
  256,
  $$customers is a string of Y and N, one letter per hour: Y means at least one customer came in that hour, N means nobody did. If the shop closes at hour j (0 <= j <= len(customers)), it is open for every hour before j and closed from hour j on. The penalty is 1 for each open hour with no customers plus 1 for each closed hour with customers. Return the earliest closing hour with the smallest penalty.

Input: one line containing customers.
Output: the closing hour.$$,
  $$class Solution:
    def bestClosingTime(self, customers: str) -> int:
        """
        customers[i] is Y if anyone came in hour i and N otherwise.
        Return the earliest hour to close that gives the smallest
        penalty.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

customers = sys.stdin.readline().strip()
print(Solution().bestClosingTime(customers))
$$,
  $$[
    {"input": "YYNY\n", "expected": "2", "hidden": false},
    {"input": "NNNNN\n", "expected": "0", "hidden": false},
    {"input": "YYYY\n", "expected": "4", "hidden": true},
    {"input": "N\n", "expected": "0", "hidden": true},
    {"input": "Y\n", "expected": "1", "hidden": true},
    {"input": "YNYNYN\n", "expected": "1", "hidden": true},
    {"input": "NYYNYYN\n", "expected": "6", "hidden": true},
    {"input": "YNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYNYY\n", "expected": "402", "hidden": true}
  ]$$::jsonb
);
