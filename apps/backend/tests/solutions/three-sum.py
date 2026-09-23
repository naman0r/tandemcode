from typing import List


class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        """
        Return every distinct triplet of values in nums that sums to
        zero, in any order. Each triplet appears once.
        """
        nums = sorted(nums)
        found = []
        for i in range(len(nums) - 2):
            if i and nums[i] == nums[i - 1]:
                continue
            lo, hi = i + 1, len(nums) - 1
            while lo < hi:
                total = nums[i] + nums[lo] + nums[hi]
                if total < 0:
                    lo += 1
                elif total > 0:
                    hi -= 1
                else:
                    found.append([nums[i], nums[lo], nums[hi]])
                    lo += 1
                    while lo < hi and nums[lo] == nums[lo - 1]:
                        lo += 1
                    hi -= 1
        return found


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

nums = list(map(int, sys.stdin.readline().split()))
for triplet in sorted(sorted(t) for t in Solution().threeSum(nums)):
    print(*triplet)
