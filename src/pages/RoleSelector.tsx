import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['culturezen']['Enums']['app_role'];

// Smart role-based router. Detects the user's persisted role and navigates
// directly to the correct dashboard — no manual role picker shown.
const RoleSelector = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .then(({ data: rows }) => {
        const has = (r: AppRole) => rows?.some((row) => row.role === r) ?? false;

        if (has('teacher')) {
          navigate('/dashboard/teacher', { replace: true });
        } else if (has('principal')) {
          navigate('/dashboard/principal', { replace: true });
        } else if (has('parent') || has('individual')) {
          navigate('/dashboard/parent', { replace: true });
        } else {
          // Default: student (role not persisted for students)
          navigate('/dashboard/student', { replace: true });
        }
      });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-4xl animate-bounce">🐰</div>
    </div>
  );
};

export default RoleSelector;
