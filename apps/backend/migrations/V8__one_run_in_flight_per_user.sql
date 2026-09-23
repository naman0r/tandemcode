-- V8: One run in flight per person, enforced by the database
--
-- The service used to check for a pending run before inserting one, which
-- two requests at once could both pass, and it only looked inside one room.

-- The old check allowed several at once, so settle all but each person's
-- newest before the index can be built.
UPDATE submissions s SET status = 'runtime_error'
WHERE s.status IN ('pending', 'running')
  AND EXISTS (
    SELECT 1 FROM submissions t
    WHERE t.user_id = s.user_id
      AND t.status IN ('pending', 'running')
      AND (t.created_at, t.id) > (s.created_at, s.id)
  );

CREATE UNIQUE INDEX submissions_one_in_flight_per_user
  ON submissions (user_id)
  WHERE status IN ('pending', 'running');
