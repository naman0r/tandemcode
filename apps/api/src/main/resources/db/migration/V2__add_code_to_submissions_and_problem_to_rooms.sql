-- V2: Store submitted code on submissions; link a problem to a room

ALTER TABLE submissions ADD COLUMN code TEXT;

ALTER TABLE rooms ADD COLUMN current_problem_id UUID REFERENCES problems(id);
