-- Demo seed for PrepVerse LLM
-- Run this after applying schema.sql. It inserts demo exams, subjects, chapters, topics and a few sample questions.

-- Exams
INSERT INTO exams (slug, name, description)
VALUES
('upsc', 'UPSC', 'Union Public Service Commission - Civil Services Examination'),
('ssc-cgl', 'SSC CGL', 'Staff Selection Commission - Combined Graduate Level Examination'),
('neet', 'NEET', 'National Eligibility cum Entrance Test'),
('jee', 'JEE', 'Joint Entrance Examination'),
('jee-main', 'JEE Main', 'National engineering entrance examination'),
('jee-advanced', 'JEE Advanced', 'Advanced engineering entrance examination'),
('banking', 'Banking', 'Banking and Financial Services Exams'),
('railways', 'Railways', 'Railway recruitment examinations'),
('defence', 'Defence', 'Defence entrance and recruitment examinations'),
('state-psc', 'State PSC', 'State public service commission examinations'),
('olympiad', 'Olympiad', 'Mathematics, science, and informatics olympiad preparation'),
('science-olympiad', 'Science Olympiad', 'School science olympiad preparation'),
('maths-olympiad', 'Mathematics Olympiad', 'Mathematics olympiad preparation'),
('informatics-olympiad', 'Informatics Olympiad', 'Programming and informatics olympiad preparation')
ON CONFLICT (slug) DO NOTHING;

-- Subjects for JEE and NEET example
WITH jee AS (
  SELECT id FROM exams WHERE slug = 'jee' LIMIT 1
), neet AS (
  SELECT id FROM exams WHERE slug = 'neet' LIMIT 1
)
INSERT INTO subjects (exam_id, name, slug)
SELECT jee.id, 'Physics', 'physics' FROM jee
UNION ALL
SELECT jee.id, 'Chemistry', 'chemistry' FROM jee
UNION ALL
SELECT jee.id, 'Mathematics', 'mathematics' FROM jee
UNION ALL
SELECT neet.id, 'Biology', 'biology' FROM neet
ON CONFLICT DO NOTHING;

-- Chapters & topics example
-- Physics -> Mechanics
WITH subj AS (SELECT s.id FROM subjects s JOIN exams e ON s.exam_id=e.id WHERE e.slug='jee' AND s.slug='physics' LIMIT 1)
INSERT INTO chapters (subject_id, name, slug)
SELECT subj.id, 'Mechanics', 'mechanics' FROM subj
ON CONFLICT DO NOTHING;

WITH ch AS (SELECT c.id FROM chapters c JOIN subjects s ON c.subject_id=s.id JOIN exams e ON s.exam_id=e.id WHERE e.slug='jee' AND s.slug='physics' AND c.slug='mechanics' LIMIT 1)
INSERT INTO topics (chapter_id, name, slug)
SELECT ch.id, 'Kinematics', 'kinematics' FROM ch
UNION ALL SELECT ch.id, 'Newton Laws', 'newton-laws' FROM ch
ON CONFLICT DO NOTHING;

-- Add sample questions (MCQ) for Kinematics
WITH t AS (SELECT t.id FROM topics t JOIN chapters c ON t.chapter_id=c.id JOIN subjects s ON c.subject_id=s.id JOIN exams e ON s.exam_id=e.id WHERE e.slug='jee' AND s.slug='physics' AND c.slug='mechanics' AND t.slug='kinematics' LIMIT 1)
INSERT INTO questions (exam_id, subject_id, chapter_id, topic_id, question_text, question_type, language, difficulty, ai_generated, verification_status)
SELECT e.id, s.id, c.id, t.id,
 'A particle moves in a straight line with constant acceleration. If its velocity increases from 10 m/s to 30 m/s in 5 s, what is the acceleration?', 'mcq', 'en', 'easy', false, 'approved'
FROM exams e, subjects s, chapters c, topics t WHERE e.slug='jee' AND s.slug='physics' AND c.slug='mechanics' AND t.slug='kinematics'
ON CONFLICT DO NOTHING RETURNING id;

-- Insert options (associate with question inserted above)
-- NOTE: This uses a simple approach: find the last inserted question matching text
INSERT INTO question_options (question_id, option_text, is_correct, position)
SELECT q.id, '4 m/s^2', true, 1 FROM questions q WHERE q.question_text ILIKE '%velocity increases from 10 m/s to 30 m/s%' LIMIT 1
UNION ALL SELECT q.id, '2 m/s^2', false, 2 FROM questions q WHERE q.question_text ILIKE '%velocity increases from 10 m/s to 30 m/s%' LIMIT 1
UNION ALL SELECT q.id, '6 m/s^2', false, 3 FROM questions q WHERE q.question_text ILIKE '%velocity increases from 10 m/s to 30 m/s%' LIMIT 1
UNION ALL SELECT q.id, '8 m/s^2', false, 4 FROM questions q WHERE q.question_text ILIKE '%velocity increases from 10 m/s to 30 m/s%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Another sample question (Chemistry)
WITH subj AS (SELECT id FROM subjects WHERE slug='chemistry' LIMIT 1)
INSERT INTO chapters (subject_id, name, slug)
SELECT subj.id, 'Atomic Structure', 'atomic-structure' FROM subj ON CONFLICT DO NOTHING;

WITH ch AS (SELECT c.id, s.id as subject_id FROM chapters c JOIN subjects s ON c.subject_id=s.id WHERE c.slug='atomic-structure' LIMIT 1)
INSERT INTO topics (chapter_id, name, slug)
SELECT ch.id, 'Bohr Model', 'bohr-model' FROM ch ON CONFLICT DO NOTHING;

WITH t AS (SELECT t.id FROM topics t JOIN chapters c ON t.chapter_id=c.id JOIN subjects s ON c.subject_id=s.id WHERE s.slug='chemistry' AND t.slug='bohr-model' LIMIT 1)
INSERT INTO questions (exam_id, subject_id, chapter_id, topic_id, question_text, question_type, language, difficulty, ai_generated, verification_status)
SELECT e.id, s.id, c.id, t.id,
 'According to Bohr model, the angular momentum of an electron in the nth orbit is:', 'mcq', 'en', 'easy', false, 'approved'
FROM exams e, subjects s, chapters c, topics t WHERE e.slug='jee' AND s.slug='chemistry' AND t.slug='bohr-model' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO question_options (question_id, option_text, is_correct, position)
SELECT q.id, 'n h / 2π', false, 1 FROM questions q WHERE q.question_text ILIKE '%angular momentum of an electron in the nth orbit%' LIMIT 1
UNION ALL SELECT q.id, 'n h', false, 2 FROM questions q WHERE q.question_text ILIKE '%angular momentum of an electron in the nth orbit%' LIMIT 1
UNION ALL SELECT q.id, 'n h / 2π', false, 3 FROM questions q WHERE q.question_text ILIKE '%angular momentum of an electron in the nth orbit%' LIMIT 1
UNION ALL SELECT q.id, 'n h / 2π', false, 4 FROM questions q WHERE q.question_text ILIKE '%angular momentum of an electron in the nth orbit%' LIMIT 1
ON CONFLICT DO NOTHING;

-- Demo admin action log entry
INSERT INTO admin_actions (admin_id, action_type, action_meta)
SELECT id, 'seed_demo', jsonb_build_object('note','Seeded demo data') FROM profiles WHERE email='admin@prepverse.local' LIMIT 1
ON CONFLICT DO NOTHING;

-- End of demo seed
