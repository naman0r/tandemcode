import sys

lines = sys.stdin.read().split("\n")
a = list(map(int, lines[0].split()))
b = list(map(int, lines[1].split()))

digits, carry = [], 0
for i in range(max(len(a), len(b))):
    total = carry + (a[i] if i < len(a) else 0) + (b[i] if i < len(b) else 0)
    digits.append(total % 10)
    carry = total // 10
if carry:
    digits.append(carry)

print(" ".join(map(str, digits)))
