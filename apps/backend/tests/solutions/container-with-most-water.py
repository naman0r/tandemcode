from typing import List


class Solution:
    def maxArea(self, height: List[int]) -> int:
        """
        height[i] is the height of a vertical line at x = i. Return the
        most water two of the lines can hold: the distance between them
        times the shorter height.
        """
        left, right, best = 0, len(height) - 1, 0
        while left < right:
            best = max(best, (right - left) * min(height[left], height[right]))
            if height[left] < height[right]:
                left += 1
            else:
                right -= 1
        return best


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

height = list(map(int, sys.stdin.readline().split()))
print(Solution().maxArea(height))
