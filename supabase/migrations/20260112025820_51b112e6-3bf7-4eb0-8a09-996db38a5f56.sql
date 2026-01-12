-- Add link_code column to students table for parent linking
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS link_code VARCHAR(8) UNIQUE;

-- Create a function to generate unique link codes
CREATE OR REPLACE FUNCTION public.generate_student_link_code()
RETURNS VARCHAR(8) AS $$
DECLARE
    new_code VARCHAR(8);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 6-character alphanumeric code (uppercase letters + numbers)
        new_code := upper(substring(md5(random()::text) from 1 for 6));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.students WHERE link_code = new_code) INTO code_exists;
        
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-generate link codes for new students
CREATE OR REPLACE FUNCTION public.set_student_link_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.link_code IS NULL THEN
        NEW.link_code := public.generate_student_link_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on students table
DROP TRIGGER IF EXISTS trigger_set_student_link_code ON public.students;
CREATE TRIGGER trigger_set_student_link_code
    BEFORE INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.set_student_link_code();

-- Backfill existing students with link codes
UPDATE public.students 
SET link_code = public.generate_student_link_code()
WHERE link_code IS NULL;

-- Create a function to convert school points to Lola time (1 point = 1 minute)
-- This runs when points are awarded and the student is linked to a kid
CREATE OR REPLACE FUNCTION public.sync_school_points_to_lola_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if student is linked to a kid
    IF EXISTS (
        SELECT 1 FROM public.students 
        WHERE id = NEW.student_id 
        AND linked_kid_id IS NOT NULL
    ) THEN
        -- Add the awarded points as Lola time (in minutes)
        UPDATE public.kids
        SET lola_time_from_school = COALESCE(lola_time_from_school, 0) + NEW.points
        WHERE id = (
            SELECT linked_kid_id FROM public.students WHERE id = NEW.student_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on school_points_log to sync points to Lola time
DROP TRIGGER IF EXISTS trigger_sync_points_to_lola ON public.school_points_log;
CREATE TRIGGER trigger_sync_points_to_lola
    AFTER INSERT ON public.school_points_log
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_school_points_to_lola_time();