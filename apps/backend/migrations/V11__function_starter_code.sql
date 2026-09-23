-- V11: Starter code is a function to fill in, not a script
--
-- Each problem's starter is now a Solution class with a documented method,
-- LeetCode style, followed by a short block that reads the input, calls it
-- and prints the result. Tests are unchanged: the block prints exactly what
-- the old scripts had to print. Statements say return instead of print.

UPDATE problems SET
  statement = $$Given a list of integers nums and an integer target, return the indices of the two numbers that add up to target, smaller index first. Exactly one answer exists.

Input: line 1 is nums, space-separated. Line 2 is target.
Output: the two indices separated by a space.$$,
  starter_code = $$from typing import List


class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        """
        Return the indices of the two numbers in nums that add up to
        target, smaller index first. Exactly one answer exists.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
nums = list(map(int, lines[0].split()))
target = int(lines[1])
print(*Solution().twoSum(nums, target))
$$
WHERE slug = 'two-sum';

UPDATE problems SET
  statement = $$Given a string s of the characters ( ) [ ] { }, return true if every opening bracket is closed by the same kind of bracket in the correct order, otherwise false. The empty string is valid.

Input: one line containing s, possibly empty.
Output: true or false.$$,
  starter_code = $$class Solution:
    def isValid(self, s: str) -> bool:
        """
        Return True if every opening bracket in s is closed by the same
        kind of bracket in the correct order. The empty string is valid.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

s = sys.stdin.readline().rstrip("\n")
print(str(Solution().isValid(s)).lower())
$$
WHERE slug = 'valid-parentheses';

UPDATE problems SET
  statement = $$Given the price of a stock on each day, choose one day to buy and a later day to sell. Return the maximum profit, or 0 if no profit is possible.

Input: one line containing prices, space-separated.
Output: the maximum profit.$$,
  starter_code = $$from typing import List


class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        """
        prices[i] is the price on day i. Return the most you can make by
        buying on one day and selling on a later day, or 0 if you cannot
        make a profit.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

prices = list(map(int, sys.stdin.readline().split()))
print(Solution().maxProfit(prices))
$$
WHERE slug = 'best-time-to-buy-sell-stock';

UPDATE problems SET
  statement = $$You are climbing a staircase with n steps. Each move climbs 1 or 2 steps. Return the number of distinct ways to reach the top.

Input: one line containing n, where 1 <= n <= 45.
Output: the number of ways.$$,
  starter_code = $$class Solution:
    def climbStairs(self, n: int) -> int:
        """
        Return the number of distinct ways to climb n steps when each move
        climbs 1 or 2 of them. 1 <= n <= 45.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

n = int(sys.stdin.readline())
print(Solution().climbStairs(n))
$$
WHERE slug = 'climbing-stairs';

UPDATE problems SET
  statement = $$Given the head of a singly linked list, reverse the list and return its new head.

Input: one line of space-separated integers, the list from head to tail. The line is empty for an empty list.
Output: the reversed values, separated by spaces.$$,
  starter_code = $$from typing import Optional


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        """
        Reverse the linked list that starts at head and return the new
        head. head is None for an empty list.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

head = None
for value in reversed(sys.stdin.readline().split()):
    head = ListNode(int(value), head)
node, values = Solution().reverseList(head), []
while node:
    values.append(node.val)
    node = node.next
print(*values)
$$
WHERE slug = 'reverse-linked-list';

UPDATE problems SET
  statement = $$Two non-negative integers are stored as linked lists of digits in reverse order, so 342 is stored as 2 -> 4 -> 3. Return their sum as a linked list in the same reversed form.

Input: two lines, l1 and l2, each a space-separated list of digits, least significant first.
Output: the digits of the sum, least significant first, separated by spaces.$$,
  starter_code = $$from typing import Optional


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


class Solution:
    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:
        """
        l1 and l2 hold the digits of two non-negative integers, one digit
        per node, least significant first. Return their sum as a list in
        the same form.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys


def to_list(line):
    head = None
    for digit in reversed(line.split()):
        head = ListNode(int(digit), head)
    return head


lines = sys.stdin.read().split("\n")
node, digits = Solution().addTwoNumbers(to_list(lines[0]), to_list(lines[1])), []
while node:
    digits.append(node.val)
    node = node.next
print(*digits)
$$
WHERE slug = 'add-two-numbers';

UPDATE problems SET
  statement = $$Given a string s, return the length of the longest substring with no repeated characters.

Input: one line containing s, possibly empty. Characters are ASCII letters, digits, and spaces.
Output: the length.$$,
  starter_code = $$class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        """
        Return the length of the longest substring of s in which no
        character appears twice. s may be empty.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

s = sys.stdin.readline().rstrip("\n")
print(Solution().lengthOfLongestSubstring(s))
$$
WHERE slug = 'longest-substring-no-repeat';

UPDATE problems SET
  statement = $$Each integer in height is the height of a vertical line at that index. Choose two lines that, with the x-axis, hold the most water. Return that area: the distance between the lines times the shorter height.

Input: one line containing height, space-separated, at least two values.
Output: the maximum area.$$,
  starter_code = $$from typing import List


class Solution:
    def maxArea(self, height: List[int]) -> int:
        """
        height[i] is the height of a vertical line at x = i. Return the
        most water two of the lines can hold: the distance between them
        times the shorter height.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

height = list(map(int, sys.stdin.readline().split()))
print(Solution().maxArea(height))
$$
WHERE slug = 'container-with-most-water';

UPDATE problems SET
  statement = $$Given a list of integers nums, return every distinct triplet of values that sums to zero. The triplets can be in any order.

