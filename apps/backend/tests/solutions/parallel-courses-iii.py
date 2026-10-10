from collections import deque
from typing import List


class Solution:
    def minimumTime(self, n: int, relations: List[List[int]], time: List[int]) -> int:
        """
        Course a must finish before course b starts for each [a, b] in
        relations, and course i takes time[i - 1] months. Return the
        fewest months to finish all n courses.
        """
        after = [[] for _ in range(n + 1)]
        waiting = [0] * (n + 1)
        for a, b in relations:
            after[a].append(b)
            waiting[b] += 1
        start = [0] * (n + 1)
        ready = deque(c for c in range(1, n + 1) if not waiting[c])
        done = 0
        while ready:
            c = ready.popleft()
            end = start[c] + time[c - 1]
            done = max(done, end)
            for d in after[c]:
                start[d] = max(start[d], end)
                waiting[d] -= 1
                if not waiting[d]:
                    ready.append(d)
        return done


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
n = int(lines[0])
time = list(map(int, lines[1].split()))
m = int(lines[2])
relations = [list(map(int, lines[3 + i].split())) for i in range(m)]
print(Solution().minimumTime(n, relations, time))
