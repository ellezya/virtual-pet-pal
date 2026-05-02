import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Users, BookOpen, Rabbit } from 'lucide-react';

const roles = [
  {
    id: 'parent',
    label: 'Parent / Family',
    description: 'Manage kids, chores, and family Lola time',
    icon: Users,
    path: '/dashboard/parent',
    emoji: '👨‍👩‍👧‍👦',
  },
  {
    id: 'teacher',
    label: 'Teacher',
    description: 'Classroom management, points, and student pets',
    icon: GraduationCap,
    path: '/dashboard/teacher',
    emoji: '🏫',
  },
  {
    id: 'student',
    label: 'Student',
    description: 'View your points, store, and classroom info',
    icon: BookOpen,
    path: '/dashboard/student',
    emoji: '🎒',
  },
] as const;

const RoleSelector = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-4xl animate-bounce">🐰</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl mb-2">🐰</div>
          <h1 className="text-2xl font-extrabold text-foreground">Welcome to LaLaLola!</h1>
          <p className="text-muted-foreground">Choose how you'd like to use the app today</p>
        </div>

        <div className="space-y-3">
          {roles.map((role) => (
            <Card
              key={role.id}
              className="cursor-pointer border-2 border-border hover:border-primary/50 transition-all hover:shadow-md"
              onClick={() => navigate(role.path)}
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

        <div className="text-center pt-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2 text-muted-foreground"
          >
            <Rabbit className="w-4 h-4" />
            Just play with Lola
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;