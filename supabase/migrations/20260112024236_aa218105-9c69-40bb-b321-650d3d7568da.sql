-- Create classroom_sessions table for tracking active display sessions
CREATE TABLE public.classroom_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id),
  
  -- Session status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_paused BOOLEAN NOT NULL DEFAULT false,
  
  -- Lola status
  lola_sleeping BOOLEAN NOT NULL DEFAULT false,
  lola_happiness INTEGER NOT NULL DEFAULT 80,
  lola_energy INTEGER NOT NULL DEFAULT 70,
  lola_hunger INTEGER NOT NULL DEFAULT 50,
  
  -- Current rotation
  current_student_id UUID REFERENCES public.students(id),
  current_turn_started_at TIMESTAMP WITH TIME ZONE,
  time_per_student INTEGER NOT NULL DEFAULT 600, -- seconds (10 min default)
  
  -- Rotation queue (array of student IDs)
  rotation_queue UUID[] NOT NULL DEFAULT '{}',
  rotation_mode TEXT NOT NULL DEFAULT 'manual', -- manual, points_weighted, alphabetical, random
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.classroom_sessions ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own sessions
CREATE POLICY "Teachers can view own sessions" 
  ON public.classroom_sessions 
  FOR SELECT 
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create sessions" 
  ON public.classroom_sessions 
  FOR INSERT 
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update own sessions" 
  ON public.classroom_sessions 
  FOR UPDATE 
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own sessions" 
  ON public.classroom_sessions 
  FOR DELETE 
  USING (teacher_id = auth.uid());

-- Enable realtime for classroom sessions (for SmartBoard sync)
ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_sessions;

-- Add updated_at trigger
CREATE TRIGGER update_classroom_sessions_updated_at
  BEFORE UPDATE ON public.classroom_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();