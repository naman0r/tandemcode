-- TandemCode Database Schema
-- This will create tables automatically when Spring Boot starts

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (for Clerk integration)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,                    -- Clerk user ID
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rooms table (for pair programming sessions)
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,                        -- We'll use String IDs from Room entity
  name TEXT NOT NULL,                         -- Room name
  description TEXT,                           -- Room description
  created_by TEXT NOT NULL REFERENCES users(id), -- Creator user ID
  is_active BOOLEAN NOT NULL DEFAULT true,    -- Whether room is active
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Room members (who's in each room)
CREATE TABLE IF NOT EXISTS room_members (
  room_id TEXT NOT NULL REFERENCES rooms(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'participant',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

-- Problems table (coding challenges)
CREATE TABLE IF NOT EXISTS problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  difficulty TEXT,
  time_limit_ms INT NOT NULL DEFAULT 2000,
  mem_limit_mb INT NOT NULL DEFAULT 256
);

-- Problem assets (test files)
CREATE TABLE IF NOT EXISTS problem_assets (
  problem_id UUID PRIMARY KEY REFERENCES problems(id),
  s3_key_tests_json TEXT NOT NULL
);

-- Submissions (code runs and results)
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES rooms(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  problem_id UUID NOT NULL REFERENCES problems(id),
  language TEXT NOT NULL,
  status TEXT,
  time_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  s3_key_stdout TEXT,
  s3_key_stderr TEXT,
  s3_key_result_json TEXT
);

-- Events table (for timeline replay)
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id),
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL,
  payload_json JSONB NOT NULL
);
