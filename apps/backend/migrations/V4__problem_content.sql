-- V4: Problem statements, starter code and test cases
--
-- Tests are JSON: [{"input": "...", "expected": "...", "hidden": false}, ...].
-- Programs read input on stdin and print the answer; a test passes when the
-- trimmed stdout equals the trimmed expected string.

ALTER TABLE problems
  ADD COLUMN statement TEXT,
  ADD COLUMN starter_code TEXT,
  ADD COLUMN tests JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE problems SET
  statement = $$Given a list of integers and a target, print the indices of the two numbers that add up to the target, smaller index first. Exactly one answer exists.

Input: line 1 is the space-separated list, line 2 is the target.
Output: the two indices separated by a space.$$,
  starter_code = $$import sys

lines = sys.stdin.read().split("\n")
nums = list(map(int, lines[0].split()))
target = int(lines[1])

# print the two indices separated by a space
$$,
  tests = $$[
    {"input": "2 7 11 15\n9\n", "expected": "0 1", "hidden": false},
    {"input": "3 2 4\n6\n", "expected": "1 2", "hidden": false},
    {"input": "3 3\n6\n", "expected": "0 1", "hidden": true},
    {"input": "-1 -2 -3 -4 -5\n-8\n", "expected": "2 4", "hidden": true},
    {"input": "1 5 9 2 8 3 7\n10\n", "expected": "0 2", "hidden": true}
  ]$$::jsonb
WHERE slug = 'two-sum';

UPDATE problems SET
  statement = $$Given a string of the characters ( ) [ ] { }, print true if every opening bracket is closed by the same kind of bracket in the correct order, otherwise false. The empty string is valid.

Input: one line containing the string, possibly empty.
Output: true or false.$$,
  starter_code = $$import sys

s = sys.stdin.readline().rstrip("\n")

# print true or false
$$,
  tests = $$[
    {"input": "()\n", "expected": "true", "hidden": false},
    {"input": "([)]\n", "expected": "false", "hidden": false},
    {"input": "()[]{}\n", "expected": "true", "hidden": true},
    {"input": "{[]}\n", "expected": "true", "hidden": true},
    {"input": "(\n", "expected": "false", "hidden": true},
    {"input": "\n", "expected": "true", "hidden": true}
  ]$$::jsonb
WHERE slug = 'valid-parentheses';

UPDATE problems SET
  statement = $$You are climbing a staircase with n steps. Each move climbs 1 or 2 steps. Print the number of distinct ways to reach the top.

Input: one line containing n, where 1 <= n <= 45.
Output: the number of ways.$$,
  starter_code = $$import sys

n = int(sys.stdin.readline())

# print the number of ways
$$,
  tests = $$[
    {"input": "2\n", "expected": "2", "hidden": false},
    {"input": "3\n", "expected": "3", "hidden": false},
    {"input": "1\n", "expected": "1", "hidden": true},
    {"input": "10\n", "expected": "89", "hidden": true},
    {"input": "45\n", "expected": "1836311903", "hidden": true}
  ]$$::jsonb
WHERE slug = 'climbing-stairs';

UPDATE problems SET
  statement = $$Given the price of a stock on each day, choose one day to buy and a later day to sell. Print the maximum profit. If no profit is possible, print 0.

Input: one line of space-separated prices.
Output: the maximum profit.$$,
  starter_code = $$import sys

prices = list(map(int, sys.stdin.readline().split()))

# print the maximum profit
$$,
  tests = $$[
    {"input": "7 1 5 3 6 4\n", "expected": "5", "hidden": false},
    {"input": "7 6 4 3 1\n", "expected": "0", "hidden": false},
    {"input": "1 2\n", "expected": "1", "hidden": true},
    {"input": "2 4 1\n", "expected": "2", "hidden": true},
    {"input": "3 3 5 0 0 3 1 4\n", "expected": "4", "hidden": true}
  ]$$::jsonb
WHERE slug = 'best-time-to-buy-sell-stock';

UPDATE problems SET
  statement = $$Given coin denominations and an amount, print the fewest coins needed to make the amount. You have unlimited coins of each denomination. If the amount cannot be made, print -1.

Input: line 1 is the space-separated denominations, line 2 is the amount.
Output: the minimum number of coins, or -1.$$,
  starter_code = $$import sys

lines = sys.stdin.read().split("\n")
coins = list(map(int, lines[0].split()))
amount = int(lines[1])

# print the minimum number of coins, or -1
$$,
  tests = $$[
    {"input": "1 2 5\n11\n", "expected": "3", "hidden": false},
    {"input": "2\n3\n", "expected": "-1", "hidden": false},
    {"input": "1\n0\n", "expected": "0", "hidden": true},
    {"input": "186 419 83 408\n6249\n", "expected": "20", "hidden": true},
    {"input": "2 5 10 1\n27\n", "expected": "4", "hidden": true}
  ]$$::jsonb
WHERE slug = 'coin-change';
