-- Fix overly permissive INSERT policy on families
DROP POLICY "Users can create families" ON public.families;

-- Only authenticated users can create families
CREATE POLICY "Authenticated users can create families"
ON public.families
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);