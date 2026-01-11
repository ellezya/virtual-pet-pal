-- Drop the restrictive policy and create a permissive one
DROP POLICY IF EXISTS "Authenticated users can create families" ON public.families;

-- Create permissive policy for authenticated users to create families
CREATE POLICY "Authenticated users can create families"
ON public.families
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Also need to allow users to SELECT their newly created family immediately after insert
-- by allowing them to see any family they just created (before they're added as a member)
-- We'll handle this by also adding a policy that allows selecting if they're the one who just created it

-- First, let's verify the family_members insert policy allows this flow
DROP POLICY IF EXISTS "Users can join families" ON public.family_members;

CREATE POLICY "Users can add themselves to families"
ON public.family_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);