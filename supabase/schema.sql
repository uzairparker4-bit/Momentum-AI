-- ============================================================
-- Momentum AI — Supabase Schema
-- Run this in your Supabase project SQL editor
-- ============================================================

-- Users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  google_id text unique,
  avatar_url text,
  created_at timestamptz default now()
);

-- Goals
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  description text,
  original_reason text,
  target_date date,
  status text default 'active',
  created_at timestamptz default now()
);

-- Phases
create table if not exists phases (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid references goals(id) on delete cascade not null,
  phase_number int not null,
  phase_name text not null,
  status text default 'pending',
  created_at timestamptz default now()
);

-- Tasks (micro-steps)
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid references phases(id) on delete cascade not null,
  task_title text not null,
  task_detail text,
  status text default 'pending',
  order_index int not null,
  created_at timestamptz default now()
);

-- Sessions (for drift detection)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  last_active_timestamp timestamptz default now(),
  momentum_score int default 0,
  unique(user_id)
);

-- Disable RLS for development (re-enable with policies in production)
alter table users disable row level security;
alter table goals disable row level security;
alter table phases disable row level security;
alter table tasks disable row level security;
alter table sessions disable row level security;
