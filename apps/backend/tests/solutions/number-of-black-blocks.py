from collections import Counter
from typing import List


class Solution:
    def countBlackBlocks(self, m: int, n: int, coordinates: List[List[int]]) -> List[int]:
        """
        coordinates lists the black cells of an m by n grid, with no
        repeats. Return how many 2 by 2 blocks hold 0, 1, 2, 3 and 4
        black cells.
        """
        blocks = Counter()
        for x, y in coordinates:
            for bx in (x - 1, x):
                for by in (y - 1, y):
                    if 0 <= bx < m - 1 and 0 <= by < n - 1:
                        blocks[bx, by] += 1
        counts = [0] * 5
        for black in blocks.values():
            counts[black] += 1
        counts[0] = (m - 1) * (n - 1) - len(blocks)
        return counts


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
m, n, k = map(int, lines[0].split())
coordinates = [list(map(int, lines[1 + i].split())) for i in range(k)]
print(*Solution().countBlackBlocks(m, n, coordinates))
