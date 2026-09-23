from typing import List


class Solution:
    def trap(self, height: List[int]) -> int:
        """
        height[i] is the height of a bar of width 1. Return how many
        units of water the bars trap after it rains.
        """
        left, right = 0, len(height) - 1
        left_max = right_max = water = 0
        while left < right:
            if height[left] < height[right]:
                left_max = max(left_max, height[left])
                water += left_max - height[left]
                left += 1
            else:
                right_max = max(right_max, height[right])
                water += right_max - height[right]
                right -= 1
        return water


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

height = list(map(int, sys.stdin.readline().split()))
print(Solution().trap(height))
