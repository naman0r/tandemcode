from typing import List


class Solution:
    def invalidTransactions(self, transactions: List[str]) -> List[str]:
        """
        Each transaction is "name,time,amount,city". Return, in any
        order, the ones over 1000 or within 60 minutes of the same name
        in a different city.
        """
        parsed = []
        for t in transactions:
            name, time, amount, city = t.split(",")
            parsed.append((name, int(time), int(amount), city))
        invalid = []
        for i, (name, time, amount, city) in enumerate(parsed):
            if amount > 1000 or any(
                other == name and other_city != city and abs(other_time - time) <= 60
                for other, other_time, _, other_city in parsed
            ):
                invalid.append(transactions[i])
        return invalid


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
n = int(lines[0])
transactions = lines[1:1 + n]
for transaction in sorted(Solution().invalidTransactions(transactions)):
    print(transaction)
