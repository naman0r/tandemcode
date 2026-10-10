from typing import List


class Solution:
    def findCheapestPrice(self, n: int, flights: List[List[int]], src: int, dst: int, k: int) -> int:
        """
        flights[i] is [from, to, price] for a one-way flight. Return the
        cheapest price from src to dst with at most k stops, or -1.
        """
        cost = [float("inf")] * n
        cost[src] = 0
        for _ in range(k + 1):
            nxt = cost[:]
            for a, b, price in flights:
                if cost[a] + price < nxt[b]:
                    nxt[b] = cost[a] + price
            cost = nxt
        return -1 if cost[dst] == float("inf") else cost[dst]


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
n, m = map(int, lines[0].split())
flights = [list(map(int, lines[1 + i].split())) for i in range(m)]
src, dst, k = map(int, lines[1 + m].split())
print(Solution().findCheapestPrice(n, flights, src, dst, k))
