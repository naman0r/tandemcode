-- V5: Judge output on the submission row
--
-- {"passed": n, "total": m, "tests": [{"index", "hidden", "passed", "timeMs", "stdout", "stderr"}, ...]}
-- The s3_key_* columns stay for the hosted pipeline; locally the result is small
-- enough to live here.

ALTER TABLE submissions ADD COLUMN result JSONB;
