-- Update verify_kid_pin to properly compare hashed PINs
-- The function now expects the client to pass the same hash it stores
CREATE OR REPLACE FUNCTION public.verify_kid_pin(p_kid_id uuid, p_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
  input_hash text;
BEGIN
  -- Get the stored pin hash (only if user is family member)
  SELECT pin_hash INTO stored_hash
  FROM public.kids
  WHERE id = p_kid_id
  AND is_family_member(family_id);
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Hash the input PIN the same way client does: SHA-256 with salt
  -- Using pgcrypto's encode/digest for server-side hashing
  SELECT encode(digest(p_pin || 'lola-salt-2024', 'sha256'), 'hex') INTO input_hash;
  
  -- Compare the hashes
  RETURN stored_hash = input_hash;
END;
$$;