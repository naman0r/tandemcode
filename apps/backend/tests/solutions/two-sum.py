from typing import List


class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        """
        Return the indices of the two numbers in nums that add up to
        target, smaller index first. Exactly one answer exists.
        """
        seen = {}
        for i, n in enumerate(nums):
            if target - n in seen:
                return [seen[target - n], i]
            seen[n] = i


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
nums = list(map(int, lines[0].split()))
target = int(lines[1])
print(*Solution().twoSum(nums, target))
