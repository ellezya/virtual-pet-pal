-- Drop the overly permissive policy and create a proper one
DROP POLICY IF EXISTS "Principals can create schools" ON public.schools;

-- Teachers can create schools when inviting a principal
-- The school is created first, then the principal invite
CREATE POLICY "Authenticated users can create schools"
ON public.schools FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);