-- V9: Rooms can be unlisted, and public rooms can ask for a partner
--
-- Unlisted rooms never appear in the room list; the invite link is the only
-- way in. Advertised is only meaningful on a public room, and turns off when
-- a second person arrives.

ALTER TABLE rooms
  ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'unlisted')),
  ADD COLUMN advertised BOOLEAN NOT NULL DEFAULT FALSE,
  ADD CONSTRAINT rooms_advertised_is_public CHECK (NOT advertised OR visibility = 'public');
