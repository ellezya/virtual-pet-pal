-- Drop existing RESTRICTIVE policies on daily_care_items
DROP POLICY IF EXISTS "Users can create their own care items" ON public.daily_care_items;
DROP POLICY IF EXISTS "Users can delete their own care items" ON public.daily_care_items;
DROP POLICY IF EXISTS "Users can update their own care items" ON public.daily_care_items;
DROP POLICY IF EXISTS "Users can view their own care items" ON public.daily_care_items;

-- Recreate policies as PERMISSIVE (default)
CREATE POLICY "Users can create their own care items"
ON public.daily_care_items
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own care items"
ON public.daily_care_items
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own care items"
ON public.daily_care_items
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own care items"
ON public.daily_care_items
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Also fix care_journal policies if they have the same issue
DROP POLICY IF EXISTS "Users can create their own journal entries" ON public.care_journal;
DROP POLICY IF EXISTS "Users can view their own journal" ON public.care_journal;
DROP POLICY IF EXISTS "Users can update their own journal entries" ON public.care_journal;
DROP POLICY IF EXISTS "Users can delete their own journal entries" ON public.care_journal;

CREATE POLICY "Users can create their own journal entries"
ON public.care_journal
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own journal"
ON public.care_journal
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
ON public.care_journal
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
ON public.care_journal
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);