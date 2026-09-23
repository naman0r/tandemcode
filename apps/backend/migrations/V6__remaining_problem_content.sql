-- V6: Content and tests for the remaining seeded problems

UPDATE problems SET
  statement = $$A singly linked list is given as its values from head to tail. Print the values after reversing the list, head to tail.

Input: one line of space-separated integers. The line is empty for an empty list.
Output: the reversed values separated by spaces, or an empty line.$$,
  starter_code = $$import sys

values = sys.stdin.readline().split()

# print the values in reverse order, separated by spaces
$$,
  tests = $$[
  {
    "input": "1 2 3 4 5\n",
    "expected": "5 4 3 2 1",
    "hidden": false
  },
  {
    "input": "1 2\n",
    "expected": "2 1",
    "hidden": false
  },
  {
    "input": "\n",
    "expected": "",
    "hidden": true
  },
  {
    "input": "7\n",
    "expected": "7",
    "hidden": true
  },
  {
    "input": "-3 0 3 -3\n",
    "expected": "-3 3 0 -3",
    "hidden": true
  }
]$$::jsonb
WHERE slug = 'reverse-linked-list';

UPDATE problems SET
  statement = $$Two non-negative integers are stored as linked lists of digits in reverse order, so 342 is stored as 2 -> 4 -> 3. Print the digits of their sum in the same reversed form.

Input: two lines, each a space-separated list of digits, least significant first.
Output: the digits of the sum, least significant first, separated by spaces.$$,
  starter_code = $$import sys

lines = sys.stdin.read().split("\n")
a = list(map(int, lines[0].split()))
b = list(map(int, lines[1].split()))

# print the digits of the sum, least significant first
$$,
  tests = $$[
  {
    "input": "2 4 3\n5 6 4\n",
    "expected": "7 0 8",
    "hidden": false
  },
  {
    "input": "0\n0\n",
    "expected": "0",
    "hidden": false
  },
  {
    "input": "9 9 9 9 9 9 9\n9 9 9 9\n",
    "expected": "8 9 9 9 0 0 0 1",
    "hidden": true
  },
  {
    "input": "5\n5\n",
    "expected": "0 1",
    "hidden": true
  },
  {
    "input": "1 8\n0\n",
    "expected": "1 8",
    "hidden": true
  }
]$$::jsonb
WHERE slug = 'add-two-numbers';

UPDATE problems SET
  statement = $$Given a string, print the length of the longest substring with no repeated characters.

Input: one line containing the string, possibly empty. Characters are ASCII letters, digits, and spaces.
Output: the length.$$,
  starter_code = $$import sys

s = sys.stdin.readline().rstrip("\n")

# print the length of the longest substring without repeating characters
$$,
  tests = $$[
  {
    "input": "abcabcbb\n",
    "expected": "3",
    "hidden": false
  },
  {
    "input": "bbbbb\n",
    "expected": "1",
    "hidden": false
  },
  {
    "input": "pwwkew\n",
    "expected": "3",
    "hidden": true
  },
  {
    "input": "\n",
    "expected": "0",
    "hidden": true
  },
  {
    "input": "dvdf\n",
    "expected": "3",
    "hidden": true
  },
  {
    "input": "abba\n",
    "expected": "2",
    "hidden": true
  }
]$$::jsonb
WHERE slug = 'longest-substring-no-repeat';

UPDATE problems SET
  statement = $$Each integer is the height of a vertical line at that index. Choose two lines that, with the x-axis, hold the most water. Print that area: the distance between the lines times the shorter height.

Input: one line of space-separated non-negative integers, at least two of them.
Output: the maximum area.$$,
  starter_code = $$import sys

height = list(map(int, sys.stdin.readline().split()))

