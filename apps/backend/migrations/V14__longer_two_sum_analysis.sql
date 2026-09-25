-- V14: One more input size for Two Sum's complexity analysis
--
-- A run only counts once the solution's own time is at least the run's fixed
-- cost (app/runner/complexity.py), and at half a million numbers the
-- reference solution clears that at only one or two sizes. A million numbers
-- fit in the problem's memory limit.

UPDATE problems
SET complexity_generator = replace(complexity_generator, 'range(10)', 'range(11)')
WHERE slug = 'two-sum';
