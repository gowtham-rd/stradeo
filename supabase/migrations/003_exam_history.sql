-- Stradeo migration 003 — exam history. Run once in the Supabase SQL editor. Safe to re-run.
-- Finished exam simulations (compact: question ids + one character per answer), newest 50.
alter table public.progress add column if not exists exams jsonb not null default '[]'::jsonb;