# print the maximum area
$$,
  tests = $$[
  {
    "input": "1 8 6 2 5 4 8 3 7\n",
    "expected": "49",
    "hidden": false
  },
  {
    "input": "1 1\n",
    "expected": "1",
    "hidden": false
  },
  {
    "input": "4 3 2 1 4\n",
    "expected": "16",
    "hidden": true
  },
  {
    "input": "1 2 1\n",
    "expected": "2",
    "hidden": true
  },
  {
    "input": "0 0 0 5 0 0 5\n",
    "expected": "15",
    "hidden": true
  }
]$$::jsonb
WHERE slug = 'container-with-most-water';

UPDATE problems SET
  statement = $$Find every distinct triplet of values in the list that sums to zero.

Input: one line of space-separated integers.
Output: one triplet per line, each sorted ascending and separated by spaces, with the lines in ascending lexicographic order. Print nothing if there is no such triplet.$$,
  starter_code = $$import sys

nums = list(map(int, sys.stdin.readline().split()))

# print each zero-sum triplet on its own line, sorted
$$,
  tests = $$[
  {
    "input": "-1 0 1 2 -1 -4\n",
    "expected": "-1 -1 2\n-1 0 1",
    "hidden": false
  },
  {
    "input": "0 1 1\n",
    "expected": "",
    "hidden": false
  },
  {
    "input": "0 0 0\n",
    "expected": "0 0 0",
    "hidden": true
  },
  {
    "input": "0 0 0 0\n",
    "expected": "0 0 0",
    "hidden": true
  },
  {
    "input": "-2 0 1 1 2\n",
    "expected": "-2 0 2\n-2 1 1",
    "hidden": true
  },
  {
    "input": "3 -2 1 0\n",
    "expected": "",
    "hidden": true
  }
]$$::jsonb
WHERE slug = 'three-sum';

UPDATE problems SET
  statement = $$A grid of letters and a word are given. Print true if the word can be traced through horizontally or vertically adjacent cells without reusing a cell, otherwise false.

Input: line 1 is the row and column counts. The next rows lines each hold one row of letters with no spaces. The last line is the word.
Output: true or false.$$,
  starter_code = $$import sys

lines = sys.stdin.read().split("\n")
rows, cols = map(int, lines[0].split())
board = [list(lines[1 + r]) for r in range(rows)]
word = lines[1 + rows]

# print true or false
$$,
  tests = $$[
  {
    "input": "3 4\nABCE\nSFCS\nADEE\nABCCED\n",
    "expected": "true",
    "hidden": false
  },
  {
    "input": "3 4\nABCE\nSFCS\nADEE\nABCB\n",
    "expected": "false",
    "hidden": false
  },
  {
    "input": "3 4\nABCE\nSFCS\nADEE\nSEE\n",
    "expected": "true",
    "hidden": true
  },
  {
    "input": "1 1\nA\nA\n",
    "expected": "true",
    "hidden": true
  },
  {
    "input": "2 2\nAB\nCD\nABDC\n",
    "expected": "true",
    "hidden": true
  },
  {
    "input": "2 2\nAA\nAA\nAAAAA\n",
    "expected": "false",
    "hidden": true
  }
]$$::jsonb
WHERE slug = 'word-search';

UPDATE problems SET
  statement = $$Merge all overlapping intervals. Intervals that touch at a point, such as 1 4 and 4 5, overlap.

Input: line 1 is the number of intervals n. Each of the next n lines is a start and an end.
Output: the merged intervals, one per line as start and end, sorted by start.$$,
  starter_code = $$import sys

lines = sys.stdin.read().split("\n")
n = int(lines[0])
intervals = [tuple(map(int, lines[i + 1].split())) for i in range(n)]

# print the merged intervals, one per line
$$,
  tests = $$[
  {
    "input": "4\n1 3\n2 6\n8 10\n15 18\n",
    "expected": "1 6\n8 10\n15 18",
    "hidden": false
  },
  {
    "input": "2\n1 4\n4 5\n",
    "expected": "1 5",
    "hidden": false
  },
  {
    "input": "1\n1 4\n",
    "expected": "1 4",
    "hidden": true
  },
  {
    "input": "3\n1 4\n0 4\n5 6\n",
    "expected": "0 4\n5 6",
    "hidden": true
  },
  {
    "input": "3\n1 10\n2 3\n4 5\n",
    "expected": "1 10",
    "hidden": true
  }
]$$::jsonb
WHERE slug = 'merge-intervals';

