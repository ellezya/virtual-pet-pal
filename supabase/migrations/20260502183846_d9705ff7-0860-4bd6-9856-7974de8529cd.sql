
-- Create daily check-ins table for student mood tracking
CREATE TABLE public.daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  classroom_id UUID NOT NULL,
  mood_emoji TEXT NOT NULL,
  mood_label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- Students can insert their own check-ins
CREATE POLICY "Students can insert own checkins"
ON public.daily_checkins
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = daily_checkins.student_id
      AND students.user_id = auth.uid()
      AND students.classroom_id = daily_checkins.classroom_id
  )
);

-- Students can view their own check-ins only
CREATE POLICY "Students can view own checkins"
ON public.daily_checkins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students
    WHERE students.id = daily_checkins.student_id
      AND students.user_id = auth.uid()
  )
);

-- Teachers can view check-ins for students in their classrooms (aggregate use)
CREATE POLICY "Teachers can view checkins for own classrooms"
ON public.daily_checkins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE classrooms.id = daily_checkins.classroom_id
      AND classrooms.teacher_id = auth.uid()
  )
);

-- Index for efficient teacher queries (mood overview by classroom + date)
CREATE INDEX idx_daily_checkins_classroom_date
ON public.daily_checkins (classroom_id, created_at DESC);

-- Index for student lookup
CREATE INDEX idx_daily_checkins_student
ON public.daily_checkins (student_id, created_at DESC);
