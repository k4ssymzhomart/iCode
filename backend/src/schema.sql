-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Profiles (Mapped to Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('student', 'teacher', 'admin')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tasks (Challenges/Assignments)
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  initial_code text not null,
  test_cases jsonb not null default '[]'::jsonb,
  language text not null
);

-- Classrooms
create table if not exists public.classrooms (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  join_code text unique not null,
  active_task_id uuid references public.tasks(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Lab Sessions (Liveblocks Rooms base lookup)
create table if not exists public.lab_sessions (
  id text primary key,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  state text not null check (state in ('lobby', 'active', 'completed')),
  config jsonb not null default '{"runLimit": -1, "correctionLimit": -1, "allowHint": true, "allowExplain": true, "allowCorrect": true}'::jsonb,
  start_time timestamp with time zone default timezone('utc'::text, now()) not null,
  end_time timestamp with time zone
);

-- Student Metrics (Leaderboard data)
create table if not exists public.student_metrics (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null references public.lab_sessions(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  run_attempts int not null default 0,
  corrections_used int not null default 0,
  hints_used int not null default 0,
  explain_used int not null default 0,
  total_time_seconds int not null default 0,
  completed boolean not null default false,
  completed_at timestamp with time zone,
  unique(session_id, task_id, student_id)
);

-- Student Code Files (Persistence logic)
create table if not exists public.code_files (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null references public.lab_sessions(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  code_content text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, task_id, student_id)
);

-- Help Requests
create table if not exists public.help_requests (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null references public.lab_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('pending', 'resolved', 'active_intervention')),
  requested_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS but allow everything since we run logic strictly on the trusted backend with Service Role
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.classrooms enable row level security;
alter table public.lab_sessions enable row level security;
alter table public.code_files enable row level security;
alter table public.help_requests enable row level security;

-- Optional: Since we only modify data from Node.js Express via SERVER ROLE KEY, we can keep these blocked from anon/authenticated direct access.
-- If we want frontend selects later, we can add policies. For now, rely on API endpoints.
