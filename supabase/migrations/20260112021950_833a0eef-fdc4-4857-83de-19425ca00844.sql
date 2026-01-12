
-- Add student_number and school_points to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS student_number text,
ADD COLUMN IF NOT EXISTS school_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS linked_kid_id uuid REFERENCES public.kids(id) ON DELETE SET NULL;

-- Create unique constraint on student_number per classroom
CREATE UNIQUE INDEX IF NOT EXISTS students_classroom_number_unique 
ON public.students (classroom_id, student_number);

-- Add 'teacher' to app_role enum if not exists
DO $$ BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create school_points_log table for tracking point history
CREATE TABLE IF NOT EXISTS public.school_points_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    points integer NOT NULL,
    reason text NOT NULL,
    awarded_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on school_points_log
ALTER TABLE public.school_points_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for school_points_log
CREATE POLICY "Teachers can view points log for own students"
ON public.school_points_log
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.classrooms c ON s.classroom_id = c.id
        WHERE s.id = school_points_log.student_id
        AND c.teacher_id = auth.uid()
    )
);

CREATE POLICY "Teachers can insert points for own students"
ON public.school_points_log
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.classrooms c ON s.classroom_id = c.id
        WHERE s.id = school_points_log.student_id
        AND c.teacher_id = auth.uid()
    )
);

-- Create function to generate student number
CREATE OR REPLACE FUNCTION public.generate_student_number(p_classroom_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    max_num integer;
    new_num text;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(student_number FROM 2) AS integer)), 0) + 1
    INTO max_num
    FROM public.students
    WHERE classroom_id = p_classroom_id
    AND student_number ~ '^#[0-9]+$';
    
    new_num := '#' || LPAD(max_num::text, 3, '0');
    RETURN new_num;
END;
$$;

-- Create function to check if user is classroom member (student's parent linked)
CREATE OR REPLACE FUNCTION public.is_classroom_member(p_classroom_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.kids k ON s.linked_kid_id = k.id
    JOIN public.family_members fm ON k.family_id = fm.family_id
    WHERE s.classroom_id = p_classroom_id
    AND fm.user_id = auth.uid()
  )
$$;

-- Add policy for parents to view students linked to their kids
CREATE POLICY "Parents can view linked students"
ON public.students
FOR SELECT
USING (
    linked_kid_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.kids k
        JOIN public.family_members fm ON k.family_id = fm.family_id
        WHERE k.id = students.linked_kid_id
        AND fm.user_id = auth.uid()
    )
);

-- Add policy for parents to view classrooms their kids are in
CREATE POLICY "Parents can view linked classrooms"
ON public.classrooms
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.kids k ON s.linked_kid_id = k.id
        JOIN public.family_members fm ON k.family_id = fm.family_id
        WHERE s.classroom_id = classrooms.id
        AND fm.user_id = auth.uid()
    )
);

-- Add policy for parents to view points log for their linked kids
CREATE POLICY "Parents can view linked student points"
ON public.school_points_log
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.students s
        JOIN public.kids k ON s.linked_kid_id = k.id
        JOIN public.family_members fm ON k.family_id = fm.family_id
        WHERE s.id = school_points_log.student_id
        AND fm.user_id = auth.uid()
    )
);
