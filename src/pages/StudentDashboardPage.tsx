import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import StudentDashboard from '@/components/StudentDashboard';

const StudentDashboardPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-4xl animate-bounce">🐰</div>
      </div>
    );
  }

  return <StudentDashboard open={true} onClose={() => navigate('/dashboard')} />;
};

export default StudentDashboardPage;