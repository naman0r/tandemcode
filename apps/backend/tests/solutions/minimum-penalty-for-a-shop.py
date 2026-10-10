class Solution:
    def bestClosingTime(self, customers: str) -> int:
        """
        customers[i] is Y if anyone came in hour i and N otherwise.
        Return the earliest hour to close that gives the smallest
        penalty.
        """
        best_hour, best, score = 0, 0, 0
        for hour, c in enumerate(customers, 1):
            score += 1 if c == "Y" else -1
            if score > best:
                best_hour, best = hour, score
        return best_hour


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

customers = sys.stdin.readline().strip()
print(Solution().bestClosingTime(customers))
