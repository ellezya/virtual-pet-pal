import { useNavigate } from 'react-router-dom';
import PrincipalDashboard from '@/components/PrincipalDashboard';

const PrincipalDashboardPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <PrincipalDashboard onClose={() => navigate('/dashboard')} />
    </div>
  );
};

export default PrincipalDashboardPage;
