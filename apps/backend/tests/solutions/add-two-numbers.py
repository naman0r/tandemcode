from typing import Optional


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
        head = tail = ListNode()
        carry = 0
        while l1 or l2 or carry:
            total = carry + (l1.val if l1 else 0) + (l2.val if l2 else 0)
            carry, digit = divmod(total, 10)
            tail.next = ListNode(digit)
            tail = tail.next
            l1 = l1.next if l1 else None
            l2 = l2.next if l2 else None
        return head.next


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
