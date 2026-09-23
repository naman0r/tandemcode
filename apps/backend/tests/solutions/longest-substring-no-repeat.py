class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        """
        Return the length of the longest substring of s in which no
        character appears twice. s may be empty.
        """
        start, best, last_seen = 0, 0, {}
        for i, ch in enumerate(s):
            if last_seen.get(ch, -1) >= start:
                start = last_seen[ch] + 1
            last_seen[ch] = i
            best = max(best, i - start + 1)
        return best


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

s = sys.stdin.readline().rstrip("\n")
print(Solution().lengthOfLongestSubstring(s))