UPDATE problems SET
  statement = $$Two sorted lists are given. Print the median of all their values together. Aim for logarithmic time, but any correct answer passes.

Input: two lines, each a sorted list of space-separated integers. Either line may be empty, but not both.
Output: the median with exactly one decimal place, for example 2.0 or 2.5.$$,
  starter_code = $$import sys

lines = sys.stdin.read().split("\n")
a = list(map(int, lines[0].split()))
b = list(map(int, lines[1].split()))

# print the median with one decimal place, e.g. print(f"{m:.1f}")
$$,
  tests = $$[
  {
    "input": "1 3\n2\n",
    "expected": "2.0",
    "hidden": false
  },
  {
    "input": "1 2\n3 4\n",
    "expected": "2.5",
    "hidden": false
  },
  {
    "input": "\n1\n",
    "expected": "1.0",
    "hidden": true
  },
  {
    "input": "2\n\n",
    "expected": "2.0",
    "hidden": true
  },
  {
    "input": "1 1 1\n1 1\n",
    "expected": "1.0",
    "hidden": true
  },
  {
    "input": "-5 3 6 12 15\n-12 -10 -6 -3 4 10\n",
    "expected": "3.0",
    "hidden": true
  }
]$$::jsonb
WHERE slug = 'median-two-sorted-arrays';

UPDATE problems SET
  statement = $$Each integer is the height of a bar of width 1. Print how much water the bars trap after it rains.

Input: one line of space-separated non-negative integers.
Output: the units of trapped water.$$,
  starter_code = $$import sys

height = list(map(int, sys.stdin.readline().split()))

# print the trapped water
$$,
  tests = $$[
  {
    "input": "0 1 0 2 1 0 1 3 2 1 2 1\n",
    "expected": "6",
    "hidden": false
  },
  {
    "input": "4 2 0 3 2 5\n",
    "expected": "9",
    "hidden": false
  },
  {
    "input": "\n",
    "expected": "0",
    "hidden": true
  },
  {
    "input": "3\n",
    "expected": "0",
    "hidden": true
  },
  {
    "input": "5 4 3 2 1\n",
    "expected": "0",
    "hidden": true
  },
  {
    "input": "2 0 2\n",
    "expected": "2",
    "hidden": true
  }
]$$::jsonb
WHERE slug = 'trapping-rain-water';

UPDATE problems SET
  statement = $$A binary tree is given in level order, with null for a missing child, the way it would be serialized. Trailing nulls may or may not be present. Deserialize it into a tree, then serialize it again in canonical form: level order, null for a missing child of a present node, and no trailing nulls.

Input: one line of space-separated tokens, each an integer or null. The line is empty for an empty tree.
Output: the canonical serialization, or an empty line for an empty tree.$$,
  starter_code = $$import sys

tokens = sys.stdin.readline().split()

# build the tree, then print its canonical level-order serialization
$$,
  tests = $$[
  {
    "input": "1 2 3 null null 4 5\n",
    "expected": "1 2 3 null null 4 5",
    "hidden": false
  },
  {
    "input": "1 2 3 null null 4 5 null null null null\n",
    "expected": "1 2 3 null null 4 5",
    "hidden": false
  },
  {
    "input": "\n",
    "expected": "",
    "hidden": true
  },
  {
    "input": "1\n",
    "expected": "1",
    "hidden": true
  },
  {
    "input": "1 null 2 null 3\n",
    "expected": "1 null 2 null 3",
    "hidden": true
  },
  {
    "input": "5 3 8 1 4 7 9\n",
    "expected": "5 3 8 1 4 7 9",
    "hidden": true
  }
]$$::jsonb
WHERE slug = 'serialize-deserialize-tree';
