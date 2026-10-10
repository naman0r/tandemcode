from collections import defaultdict
from typing import List


class Solution:
    def alertNames(self, keyName: List[str], keyTime: List[str]) -> List[str]:
        """
        keyName[i] used a key card at keyTime[i], an HH:MM time on one
        day. Return, sorted, everyone who used a card three or more
        times within one hour.
        """
        times = defaultdict(list)
        for name, t in zip(keyName, keyTime):
            times[name].append(int(t[:2]) * 60 + int(t[3:]))
        alerted = []
        for name, ts in times.items():
            ts.sort()
            if any(ts[i + 2] - ts[i] <= 60 for i in range(len(ts) - 2)):
                alerted.append(name)
        return sorted(alerted)


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
n = int(lines[0])
uses = [lines[1 + i].split() for i in range(n)]
keyName = [name for name, _ in uses]
keyTime = [time for _, time in uses]
print(" ".join(sorted(Solution().alertNames(keyName, keyTime))))
