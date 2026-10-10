-- V21: Add the Alert Using Same Key-Card Three or More Times in a One Hour Period problem

INSERT INTO problems (slug, title, difficulty, time_limit_ms, mem_limit_mb, statement, starter_code, tests)
VALUES (
  'alert-using-same-key-card-three-or-more-times-in-a-one-hour-period',
  'Alert Using Same Key-Card Three or More Times in a One Hour Period',
  'medium',
  2000,
  256,
  $$Workers badge in with key cards. keyName[i] is the worker who used a card at keyTime[i], written in 24-hour HH:MM form. Every use happens on the same day, so 23:51 and 00:10 are almost a whole day apart. Return the names of every worker who used a card three or more times within one hour, sorted alphabetically. An hour includes both ends, so 10:00 and 11:00 are within one hour of each other.

Input: the first line is the number of card uses, then one use per line as name HH:MM.
Output: the names sorted alphabetically and separated by spaces, or an empty line if there are none.$$,
  $$from collections import defaultdict
from typing import List


class Solution:
    def alertNames(self, keyName: List[str], keyTime: List[str]) -> List[str]:
        """
        keyName[i] used a key card at keyTime[i], an HH:MM time on one
        day. Return, sorted, everyone who used a card three or more
        times within one hour.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
n = int(lines[0])
uses = [lines[1 + i].split() for i in range(n)]
keyName = [name for name, _ in uses]
keyTime = [time for _, time in uses]
print(" ".join(sorted(Solution().alertNames(keyName, keyTime))))
$$,
  $$[
    {"input": "7\ndaniel 10:00\ndaniel 10:40\ndaniel 11:00\nluis 09:00\nluis 11:00\nluis 13:00\nluis 15:00\n", "expected": "daniel", "hidden": false},
    {"input": "7\nalice 12:01\nalice 12:00\nalice 18:00\nbob 21:00\nbob 21:20\nbob 21:30\nbob 23:00\n", "expected": "bob", "hidden": false},
    {"input": "2\nann 10:00\nann 10:01\n", "expected": "", "hidden": true},
    {"input": "3\nann 23:51\nann 00:10\nann 23:59\n", "expected": "", "hidden": true},
    {"input": "3\nann 10:00\nann 11:01\nann 10:30\n", "expected": "", "hidden": true},
    {"input": "6\nzed 08:00\nzed 08:59\nzed 08:30\namy 00:00\namy 01:00\namy 00:30\n", "expected": "amy zed", "hidden": true},
    {"input": "8\nkim 09:00\nlee 09:10\nkim 09:20\nlee 09:30\nkim 10:01\nlee 10:10\nkim 10:20\nlee 11:00\n", "expected": "kim lee", "hidden": true}
  ]$$::jsonb
);
