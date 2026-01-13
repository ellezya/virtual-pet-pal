-- Add total_care_actions column to user_progress table
ALTER TABLE public.user_progress 
ADD COLUMN total_care_actions integer NOT NULL DEFAULT 0;

-- Initialize existing users with approximated value (play_sessions + total_sessions as fallback)
UPDATE public.user_progress 
SET total_care_actions = COALESCE(play_sessions, 0) + COALESCE(total_sessions, 0);