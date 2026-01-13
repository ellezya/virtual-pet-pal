-- SECURITY FIX: Replace overly permissive families INSERT policy
-- This policy should require the user to become a family member, which is handled
-- by the create-family edge function. For direct inserts, we restrict it.
DROP POLICY IF EXISTS "Authenticated users can create families" ON public.families;

-- New policy: Only allow inserts where the user will be added as a member
-- Since family creation happens via edge function with service role, 
-- we can make this more restrictive for direct client access
CREATE POLICY "Service can create families"
ON public.families
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user will be added as a member in same transaction
  -- This is a placeholder that effectively blocks direct client inserts
  -- since family creation goes through the create-family edge function
  EXISTS (
    SELECT 1 FROM public.family_members 
    WHERE family_id = families.id 
    AND user_id = auth.uid()
  )
);

-- ADD PARENT VISIBILITY POLICIES

-- Parents can view store items in their linked students' classrooms
CREATE POLICY "Parents can view linked classroom store items"
ON public.store_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN kids k ON s.linked_kid_id = k.id
    JOIN family_members fm ON k.family_id = fm.family_id
    WHERE s.classroom_id = store_items.classroom_id
    AND fm.user_id = auth.uid()
  )
);

-- Parents can view orders for their linked students
CREATE POLICY "Parents can view linked student orders"
ON public.store_orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN kids k ON s.linked_kid_id = k.id
    JOIN family_members fm ON k.family_id = fm.family_id
    WHERE s.id = store_orders.student_id
    AND fm.user_id = auth.uid()
  )
);

-- Parents can view order items for their linked students' orders
CREATE POLICY "Parents can view linked student order items"
ON public.store_order_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM store_orders o
    JOIN students s ON o.student_id = s.id
    JOIN kids k ON s.linked_kid_id = k.id
    JOIN family_members fm ON k.family_id = fm.family_id
    WHERE o.id = store_order_items.order_id
    AND fm.user_id = auth.uid()
  )
);

-- Parents can view classroom pets in their linked students' classrooms
CREATE POLICY "Parents can view linked classroom pets"
ON public.classroom_pets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN kids k ON s.linked_kid_id = k.id
    JOIN family_members fm ON k.family_id = fm.family_id
    WHERE s.classroom_id = classroom_pets.classroom_id
    AND fm.user_id = auth.uid()
  )
);

-- Parents can view pet helper assignments for their linked students
CREATE POLICY "Parents can view linked student pet helpers"
ON public.pet_helpers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN kids k ON s.linked_kid_id = k.id
    JOIN family_members fm ON k.family_id = fm.family_id
    WHERE s.id = pet_helpers.student_id
    AND fm.user_id = auth.uid()
  )
);

-- Parents can view care logs created by their linked students
CREATE POLICY "Parents can view linked student care logs"
ON public.care_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM students s
    JOIN kids k ON s.linked_kid_id = k.id
    JOIN family_members fm ON k.family_id = fm.family_id
    WHERE s.id = care_logs.student_id
    AND fm.user_id = auth.uid()
  )
);

-- CREATE SERVER-SIDE PIN VERIFICATION FUNCTION
-- This allows PIN verification without exposing the hash to clients
CREATE OR REPLACE FUNCTION public.verify_kid_pin(p_kid_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
  computed_hash text;
BEGIN
  -- Get the stored pin hash (only if user is family member)
  SELECT pin_hash INTO stored_hash
  FROM public.kids
  WHERE id = p_kid_id
  AND is_family_member(family_id);
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Simple comparison (assuming pin_hash is just the pin for now)
  -- In production, use proper hashing like pgcrypto's crypt()
  RETURN stored_hash = p_pin;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.verify_kid_pin(uuid, text) TO authenticated;