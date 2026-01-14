-- Add user_id and status columns to students table for self-registration
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('pending', 'active', 'removed')),
ADD COLUMN IF NOT EXISTS joined_at timestamptz;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_user_id ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);

-- Add student role to app_role enum if not exists (it already has the roles we need)
-- We'll use 'child' role for students since it's already in the enum

-- Update RLS policies to allow students to read their own data
CREATE POLICY "Students can view their own data"
ON public.students
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Update RLS policy to allow students to join classrooms
CREATE POLICY "Authenticated users can join classrooms"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.classrooms 
    WHERE classrooms.id = classroom_id
  )
);

-- Allow students to view classroom info when they're members
CREATE POLICY "Students can view their classroom"
ON public.classrooms
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.classroom_id = classrooms.id 
    AND students.user_id = auth.uid()
  )
);

-- Allow students to see other students in their classrooms (for display mode)
CREATE POLICY "Students can view classmates"
ON public.students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students AS s 
    WHERE s.classroom_id = students.classroom_id 
    AND s.user_id = auth.uid()
  )
);

-- Allow students to view their own points log
CREATE POLICY "Students can view their own points log"
ON public.school_points_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.id = school_points_log.student_id 
    AND students.user_id = auth.uid()
  )
);

-- Allow students to view store items in their classroom
CREATE POLICY "Students can view store items"
ON public.store_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.classroom_id = store_items.classroom_id 
    AND students.user_id = auth.uid()
  )
);

-- Allow students to create store orders
CREATE POLICY "Students can create their own orders"
ON public.store_orders
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.id = store_orders.student_id 
    AND students.user_id = auth.uid()
  )
);

-- Allow students to view their own orders
CREATE POLICY "Students can view their own orders"
ON public.store_orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.id = store_orders.student_id 
    AND students.user_id = auth.uid()
  )
);

-- Allow students to create order items for their orders
CREATE POLICY "Students can create order items"
ON public.store_order_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.store_orders 
    JOIN public.students ON students.id = store_orders.student_id
    WHERE store_orders.id = store_order_items.order_id 
    AND students.user_id = auth.uid()
  )
);

-- Allow students to view their own order items
CREATE POLICY "Students can view their own order items"
ON public.store_order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.store_orders 
    JOIN public.students ON students.id = store_orders.student_id
    WHERE store_orders.id = store_order_items.order_id 
    AND students.user_id = auth.uid()
  )
);