from typing import List


class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        """
        Return the fewest coins that add up to amount, using as many of
        each denomination in coins as you like, or -1 if no combination
        does.
        """
        fewest = [0] + [amount + 1] * amount
        for total in range(1, amount + 1):
            for coin in coins:
                if coin <= total:
                    fewest[total] = min(fewest[total], fewest[total - coin] + 1)
        return fewest[amount] if fewest[amount] <= amount else -1


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
coins = list(map(int, lines[0].split()))
amount = int(lines[1])
print(Solution().coinChange(coins, amount))
