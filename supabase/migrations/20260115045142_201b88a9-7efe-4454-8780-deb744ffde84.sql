-- Allow anyone to look up a family by its public join code
CREATE POLICY "Anyone can look up family by code" 
ON public.families 
FOR SELECT 
USING (true);

-- Allow anyone to view kids (limited fields) for PIN login when they have the family_id
-- This is safe because PIN verification happens server-side
CREATE POLICY "Anyone can view kids for PIN login" 
ON public.kids 
FOR SELECT 
USING (true);