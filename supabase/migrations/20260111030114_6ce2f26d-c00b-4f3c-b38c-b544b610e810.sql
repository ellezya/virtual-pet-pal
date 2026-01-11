-- Add unlockable toys tracking columns to user_progress
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS unlocked_toys TEXT[] DEFAULT ARRAY['hayPile']::TEXT[],
ADD COLUMN IF NOT EXISTS chores_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS school_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS play_sessions INTEGER DEFAULT 0;