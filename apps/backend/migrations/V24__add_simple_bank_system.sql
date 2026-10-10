-- V24: Add the Simple Bank System problem

INSERT INTO problems (slug, title, difficulty, time_limit_ms, mem_limit_mb, statement, starter_code, tests)
VALUES (
  'simple-bank-system',
  'Simple Bank System',
  'medium',
  2000,
  256,
  $$Write a Bank class for accounts numbered 1 to n, where balance[i - 1] is the starting balance of account i. It supports three operations, each of which returns true if it went through and false if it did not:

- transfer(account1, account2, money) moves money from account1 to account2.
- deposit(account, money) adds money to account.
- withdraw(account, money) takes money out of account.

An operation fails, and changes nothing, if it names an account that does not exist or would take out more than an account holds.

Input: the first line is balance, space-separated. The second line is the number of operations, then one per line as the operation's name and its arguments.
Output: true or false for each operation, one per line.$$,
  $$from typing import List


class Bank:
    def __init__(self, balance: List[int]):
        """
        Account i, numbered from 1, starts with balance[i - 1].
        """

    def transfer(self, account1: int, account2: int, money: int) -> bool:
        """
        Move money from account1 to account2. Return False, changing
        nothing, if either account does not exist or account1 holds
        less than money.
        """

    def deposit(self, account: int, money: int) -> bool:
        """
        Add money to account. Return False if it does not exist.
        """

    def withdraw(self, account: int, money: int) -> bool:
        """
        Take money out of account. Return False, changing nothing, if it
        does not exist or holds less than money.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
bank = Bank(list(map(int, lines[0].split())))
q = int(lines[1])
for line in lines[2:2 + q]:
    operation, *args = line.split()
    print(str(getattr(bank, operation)(*map(int, args))).lower())
$$,
  $$[
    {"input": "10 100 20 50 30\n5\nwithdraw 3 10\ntransfer 5 1 20\ndeposit 5 20\ntransfer 3 4 15\nwithdraw 10 50\n", "expected": "true\ntrue\ntrue\nfalse\nfalse", "hidden": false},
    {"input": "0\n3\ndeposit 1 5\nwithdraw 1 5\nwithdraw 1 1\n", "expected": "true\ntrue\nfalse", "hidden": false},
    {"input": "5 5\n3\ntransfer 1 3 1\nwithdraw 1 5\nwithdraw 1 1\n", "expected": "false\ntrue\nfalse", "hidden": true},
    {"input": "7\n3\ntransfer 1 1 7\ntransfer 1 1 8\nwithdraw 1 7\n", "expected": "true\nfalse\ntrue", "hidden": true},
    {"input": "1 2 3\n4\ndeposit 0 5\ndeposit 4 5\ntransfer 0 1 0\nwithdraw 2 2\n", "expected": "false\nfalse\nfalse\ntrue", "hidden": true},
    {"input": "100 0\n6\ntransfer 1 2 60\ntransfer 1 2 60\ntransfer 2 1 60\nwithdraw 1 100\nwithdraw 2 1\ndeposit 2 1\n", "expected": "true\nfalse\ntrue\ntrue\nfalse\ntrue", "hidden": true}
  ]$$::jsonb
);
