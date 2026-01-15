-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can look up family by code" ON public.families;
DROP POLICY IF EXISTS "Anyone can view kids for PIN login" ON public.kids;

-- Create a security definer function to look up family by code
-- This returns only the id and name, never exposes all families
CREATE OR REPLACE FUNCTION public.lookup_family_by_code(p_code text)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.id, f.name
  FROM public.families f
  WHERE f.family_code = UPPER(p_code)
  LIMIT 1;
$$;

-- Create a security definer function to get kids for PIN login
-- Only returns id, name, age, avatar_emoji - NOT pin_hash or other sensitive fields
CREATE OR REPLACE FUNCTION public.get_kids_for_login(p_family_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  age integer,
  avatar_emoji text,
  lola_time_from_chores integer,
  lola_time_from_school integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT k.id, k.name, k.age, k.avatar_emoji, k.lola_time_from_chores, k.lola_time_from_school
  FROM public.kids k
  WHERE k.family_id = p_family_id;
$$;