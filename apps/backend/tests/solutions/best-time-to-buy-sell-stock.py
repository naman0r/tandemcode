from typing import List


class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        """
        prices[i] is the price on day i. Return the most you can make by
        buying on one day and selling on a later day, or 0 if you cannot
        make a profit.
        """
        best, low = 0, float("inf")
        for price in prices:
            low = min(low, price)
            best = max(best, price - low)
        return best


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

prices = list(map(int, sys.stdin.readline().split()))
print(Solution().maxProfit(prices))
