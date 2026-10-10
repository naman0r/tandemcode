from typing import List


class Bank:
    def __init__(self, balance: List[int]):
        """
        Account i, numbered from 1, starts with balance[i - 1].
        """
        self.balance = balance

    def transfer(self, account1: int, account2: int, money: int) -> bool:
        """
        Move money from account1 to account2. Return False, changing
        nothing, if either account does not exist or account1 holds
        less than money.
        """
        if not (self._exists(account2) and self.withdraw(account1, money)):
            return False
        return self.deposit(account2, money)

    def deposit(self, account: int, money: int) -> bool:
        """
        Add money to account. Return False if it does not exist.
        """
        if not self._exists(account):
            return False
        self.balance[account - 1] += money
        return True

    def withdraw(self, account: int, money: int) -> bool:
        """
        Take money out of account. Return False, changing nothing, if it
        does not exist or holds less than money.
        """
        if not self._exists(account) or self.balance[account - 1] < money:
            return False
        self.balance[account - 1] -= money
        return True

    def _exists(self, account: int) -> bool:
        return 1 <= account <= len(self.balance)


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
bank = Bank(list(map(int, lines[0].split())))
q = int(lines[1])
for line in lines[2:2 + q]:
    operation, *args = line.split()
    print(str(getattr(bank, operation)(*map(int, args))).lower())
