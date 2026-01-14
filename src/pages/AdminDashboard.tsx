import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, School, Activity, Clock, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

// Admin email - only this user can access the dashboard
const ADMIN_EMAIL = 'founder@lalalola.app'; // Update this to your actual email

interface UserStats {
  totalUsers: number;
  totalTeachers: number;
  totalParents: number;
  totalIndividuals: number;
  usersToday: number;
  usersThisWeek: number;
}

interface WaitlistEntry {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  school_name: string;
  created_at: string;
}

interface RecentUser {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  user_type: string | null;
  created_at: string | null;
  school_name: string | null;
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    totalTeachers: 0,
    totalParents: 0,
    totalIndividuals: 0,
    usersToday: 0,
    usersThisWeek: 0,
  });
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    // Check if user is admin
    const checkAdmin = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      if (profile?.email === ADMIN_EMAIL || user.email === ADMIN_EMAIL) {
        setAuthorized(true);
        fetchData();
      } else {
        navigate('/');
      }
    };

    checkAdmin();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      // Get total users and breakdown by type
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_type, created_at, email, first_name, last_name, school_name');

      if (profilesError) throw profilesError;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);

      const userStats: UserStats = {
        totalUsers: profiles?.length || 0,
        totalTeachers: profiles?.filter(p => p.user_type === 'teacher').length || 0,
        totalParents: profiles?.filter(p => p.user_type === 'parent').length || 0,
        totalIndividuals: profiles?.filter(p => p.user_type === 'individual').length || 0,
        usersToday: profiles?.filter(p => p.created_at && new Date(p.created_at) >= todayStart).length || 0,
        usersThisWeek: profiles?.filter(p => p.created_at && new Date(p.created_at) >= weekStart).length || 0,
      };

      setStats(userStats);

      // Get recent users (last 50)
      const recent = profiles
        ?.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 50) || [];
      setRecentUsers(recent);

      // Get teacher waitlist
      const { data: waitlistData } = await supabase
        .from('teacher_waitlist')
        .select('*')
        .order('created_at', { ascending: false });

      setWaitlist(waitlistData || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveTeacher = async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ teacher_beta_approved: true })
        .eq('id', userId);
      
      // Remove from waitlist
      await supabase
        .from('teacher_waitlist')
        .delete()
        .eq('user_id', userId);

      fetchData();
    } catch (error) {
      console.error('Error approving teacher:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Founder overview of user activity</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {stats.totalUsers}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Teachers</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <School className="h-5 w-5 text-blue-500" />
                {stats.totalTeachers}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Parents</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                {stats.totalParents}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Individuals</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                {stats.totalIndividuals}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Today</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                {stats.usersToday}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>This Week</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-teal-500" />
                {stats.usersThisWeek}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Recent Users</TabsTrigger>
            <TabsTrigger value="waitlist">
              Teacher Waitlist
              {waitlist.length > 0 && (
                <Badge variant="destructive" className="ml-2">{waitlist.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
                <CardDescription>Last 50 users who signed up</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {user.first_name || user.last_name 
                            ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                            : '—'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{user.email || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.user_type === 'teacher' ? 'default' :
                            user.user_type === 'parent' ? 'secondary' : 'outline'
                          }>
                            {user.user_type || 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.school_name || '—'}</TableCell>
                        <TableCell>
                          {user.created_at 
                            ? format(new Date(user.created_at), 'MMM d, yyyy')
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waitlist">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Beta Waitlist</CardTitle>
                <CardDescription>Teachers waiting for beta access approval</CardDescription>
              </CardHeader>
              <CardContent>
                {waitlist.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No teachers on waitlist</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>School</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waitlist.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {entry.first_name || entry.last_name 
                              ? `${entry.first_name || ''} ${entry.last_name || ''}`.trim()
                              : '—'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{entry.email}</TableCell>
                          <TableCell>{entry.school_name}</TableCell>
                          <TableCell>
                            {format(new Date(entry.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              onClick={() => approveTeacher(entry.id)}
                            >
                              Approve
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
