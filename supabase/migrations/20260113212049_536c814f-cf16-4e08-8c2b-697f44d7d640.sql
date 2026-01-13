-- Enable pgcrypto extension for proper password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to hash PINs on kid creation/update
-- This uses bcrypt (via crypt with bf algorithm) which is much stronger than SHA-256
CREATE OR REPLACE FUNCTION public.hash_kid_pin(p_pin text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use blowfish algorithm with cost factor 8 (good balance of security and speed)
  RETURN crypt(p_pin, gen_salt('bf', 8));
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.hash_kid_pin(text) TO authenticated;

-- Update verify_kid_pin to use bcrypt comparison
-- The function now expects a PLAIN PIN and compares it against the bcrypt hash
CREATE OR REPLACE FUNCTION public.verify_kid_pin(p_kid_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  -- Get the stored pin hash (only if user is family member)
  SELECT pin_hash INTO stored_hash
  FROM public.kids
  WHERE id = p_kid_id
  AND is_family_member(family_id);
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Use crypt() to verify the PIN against the bcrypt hash
  -- crypt(password, hash) returns the hash if password matches
  RETURN stored_hash = crypt(p_pin, stored_hash);
END;
$$;

-- Migrate existing SHA-256 hashes to bcrypt
-- Since we can't reverse SHA-256, we need to re-hash all existing PINs
-- For now, we'll set a flag that requires PIN reset on next login
-- But since this is a new app with likely no production data, we can just clear old hashes

-- If there are existing kids with old SHA-256 hashes, they'll need PIN reset
-- Add a column to track if PIN needs reset (optional, for production use)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'kids' 
    AND column_name = 'pin_needs_reset'
  ) THEN
    ALTER TABLE public.kids ADD COLUMN pin_needs_reset boolean DEFAULT false;
  END IF;
END $$;

-- Mark all existing kids as needing PIN reset since their hashes are SHA-256
-- Only if there are existing records with SHA-256 hashes (they start with lowercase hex chars)
UPDATE public.kids 
SET pin_needs_reset = true 
WHERE pin_hash IS NOT NULL 
AND pin_hash ~ '^[a-f0-9]{64}$';  -- SHA-256 produces 64 hex chars