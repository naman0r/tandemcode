-- V3: Seed initial problem set

INSERT INTO problems (id, slug, title, difficulty, time_limit_ms, mem_limit_mb) VALUES
  (gen_random_uuid(), 'two-sum',                    'Two Sum',                       'easy',   2000, 256),
  (gen_random_uuid(), 'valid-parentheses',           'Valid Parentheses',             'easy',   2000, 256),
  (gen_random_uuid(), 'best-time-to-buy-sell-stock', 'Best Time to Buy and Sell Stock','easy',  2000, 256),
  (gen_random_uuid(), 'climbing-stairs',             'Climbing Stairs',               'easy',   2000, 256),
  (gen_random_uuid(), 'reverse-linked-list',         'Reverse Linked List',           'easy',   2000, 256),
  (gen_random_uuid(), 'add-two-numbers',             'Add Two Numbers',               'medium', 2000, 256),
  (gen_random_uuid(), 'longest-substring-no-repeat', 'Longest Substring Without Repeating Characters', 'medium', 2000, 256),
  (gen_random_uuid(), 'container-with-most-water',   'Container With Most Water',     'medium', 2000, 256),
  (gen_random_uuid(), 'three-sum',                   '3Sum',                          'medium', 2000, 256),
  (gen_random_uuid(), 'coin-change',                 'Coin Change',                   'medium', 2000, 256),
  (gen_random_uuid(), 'word-search',                 'Word Search',                   'medium', 2000, 256),
  (gen_random_uuid(), 'merge-intervals',             'Merge Intervals',               'medium', 2000, 256),
  (gen_random_uuid(), 'median-two-sorted-arrays',    'Median of Two Sorted Arrays',   'hard',   2000, 256),
  (gen_random_uuid(), 'trapping-rain-water',         'Trapping Rain Water',           'hard',   2000, 256),
  (gen_random_uuid(), 'serialize-deserialize-tree',  'Serialize and Deserialize Binary Tree', 'hard', 2000, 256);
