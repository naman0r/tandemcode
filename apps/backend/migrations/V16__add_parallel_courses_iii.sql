-- V16: Add the Parallel Courses III problem

INSERT INTO problems (slug, title, difficulty, time_limit_ms, mem_limit_mb, statement, starter_code, tests)
VALUES (
  'parallel-courses-iii',
  'Parallel Courses III',
  'hard',
  2000,
  256,
  $$There are n courses numbered 1 to n. time[i - 1] is how many months course i takes. Each pair [a, b] in relations means course a must be finished before course b can start. Any number of courses can run at once, and a course can start as soon as everything it depends on is finished. The relations have no cycles. Return the fewest months needed to finish every course.

Input: the first line is n, the second line is time, space-separated. The third line is the number of relations, followed by one relation per line as a b.
Output: the fewest months.$$,
  $$from collections import deque
from typing import List


class Solution:
    def minimumTime(self, n: int, relations: List[List[int]], time: List[int]) -> int:
        """
        Course a must finish before course b starts for each [a, b] in
        relations, and course i takes time[i - 1] months. Return the
        fewest months to finish all n courses.
        """



# Reads the input, calls your solution and prints the result.
# You do not need to change anything below this line.
import sys

lines = sys.stdin.read().split("\n")
n = int(lines[0])
time = list(map(int, lines[1].split()))
m = int(lines[2])
relations = [list(map(int, lines[3 + i].split())) for i in range(m)]
print(Solution().minimumTime(n, relations, time))
$$,
  $$[
    {"input": "3\n3 2 5\n2\n1 3\n2 3\n", "expected": "8", "hidden": false},
    {"input": "5\n1 2 3 4 5\n5\n1 5\n2 5\n3 5\n3 4\n4 5\n", "expected": "12", "hidden": false},
    {"input": "1\n7\n0\n", "expected": "7", "hidden": true},
    {"input": "4\n5 1 1 1\n0\n", "expected": "5", "hidden": true},
    {"input": "4\n1 1 1 10\n3\n1 2\n2 3\n1 4\n", "expected": "11", "hidden": true},
    {"input": "6\n2 3 1 4 2 6\n6\n1 3\n2 3\n3 4\n3 5\n5 6\n2 6\n", "expected": "12", "hidden": true},
    {"input": "300\n1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6 7 1 2 3 4 5 6\n299\n1 2\n2 3\n3 4\n4 5\n5 6\n6 7\n7 8\n8 9\n9 10\n10 11\n11 12\n12 13\n13 14\n14 15\n15 16\n16 17\n17 18\n18 19\n19 20\n20 21\n21 22\n22 23\n23 24\n24 25\n25 26\n26 27\n27 28\n28 29\n29 30\n30 31\n31 32\n32 33\n33 34\n34 35\n35 36\n36 37\n37 38\n38 39\n39 40\n40 41\n41 42\n42 43\n43 44\n44 45\n45 46\n46 47\n47 48\n48 49\n49 50\n50 51\n51 52\n52 53\n53 54\n54 55\n55 56\n56 57\n57 58\n58 59\n59 60\n60 61\n61 62\n62 63\n63 64\n64 65\n65 66\n66 67\n67 68\n68 69\n69 70\n70 71\n71 72\n72 73\n73 74\n74 75\n75 76\n76 77\n77 78\n78 79\n79 80\n80 81\n81 82\n82 83\n83 84\n84 85\n85 86\n86 87\n87 88\n88 89\n89 90\n90 91\n91 92\n92 93\n93 94\n94 95\n95 96\n96 97\n97 98\n98 99\n99 100\n100 101\n101 102\n102 103\n103 104\n104 105\n105 106\n106 107\n107 108\n108 109\n109 110\n110 111\n111 112\n112 113\n113 114\n114 115\n115 116\n116 117\n117 118\n118 119\n119 120\n120 121\n121 122\n122 123\n123 124\n124 125\n125 126\n126 127\n127 128\n128 129\n129 130\n130 131\n131 132\n132 133\n133 134\n134 135\n135 136\n136 137\n137 138\n138 139\n139 140\n140 141\n141 142\n142 143\n143 144\n144 145\n145 146\n146 147\n147 148\n148 149\n149 150\n150 151\n151 152\n152 153\n153 154\n154 155\n155 156\n156 157\n157 158\n158 159\n159 160\n160 161\n161 162\n162 163\n163 164\n164 165\n165 166\n166 167\n167 168\n168 169\n169 170\n170 171\n171 172\n172 173\n173 174\n174 175\n175 176\n176 177\n177 178\n178 179\n179 180\n180 181\n181 182\n182 183\n183 184\n184 185\n185 186\n186 187\n187 188\n188 189\n189 190\n190 191\n191 192\n192 193\n193 194\n194 195\n195 196\n196 197\n197 198\n198 199\n199 200\n200 201\n201 202\n202 203\n203 204\n204 205\n205 206\n206 207\n207 208\n208 209\n209 210\n210 211\n211 212\n212 213\n213 214\n214 215\n215 216\n216 217\n217 218\n218 219\n219 220\n220 221\n221 222\n222 223\n223 224\n224 225\n225 226\n226 227\n227 228\n228 229\n229 230\n230 231\n231 232\n232 233\n233 234\n234 235\n235 236\n236 237\n237 238\n238 239\n239 240\n240 241\n241 242\n242 243\n243 244\n244 245\n245 246\n246 247\n247 248\n248 249\n249 250\n250 251\n251 252\n252 253\n253 254\n254 255\n255 256\n256 257\n257 258\n258 259\n259 260\n260 261\n261 262\n262 263\n263 264\n264 265\n265 266\n266 267\n267 268\n268 269\n269 270\n270 271\n271 272\n272 273\n273 274\n274 275\n275 276\n276 277\n277 278\n278 279\n279 280\n280 281\n281 282\n282 283\n283 284\n284 285\n285 286\n286 287\n287 288\n288 289\n289 290\n290 291\n291 292\n292 293\n293 294\n294 295\n295 296\n296 297\n297 298\n298 299\n299 300\n", "expected": "1197", "hidden": true}
  ]$$::jsonb
);
