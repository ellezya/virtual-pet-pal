-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('guest', 'individual', 'parent', 'child', 'teacher', 'school_admin', 'staff');

-- Create user_roles table (security best practice - separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create families table
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Family',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Create family_members junction table (parents)
CREATE TABLE public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'guardian')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (family_id, user_id)
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Create kids table
CREATE TABLE public.kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  pin_hash TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '👶',
  lola_time_from_chores INTEGER DEFAULT 0,
  lola_time_from_school INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  days_active INTEGER DEFAULT 0,
  last_active_date DATE,
  last_fed TIMESTAMP WITH TIME ZONE,
  last_watered TIMESTAMP WITH TIME ZONE,
  last_played TIMESTAMP WITH TIME ZONE,
  last_slept TIMESTAMP WITH TIME ZONE,
  unlocked_toys TEXT[] DEFAULT ARRAY['hayPile'],
  play_sessions INTEGER DEFAULT 0,
  chores_completed INTEGER DEFAULT 0,
  pet_state JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.kids ENABLE ROW LEVEL SECURITY;

-- Create chores table
CREATE TABLE public.chores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE NOT NULL,
  kid_id UUID REFERENCES public.kids(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  minutes_earned INTEGER NOT NULL DEFAULT 5,
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'once')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.chores ENABLE ROW LEVEL SECURITY;

-- Create chore_completions table
CREATE TABLE public.chore_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id UUID REFERENCES public.chores(id) ON DELETE CASCADE NOT NULL,
  kid_id UUID REFERENCES public.kids(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  minutes_earned INTEGER NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.chore_completions ENABLE ROW LEVEL SECURITY;

-- Function to check if user is family member
CREATE OR REPLACE FUNCTION public.is_family_member(_family_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE family_id = _family_id
      AND user_id = auth.uid()
  )
$$;

-- RLS policies for families
CREATE POLICY "Family members can view their family"
ON public.families
FOR SELECT
USING (is_family_member(id));

CREATE POLICY "Users can create families"
ON public.families
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Family members can update their family"
ON public.families
FOR UPDATE
USING (is_family_member(id));

-- RLS policies for family_members
CREATE POLICY "Family members can view members"
ON public.family_members
FOR SELECT
USING (is_family_member(family_id));

CREATE POLICY "Users can join families"
ON public.family_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for kids
CREATE POLICY "Family members can view kids"
ON public.kids
FOR SELECT
USING (is_family_member(family_id));

CREATE POLICY "Family members can add kids"
ON public.kids
FOR INSERT
WITH CHECK (is_family_member(family_id));

CREATE POLICY "Family members can update kids"
ON public.kids
FOR UPDATE
USING (is_family_member(family_id));

CREATE POLICY "Family members can delete kids"
ON public.kids
FOR DELETE
USING (is_family_member(family_id));

-- RLS policies for chores
CREATE POLICY "Family members can view chores"
ON public.chores
FOR SELECT
USING (is_family_member(family_id));

CREATE POLICY "Family members can add chores"
ON public.chores
FOR INSERT
WITH CHECK (is_family_member(family_id));

CREATE POLICY "Family members can update chores"
ON public.chores
FOR UPDATE
USING (is_family_member(family_id));

CREATE POLICY "Family members can delete chores"
ON public.chores
FOR DELETE
USING (is_family_member(family_id));

-- RLS policies for chore_completions
CREATE POLICY "Family members can view completions"
ON public.chore_completions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.kids k
  WHERE k.id = kid_id
  AND is_family_member(k.family_id)
));

CREATE POLICY "Family members can add completions"
ON public.chore_completions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.kids k
  WHERE k.id = kid_id
  AND is_family_member(k.family_id)
));

CREATE POLICY "Family members can update completions"
ON public.chore_completions
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.kids k
  WHERE k.id = kid_id
  AND is_family_member(k.family_id)
));

-- Add family_id to profiles for quick access
ALTER TABLE public.profiles ADD COLUMN family_id UUID REFERENCES public.families(id);

-- Trigger to update updated_at
CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON public.families
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_kids_updated_at
  BEFORE UPDATE ON public.kids
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_chores_updated_at
  BEFORE UPDATE ON public.chores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();