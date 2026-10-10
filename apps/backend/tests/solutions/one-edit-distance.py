class Solution:
    def isOneEditDistance(self, s: str, t: str) -> bool:
        """
        Return True if exactly one insertion, deletion or replacement
        turns s into t.
        """
        if len(s) > len(t):
            s, t = t, s
        if len(t) - len(s) > 1:
            return False
        for i in range(len(s)):
            if s[i] != t[i]:
                return s[i + 1:] == t[i + 1:] if len(s) == len(t) else s[i:] == t[i + 1:]
        return len(t) == len(s) + 1


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
s, t = lines[0], lines[1]
print(str(Solution().isOneEditDistance(s, t)).lower())
