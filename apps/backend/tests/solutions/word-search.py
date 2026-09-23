from typing import List


class Solution:
    def exist(self, board: List[List[str]], word: str) -> bool:
        """
        Return True if word can be traced through horizontally or
        vertically adjacent cells of board without using a cell twice.
        """
        rows, cols = len(board), len(board[0])

        def found(r, c, i):
            if i == len(word):
                return True
            if not (0 <= r < rows and 0 <= c < cols) or board[r][c] != word[i]:
                return False
            board[r][c] = "#"
            hit = any(found(r + dr, c + dc, i + 1) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            board[r][c] = word[i]
            return hit

        return any(found(r, c, 0) for r in range(rows) for c in range(cols))


# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
rows, cols = map(int, lines[0].split())
board = [list(lines[1 + r]) for r in range(rows)]
word = lines[1 + rows]
print(str(Solution().exist(board, word)).lower())
