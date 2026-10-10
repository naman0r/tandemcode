-- V18: Add the Cheapest Flights Within K Stops problem

INSERT INTO problems (slug, title, difficulty, time_limit_ms, mem_limit_mb, statement, starter_code, tests)
VALUES (
  'cheapest-flights-within-k-stops',
  'Cheapest Flights Within K Stops',
  'medium',
  2000,
  256,
  $$There are n cities numbered 0 to n - 1. Each flight [from, to, price] goes one way from city from to city to and costs price. Return the cheapest way to get from src to dst with at most k stops in between, or -1 if there is no such route.

Input: the first line is n and the number of flights. Each flight follows on its own line as from to price. The last line is src dst k.
Output: the cheapest price, or -1.$$,
  $$from typing import List


class Solution:
    def findCheapestPrice(self, n: int, flights: List[List[int]], src: int, dst: int, k: int) -> int:
        """
        flights[i] is [from, to, price] for a one-way flight. Return the
        cheapest price from src to dst with at most k stops, or -1.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
n, m = map(int, lines[0].split())
flights = [list(map(int, lines[1 + i].split())) for i in range(m)]
src, dst, k = map(int, lines[1 + m].split())
print(Solution().findCheapestPrice(n, flights, src, dst, k))
$$,
  $$[
    {"input": "4 5\n0 1 100\n1 2 100\n2 0 100\n1 3 600\n2 3 200\n0 3 1\n", "expected": "700", "hidden": false},
    {"input": "3 3\n0 1 100\n1 2 100\n0 2 500\n0 2 1\n", "expected": "200", "hidden": false},
    {"input": "3 3\n0 1 100\n1 2 100\n0 2 500\n0 2 0\n", "expected": "500", "hidden": true},
    {"input": "3 1\n0 1 100\n0 2 1\n", "expected": "-1", "hidden": true},
    {"input": "2 1\n1 0 50\n0 1 3\n", "expected": "-1", "hidden": true},
    {"input": "5 6\n0 1 5\n1 2 5\n0 3 2\n3 1 2\n1 4 1\n4 2 1\n0 2 2\n", "expected": "7", "hidden": true},
    {"input": "5 6\n0 1 5\n1 2 5\n0 3 2\n3 1 2\n1 4 1\n4 2 1\n0 2 1\n", "expected": "10", "hidden": true},
    {"input": "4 4\n0 1 1\n0 2 5\n1 2 1\n2 3 1\n0 3 1\n", "expected": "6", "hidden": true}
  ]$$::jsonb
);
