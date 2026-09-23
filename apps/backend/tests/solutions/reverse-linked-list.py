from typing import Optional


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
        previous = None
        while head:
            following = head.next
            head.next = previous
            previous, head = head, following
        return previous


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
