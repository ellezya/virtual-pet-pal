-- Create a safe view for students that excludes sensitive columns
-- This view will be used for displaying classmates (excluding link_code, email, user_id, linked_kid_id)
CREATE VIEW public.students_safe 
WITH (security_invoker=on) AS
SELECT 
  id, 
  classroom_id, 
  name, 
  avatar_emoji, 
  student_number, 
  school_points, 
  status, 
  joined_at,
  created_at
FROM public.students;

-- Grant access to the view
GRANT SELECT ON public.students_safe TO authenticated;

-- Drop the problematic policy that exposes all columns to classmates
DROP POLICY IF EXISTS "Students can view classmates" ON public.students;

-- Create a more restrictive policy - students can only view their OWN full record
-- For viewing classmates, they must use the students_safe view
-- Teachers and parents policies remain unchanged
CREATE POLICY "Students can view their own full data"
ON public.students
FOR SELECT
TO authenticated
USING (user_id = auth.uid());