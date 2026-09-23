from typing import List


class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        """
        Each interval is [start, end]. Merge every group of overlapping
        intervals and return the result, in any order. Intervals that
        touch at a point, such as [1, 4] and [4, 5], overlap.
        """
        merged = []
        for start, end in sorted(intervals):
            if merged and start <= merged[-1][1]:
                merged[-1][1] = max(merged[-1][1], end)
            else:
                merged.append([start, end])
        return merged


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
n = int(lines[0])
intervals = [list(map(int, lines[i + 1].split())) for i in range(n)]
for start, end in sorted(Solution().merge(intervals)):
    print(start, end)
