-- V12: Bound what a problem can ask of the runner
--
-- Problems come from outside contributors. A problem that asked for 4 GB or
-- a minute per test would let any submission starve the one judge host.

ALTER TABLE problems
  ADD CONSTRAINT problems_time_limit_bounded CHECK (time_limit_ms BETWEEN 100 AND 10000),
  ADD CONSTRAINT problems_mem_limit_bounded CHECK (mem_limit_mb BETWEEN 32 AND 512),
  ADD CONSTRAINT problems_difficulty_known CHECK (difficulty IN ('easy', 'medium', 'hard'));
