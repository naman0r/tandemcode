-- V10: Count what each room has stored for its replay
--
-- The relay used to keep this tally in memory, so a restart reset it. Kept
-- on the room, the insert and the check are one statement.

ALTER TABLE rooms ADD COLUMN recorded_bytes BIGINT NOT NULL DEFAULT 0;

UPDATE rooms r SET recorded_bytes = u.total
FROM (SELECT room_id, SUM(octet_length(data)) AS total FROM room_updates GROUP BY room_id) u
WHERE u.room_id = r.id;
