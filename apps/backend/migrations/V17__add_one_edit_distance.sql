-- V17: Add the One Edit Distance problem

INSERT INTO problems (slug, title, difficulty, time_limit_ms, mem_limit_mb, statement, starter_code, tests)
VALUES (
  'one-edit-distance',
  'One Edit Distance',
  'medium',
  2000,
  256,
  $$Return true if s can be turned into t with exactly one edit, and false otherwise. An edit inserts one character, deletes one character, or replaces one character with a different one. Two equal strings are zero edits apart, so they give false.

Input: two lines, s and t. Either line may be empty.
Output: true or false.$$,
  $$class Solution:
    def isOneEditDistance(self, s: str, t: str) -> bool:
        """
        Return True if exactly one insertion, deletion or replacement
        turns s into t.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
s, t = lines[0], lines[1]
print(str(Solution().isOneEditDistance(s, t)).lower())
$$,
  $$[
    {"input": "ab\nacb\n", "expected": "true", "hidden": false},
    {"input": "\n\n", "expected": "false", "hidden": false},
    {"input": "abc\nabc\n", "expected": "false", "hidden": true},
    {"input": "\nA\n", "expected": "true", "hidden": true},
    {"input": "abcd\nabxd\n", "expected": "true", "hidden": true},
    {"input": "abcd\nabdc\n", "expected": "false", "hidden": true},
    {"input": "abc\na\n", "expected": "false", "hidden": true},
    {"input": "abcx\nabc\n", "expected": "true", "hidden": true},
    {"input": "teacher\ndetacher\n", "expected": "false", "hidden": true}
  ]$$::jsonb
);
