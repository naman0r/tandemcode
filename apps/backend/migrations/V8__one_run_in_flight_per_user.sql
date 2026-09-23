-- V8: One run in flight per person, enforced by the database
--
-- The service used to check for a pending run before inserting one, which
-- two requests at once could both pass, and it only looked inside one room.

CREATE UNIQUE INDEX submissions_one_in_flight_per_user
  ON submissions (user_id)
  WHERE status IN ('pending', 'running');
