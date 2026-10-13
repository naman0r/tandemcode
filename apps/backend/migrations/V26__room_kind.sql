-- V26: A room is for coding or for system design
--
-- A design room has a shared whiteboard in place of the editor, problem and
-- runs. The board travels over the same Yjs relay as the editor.

ALTER TABLE rooms
  ADD COLUMN kind TEXT NOT NULL DEFAULT 'code' CHECK (kind IN ('code', 'design'));
