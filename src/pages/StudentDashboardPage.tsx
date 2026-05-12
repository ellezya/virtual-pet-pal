import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Star,
  Smile,
  Sparkles,
  Clock,
  TrendingUp,
  School,
  Heart,
  Gift,
  CheckCircle2,
  LogOut,
  Settings,
} from 'lucide-react';
import StudentDashboard from '@/components/StudentDashboard';

interface StudentClassroom {
  id: string;
  name: string;
  student_id: string;
  school_points: number;
}

interface PointsEntry {
  id: string;
  points: number;
  reason: string;
  created_at: string;
}

const StudentDashboardPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { progress } = useProgress();
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState<StudentClassroom[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsEntry[]>([]);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [greetingVisible, setGreetingVisible] = useState(true);
  const [showFullDashboard, setShowFullDashboard] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  // Auto-dismiss Lola greeting after 3 seconds
  useEffect(() => {
    const t = setTimeout(() => setGreetingVisible(false), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setDataLoading(true);
      try {
        const { data: studentData } = await supabase
          .from('students')
          .select(`
            id,
            school_points,
            classroom_id,
            classrooms (id, name)
          `)
          .eq('user_id', user.id)
          .eq('status', 'active');

        const classroomList: StudentClassroom[] = (studentData || []).map((s: any) => ({
          id: s.classrooms?.id ?? s.classroom_id,
          name: s.classrooms?.name ?? 'Class',
          student_id: s.id,
          school_points: s.school_points || 0,
        }));
        setClassrooms(classroomList);

        if (classroomList.length > 0) {
          const studentIds = classroomList.map((c) => c.student_id);

          const { data: historyData } = await supabase
            .from('school_points_log')
            .select('id, points, reason, created_at')
            .in('student_id', studentIds)
            .order('created_at', { ascending: false })
            .limit(10);
          setPointsHistory(historyData || []);

          const today = new Date().toISOString().split('T')[0];
          const { data: checkinData } = await supabase
            .from('daily_checkins')
            .select('id')
            .eq('student_id', classroomList[0].student_id)
            .gte('created_at', `${today}T00:00:00`)
            .lt('created_at', `${today}T23:59:59.999`)
            .limit(1);
          setCheckedInToday(!!(checkinData && checkinData.length > 0));
        }
      } catch (err) {
        console.error('Error fetching student data:', err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const totalPoints = classrooms.reduce((sum, c) => sum + c.school_points, 0);

  // Weekly earning status: only reveal on Friday noon or later
  const now = new Date();
  const isFridayNoon = now.getDay() === 5 && now.getHours() >= 12;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const earnedThisWeek = pointsHistory
    .filter((p) => new Date(p.created_at) >= startOfWeek)
    .reduce((sum, p) => sum + p.points, 0);

  const lolaHappy = !!(progress.lastFed || progress.lastWatered || progress.lastPlayed);
  const displayName =
    user?.user_metadata?.display_name ||
    (user?.email ? user.email.split('@')[0] : 'Student');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-4xl animate-bounce">🐰</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted relative">
      {/* Lola greeting animation — corner, auto-dismisses after 3 s */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 transition-all duration-500 ${
          greetingVisible
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="bg-card border-2 border-primary/30 rounded-2xl px-4 py-2 shadow-lg max-w-[200px]">
          <p className="text-sm font-semibold text-foreground">Hi {displayName}! 🌟</p>
          <p className="text-xs text-muted-foreground">Lola is so happy to see you!</p>
        </div>
        <div className="text-5xl animate-bounce select-none">🐰</div>
      </div>

      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-primary" />
          <div>
            <p className="font-bold text-foreground leading-tight">Hi, {displayName}!</p>
            <p className="text-xs text-muted-foreground">Student Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setShowFullDashboard(true)}>
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => signOut().then(() => navigate('/auth'))}
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-10">
        {dataLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-4xl animate-bounce">🐰</div>
          </div>
        ) : (
          <>
            {/* ROAR Paw Balance */}
            <Card className="bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      ROAR Paw Balance
                    </p>
                    <p className="text-5xl font-extrabold text-primary mt-1 leading-none">
                      {totalPoints}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {classrooms.length === 1
                        ? classrooms[0].name
                        : `${classrooms.length} classroom${classrooms.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <Star className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly earning status — visible only from Friday noon */}
            {isFridayNoon && (
              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-400/5 border-amber-400/20">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        This Week's Earnings
                      </p>
                      <p className="text-2xl font-bold text-amber-600 leading-tight">
                        +{earnedThisWeek} paws
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status row: Lola + Check-In */}
            <div className="grid grid-cols-2 gap-3">
              <Card
                className={`border-2 ${
                  lolaHappy
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-border'
                }`}
              >
                <CardContent className="p-3 text-center">
                  <div className="text-3xl mb-1">🐰</div>
                  <p className="text-xs font-semibold text-foreground">Lola</p>
                  <p className="text-xs text-muted-foreground">
                    {lolaHappy ? 'Happy & cared for' : 'Waiting for you'}
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`border-2 ${
                  checkedInToday
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-amber-400/30 bg-amber-400/5'
                }`}
              >
                <CardContent className="p-3 text-center">
                  {checkedInToday ? (
                    <>
                      <CheckCircle2 className="w-7 h-7 mx-auto mb-1 text-green-500" />
                      <p className="text-xs font-semibold text-foreground">Checked In</p>
                      <p className="text-xs text-muted-foreground">Done today!</p>
                    </>
                  ) : (
                    <>
                      <Smile className="w-7 h-7 mx-auto mb-1 text-amber-500" />
                      <p className="text-xs font-semibold text-foreground">Check-In</p>
                      <p className="text-xs text-muted-foreground">Not done yet</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Primary actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="lg"
                className="h-14 text-base font-bold"
                onClick={() => navigate('/')}
              >
                🐰 Visit Lola
              </Button>
              <Button
                size="lg"
                variant={checkedInToday ? 'outline' : 'default'}
                className="h-14 text-base font-bold"
                onClick={() => navigate('/dashboard/student/checkin')}
                disabled={checkedInToday}
              >
                <Smile className="w-5 h-5 mr-1" />
                {checkedInToday ? 'Done!' : 'Check-In'}
              </Button>
            </div>

            {/* Recent activity feed */}
            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <Clock className="w-4 h-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {pointsHistory.length === 0 ? (
                  <div className="text-center py-4">
                    <Gift className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                    <p className="text-sm text-muted-foreground">No recent activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pointsHistory.slice(0, 5).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <Sparkles className="w-4 h-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {entry.reason}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-primary border-primary/30 shrink-0 ml-2"
                        >
                          +{entry.points}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Streak + self-care summary */}
            <Card className="bg-gradient-to-br from-pink-500/10 to-purple-500/5 border-pink-500/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-pink-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {progress.currentStreak}-day streak
                      </p>
                      <p className="text-xs text-muted-foreground">Keep it up!</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <School className="w-4 h-4" />
                    <span>{classrooms.length} class{classrooms.length !== 1 ? 'es' : ''}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Full StudentDashboard for detailed view (classes, rewards, store) */}
      <StudentDashboard
        open={showFullDashboard}
        onClose={() => setShowFullDashboard(false)}
      />
    </div>
  );
};

export default StudentDashboardPage;
