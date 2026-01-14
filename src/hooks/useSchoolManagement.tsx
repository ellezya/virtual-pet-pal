import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface School {
  id: string;
  name: string;
  domain: string | null;
  created_at: string;
  updated_at: string;
}

export interface SchoolStaff {
  id: string;
  school_id: string;
  user_id: string;
  role: 'principal' | 'school_admin';
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export interface ClassroomWithSchool {
  id: string;
  name: string;
  classroom_code: string;
  teacher_id: string;
  school_id: string | null;
  teacher_name?: string;
  student_count?: number;
}

export const useSchoolManagement = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [staff, setStaff] = useState<SchoolStaff[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomWithSchool[]>([]);
  const [myRole, setMyRole] = useState<'principal' | 'school_admin' | 'teacher' | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingInvites, setPendingInvites] = useState<SchoolStaff[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch schools I'm part of
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*');

      if (schoolsError) throw schoolsError;
      setSchools(schoolsData || []);

      // Fetch my staff roles
      const { data: myStaffData, error: myStaffError } = await supabase
        .from('school_staff')
        .select('*')
        .eq('user_id', user.id);

      if (myStaffError) throw myStaffError;

      // Determine my role
      const acceptedRoles = (myStaffData || []).filter(s => s.accepted_at);
      const pendingRoles = (myStaffData || []).filter(s => !s.accepted_at);
      setPendingInvites(pendingRoles as SchoolStaff[]);

      if (acceptedRoles.some(s => s.role === 'principal')) {
        setMyRole('principal');
      } else if (acceptedRoles.some(s => s.role === 'school_admin')) {
        setMyRole('school_admin');
      } else {
        setMyRole('teacher');
      }

      // Fetch all staff for schools I can see
      if (schoolsData && schoolsData.length > 0) {
        const schoolIds = schoolsData.map(s => s.id);
        const { data: allStaffData, error: allStaffError } = await supabase
          .from('school_staff')
          .select('*')
          .in('school_id', schoolIds);

        if (allStaffError) throw allStaffError;
        setStaff(allStaffData as SchoolStaff[] || []);

        // Fetch classrooms for these schools
        const { data: classroomsData, error: classroomsError } = await supabase
          .from('classrooms')
          .select('*')
          .in('school_id', schoolIds);

        if (classroomsError) throw classroomsError;
        setClassrooms(classroomsData as ClassroomWithSchool[] || []);
      }

    } catch (error) {
      console.error('Error fetching school data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create a new school and invite a principal
  const createSchoolWithPrincipal = async (
    schoolName: string,
    principalEmail: string
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      // Create the school
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert({ name: schoolName })
        .select()
        .single();

      if (schoolError) throw schoolError;

      // Look up the principal by email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', principalEmail)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        toast({
          title: "User not found",
          description: "No user found with that email address. They need to create an account first.",
          variant: "destructive",
        });
        // Delete the school we just created since we can't add the principal
        await supabase.from('schools').delete().eq('id', school.id);
        return false;
      }

      // Create the principal invite
      const { error: staffError } = await supabase
        .from('school_staff')
        .insert({
          school_id: school.id,
          user_id: profileData.id,
          role: 'principal',
          invited_by: user.id,
        });

      if (staffError) throw staffError;

      toast({
        title: "School created",
        description: `${schoolName} created and principal invited!`,
      });

      fetchData();
      return true;
    } catch (error) {
      console.error('Error creating school:', error);
      toast({
        title: "Error",
        description: "Failed to create school",
        variant: "destructive",
      });
      return false;
    }
  };

  // Principal invites an admin
  const inviteAdmin = async (schoolId: string, adminEmail: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Look up the admin by email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', adminEmail)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        toast({
          title: "User not found",
          description: "No user found with that email. They need to create an account first.",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('school_staff')
        .insert({
          school_id: schoolId,
          user_id: profileData.id,
          role: 'school_admin',
          invited_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Admin invited",
        description: "School admin invitation sent!",
      });

      fetchData();
      return true;
    } catch (error) {
      console.error('Error inviting admin:', error);
      toast({
        title: "Error",
        description: "Failed to invite admin",
        variant: "destructive",
      });
      return false;
    }
  };

  // Accept an invite
  const acceptInvite = async (inviteId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('school_staff')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: "Invite accepted",
        description: "You've joined the school!",
      });

      fetchData();
      return true;
    } catch (error) {
      console.error('Error accepting invite:', error);
      toast({
        title: "Error",
        description: "Failed to accept invite",
        variant: "destructive",
      });
      return false;
    }
  };

  // Link classroom to school
  const linkClassroomToSchool = async (classroomId: string, schoolId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('classrooms')
        .update({ school_id: schoolId })
        .eq('id', classroomId);

      if (error) throw error;

      toast({
        title: "Classroom linked",
        description: "Classroom has been added to the school!",
      });

      fetchData();
      return true;
    } catch (error) {
      console.error('Error linking classroom:', error);
      toast({
        title: "Error",
        description: "Failed to link classroom",
        variant: "destructive",
      });
      return false;
    }
  };

  // Admin activates store for a classroom
  const activateStore = async (classroomId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('store_settings')
        .select('id')
        .eq('classroom_id', classroomId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('store_settings')
          .update({
            is_store_open: true,
            store_enabled_by: user.id,
            store_enabled_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('store_settings')
          .insert({
            classroom_id: classroomId,
            is_store_open: true,
            store_enabled_by: user.id,
            store_enabled_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      toast({
        title: "Store activated",
        description: "The school store is now available to students!",
      });

      fetchData();
      return true;
    } catch (error) {
      console.error('Error activating store:', error);
      toast({
        title: "Error",
        description: "Failed to activate store",
        variant: "destructive",
      });
      return false;
    }
  };

  // Remove staff member
  const removeStaff = async (staffId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('school_staff')
        .delete()
        .eq('id', staffId);

      if (error) throw error;

      toast({
        title: "Staff removed",
        description: "Staff member has been removed",
      });

      fetchData();
      return true;
    } catch (error) {
      console.error('Error removing staff:', error);
      toast({
        title: "Error",
        description: "Failed to remove staff",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    schools,
    staff,
    classrooms,
    myRole,
    loading,
    pendingInvites,
    createSchoolWithPrincipal,
    inviteAdmin,
    acceptInvite,
    linkClassroomToSchool,
    activateStore,
    removeStaff,
    refetch: fetchData,
  };
};
