import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  name: string;
  avatar_emoji: string;
  student_number: string;
  school_points: number;
  linked_kid_id?: string | null;
  classroom_id: string;
}

interface Classroom {
  id: string;
  name: string;
  classroom_code: string;
  teacher_id: string;
  created_at: string;
}

interface PointsLog {
  id: string;
  student_id: string;
  points: number;
  reason: string;
  awarded_by: string;
  created_at: string;
}

interface ClassroomContextType {
  classrooms: Classroom[];
  activeClassroom: Classroom | null;
  students: Student[];
  pointsLog: PointsLog[];
  loading: boolean;
  isTeacher: boolean;
  
  // Classroom management
  createClassroom: (name: string) => Promise<Classroom | null>;
  selectClassroom: (classroomId: string) => void;
  deleteClassroom: (classroomId: string) => Promise<void>;
  
  // Student management
  addStudent: (name: string, avatarEmoji?: string) => Promise<Student | null>;
  bulkAddStudents: (students: Array<{ name: string; avatar_emoji?: string }>) => Promise<number>;
  updateStudent: (studentId: string, name?: string, avatarEmoji?: string) => Promise<void>;
  removeStudent: (studentId: string) => Promise<void>;
  
  // Point awarding
  awardPoints: (studentId: string, points: number, reason: string) => Promise<void>;
  
  // Refresh data
  refreshClassrooms: () => Promise<void>;
}

const ClassroomContext = createContext<ClassroomContextType | undefined>(undefined);

const POINT_REASONS = [
  'Great participation',
  'Helping a classmate',
  'Completed assignment',
  'Good behavior',
  'Creative thinking',
  'Extra effort',
  'Kindness',
  'Leadership',
];

export const PRESET_POINT_REASONS = POINT_REASONS;

