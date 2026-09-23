class Solution:
    def isValid(self, s: str) -> bool:
        """
        Return True if every opening bracket in s is closed by the same
        kind of bracket in the correct order. The empty string is valid.
        """
        pairs = {")": "(", "]": "[", "}": "{"}
        stack = []
        for ch in s:
            if ch in pairs:
                if not stack or stack.pop() != pairs[ch]:
                    return False
            else:
                stack.append(ch)
        return not stack


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

s = sys.stdin.readline().rstrip("\n")
print(str(Solution().isValid(s)).lower())