Input: one line containing nums, space-separated.
Output: one triplet per line, each sorted ascending, with the lines sorted. Nothing if there is no such triplet.$$,
  starter_code = $$from typing import List


class Solution:
    def threeSum(self, nums: List[int]) -> List[List[int]]:
        """
        Return every distinct triplet of values in nums that sums to
        zero, in any order. Each triplet appears once.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

nums = list(map(int, sys.stdin.readline().split()))
for triplet in sorted(sorted(t) for t in Solution().threeSum(nums)):
    print(*triplet)
$$
WHERE slug = 'three-sum';

UPDATE problems SET
  statement = $$Given coin denominations coins and an amount, return the fewest coins needed to make the amount, with unlimited coins of each denomination. Return -1 if the amount cannot be made.

Input: line 1 is coins, space-separated. Line 2 is amount.
Output: the minimum number of coins, or -1.$$,
  starter_code = $$from typing import List


class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        """
        Return the fewest coins that add up to amount, using as many of
        each denomination in coins as you like, or -1 if no combination
        does.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
coins = list(map(int, lines[0].split()))
amount = int(lines[1])
print(Solution().coinChange(coins, amount))
$$
WHERE slug = 'coin-change';

UPDATE problems SET
  statement = $$Given a grid of letters board and a word, return true if the word can be traced through horizontally or vertically adjacent cells without reusing a cell, otherwise false.

Input: line 1 is the row and column counts. The next lines each hold one row of board with no spaces. The last line is word.
Output: true or false.$$,
  starter_code = $$from typing import List


class Solution:
    def exist(self, board: List[List[str]], word: str) -> bool:
        """
        Return True if word can be traced through horizontally or
        vertically adjacent cells of board without using a cell twice.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
rows, cols = map(int, lines[0].split())
board = [list(lines[1 + r]) for r in range(rows)]
word = lines[1 + rows]
print(str(Solution().exist(board, word)).lower())
$$
WHERE slug = 'word-search';

UPDATE problems SET
  statement = $$Given a list of intervals, merge all overlapping intervals and return the result. Intervals that touch at a point, such as [1, 4] and [4, 5], overlap.

Input: line 1 is the number of intervals n. Each of the next n lines is a start and an end.
Output: the merged intervals, one per line as start and end, sorted by start.$$,
  starter_code = $$from typing import List


class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        """
        Each interval is [start, end]. Merge every group of overlapping
        intervals and return the result, in any order. Intervals that
        touch at a point, such as [1, 4] and [4, 5], overlap.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
n = int(lines[0])
intervals = [list(map(int, lines[i + 1].split())) for i in range(n)]
for start, end in sorted(Solution().merge(intervals)):
    print(start, end)
$$
WHERE slug = 'merge-intervals';

UPDATE problems SET
  statement = $$Given two sorted lists nums1 and nums2, return the median of all their values together. Aim for logarithmic time, but any correct answer passes.

Input: two lines, nums1 and nums2, each sorted and space-separated. Either line may be empty, but not both.
Output: the median with one decimal place, for example 2.0 or 2.5.$$,
  starter_code = $$from typing import List


class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        """
        nums1 and nums2 are sorted, and at most one of them is empty.
        Return the median of all their values together.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
nums1 = list(map(int, lines[0].split()))
nums2 = list(map(int, lines[1].split()))
print(f"{Solution().findMedianSortedArrays(nums1, nums2):.1f}")
$$
WHERE slug = 'median-two-sorted-arrays';

UPDATE problems SET
  statement = $$Each integer in height is the height of a bar of width 1. Return how much water the bars trap after it rains.

Input: one line containing height, space-separated.
Output: the units of trapped water.$$,
  starter_code = $$from typing import List


class Solution:
    def trap(self, height: List[int]) -> int:
        """
        height[i] is the height of a bar of width 1. Return how many
        units of water the bars trap after it rains.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

height = list(map(int, sys.stdin.readline().split()))
print(Solution().trap(height))
$$
WHERE slug = 'trapping-rain-water';

UPDATE problems SET
  statement = $$Design a way to turn a binary tree into a string and back. serialize encodes a tree as a string in any format you choose; deserialize rebuilds the same tree from that string.

Input: the tree in level order, with null for a missing child. The line is empty for an empty tree.
Output: the rebuilt tree in the same level-order form, without trailing nulls.$$,
  starter_code = $$from typing import Optional


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right


class Codec:
    def serialize(self, root: Optional[TreeNode]) -> str:
        """
        Encode the tree rooted at root as a string, in any format you
        like. root is None for an empty tree.
        """

    def deserialize(self, data: str) -> Optional[TreeNode]:
        """
        Rebuild and return the tree from a string that serialize
        produced.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

from collections import deque


def build(tokens):
    if not tokens or tokens[0] == "null":
        return None
    root = TreeNode(int(tokens[0]))
    queue, i = deque([root]), 1
    while queue and i < len(tokens):
        node = queue.popleft()
        for side in ("left", "right"):
            if i < len(tokens) and tokens[i] != "null":
                child = TreeNode(int(tokens[i]))
                setattr(node, side, child)
                queue.append(child)
            i += 1
    return root


def level_order(root):
    tokens, queue = [], deque([root])
    while queue:
        node = queue.popleft()
        if node is None:
            tokens.append("null")
        else:
            tokens.append(str(node.val))
            queue.extend((node.left, node.right))
    while tokens and tokens[-1] == "null":
        tokens.pop()
    return " ".join(tokens)


# Two instances, so nothing can be kept on the object between the calls.
data = Codec().serialize(build(sys.stdin.readline().split()))
print(level_order(Codec().deserialize(data)))
$$
WHERE slug = 'serialize-deserialize-tree';
