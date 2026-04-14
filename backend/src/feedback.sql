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

alter table public.feedback enable row level security;
