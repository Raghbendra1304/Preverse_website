-- PrepVerse LLM: PostgreSQL schema (initial)
-- Run this on your Supabase/Postgres instance to create core tables for Phase 1+2.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- users & profiles (Supabase will manage auth; keep profile table for app metadata)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id text UNIQUE, -- Supabase auth user id
  full_name text,
  email text UNIQUE,
  avatar_url text,
  preferred_exam text,
  preferred_language text DEFAULT 'en',
  target_score integer,
  daily_goal_minutes integer,
  preparation_level text,
  role text DEFAULT 'student' CHECK (role IN ('student','admin','super_admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- exams, subjects, chapters, topics
CREATE TABLE IF NOT EXISTS exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id uuid REFERENCES chapters(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text,
  created_at timestamptz DEFAULT now()
);

-- questions core
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES exams(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id uuid REFERENCES chapters(id) ON DELETE SET NULL,
  topic_id uuid REFERENCES topics(id) ON DELETE SET NULL,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('mcq','multiple_correct','true_false','assertion_reason','fill_blank','numerical','match','case','passage','coding','verbal')),
  language text DEFAULT 'en',
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard','expert')),
  ai_generated boolean DEFAULT false,
  ai_model text,
  verification_status text DEFAULT 'draft' CHECK (verification_status IN ('draft','review','approved','rejected')),
  usage_count integer DEFAULT 0,
  correct_percentage numeric(5,2) DEFAULT 0,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- options for MCQs
CREATE TABLE IF NOT EXISTS question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  is_correct boolean DEFAULT false,
  position integer,
  created_at timestamptz DEFAULT now()
);

-- question versions for audit and edits
CREATE TABLE IF NOT EXISTS question_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  version_data jsonb NOT NULL,
  change_reason text,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- question_sources / uploads
CREATE TABLE IF NOT EXISTS question_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text CHECK (source_type IN ('upload','api','manual')) DEFAULT 'manual',
  source_meta jsonb,
  created_at timestamptz DEFAULT now()
);

-- tests and test_questions
CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  exam_id uuid REFERENCES exams(id) ON DELETE SET NULL,
  meta jsonb,
  time_limit_seconds integer,
  negative_marking numeric DEFAULT 0,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid REFERENCES tests(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE SET NULL,
  sequence integer,
  section text,
  points numeric DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- attempts and answers
CREATE TABLE IF NOT EXISTS attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  test_id uuid REFERENCES tests(id) ON DELETE SET NULL,
  type text CHECK (type IN ('practice','mock','adaptive','interview')) DEFAULT 'practice',
  topic text,
  difficulty text,
  score numeric DEFAULT 0,
  total integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES attempts(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE SET NULL,
  given_answer jsonb,
  is_correct boolean,
  time_taken_seconds integer,
  created_at timestamptz DEFAULT now()
);

-- bookmarks and mistakes
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mistakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  first_failed_at timestamptz DEFAULT now(),
  times_failed integer DEFAULT 1,
  last_failed_at timestamptz DEFAULT now()
);

-- ai_generations & ai_reviews
CREATE TABLE IF NOT EXISTS ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text,
  input jsonb,
  output jsonb,
  model text,
  prompt_key text,
  status text CHECK (status IN ('pending','done','failed')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id uuid REFERENCES ai_generations(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  review_notes text,
  rating integer,
  created_at timestamptz DEFAULT now()
);

-- admin actions log
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action_type text,
  action_meta jsonb,
  created_at timestamptz DEFAULT now()
);

-- indexes for common queries
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_answers_attempt ON answers(attempt_id);

-- Seed: example demo admin (do NOT use in production) - created ONLY if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@prepverse.local') THEN
    INSERT INTO profiles (auth_user_id, full_name, email, role)
    VALUES ('__dev_admin__', 'Demo Admin', 'admin@prepverse.local', 'super_admin');
  END IF;
END$$;

-- End of schema
