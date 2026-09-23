from typing import List


class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        """
        nums1 and nums2 are sorted, and at most one of them is empty.
        Return the median of all their values together.
        """
        merged = sorted(nums1 + nums2)
        mid = len(merged) // 2
        if len(merged) % 2:
            return float(merged[mid])
        return (merged[mid - 1] + merged[mid]) / 2


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
nums1 = list(map(int, lines[0].split()))
nums2 = list(map(int, lines[1].split()))
print(f"{Solution().findMedianSortedArrays(nums1, nums2):.1f}")
