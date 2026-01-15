-- Update hash_kid_pin function to use pgcrypto from extensions schema
CREATE OR REPLACE FUNCTION public.hash_kid_pin(p_pin text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- Use blowfish algorithm with cost factor 8 (good balance of security and speed)
  RETURN extensions.crypt(p_pin, extensions.gen_salt('bf', 8));
END;
$function$;

-- Update verify_kid_pin function to use pgcrypto from extensions schema
CREATE OR REPLACE FUNCTION public.verify_kid_pin(p_kid_id uuid, p_pin text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
  RETURN stored_hash = extensions.crypt(p_pin, stored_hash);
END;
$function$;