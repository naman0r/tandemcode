-- V22: Add the Brace Expansion problem

INSERT INTO problems (slug, title, difficulty, time_limit_ms, mem_limit_mb, statement, starter_code, tests)
VALUES (
  'brace-expansion',
  'Brace Expansion',
  'medium',
  2000,
  256,
  $$s is made of lowercase letters and groups of options in braces, such as {a,b}. A letter outside braces is always used, and a group stands for exactly one of its options. Braces are never nested, and the options in a group are distinct single letters. Return every word s can stand for, sorted alphabetically.

Input: one line containing s.
Output: the words sorted alphabetically and separated by spaces.$$,
  $$from typing import List


class Solution:
    def expand(self, s: str) -> List[str]:
        """
        Each {x,y,...} group in s stands for one of its letters. Return
        every word s can stand for, sorted.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

s = sys.stdin.readline().strip()
print(" ".join(sorted(Solution().expand(s))))
$$,
  $$[
    {"input": "{a,b}c{d,e}f\n", "expected": "acdf acef bcdf bcef", "hidden": false},
    {"input": "abcd\n", "expected": "abcd", "hidden": false},
    {"input": "{z}\n", "expected": "z", "hidden": true},
    {"input": "{c,a,b}\n", "expected": "a b c", "hidden": true},
    {"input": "x{b,a}\n", "expected": "xa xb", "hidden": true},
    {"input": "{a,b}{a,b}{a,b}\n", "expected": "aaa aab aba abb baa bab bba bbb", "hidden": true},
    {"input": "k{u,o}{t,s,r}y\n", "expected": "kory kosy koty kury kusy kuty", "hidden": true}
  ]$$::jsonb
);
