from typing import List


class Solution:
    def expand(self, s: str) -> List[str]:
        """
        Each {x,y,...} group in s stands for one of its letters. Return
        every word s can stand for, sorted.
        """
        words = [""]
        i = 0
        while i < len(s):
            if s[i] == "{":
                end = s.index("}", i)
                options = sorted(s[i + 1:end].split(","))
                i = end + 1
            else:
                options = [s[i]]
                i += 1
            words = [word + option for word in words for option in options]
        return words


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

s = sys.stdin.readline().strip()
print(" ".join(sorted(Solution().expand(s))))
