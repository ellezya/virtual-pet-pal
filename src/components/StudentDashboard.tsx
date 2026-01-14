import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { useSelfCare } from '@/hooks/useSelfCare';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, 
  Trophy, 
  Store, 
  Star, 
  Heart, 
  School,
  Gift,
  Sparkles,
  Clock,
  TrendingUp,
  Award,
  ShoppingBag
} from 'lucide-react';

interface StudentClassroom {
  id: string;
  name: string;
  classroom_code: string;
  student_id: string;
  school_points: number;
  student_number: string;
}

interface StudentDashboardProps {
  open: boolean;
  onClose: () => void;
}

const StudentDashboard = ({ open, onClose }: StudentDashboardProps) => {
  const { user } = useAuth();
  const { progress } = useProgress();
  const { careItems } = useSelfCare();
  const navigate = useNavigate();
  
  const [classrooms, setClassrooms] = useState<StudentClassroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsHistory, setPointsHistory] = useState<Array<{
    id: string;
    points: number;
    reason: string;
    created_at: string;
  }>>([]);

  useEffect(() => {
    if (open && user) {
      fetchStudentData();
    }
  }, [open, user]);

  const fetchStudentData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch all classrooms the student is in
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          school_points,
          student_number,
          classroom_id,
          classrooms (
            id,
            name,
            classroom_code
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (studentError) throw studentError;

      const classroomList: StudentClassroom[] = (studentData || []).map((s: any) => ({
        id: s.classrooms.id,
        name: s.classrooms.name,
        classroom_code: s.classrooms.classroom_code,
        student_id: s.id,
        school_points: s.school_points || 0,
        student_number: s.student_number,
      }));

      setClassrooms(classroomList);

      // Fetch points history for all student records
      if (classroomList.length > 0) {
        const studentIds = classroomList.map(c => c.student_id);
        const { data: historyData } = await supabase
          .from('school_points_log')
          .select('id, points, reason, created_at')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false })
          .limit(20);

        setPointsHistory(historyData || []);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = classrooms.reduce((sum, c) => sum + c.school_points, 0);
  const completedCareItems = careItems.filter(item => item.completed).length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden flex flex-col">
      {/* Header */}
      <header className="mobile-header flex items-center justify-between p-3 sm:p-4 bg-card">
        <div className="flex items-center gap-2 sm:gap-3">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">My Dashboard</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="touch-target-sm">
          <X className="w-5 h-5" />
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            {/* Points Summary */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total School Points</p>
                    <p className="text-4xl font-bold text-primary">{totalPoints}</p>
                  </div>
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <Star className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-2">
              <Card className="bg-card border-border">
                <CardContent className="p-3 text-center">
                  <School className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-xl font-bold text-foreground">{classrooms.length}</p>
                  <p className="text-xs text-muted-foreground">Classes</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-3 text-center">
                  <Heart className="w-5 h-5 mx-auto mb-1 text-pink-500" />
                  <p className="text-xl font-bold text-foreground">{completedCareItems}/{careItems.length}</p>
                  <p className="text-xs text-muted-foreground">Self-Care</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-3 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <p className="text-xl font-bold text-foreground">{progress.currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="classes" className="space-y-3">
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="classes" className="flex items-center gap-1 text-xs sm:text-sm py-2">
                  <School className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Classes</span>
                </TabsTrigger>
                <TabsTrigger value="rewards" className="flex items-center gap-1 text-xs sm:text-sm py-2">
                  <Award className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Rewards</span>
                </TabsTrigger>
                <TabsTrigger value="store" className="flex items-center gap-1 text-xs sm:text-sm py-2">
                  <Store className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Store</span>
                </TabsTrigger>
              </TabsList>

              {/* Classes Tab */}
              <TabsContent value="classes">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-foreground flex items-center gap-2 text-base">
                      <School className="w-5 h-5" />
                      My Classrooms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {classrooms.length === 0 ? (
                      <div className="text-center py-6">
                        <School className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground mb-3">No classrooms yet</p>
                        <Button onClick={() => navigate('/join')} className="bg-primary text-primary-foreground">
                          Join a Classroom
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {classrooms.map(classroom => (
                          <div 
                            key={classroom.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                <School className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{classroom.name}</p>
                                <p className="text-xs text-muted-foreground">{classroom.student_number}</p>
                              </div>
                            </div>
                            <Badge className="bg-primary/20 text-primary border-0">
                              <Star className="w-3 h-3 mr-1" />
                              {classroom.school_points} pts
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Rewards Tab */}
              <TabsContent value="rewards">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-foreground flex items-center gap-2 text-base">
                      <Award className="w-5 h-5" />
                      Recent Rewards
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pointsHistory.length === 0 ? (
                      <div className="text-center py-6">
                        <Gift className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No rewards yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Keep up the good work to earn points!
                        </p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {pointsHistory.map(entry => (
                            <div 
                              key={entry.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                                  <Sparkles className="w-4 h-4 text-success" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground text-sm">{entry.reason}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(entry.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-success border-success">
                                +{entry.points}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Store Tab */}
              <TabsContent value="store">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-foreground flex items-center gap-2 text-base">
                      <Store className="w-5 h-5" />
                      Class Store
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-6">
                      <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground mb-1">Store coming soon!</p>
                      <p className="text-xs text-muted-foreground">
                        You have <strong>{totalPoints} points</strong> to spend
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Self-Care Summary */}
            <Card className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 border-pink-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground flex items-center gap-2 text-base">
                  <Heart className="w-5 h-5 text-pink-500" />
                  Today's Self-Care
                </CardTitle>
              </CardHeader>
              <CardContent>
                {careItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No self-care items set up yet. Take care of yourself!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {careItems.map(item => (
                      <div 
                        key={item.id}
                        className={`flex items-center gap-2 p-2 rounded ${
                          item.completed ? 'bg-success/10' : 'bg-muted/50'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          item.completed 
                            ? 'bg-success border-success' 
                            : 'border-muted-foreground'
                        }`}>
                          {item.completed && <span className="text-white text-xs">✓</span>}
                        </div>
                        <span className={`text-sm ${
                          item.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}>
                          {item.item_text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
