import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Building2, School } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['culturezen']['Enums']['app_role'];

const roles: { id: AppRole; label: string; description: string; icon: typeof GraduationCap; path: string; emoji: string }[] = [
  {
    id: 'teacher',
    label: 'Teacher',
    description: 'Classroom management, points, and student pets',
    icon: GraduationCap,
    path: '/dashboard/teacher',
    emoji: '🏫',
  },
  {
    id: 'school_admin',
    label: 'School Admin',
    description: 'Manage staff, classrooms, and school settings',
    icon: Building2,
    path: '/dashboard/teacher',
    emoji: '🏢',
  },
  {
    id: 'principal',
    label: 'Principal',
    description: 'School-wide overview, staff, and approvals',
    icon: School,
    path: '/dashboard/principal',
    emoji: '🎓',
  },
];

const persistRole = async (userId: string, role: AppRole) => {
  const { data: existing } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle();
  if (!existing) {
    await supabase.from('user_roles').insert({ user_id: userId, role });
  }
};

const RoleSelectorAdmin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-4xl animate-bounce">🎓</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl mb-2">🎓</div>
          <h1 className="text-2xl font-extrabold text-foreground">CultureZen</h1>
          <p className="text-muted-foreground">Choose your role to continue</p>
        </div>

        <div className="space-y-3">
          {roles.map((role) => (
            <Card
              key={role.id}
              className="cursor-pointer border-2 border-border hover:border-primary/50 transition-all hover:shadow-md"
              onClick={async () => {
                if (user) await persistRole(user.id, role.id).catch(() => {});
                navigate(role.path);
              }}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="text-3xl">{role.emoji}</div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">{role.label}</p>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
                <role.icon className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelectorAdmin;
