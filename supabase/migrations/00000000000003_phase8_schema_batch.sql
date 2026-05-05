-- Phase 8 schema batch
-- Applied manually via Supabase SQL editor on 2026-05-05

-- 8A: district_student_id on students
ALTER TABLE culturezen.students
  ADD COLUMN IF NOT EXISTS district_student_id TEXT;

CREATE INDEX IF NOT EXISTS idx_students_district_id
  ON culturezen.students (district_student_id)
  WHERE district_student_id IS NOT NULL;

-- 8B: spedzen_connections join table
CREATE TABLE IF NOT EXISTS culturezen.spedzen_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  culturezen_student_id UUID NOT NULL REFERENCES culturezen.students(id) ON DELETE CASCADE,
  spedzen_student_id UUID NOT NULL,
  district_student_id TEXT,
  linked_at TIMESTAMPTZ DEFAULT now(),
  linked_by UUID REFERENCES auth.users(id),
  UNIQUE (culturezen_student_id, spedzen_student_id)
);

ALTER TABLE culturezen.spedzen_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School staff can view connections"
  ON culturezen.spedzen_connections FOR SELECT
  TO authenticated
  USING (culturezen.is_school_staff((
    SELECT c.school_id
    FROM culturezen.students s
    JOIN culturezen.classrooms c ON c.id = s.classroom_id
    WHERE s.id = culturezen_student_id
  )));

CREATE POLICY "School admins can manage connections"
  ON culturezen.spedzen_connections FOR ALL
  TO authenticated
  USING (culturezen.has_role(auth.uid(), 'school_admin'::culturezen.app_role))
  WITH CHECK (culturezen.has_role(auth.uid(), 'school_admin'::culturezen.app_role));

-- 8C: rename individual → family_individual in app_role enum
-- Note: ALTER TYPE RENAME VALUE updates stored data in-place; no UPDATE needed.
ALTER TYPE culturezen.app_role RENAME VALUE 'individual' TO 'family_individual';
