import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TeacherBetaStatus {
  hasBetaAccess: boolean;
  isOnWaitlist: boolean;
  schoolName: string | null;
  loading: boolean;
}

// Approved email domain for beta access
const APPROVED_EMAIL_DOMAIN = '@twincitiesacademy.org';

const isApprovedTeacherEmail = (email: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase().trim().endsWith(APPROVED_EMAIL_DOMAIN);
};

export const useTeacherBeta = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<TeacherBetaStatus>({
    hasBetaAccess: false,
    isOnWaitlist: false,
    schoolName: null,
    loading: true,
  });

  const checkBetaStatus = useCallback(async () => {
    if (!user) {
      setStatus({
        hasBetaAccess: false,
        isOnWaitlist: false,
        schoolName: null,
        loading: false,
      });
      return;
    }

    try {
      // Check profile for email and beta approval
      const { data: profile } = await supabase
        .from('profiles')
        .select('school_name, teacher_beta_approved, user_type, also_teacher, email')
        .eq('id', user.id)
        .single();

      // Check if on waitlist
      const { data: waitlistEntry } = await supabase
        .from('teacher_waitlist')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const isTeacher = profile?.user_type === 'teacher' || profile?.also_teacher === true;
      const schoolName = profile?.school_name || null;
      const userEmail = profile?.email || user.email || null;
      const hasBetaAccess = isTeacher && (
        profile?.teacher_beta_approved === true || 
        isApprovedTeacherEmail(userEmail)
      );

      setStatus({
        hasBetaAccess,
        isOnWaitlist: !!waitlistEntry,
        schoolName,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking teacher beta status:', error);
      setStatus(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkBetaStatus();
  }, [checkBetaStatus]);

  const joinWaitlist = async (schoolName: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Must be logged in' };
    }

    try {
      // Get user's profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single();

      // Update profile with school name
      await supabase
        .from('profiles')
        .update({ school_name: schoolName })
        .eq('id', user.id);

      // Check if already on waitlist
      const { data: existing } = await supabase
        .from('teacher_waitlist')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing entry
        await supabase
          .from('teacher_waitlist')
          .update({ school_name: schoolName })
          .eq('user_id', user.id);
      } else {
        // Insert new entry
        await supabase
          .from('teacher_waitlist')
          .insert({
            user_id: user.id,
            email: profile?.email || user.email || '',
            first_name: profile?.first_name,
            last_name: profile?.last_name,
            school_name: schoolName,
          });
      }

      setStatus(prev => ({ ...prev, isOnWaitlist: true, schoolName }));
      return { success: true };
    } catch (error) {
      console.error('Error joining waitlist:', error);
      return { success: false, error: 'Failed to join waitlist' };
    }
  };

  const updateSchoolName = async (schoolName: string): Promise<{ success: boolean; hasBetaAccess: boolean }> => {
    if (!user) return { success: false, hasBetaAccess: false };

    try {
      await supabase
        .from('profiles')
        .update({ school_name: schoolName })
        .eq('id', user.id);
      
      setStatus(prev => ({ 
        ...prev, 
        schoolName
      }));

      return { success: true, hasBetaAccess: status.hasBetaAccess };
    } catch (error) {
      console.error('Error updating school name:', error);
      return { success: false, hasBetaAccess: false };
    }
  };

  return {
    ...status,
    joinWaitlist,
    updateSchoolName,
    checkBetaStatus,
    isApprovedTeacherEmail,
  };
};
