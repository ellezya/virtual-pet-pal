import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ADMIN_ORIGIN } from '@/lib/publicOrigin';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['culturezen']['Enums']['app_role'];

// Roles that live on the school/admin app (school.lalalola.app), not here.
const SCHOOL_ROLES: AppRole[] = [
  'teacher', 'school_admin', 'staff', 'principal', 'platform_admin', 'authority_admin',
];

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

        if (SCHOOL_ROLES.some((r) => has(r))) {
          // School-side roles don't exist on the consumer app — send to admin app.
          window.location.href = `${ADMIN_ORIGIN}/dashboard`;
        } else if (has('parent') || has('family_individual')) {
          navigate('/dashboard/parent', { replace: true });
        } else {
          // Default: student/child/guest (student role is not persisted)
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
