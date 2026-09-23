-- V7: Keep enough to replay a session after it ends
--
-- Members are no longer deleted on leave: left_at marks them gone, so a
-- closed room still knows who was in it. Editor changes are stored as the
-- framed Yjs sync messages the relay saw, replayed client-side in order.

ALTER TABLE room_members ADD COLUMN left_at TIMESTAMPTZ;

CREATE TABLE room_updates (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id),
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data BYTEA NOT NULL
);

CREATE INDEX room_updates_room_id_id ON room_updates (room_id, id);
CREATE INDEX events_room_id_id ON events (room_id, id);
