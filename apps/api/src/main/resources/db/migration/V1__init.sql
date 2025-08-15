-- Enable UUID extension
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  created_at timestamptz not null default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  created_by_user_id uuid not null references users(id),
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists room_members (
  room_id uuid not null references rooms(id),
  user_id uuid not null references users(id),
  role text not null default 'participant',
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists problems (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  difficulty text,
  time_limit_ms int not null default 2000,
  mem_limit_mb int not null default 256
);

create table if not exists problem_assets (
  problem_id uuid primary key references problems(id),
  s3_key_tests_json text not null
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id),
  user_id uuid not null references users(id),
  problem_id uuid not null references problems(id),
  language text not null,
  status text,
  time_ms int,
  created_at timestamptz not null default now(),
  s3_key_stdout text,
  s3_key_stderr text,
  s3_key_result_json text
);

create table if not exists events (
  id bigserial primary key,
  room_id uuid not null references rooms(id),
  ts timestamptz not null default now(),
  type text not null,
  payload_json jsonb not null
);
