import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [roleChecked, setRoleChecked] = useState(!requiredRole);
  const [hasRole, setHasRole] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!requiredRole || !user) {
      setRoleChecked(true);
      return;
    }

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

    setRoleChecked(false);
    supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .in('role', roles)
      .limit(1)
      .then(({ data }) => {
        if (!cancelled) {
          setHasRole(!!data?.length);
          setRoleChecked(true);
        }
      });

    return () => { cancelled = true; };
  }, [user?.id, JSON.stringify(requiredRole)]);

  if (loading || !roleChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">🐰</div>
          <p className="text-lg font-bold text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (requiredRole && !hasRole) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
