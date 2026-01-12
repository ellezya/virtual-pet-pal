import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from '@/hooks/useFamily';
import { Award, TrendingUp, Calendar, Star, School } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';

interface LinkedStudentReport {
  studentId: string;
  studentName: string;
  studentNumber: string;
  classroomName: string;
  kidName: string;
  kidEmoji: string;
  totalPoints: number;
  pointsThisWeek: number;
  recentAwards: Array<{
    id: string;
    points: number;
    reason: string;
    created_at: string;
  }>;
}

const SchoolReports = () => {
  const { kids } = useFamily();
  const [reports, setReports] = useState<LinkedStudentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const kidIds = kids.map(k => k.id);
      if (kidIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch linked students with their classroom info
      const { data: linkedStudents, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          name,
          student_number,
          school_points,
          linked_kid_id,
          classrooms!inner(name)
        `)
        .in('linked_kid_id', kidIds);

      if (studentsError || !linkedStudents || linkedStudents.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch points log for all linked students
      const studentIds = linkedStudents.map(s => s.id);
      const { data: pointsLog } = await supabase
        .from('school_points_log')
        .select('*')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })
        .limit(100);

      const weekAgo = subDays(new Date(), 7);

      // Build reports for each linked student
      const studentReports: LinkedStudentReport[] = linkedStudents.map(student => {
        const kid = kids.find(k => k.id === student.linked_kid_id);
        const studentPoints = (pointsLog || []).filter(p => p.student_id === student.id);
        const weekPoints = studentPoints
          .filter(p => isAfter(new Date(p.created_at), weekAgo))
          .reduce((sum, p) => sum + p.points, 0);

        return {
          studentId: student.id,
          studentName: student.name,
          studentNumber: student.student_number,
          classroomName: (student.classrooms as any)?.name || 'Unknown',
          kidName: kid?.name || 'Unknown',
          kidEmoji: kid?.avatar_emoji || '👶',
          totalPoints: student.school_points || 0,
          pointsThisWeek: weekPoints,
          recentAwards: studentPoints.slice(0, 10).map(p => ({
            id: p.id,
            points: p.points,
            reason: p.reason,
            created_at: p.created_at
          }))
        };
      });

      setReports(studentReports);
      setLoading(false);
    };

    fetchReports();
  }, [kids]);

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading school reports...
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <School className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No linked students yet</p>
        <p className="text-sm mt-1">Link your child to their classroom to see reports</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reports.map(report => (
        <Card key={report.studentId} className="overflow-hidden">
          <CardHeader className="pb-3 bg-primary/5">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{report.kidEmoji}</span>
                <div>
                  <div className="font-semibold">{report.kidName}</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    {report.studentName} • {report.classroomName}
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                <Star className="w-4 h-4 mr-1 text-warning" />
                {report.totalPoints}
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-4 space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-success/10 rounded-lg text-center">
                <div className="text-2xl font-bold text-success">
                  +{report.pointsThisWeek}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  This Week
                </div>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg text-center">
                <div className="text-2xl font-bold text-primary">
                  {report.totalPoints}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Award className="w-3 h-3" />
                  Total Points
                </div>
              </div>
            </div>

            {/* Recent Awards */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4" />
                Recent Awards
              </h4>
              
              {report.recentAwards.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No awards yet
                </p>
              ) : (
                <ScrollArea className="h-[180px]">
                  <div className="space-y-2">
                    {report.recentAwards.map(award => (
                      <div 
                        key={award.id}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{award.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(award.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <Badge className="bg-success/20 text-success ml-2 shrink-0">
                          +{award.points}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Lola Time Conversion */}
            <div className="p-3 bg-muted rounded-lg text-center text-sm">
              <span className="text-muted-foreground">Points converted to </span>
              <span className="font-semibold text-primary">
                {report.totalPoints} min
              </span>
              <span className="text-muted-foreground"> of Lola time 🐰</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SchoolReports;
