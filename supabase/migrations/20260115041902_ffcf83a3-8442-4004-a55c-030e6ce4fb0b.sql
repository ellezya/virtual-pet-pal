-- Add family_code column to families table
ALTER TABLE public.families 
ADD COLUMN family_code TEXT UNIQUE;

-- Create function to generate family code (similar to classroom code)
CREATE OR REPLACE FUNCTION public.generate_family_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Create trigger to auto-generate family_code on insert
CREATE OR REPLACE FUNCTION public.set_family_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.family_code IS NULL THEN
    LOOP
      new_code := generate_family_code();
      SELECT EXISTS(SELECT 1 FROM families WHERE family_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.family_code := new_code;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_family_code_trigger
BEFORE INSERT ON public.families
FOR EACH ROW
EXECUTE FUNCTION public.set_family_code();

-- Backfill existing families with codes
DO $$
DECLARE
  fam RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  FOR fam IN SELECT id FROM families WHERE family_code IS NULL LOOP
    LOOP
      new_code := generate_family_code();
      SELECT EXISTS(SELECT 1 FROM families WHERE family_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    UPDATE families SET family_code = new_code WHERE id = fam.id;
  END LOOP;
END;
$$;

-- Make family_code NOT NULL after backfill
ALTER TABLE public.families ALTER COLUMN family_code SET NOT NULL;