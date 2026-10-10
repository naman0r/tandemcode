from typing import List


class Solution:
    def calculateTax(self, brackets: List[List[int]], income: int) -> float:
        """
        brackets[i] is [upper, percent], sorted by upper. Return the tax
        owed on income.
        """
        tax, lower = 0, 0
        for upper, percent in brackets:
            tax += max(0, min(income, upper) - lower) * percent
            lower = upper
        return tax / 100


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
n = int(lines[0])
brackets = [list(map(int, lines[1 + i].split())) for i in range(n)]
income = int(lines[1 + n])
print(f"{Solution().calculateTax(brackets, income):.2f}")
