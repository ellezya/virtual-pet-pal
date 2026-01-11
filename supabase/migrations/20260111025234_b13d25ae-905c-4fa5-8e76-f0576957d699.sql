-- Create user_progress table for storing game progress
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Care timestamps
  last_fed TIMESTAMP WITH TIME ZONE,
  last_watered TIMESTAMP WITH TIME ZONE,
  last_played TIMESTAMP WITH TIME ZONE,
  last_slept TIMESTAMP WITH TIME ZONE,
  
  -- Session stats
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  days_active INTEGER NOT NULL DEFAULT 0,
  
  -- Streaks
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  
  -- Lola time (in minutes)
  lola_time_remaining INTEGER NOT NULL DEFAULT 30,
  
  -- Pet state (synced from localStorage for account users)
  pet_state JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- One progress record per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Users can only view their own progress
CREATE POLICY "Users can view own progress"
ON public.user_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress"
ON public.user_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
ON public.user_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add account_prompt_dismissed_at to profiles for tracking when user dismissed the account prompt
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_prompt_dismissed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS first_play_at TIMESTAMP WITH TIME ZONE;