-- V20: Add the Number of Black Blocks problem

INSERT INTO problems (slug, title, difficulty, time_limit_ms, mem_limit_mb, statement, starter_code, tests)
VALUES (
  'number-of-black-blocks',
  'Number of Black Blocks',
  'medium',
  2000,
  256,
  $$A grid has m rows and n columns. Every cell is white except the ones listed in coordinates, each given as [x, y] for row x and column y, which are black. A block is any 2 by 2 square of cells inside the grid. Return a list of five numbers where the number at index i counts the blocks that contain exactly i black cells.

Input: the first line is m, n and the number of black cells. Each black cell follows on its own line as x y.
Output: the five counts, space-separated.$$,
  $$from collections import Counter
from typing import List


class Solution:
    def countBlackBlocks(self, m: int, n: int, coordinates: List[List[int]]) -> List[int]:
        """
        coordinates lists the black cells of an m by n grid, with no
        repeats. Return how many 2 by 2 blocks hold 0, 1, 2, 3 and 4
        black cells.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
m, n, k = map(int, lines[0].split())
coordinates = [list(map(int, lines[1 + i].split())) for i in range(k)]
print(*Solution().countBlackBlocks(m, n, coordinates))
$$,
  $$[
    {"input": "3 3 1\n0 0\n", "expected": "3 1 0 0 0", "hidden": false},
    {"input": "3 3 3\n0 0\n1 1\n0 2\n", "expected": "0 2 2 0 0", "hidden": false},
    {"input": "2 2 0\n", "expected": "1 0 0 0 0", "hidden": true},
    {"input": "2 2 4\n0 0\n0 1\n1 0\n1 1\n", "expected": "0 0 0 0 1", "hidden": true},
    {"input": "100000 100000 0\n", "expected": "9999800001 0 0 0 0", "hidden": true},
    {"input": "4 5 6\n0 0\n1 1\n2 2\n3 3\n1 0\n0 4\n", "expected": "3 5 3 1 0", "hidden": true},
    {"input": "3 4 5\n0 0\n0 1\n1 0\n1 1\n2 3\n", "expected": "1 2 2 0 1", "hidden": true}
  ]$$::jsonb
);
