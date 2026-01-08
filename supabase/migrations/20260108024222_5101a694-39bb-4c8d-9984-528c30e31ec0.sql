-- Create profiles table for teachers
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create classrooms table
CREATE TABLE public.classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  classroom_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own classrooms" ON public.classrooms
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create classrooms" ON public.classrooms
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own classrooms" ON public.classrooms
  FOR UPDATE USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own classrooms" ON public.classrooms
  FOR DELETE USING (auth.uid() = teacher_id);

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '👤',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Security definer function to check classroom ownership
CREATE OR REPLACE FUNCTION public.is_classroom_owner(_classroom_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classrooms
    WHERE id = _classroom_id AND teacher_id = auth.uid()
  )
$$;

CREATE POLICY "Teachers can view students in own classrooms" ON public.students
  FOR SELECT USING (public.is_classroom_owner(classroom_id));

CREATE POLICY "Teachers can add students to own classrooms" ON public.students
  FOR INSERT WITH CHECK (public.is_classroom_owner(classroom_id));

CREATE POLICY "Teachers can update students in own classrooms" ON public.students
  FOR UPDATE USING (public.is_classroom_owner(classroom_id));

CREATE POLICY "Teachers can delete students from own classrooms" ON public.students
  FOR DELETE USING (public.is_classroom_owner(classroom_id));

-- Pet types enum
CREATE TYPE public.pet_type AS ENUM ('bunny', 'fish', 'hamster', 'turtle', 'bird');

-- Classroom pets table
CREATE TABLE public.classroom_pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE NOT NULL,
  pet_type public.pet_type NOT NULL DEFAULT 'bunny',
  name TEXT NOT NULL,
  hunger INTEGER DEFAULT 50 CHECK (hunger >= 0 AND hunger <= 100),
  happiness INTEGER DEFAULT 50 CHECK (happiness >= 0 AND happiness <= 100),
  cleanliness INTEGER DEFAULT 50 CHECK (cleanliness >= 0 AND cleanliness <= 100),
  energy INTEGER DEFAULT 50 CHECK (energy >= 0 AND energy <= 100),
  accessories TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.classroom_pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view pets in own classrooms" ON public.classroom_pets
  FOR SELECT USING (public.is_classroom_owner(classroom_id));

CREATE POLICY "Teachers can add pets to own classrooms" ON public.classroom_pets
  FOR INSERT WITH CHECK (public.is_classroom_owner(classroom_id));

CREATE POLICY "Teachers can update pets in own classrooms" ON public.classroom_pets
  FOR UPDATE USING (public.is_classroom_owner(classroom_id));

CREATE POLICY "Teachers can delete pets from own classrooms" ON public.classroom_pets
  FOR DELETE USING (public.is_classroom_owner(classroom_id));

-- Care logs table
CREATE TABLE public.care_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.classroom_pets(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.care_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check pet ownership via classroom
CREATE OR REPLACE FUNCTION public.is_pet_owner(_pet_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classroom_pets cp
    JOIN public.classrooms c ON cp.classroom_id = c.id
    WHERE cp.id = _pet_id AND c.teacher_id = auth.uid()
  )
$$;

CREATE POLICY "Teachers can view care logs for own pets" ON public.care_logs
  FOR SELECT USING (public.is_pet_owner(pet_id));

CREATE POLICY "Teachers can add care logs for own pets" ON public.care_logs
  FOR INSERT WITH CHECK (public.is_pet_owner(pet_id));

-- Pet helpers table (premium feature - assign students to help care)
CREATE TABLE public.pet_helpers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.classroom_pets(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  assigned_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(pet_id, student_id, assigned_date)
);

ALTER TABLE public.pet_helpers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view pet helpers for own pets" ON public.pet_helpers
  FOR SELECT USING (public.is_pet_owner(pet_id));

CREATE POLICY "Teachers can assign pet helpers for own pets" ON public.pet_helpers
  FOR INSERT WITH CHECK (public.is_pet_owner(pet_id));

CREATE POLICY "Teachers can remove pet helpers for own pets" ON public.pet_helpers
  FOR DELETE USING (public.is_pet_owner(pet_id));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate unique classroom codes
CREATE OR REPLACE FUNCTION public.generate_classroom_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substr(md5(random()::text), 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.classrooms WHERE classroom_code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_classrooms_updated_at
  BEFORE UPDATE ON public.classrooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_classroom_pets_updated_at
  BEFORE UPDATE ON public.classroom_pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();