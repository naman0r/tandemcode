class Solution:
    def climbStairs(self, n: int) -> int:
        """
        Return the number of distinct ways to climb n steps when each move
        climbs 1 or 2 of them. 1 <= n <= 45.
        """
        a, b = 1, 1
        for _ in range(n):
            a, b = b, a + b
        return a


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

n = int(sys.stdin.readline())
print(Solution().climbStairs(n))
