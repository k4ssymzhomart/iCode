create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('student', 'teacher', 'admin')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  initial_code text not null,
  test_cases jsonb not null default '[]'::jsonb,
  input_format text not null default '',
  output_format text not null default '',
  constraints jsonb not null default '[]'::jsonb,
  external_id text,
  language text not null,
  difficulty text not null default 'Medium',
  logic_steps jsonb not null default '[]'::jsonb
);

alter table public.tasks
  add column if not exists input_format text not null default '',
  add column if not exists output_format text not null default '',
  add column if not exists constraints jsonb not null default '[]'::jsonb,
  add column if not exists external_id text,
  add column if not exists difficulty text not null default 'Medium',
  add column if not exists logic_steps jsonb not null default '[]'::jsonb;

alter table public.tasks drop constraint if exists tasks_difficulty_check;
alter table public.tasks
  add constraint tasks_difficulty_check
  check (difficulty in ('Easy', 'Medium', 'Hard'));

create table if not exists public.task_sets (
  id text primary key,
  title text not null,
  topic text not null,
  description text not null default '',
  language text not null,
  source_type text not null default 'json_import',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.task_sets
  add column if not exists title text not null default 'Untitled Task Set',
  add column if not exists topic text not null default 'General',
  add column if not exists description text not null default '',
  add column if not exists language text not null default 'python',
  add column if not exists source_type text not null default 'json_import',
  add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;

alter table public.task_sets drop constraint if exists task_sets_source_type_check;
alter table public.task_sets
  add constraint task_sets_source_type_check
  check (source_type in ('json_import', 'legacy_single_task'));

alter table public.task_sets drop constraint if exists task_sets_language_check;
alter table public.task_sets
  add constraint task_sets_language_check
  check (language in ('python', 'javascript', 'typescript'));

create table if not exists public.task_set_tasks (
  id uuid primary key default uuid_generate_v4(),
  task_set_id text not null references public.task_sets(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  position integer not null default 0,
  unique(task_set_id, task_id)
);

create index if not exists task_set_tasks_lookup_idx
  on public.task_set_tasks (task_set_id, position);

create table if not exists public.classrooms (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  join_code text unique not null,
  active_task_id uuid references public.tasks(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.lab_sessions (
  id text primary key,
  classroom_id uuid references public.classrooms(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  title text not null default 'Untitled Session',
  topic text not null default 'Untitled Session',
  description text not null default '',
  join_code text,
  task_set_id text references public.task_sets(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  active_task_id uuid references public.tasks(id) on delete set null,
  state text not null default 'draft',
  config jsonb not null default '{"allowRun": true, "runLimit": -1, "correctionLimit": -1, "allowHint": true, "allowExplain": true, "allowCorrect": true}'::jsonb,
  controls jsonb not null default '{"allowRun": true, "runLimit": -1, "correctionLimit": -1, "allowHint": true, "allowExplain": true, "allowCorrect": true}'::jsonb,
  broadcast_message text,
  pinned_hint text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  start_time timestamp with time zone,
  end_time timestamp with time zone
);

alter table public.lab_sessions
  add column if not exists teacher_id uuid references public.profiles(id) on delete cascade,
  add column if not exists title text not null default 'Untitled Session',
  add column if not exists topic text not null default 'Untitled Session',
  add column if not exists description text not null default '',
  add column if not exists join_code text,
  add column if not exists task_set_id text references public.task_sets(id) on delete set null,
  add column if not exists active_task_id uuid references public.tasks(id) on delete set null,
  add column if not exists controls jsonb not null default '{"allowRun": true, "runLimit": -1, "correctionLimit": -1, "allowHint": true, "allowExplain": true, "allowCorrect": true}'::jsonb,
  add column if not exists broadcast_message text,
  add column if not exists pinned_hint text,
  add column if not exists created_at timestamp with time zone default timezone('utc'::text, now()) not null;

alter table public.lab_sessions alter column classroom_id drop not null;
alter table public.lab_sessions alter column task_id drop not null;
alter table public.lab_sessions alter column start_time drop default;
alter table public.lab_sessions alter column start_time drop not null;
alter table public.lab_sessions drop constraint if exists lab_sessions_state_check;

update public.lab_sessions
set state = case
  when state = 'active' then 'live'
  when state = 'lobby' then 'draft'
  else state
end
where state in ('active', 'lobby');

update public.lab_sessions
set teacher_id = classrooms.teacher_id
from public.classrooms
where public.lab_sessions.classroom_id = classrooms.id
  and public.lab_sessions.teacher_id is null;

update public.lab_sessions
set topic = coalesce(nullif(public.lab_sessions.topic, ''), classrooms.name, 'Untitled Session')
from public.classrooms
where public.lab_sessions.classroom_id = classrooms.id;

update public.lab_sessions
set title = coalesce(nullif(public.lab_sessions.topic, ''), classrooms.name, 'Untitled Session')
from public.classrooms
where public.lab_sessions.classroom_id = classrooms.id
  and (
    public.lab_sessions.title is null
    or public.lab_sessions.title = ''
    or public.lab_sessions.title = 'Untitled Session'
  );

update public.lab_sessions
set title = coalesce(nullif(topic, ''), 'Untitled Session')
where title is null
  or title = ''
  or title = 'Untitled Session';

update public.lab_sessions
set description = coalesce(description, '');

update public.lab_sessions
set active_task_id = coalesce(
  public.lab_sessions.active_task_id,
  public.lab_sessions.task_id,
  classrooms.active_task_id
)
from public.classrooms
where public.lab_sessions.classroom_id = classrooms.id
  and public.lab_sessions.active_task_id is null;

update public.lab_sessions
set controls = coalesce(
      public.lab_sessions.controls,
      public.lab_sessions.config,
      '{"allowRun": true, "runLimit": -1, "correctionLimit": -1, "allowHint": true, "allowExplain": true, "allowCorrect": true}'::jsonb
    ),
    config = coalesce(
      public.lab_sessions.config,
      public.lab_sessions.controls,
      '{"allowRun": true, "runLimit": -1, "correctionLimit": -1, "allowHint": true, "allowExplain": true, "allowCorrect": true}'::jsonb
    );

alter table public.lab_sessions
  add constraint lab_sessions_state_check
  check (state in ('draft', 'live', 'paused', 'completed'));

with ranked_live_sessions as (
  select
    id,
    row_number() over (
      partition by teacher_id
      order by coalesce(start_time, created_at, timezone('utc'::text, now())) desc, id desc
    ) as row_num
  from public.lab_sessions
  where teacher_id is not null
    and state = 'live'
)
update public.lab_sessions
set state = 'paused'
where id in (
  select id
  from ranked_live_sessions
  where row_num > 1
);

create unique index if not exists lab_sessions_one_live_per_teacher_idx
  on public.lab_sessions (teacher_id)
  where teacher_id is not null and state = 'live';

create unique index if not exists lab_sessions_join_code_unique_idx
  on public.lab_sessions (join_code)
  where join_code is not null;

insert into public.task_sets (id, title, topic, description, language, source_type)
select
  'legacy-task-' || tasks.id::text,
  tasks.title,
  tasks.title,
  tasks.description,
  tasks.language,
  'legacy_single_task'
from public.tasks
where not exists (
  select 1
  from public.task_sets
  where id = 'legacy-task-' || tasks.id::text
);

insert into public.task_set_tasks (task_set_id, task_id, position)
select
  'legacy-task-' || tasks.id::text,
  tasks.id,
  0
from public.tasks
where not exists (
  select 1
  from public.task_set_tasks
  where task_set_id = 'legacy-task-' || tasks.id::text
    and task_id = tasks.id
);

create table if not exists public.session_students (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null references public.lab_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'offline',
  help_status text not null default 'none',
  joined_at timestamp with time zone,
  last_activity_at timestamp with time zone,
  current_task_id uuid references public.tasks(id) on delete set null,
  overview_snippet text,
  help_requested_at timestamp with time zone,
  unique(session_id, student_id)
);

create table if not exists public.feedback (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.profiles(id) on delete cascade,
  gender text,
  age_group text,
  country text,
  bug_description text,
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.session_students drop constraint if exists session_students_status_check;
alter table public.session_students
  add constraint session_students_status_check
  check (status in ('offline', 'joined', 'active', 'idle', 'help', 'resolved', 'completed'));

alter table public.session_students drop constraint if exists session_students_help_status_check;
alter table public.session_students
  add constraint session_students_help_status_check
  check (help_status in ('none', 'requested', 'active', 'resolved'));

create index if not exists session_students_session_idx on public.session_students (session_id);
create index if not exists session_students_student_idx on public.session_students (student_id);

create table if not exists public.session_tasks (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null references public.lab_sessions(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  position integer not null default 0,
  is_active boolean not null default false,
  unique(session_id, task_id)
);

create index if not exists session_tasks_session_position_idx
  on public.session_tasks (session_id, position);

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

create table if not exists public.code_files (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null references public.lab_sessions(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  code_content text not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_by_role text,
  revision integer not null default 1,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(session_id, task_id, student_id)
);

alter table public.code_files
  add column if not exists updated_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by_role text,
  add column if not exists revision integer not null default 1;

alter table public.code_files drop constraint if exists code_files_updated_by_role_check;
alter table public.code_files
  add constraint code_files_updated_by_role_check
  check (updated_by_role in ('student', 'teacher', 'admin') or updated_by_role is null);

create table if not exists public.help_requests (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null references public.lab_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  status text not null default 'pending',
  requested_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone,
  resolution_notes jsonb not null default '[]'::jsonb,
  resolved_by_teacher_id uuid references public.profiles(id) on delete set null
);

alter table public.help_requests
  add column if not exists task_id uuid references public.tasks(id) on delete set null,
  add column if not exists resolved_at timestamp with time zone,
  add column if not exists resolution_notes jsonb not null default '[]'::jsonb,
  add column if not exists resolved_by_teacher_id uuid references public.profiles(id) on delete set null;

alter table public.help_requests drop constraint if exists help_requests_status_check;
alter table public.help_requests
  add constraint help_requests_status_check
  check (status in ('pending', 'active_intervention', 'resolved'));

create index if not exists help_requests_session_idx on public.help_requests (session_id, status);

create table if not exists public.editor_interventions (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null references public.lab_sessions(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  status text not null default 'open',
  mode text not null default 'view',
  range jsonb not null,
  content text,
  suggested_code text,
  before_excerpt text,
  after_excerpt text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  resolved_at timestamp with time zone
);

alter table public.editor_interventions drop constraint if exists editor_interventions_type_check;
alter table public.editor_interventions
  add constraint editor_interventions_type_check
  check (type in ('comment', 'highlight', 'suggestion', 'direct_edit'));

alter table public.editor_interventions drop constraint if exists editor_interventions_status_check;
alter table public.editor_interventions
  add constraint editor_interventions_status_check
  check (status in ('open', 'accepted', 'rejected', 'resolved'));

alter table public.editor_interventions drop constraint if exists editor_interventions_mode_check;
alter table public.editor_interventions
  add constraint editor_interventions_mode_check
  check (mode in ('view', 'suggest', 'edit'));

create index if not exists editor_interventions_lookup_idx
  on public.editor_interventions (session_id, student_id, task_id, status);

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.task_sets enable row level security;
alter table public.task_set_tasks enable row level security;
alter table public.classrooms enable row level security;
alter table public.lab_sessions enable row level security;
alter table public.session_students enable row level security;
alter table public.session_tasks enable row level security;
alter table public.student_metrics enable row level security;
alter table public.code_files enable row level security;
alter table public.help_requests enable row level security;
alter table public.editor_interventions enable row level security;
alter table public.feedback enable row level security;
