-- V23: Add the Invalid Transactions problem

INSERT INTO problems (slug, title, difficulty, time_limit_ms, mem_limit_mb, statement, starter_code, tests)
VALUES (
  'invalid-transactions',
  'Invalid Transactions',
  'medium',
  2000,
  256,
  $$Each string in transactions is name,time,amount,city, with time in minutes. A transaction is invalid if its amount is over 1000, or if the same name has another transaction in a different city at most 60 minutes before or after it. Return every invalid transaction. If two identical strings are both invalid, return both.

Input: the first line is the number of transactions, then one transaction per line.
Output: the invalid transactions sorted alphabetically, one per line, or an empty line if there are none.$$,
  $$from typing import List


class Solution:
    def invalidTransactions(self, transactions: List[str]) -> List[str]:
        """
        Each transaction is "name,time,amount,city". Return, in any
        order, the ones over 1000 or within 60 minutes of the same name
        in a different city.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
n = int(lines[0])
transactions = lines[1:1 + n]
for transaction in sorted(Solution().invalidTransactions(transactions)):
    print(transaction)
$$,
  $$[
    {"input": "2\nalice,20,800,mtv\nalice,50,100,beijing\n", "expected": "alice,20,800,mtv\nalice,50,100,beijing", "hidden": false},
    {"input": "2\nalice,20,800,mtv\nalice,50,1200,mtv\n", "expected": "alice,50,1200,mtv", "hidden": false},
    {"input": "2\nalice,20,800,mtv\nbob,50,1200,mtv\n", "expected": "bob,50,1200,mtv", "hidden": true},
    {"input": "1\nann,0,1000,nyc\n", "expected": "", "hidden": true},
    {"input": "2\nann,0,10,nyc\nann,61,10,sf\n", "expected": "", "hidden": true},
    {"input": "2\nann,0,10,nyc\nann,60,10,sf\n", "expected": "ann,0,10,nyc\nann,60,10,sf", "hidden": true},
    {"input": "3\nbob,100,5,la\nbob,100,5,la\nbob,130,5,sf\n", "expected": "bob,100,5,la\nbob,100,5,la\nbob,130,5,sf", "hidden": true},
    {"input": "5\nxi,10,2000,rome\nyu,15,30,rome\nyu,500,30,oslo\nxi,70,40,oslo\nyu,540,1001,oslo\n", "expected": "xi,10,2000,rome\nxi,70,40,oslo\nyu,540,1001,oslo", "hidden": true}
  ]$$::jsonb
);
