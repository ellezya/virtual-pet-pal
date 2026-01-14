-- Add 'principal' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'principal';

-- Create schools table
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT, -- Optional email domain for the school
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Create school_staff table to track principals and admins
CREATE TABLE public.school_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('principal', 'school_admin')),
  invited_by UUID,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, user_id)
);

-- Enable RLS on school_staff
ALTER TABLE public.school_staff ENABLE ROW LEVEL SECURITY;

-- Add school_id to classrooms table
ALTER TABLE public.classrooms ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

-- Add store_enabled to store_settings to track if admin has activated it
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS store_enabled_by UUID;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS store_enabled_at TIMESTAMPTZ;

-- Helper function to check if user is school staff with specific role
CREATE OR REPLACE FUNCTION public.is_school_staff(p_school_id UUID, p_role TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_staff
    WHERE school_id = p_school_id 
      AND user_id = auth.uid()
      AND accepted_at IS NOT NULL
      AND (p_role IS NULL OR role = p_role)
  )
$$;

-- Helper function to check if user is principal of any school that contains a classroom
CREATE OR REPLACE FUNCTION public.is_classroom_principal(p_classroom_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.classrooms c
    JOIN public.school_staff ss ON ss.school_id = c.school_id
    WHERE c.id = p_classroom_id
      AND ss.user_id = auth.uid()
      AND ss.role = 'principal'
      AND ss.accepted_at IS NOT NULL
  )
$$;

-- Helper function to check if user is admin of any school that contains a classroom
CREATE OR REPLACE FUNCTION public.is_classroom_admin(p_classroom_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.classrooms c
    JOIN public.school_staff ss ON ss.school_id = c.school_id
    WHERE c.id = p_classroom_id
      AND ss.user_id = auth.uid()
      AND ss.role = 'school_admin'
      AND ss.accepted_at IS NOT NULL
  )
$$;

-- RLS policies for schools
CREATE POLICY "Staff can view their schools"
ON public.schools FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.school_staff
    WHERE school_staff.school_id = schools.id
      AND school_staff.user_id = auth.uid()
      AND school_staff.accepted_at IS NOT NULL
  )
);

CREATE POLICY "Teachers can view schools their classrooms belong to"
ON public.schools FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE classrooms.school_id = schools.id
      AND classrooms.teacher_id = auth.uid()
  )
);

CREATE POLICY "Principals can create schools"
ON public.schools FOR INSERT
WITH CHECK (true);

CREATE POLICY "Principals can update their schools"
ON public.schools FOR UPDATE
USING (is_school_staff(id, 'principal'));

-- RLS policies for school_staff
CREATE POLICY "Staff can view their school's staff"
ON public.school_staff FOR SELECT
USING (
  is_school_staff(school_id) OR user_id = auth.uid()
);

CREATE POLICY "Teachers can view pending invites for them"
ON public.school_staff FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Teachers can invite principals to schools"
ON public.school_staff FOR INSERT
WITH CHECK (role = 'principal');

CREATE POLICY "Principals can invite admins"
ON public.school_staff FOR INSERT
WITH CHECK (
  role = 'school_admin' 
  AND is_school_staff(school_id, 'principal')
);

CREATE POLICY "Staff can update their own acceptance"
ON public.school_staff FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Principals can remove staff"
ON public.school_staff FOR DELETE
USING (is_school_staff(school_id, 'principal'));

-- Update classrooms policies to allow principals to view
CREATE POLICY "Principals can view school classrooms"
ON public.classrooms FOR SELECT
USING (
  school_id IS NOT NULL AND is_school_staff(school_id, 'principal')
);

CREATE POLICY "Admins can view school classrooms"
ON public.classrooms FOR SELECT
USING (
  school_id IS NOT NULL AND is_school_staff(school_id, 'school_admin')
);

-- Update store_settings policies for admins
CREATE POLICY "School admins can view store settings"
ON public.store_settings FOR SELECT
USING (is_classroom_admin(classroom_id));

CREATE POLICY "School admins can update store settings"
ON public.store_settings FOR UPDATE
USING (is_classroom_admin(classroom_id));

CREATE POLICY "School admins can create store settings"
ON public.store_settings FOR INSERT
WITH CHECK (is_classroom_admin(classroom_id));

-- Students policies for principals/admins
CREATE POLICY "Principals can view school students"
ON public.students FOR SELECT
USING (is_classroom_principal(classroom_id));

CREATE POLICY "Admins can view school students"
ON public.students FOR SELECT
USING (is_classroom_admin(classroom_id));

-- Store items policies for admins
CREATE POLICY "School admins can manage store items"
ON public.store_items FOR ALL
USING (is_classroom_admin(classroom_id));

-- Store orders policies for admins  
CREATE POLICY "School admins can view store orders"
ON public.store_orders FOR SELECT
USING (is_classroom_admin(classroom_id));

CREATE POLICY "School admins can update store orders"
ON public.store_orders FOR UPDATE
USING (is_classroom_admin(classroom_id));