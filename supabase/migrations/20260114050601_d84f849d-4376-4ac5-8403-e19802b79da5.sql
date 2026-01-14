-- Add school_name column to profiles for teachers
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_name text;

-- Add teacher_beta_approved column to track approved beta teachers
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teacher_beta_approved boolean DEFAULT false;

-- Create teacher waitlist table
CREATE TABLE IF NOT EXISTS public.teacher_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  school_name text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  notified_at timestamp with time zone,
  UNIQUE(user_id)
);

-- Enable RLS on teacher_waitlist
ALTER TABLE public.teacher_waitlist ENABLE ROW LEVEL SECURITY;

-- Users can view and insert their own waitlist entry
CREATE POLICY "Users can view their own waitlist entry"
ON public.teacher_waitlist
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own waitlist entry"
ON public.teacher_waitlist
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to check if teacher is from approved school (Twin Cities Academy)
CREATE OR REPLACE FUNCTION public.is_approved_teacher_school(school text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    LOWER(TRIM(school)) LIKE '%twin cities academy%',
    false
  );
$$;

-- Create function to check if user has teacher beta access
CREATE OR REPLACE FUNCTION public.has_teacher_beta_access(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT teacher_beta_approved FROM public.profiles WHERE id = p_user_id)
    OR public.is_approved_teacher_school((SELECT school_name FROM public.profiles WHERE id = p_user_id)),
    false
  );
$$;