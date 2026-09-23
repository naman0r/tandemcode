from typing import Optional


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
        out = []

        def walk(node):
            if node is None:
                out.append("#")
                return
            out.append(str(node.val))
            walk(node.left)
            walk(node.right)

        walk(root)
        return ",".join(out)

    def deserialize(self, data: str) -> Optional[TreeNode]:
        """
        Rebuild and return the tree from a string that serialize
        produced.
        """
        values = iter(data.split(","))

        def build():
            value = next(values)
            if value == "#":
                return None
            node = TreeNode(int(value))
            node.left = build()
            node.right = build()
            return node

        return build()


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
