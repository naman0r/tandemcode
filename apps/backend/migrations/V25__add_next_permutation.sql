-- V25: Add the Next Permutation problem

INSERT INTO problems (slug, title, difficulty, time_limit_ms, mem_limit_mb, statement, starter_code, tests)
VALUES (
  'next-permutation',
  'Next Permutation',
  'medium',
  2000,
  256,
  $$Rearrange nums into the next arrangement of the same numbers in dictionary order, the one that would come right after it if every arrangement were sorted. If nums is already the last arrangement, rearrange it into the first, sorted ascending. Change nums in place and use only constant extra memory.

Input: one line containing nums, space-separated.
Output: nums after the change, separated by spaces.$$,
  $$from typing import List


class Solution:
    def nextPermutation(self, nums: List[int]) -> None:
        """
        Rearrange nums in place into the next arrangement in dictionary
        order, or into ascending order if it is the last one. Return
        nothing.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

nums = list(map(int, sys.stdin.readline().split()))
Solution().nextPermutation(nums)
print(*nums)
$$,
  $$[
    {"input": "1 2 3\n", "expected": "1 3 2", "hidden": false},
    {"input": "3 2 1\n", "expected": "1 2 3", "hidden": false},
    {"input": "1 1 5\n", "expected": "1 5 1", "hidden": true},
    {"input": "1\n", "expected": "1", "hidden": true},
    {"input": "1 3 2\n", "expected": "2 1 3", "hidden": true},
    {"input": "2 2 0 4 3 1\n", "expected": "2 2 1 0 3 4", "hidden": true},
    {"input": "5 1 1\n", "expected": "1 1 5", "hidden": true},
    {"input": "1 5 8 4 7 6 5 3 1\n", "expected": "1 5 8 5 1 3 4 6 7", "hidden": true}
  ]$$::jsonb
);
