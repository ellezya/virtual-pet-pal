import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useClassroom } from '@/hooks/useClassroom';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ClassroomSession {
  id: string;
  classroom_id: string;
  teacher_id: string;
  is_active: boolean;
  is_paused: boolean;
  lola_sleeping: boolean;
  lola_happiness: number;
  lola_energy: number;
  lola_hunger: number;
  current_student_id: string | null;
  current_turn_started_at: string | null;
  time_per_student: number;
  rotation_queue: string[];
  rotation_mode: string;
  started_at: string;
  ended_at: string | null;
}

interface StudentInRotation {
  id: string;
  student_number: string;
  avatar_emoji: string;
  name: string; // For teacher's private view
}

export const useClassroomSession = () => {
  const { user } = useAuth();
  const { activeClassroom, students } = useClassroom();
  const { toast } = useToast();
  
  const [session, setSession] = useState<ClassroomSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate time remaining based on turn start
  const calculateTimeRemaining = useCallback((sess: ClassroomSession) => {
    if (!sess.current_turn_started_at || sess.is_paused || sess.lola_sleeping) {
      return sess.time_per_student;
    }
    const started = new Date(sess.current_turn_started_at).getTime();
    const elapsed = Math.floor((Date.now() - started) / 1000);
    return Math.max(0, sess.time_per_student - elapsed);
  }, []);

  // Fetch active session
  const fetchSession = useCallback(async () => {
    if (!activeClassroom || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('classroom_sessions')
        .select('*')
        .eq('classroom_id', activeClassroom.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const typedSession = data as unknown as ClassroomSession;
        setSession(typedSession);
        setTimeRemaining(calculateTimeRemaining(typedSession));
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  }, [activeClassroom, user, calculateTimeRemaining]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!activeClassroom || !user) return;

    fetchSession();

    // Subscribe to session changes
    channelRef.current = supabase
      .channel(`classroom-session-${activeClassroom.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'classroom_sessions',
          filter: `classroom_id=eq.${activeClassroom.id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setSession(null);
          } else {
            const newSession = payload.new as unknown as ClassroomSession;
            setSession(newSession);
            setTimeRemaining(calculateTimeRemaining(newSession));
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [activeClassroom, user, fetchSession, calculateTimeRemaining]);

  // Timer countdown
  useEffect(() => {
    if (!session || session.is_paused || session.lola_sleeping || !session.current_student_id) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-advance to next student when time runs out
          advanceToNextStudent();
          return session.time_per_student;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [session?.id, session?.is_paused, session?.lola_sleeping, session?.current_student_id]);

  // Start a new session
  const startSession = async (
    selectedStudents: string[],
    timePerStudent: number = 600,
    rotationMode: string = 'manual'
  ) => {
    if (!activeClassroom || !user) return null;
    
    setLoading(true);
    try {
      // End any existing active session
      await supabase
        .from('classroom_sessions')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('classroom_id', activeClassroom.id)
        .eq('is_active', true);

      // Create new session
      const { data, error } = await supabase
        .from('classroom_sessions')
        .insert({
          classroom_id: activeClassroom.id,
          teacher_id: user.id,
          time_per_student: timePerStudent,
          rotation_mode: rotationMode,
          rotation_queue: selectedStudents.slice(1), // Rest of queue
          current_student_id: selectedStudents[0] || null,
          current_turn_started_at: selectedStudents.length > 0 ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      
      const typedSession = data as unknown as ClassroomSession;
      setSession(typedSession);
      setTimeRemaining(timePerStudent);
      
      toast({
        title: 'Session Started!',
        description: `${selectedStudents.length} students in rotation`,
      });
      
      return typedSession;
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start session',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // End the current session
  const endSession = async () => {
    if (!session) return;
    
    try {
      await supabase
        .from('classroom_sessions')
        .update({ 
          is_active: false, 
          ended_at: new Date().toISOString() 
        })
        .eq('id', session.id);

      setSession(null);
      toast({
        title: 'Session Ended',
      });
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  // Advance to next student in rotation
  const advanceToNextStudent = async () => {
    if (!session) return;
    
    const queue = [...session.rotation_queue];
    const nextStudent = queue.shift();
    
    try {
      await supabase
        .from('classroom_sessions')
        .update({
          current_student_id: nextStudent || null,
          current_turn_started_at: nextStudent ? new Date().toISOString() : null,
          rotation_queue: queue,
        })
        .eq('id', session.id);
    } catch (error) {
      console.error('Error advancing student:', error);
    }
  };

  // Skip current student
  const skipStudent = async () => {
    await advanceToNextStudent();
    toast({ title: 'Skipped to next student' });
  };

  // Pause/resume session
  const togglePause = async () => {
    if (!session) return;
    
    try {
      await supabase
        .from('classroom_sessions')
        .update({ is_paused: !session.is_paused })
        .eq('id', session.id);
    } catch (error) {
      console.error('Error toggling pause:', error);
    }
  };

  // Put Lola to sleep / wake up
  const toggleSleep = async () => {
    if (!session) return;
    
    try {
      await supabase
        .from('classroom_sessions')
        .update({ lola_sleeping: !session.lola_sleeping })
        .eq('id', session.id);
      
      toast({
        title: session.lola_sleeping ? 'Lola is awake!' : 'Lola is sleeping 😴',
      });
    } catch (error) {
      console.error('Error toggling sleep:', error);
    }
  };

  // Update Lola's stats (from care actions)
  const updateLolaStats = async (updates: Partial<{
    lola_happiness: number;
    lola_energy: number;
    lola_hunger: number;
  }>) => {
    if (!session) return;
    
    try {
      await supabase
        .from('classroom_sessions')
        .update(updates)
        .eq('id', session.id);
    } catch (error) {
      console.error('Error updating Lola stats:', error);
    }
  };

  // Add more time to current student
  const addTime = async (seconds: number) => {
    if (!session || !session.current_turn_started_at) return;
    
    // Adjust turn start time to give more time
    const newStartTime = new Date(
      new Date(session.current_turn_started_at).getTime() + seconds * 1000
    ).toISOString();
    
    try {
      await supabase
        .from('classroom_sessions')
        .update({ current_turn_started_at: newStartTime })
        .eq('id', session.id);
      
      setTimeRemaining((prev) => prev + seconds);
    } catch (error) {
      console.error('Error adding time:', error);
    }
  };

  // Get current student info
  const getCurrentStudent = (): StudentInRotation | null => {
    if (!session?.current_student_id) return null;
    const student = students.find((s) => s.id === session.current_student_id);
    if (!student) return null;
    return {
      id: student.id,
      student_number: student.student_number,
      avatar_emoji: student.avatar_emoji,
      name: student.name,
    };
  };

  // Get rotation queue with student info
  const getRotationQueue = (): StudentInRotation[] => {
    if (!session) return [];
    return session.rotation_queue
      .map((id) => {
        const student = students.find((s) => s.id === id);
        if (!student) return null;
        return {
          id: student.id,
          student_number: student.student_number,
          avatar_emoji: student.avatar_emoji,
          name: student.name,
        };
      })
      .filter(Boolean) as StudentInRotation[];
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    session,
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    loading,
    currentStudent: getCurrentStudent(),
    rotationQueue: getRotationQueue(),
    
    // Actions
    startSession,
    endSession,
    skipStudent,
    togglePause,
    toggleSleep,
    updateLolaStats,
    addTime,
    advanceToNextStudent,
    
    // Helpers
    formatTime,
  };
};
