-- Create daily_care_items table for storing user's care items
CREATE TABLE public.daily_care_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  item_text TEXT NOT NULL CHECK (char_length(item_text) <= 100),
  difficulty_text TEXT CHECK (char_length(difficulty_text) <= 200),
  item_order INTEGER NOT NULL CHECK (item_order >= 1 AND item_order <= 3),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  journal_entry TEXT,
  remind_later_count INTEGER NOT NULL DEFAULT 0,
  peptalk_count INTEGER NOT NULL DEFAULT 0,
  last_reminded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, item_order)
);

-- Create care_journal table for historical tracking
CREATE TABLE public.care_journal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  care_item TEXT NOT NULL,
  difficulty_text TEXT,
  completed_at TIMESTAMPTZ NOT NULL,
  journal_entry TEXT,
  lola_feed_count INTEGER DEFAULT 0,
  lola_water_count INTEGER DEFAULT 0,
  lola_play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add self-care related fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS care_items_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_frequency TEXT DEFAULT '3hours' CHECK (reminder_frequency IN ('1hour', '3hours', 'off')),
ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quiet_hours_start TIME DEFAULT '22:00',
ADD COLUMN IF NOT EXISTS quiet_hours_end TIME DEFAULT '07:00',
ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS next_reminder_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS encouragement_flag_dismissed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS user_type TEXT CHECK (user_type IN ('individual', 'parent', 'teacher', 'kid')),
ADD COLUMN IF NOT EXISTS also_teacher BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS also_parent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS account_type_set_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_end_of_day_shown DATE;

-- Enable RLS on new tables
ALTER TABLE public.daily_care_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_journal ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_care_items
CREATE POLICY "Users can view their own care items"
  ON public.daily_care_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own care items"
  ON public.daily_care_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own care items"
  ON public.daily_care_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own care items"
  ON public.daily_care_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for care_journal
CREATE POLICY "Users can view their own journal"
  ON public.care_journal FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal entries"
  ON public.care_journal FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON public.care_journal FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON public.care_journal FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at on daily_care_items (using existing function)
CREATE TRIGGER update_daily_care_items_updated_at
  BEFORE UPDATE ON public.daily_care_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for better query performance
CREATE INDEX idx_daily_care_items_user_date ON public.daily_care_items(user_id, date);
CREATE INDEX idx_care_journal_user_date ON public.care_journal(user_id, date);