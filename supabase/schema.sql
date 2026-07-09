-- Stradeo Database Schema
-- Run this in Supabase SQL Editor after creating your project

-- User progress (one row per user)
CREATE TABLE IF NOT EXISTS progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  stats JSONB DEFAULT '{}'::jsonb,
  total_done INTEGER DEFAULT 0,
  wrong_questions JSONB DEFAULT '[]'::jsonb,
  sr_data JSONB DEFAULT '{}'::jsonb,
  streak INTEGER DEFAULT 0,
  last_study DATE,
  daily_log JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Theory cache (avoid re-generating AI lessons)
CREATE TABLE IF NOT EXISTS theory_cache (
  topic_id INTEGER NOT NULL,
  language VARCHAR(2) NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (topic_id, language)
);

-- Row-Level Security (users can only access their own data)
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own progress"
  ON progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own progress"
  ON progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own progress"
  ON progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Theory cache is readable by all authenticated users
ALTER TABLE theory_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users read theory"
  ON theory_cache FOR SELECT
  TO authenticated
  USING (true);

-- Table privileges for the logged-in ("authenticated") role.
-- RLS policies above only take effect once the role also has table grants.
GRANT SELECT, INSERT, UPDATE ON public.progress TO authenticated;
GRANT SELECT ON public.theory_cache TO authenticated;

-- Auto-create progress row on first login
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.progress (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