export const ClassroomProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [activeClassroom, setActiveClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [pointsLog, setPointsLog] = useState<PointsLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);

  const fetchClassrooms = useCallback(async () => {
    if (!user) {
      setClassrooms([]);
      setActiveClassroom(null);
      setLoading(false);
      return;
    }

    try {
      // Check if user has teacher role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const hasTeacherRole = roles?.some(r => r.role === 'teacher');
      setIsTeacher(hasTeacherRole || false);

      // Fetch classrooms where user is teacher
      const { data: classroomData, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const typedClassrooms = (classroomData || []) as Classroom[];
      setClassrooms(typedClassrooms);
      
      // Auto-select first classroom if none selected
      if (typedClassrooms.length > 0 && !activeClassroom) {
        setActiveClassroom(typedClassrooms[0]);
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error);
    } finally {
      setLoading(false);
    }
  }, [user, activeClassroom]);

  const fetchStudents = useCallback(async () => {
    if (!activeClassroom) {
      setStudents([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('classroom_id', activeClassroom.id)
        .order('student_number', { ascending: true });

      if (error) throw error;
      setStudents((data || []) as Student[]);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, [activeClassroom]);

  const fetchPointsLog = useCallback(async () => {
    if (!activeClassroom) {
      setPointsLog([]);
      return;
    }

    try {
      // Get student IDs for this classroom
      const studentIds = students.map(s => s.id);
      if (studentIds.length === 0) return;

      const { data, error } = await supabase
        .from('school_points_log')
        .select('*')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPointsLog((data || []) as PointsLog[]);
    } catch (error) {
      console.error('Error fetching points log:', error);
    }
  }, [activeClassroom, students]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    if (students.length > 0) {
      fetchPointsLog();
    }
  }, [fetchPointsLog, students.length]);

  const createClassroom = async (name: string): Promise<Classroom | null> => {
    if (!user) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-classroom`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ action: 'create_classroom', name }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast({
        title: 'Classroom Created!',
        description: `Code: ${result.classroom.classroom_code}`,
      });

      await fetchClassrooms();
      setActiveClassroom(result.classroom);
      setIsTeacher(true);
      return result.classroom;
    } catch (error) {
      console.error('Error creating classroom:', error);
      toast({
        title: 'Error',
        description: 'Failed to create classroom',
        variant: 'destructive',
      });
      return null;
    }
  };

  const selectClassroom = (classroomId: string) => {
    const classroom = classrooms.find(c => c.id === classroomId);
    if (classroom) {
      setActiveClassroom(classroom);
    }
  };

  const deleteClassroom = async (classroomId: string) => {
    try {
      const { error } = await supabase
        .from('classrooms')
        .delete()
        .eq('id', classroomId);

      if (error) throw error;

      toast({
        title: 'Classroom Deleted',
      });

      await fetchClassrooms();
      if (activeClassroom?.id === classroomId) {
        setActiveClassroom(classrooms[0] || null);
      }
    } catch (error) {
      console.error('Error deleting classroom:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete classroom',
        variant: 'destructive',
      });
    }
  };

  const addStudent = async (name: string, avatarEmoji?: string): Promise<Student | null> => {
    if (!activeClassroom) return null;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-classroom`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'add_student',
            classroom_id: activeClassroom.id,
            name,
            avatar_emoji: avatarEmoji,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast({
        title: 'Student Added!',
        description: `${result.student.name} (${result.student.student_number})`,
      });

      await fetchStudents();
      return result.student;
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: 'Error',
        description: 'Failed to add student',
        variant: 'destructive',
      });
      return null;
    }
  };

  const bulkAddStudents = async (studentsList: Array<{ name: string; avatar_emoji?: string }>): Promise<number> => {
    if (!activeClassroom) return 0;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-classroom`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'bulk_add_students',
            classroom_id: activeClassroom.id,
            students: studentsList,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast({
        title: 'Students Imported!',
        description: `${result.added_count} students added successfully`,
      });

      await fetchStudents();
      return result.added_count;
    } catch (error) {
      console.error('Error bulk adding students:', error);
      toast({
        title: 'Error',
        description: 'Failed to import students',
        variant: 'destructive',
      });
      return 0;
    }
  };

  const updateStudent = async (studentId: string, name?: string, avatarEmoji?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-classroom`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'update_student',
            student_id: studentId,
            name,
            avatar_emoji: avatarEmoji,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      await fetchStudents();
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: 'Error',
        description: 'Failed to update student',
        variant: 'destructive',
      });
    }
  };

  const removeStudent = async (studentId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-classroom`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'remove_student',
            student_id: studentId,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast({
        title: 'Student Removed',
      });

      await fetchStudents();
    } catch (error) {
      console.error('Error removing student:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove student',
        variant: 'destructive',
      });
    }
  };

  const awardPoints = async (studentId: string, points: number, reason: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-classroom`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'award_points',
            student_id: studentId,
            points,
            reason,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      const student = students.find(s => s.id === studentId);
      toast({
        title: `+${points} points!`,
        description: `${student?.name}: ${reason}`,
      });

      await fetchStudents();
      await fetchPointsLog();
    } catch (error) {
      console.error('Error awarding points:', error);
      toast({
        title: 'Error',
        description: 'Failed to award points',
        variant: 'destructive',
      });
    }
  };

  const refreshClassrooms = async () => {
    await fetchClassrooms();
    await fetchStudents();
    await fetchPointsLog();
  };

  return (
    <ClassroomContext.Provider
      value={{
        classrooms,
        activeClassroom,
        students,
        pointsLog,
        loading,
        isTeacher,
        createClassroom,
        selectClassroom,
        deleteClassroom,
        addStudent,
        bulkAddStudents,
        updateStudent,
        removeStudent,
        awardPoints,
        refreshClassrooms,
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
};

export const useClassroom = () => {
  const context = useContext(ClassroomContext);
  if (context === undefined) {
    throw new Error('useClassroom must be used within a ClassroomProvider');
  }
  return context;
};
