from typing import List


class Solution:
    def nextPermutation(self, nums: List[int]) -> None:
        """
        Rearrange nums in place into the next arrangement in dictionary
        order, or into ascending order if it is the last one. Return
        nothing.
        """
        i = len(nums) - 2
        while i >= 0 and nums[i] >= nums[i + 1]:
            i -= 1
        if i >= 0:
            j = len(nums) - 1
            while nums[j] <= nums[i]:
                j -= 1
            nums[i], nums[j] = nums[j], nums[i]
        nums[i + 1:] = reversed(nums[i + 1:])


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

nums = list(map(int, sys.stdin.readline().split()))
Solution().nextPermutation(nums)
print(*nums)
