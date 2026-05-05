import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Users, School, CheckCircle2, AlertTriangle,
  FileText, BarChart3, CalendarClock, Landmark,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CZStats {
  activeStudents: number;
  activeClassrooms: number;
  checkinsThisWeek: number;
  checkInRate: number | null;
  incidentsThisWeek: number;
  incidentsBySeverity: Record<string, number>;
  incidentsByType: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getWeekStart(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // back to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getSchoolDaysElapsed(): number {
  const day = new Date().getDay(); // 0=Sun..6=Sat
  if (day === 0) return 0;
  if (day === 6) return 5;
  return day; // Mon=1 … Fri=5
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  iconClass?: string;
}

const StatCard = ({ icon, label, value, sub, iconClass = 'text-primary' }: StatCardProps) => (
  <Card>
    <CardHeader className="pb-2">
      <CardDescription>{label}</CardDescription>
      <CardTitle className="text-2xl flex items-center gap-2">
        <span className={iconClass}>{icon}</span>
        {value}
      </CardTitle>
    </CardHeader>
    {sub && (
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    )}
  </Card>
);

interface PlaceholderCardProps {
  icon: React.ReactNode;
  label: string;
}

const PlaceholderCard = ({ icon, label }: PlaceholderCardProps) => (
  <Card className="border-dashed opacity-70">
    <CardHeader className="pb-2">
      <CardDescription>{label}</CardDescription>
      <CardTitle className="text-2xl flex items-center gap-2 text-muted-foreground">
        <span>{icon}</span>
        —
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <Badge variant="outline" className="text-xs">Pending SpedZen connection</Badge>
    </CardContent>
  </Card>
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const AuthorityAdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CZStats | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchStats();
  }, [user, authLoading]);

  const fetchStats = async () => {
    try {
      const wsIso = getWeekStart().toISOString();

      const [
        { count: activeStudents },
        { count: activeClassrooms },
        { count: checkinsThisWeek },
        { data: incidents },
      ] = await Promise.all([
        supabase
          .from('students')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('classrooms')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('daily_checkins')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', wsIso),
        supabase
          .from('behavior_incidents')
          .select('severity, incident_type')
          .gte('created_at', wsIso),
      ]);

      const daysElapsed = getSchoolDaysElapsed();
      const possible = (activeStudents ?? 0) * daysElapsed;
      const checkInRate = possible > 0
        ? Math.round(((checkinsThisWeek ?? 0) / possible) * 100)
        : null;

      const incidentsBySeverity: Record<string, number> = {};
      const incidentsByType: Record<string, number> = {};
      for (const inc of incidents ?? []) {
        incidentsBySeverity[inc.severity] = (incidentsBySeverity[inc.severity] ?? 0) + 1;
        incidentsByType[inc.incident_type] = (incidentsByType[inc.incident_type] ?? 0) + 1;
      }

      setStats({
        activeStudents: activeStudents ?? 0,
        activeClassrooms: activeClassrooms ?? 0,
        checkinsThisWeek: checkinsThisWeek ?? 0,
        checkInRate,
        incidentsThisWeek: incidents?.length ?? 0,
        incidentsBySeverity,
        incidentsByType,
      });
    } catch (err) {
      console.error('Authority admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const severityVariant = (s: string): 'destructive' | 'secondary' | 'outline' =>
    s === 'critical' || s === 'high' ? 'destructive' : s === 'medium' ? 'secondary' : 'outline';

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Landmark className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold">Authority Admin</h1>
            </div>
            <p className="text-muted-foreground">Read-only district and authority-level oversight</p>
          </div>
        </div>

        {/* CultureZen live stats */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold">CultureZen</h2>
            <Badge className="text-xs">Live</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Active Students"
              value={stats?.activeStudents ?? 0}
              iconClass="text-blue-500"
            />
            <StatCard
              icon={<School className="h-5 w-5" />}
              label="Active Classrooms"
              value={stats?.activeClassrooms ?? 0}
              iconClass="text-green-500"
            />
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Check-in Rate This Week"
              value={stats?.checkInRate != null ? `${stats.checkInRate}%` : '—'}
              sub={`${stats?.checkinsThisWeek ?? 0} check-in${stats?.checkinsThisWeek !== 1 ? 's' : ''} logged`}
              iconClass="text-teal-500"
            />
            <StatCard
              icon={<AlertTriangle className="h-5 w-5" />}
              label="Incidents This Week"
              value={stats?.incidentsThisWeek ?? 0}
              iconClass="text-orange-500"
            />
          </div>
        </section>

        {/* Incident breakdown — only shown when there are incidents */}
        {(stats?.incidentsThisWeek ?? 0) > 0 && (
          <section>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Incident Breakdown This Week
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">By Severity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats!.incidentsBySeverity).map(([severity, count]) => (
                      <div key={severity} className="flex justify-between items-center">
                        <Badge variant={severityVariant(severity)} className="capitalize">
                          {severity}
                        </Badge>
                        <span className="font-mono text-sm">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">By Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats!.incidentsByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{type.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-sm">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        <Separator />

        {/* SpedZen placeholder stats */}
        <section>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-muted-foreground">SpedZen</h2>
            <Badge variant="outline" className="text-xs">Pending SpedZen connection</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            IEP data will appear here once the SpedZen integration is established.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PlaceholderCard
              icon={<FileText className="h-5 w-5" />}
              label="Total Active IEPs"
            />
            <PlaceholderCard
              icon={<BarChart3 className="h-5 w-5" />}
              label="IEP Compliance Rate"
            />
            <PlaceholderCard
              icon={<CalendarClock className="h-5 w-5" />}
              label="Students with Upcoming IEP Reviews"
            />
          </div>
        </section>

      </div>
    </div>
  );
};

export default AuthorityAdminPage;
