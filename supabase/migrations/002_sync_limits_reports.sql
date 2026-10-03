-- Stradeo migration 002 — run once in the Supabase SQL editor. Safe to re-run.

-- 1. Multi-device safe sync: each save must match the version it was based on.
--    Unique questions answered, per topic (for "remaining" and topic progress).
alter table public.progress add column if not exists version integer not null default 0;
alter table public.progress add column if not exists seen jsonb not null default '{}'::jsonb;

-- 2. Daily AI allowance per user (translations, explanations, lessons).
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null default current_date,
  count integer not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
-- No policies on purpose: users can't read or edit counts; only the function below writes them.

create or replace function public.bump_ai_usage()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  daily_limit constant integer := 60;
  n integer;
begin
  if auth.uid() is null then
    return false;
  end if;
  insert into public.ai_usage (user_id, day, count)
  values (auth.uid(), current_date, 1)
  on conflict (user_id, day) do update set count = public.ai_usage.count + 1
  returning count into n;
  return n <= daily_limit;
end;
$$;
revoke all on function public.bump_ai_usage() from public, anon;
grant execute on function public.bump_ai_usage() to authenticated;

-- 3. "Report a problem" on questions.
create table if not exists public.question_reports (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  question_key text not null check (char_length(question_key) <= 1500),
  reason text not null check (reason in ('wrong_answer', 'bad_translation', 'image', 'unclear', 'other')),
  note text check (note is null or char_length(note) <= 500),
  created_at timestamptz not null default now()
);
alter table public.question_reports enable row level security;
drop policy if exists "Users file own reports" on public.question_reports;
create policy "Users file own reports" on public.question_reports
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users read own reports" on public.question_reports;
create policy "Users read own reports" on public.question_reports
  for select to authenticated using (auth.uid() = user_id);
grant select, insert on public.question_reports to authenticated;

-- 4. Security advisor fixes for the new-user trigger function.
alter function public.handle_new_user() set search_path = '';
revoke execute on function public.handle_new_user() from public, anon, authenticated;
