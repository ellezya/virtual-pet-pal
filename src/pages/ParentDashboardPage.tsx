import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useFamily } from '@/hooks/useFamily';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Clock, Settings, LogOut } from 'lucide-react';
import ParentDashboard from '@/components/ParentDashboard';

const ParentDashboardPage = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { family, kids, pendingCompletions, loading: familyLoading } = useFamily();
  const [showManage, setShowManage] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  if (authLoading || familyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-4xl animate-bounce">🐰</div>
      </div>
    );
  }

  const today = new Date().toDateString();

  // For each kid, determine Lola time status:
  // "Lola time earned" = completed daily check-in AND at least one chore marked complete.
  // Family kids don't have a separate check-in record; we use today's chore completion
  // as the combined signal (submitting a chore counts as the daily check-in proxy).
  const getKidStatus = (kidId: string) => {
    const kid = kids.find((k) => k.id === kidId);
    const totalLolaTime = (kid?.lola_time_from_chores ?? 0) + (kid?.lola_time_from_school ?? 0);

    const todayCompletions = pendingCompletions.filter(
      (p) => p.kid_id === kidId && new Date(p.completed_at).toDateString() === today
    );
    const choreSubmittedToday = todayCompletions.length > 0;

    // Earned = has submitted a chore today (check-in proxy) AND has Lola time available
    if (choreSubmittedToday && totalLolaTime > 0) {
      return { earned: true, missing: null as string | null };
    }
    if (!choreSubmittedToday && totalLolaTime === 0) {
      return { earned: false, missing: 'Complete your check-in' };
    }
    if (!choreSubmittedToday) {
      return { earned: false, missing: 'Complete a chore' };
    }
    // Has chore today but no Lola time yet (pending approval)
    return { earned: false, missing: 'Waiting for approval' };
  };

  const pendingCount = pendingCompletions.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <p className="font-bold text-foreground leading-tight">
            {family?.name || 'Family Dashboard'}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setShowManage(true)}>
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
        {/* No family set up yet */}
        {!family ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Welcome!</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Set up your family to track kids, chores, and Lola time.
            </p>
            <Button onClick={() => setShowManage(true)} size="lg">
              Set Up Family
            </Button>
          </div>
        ) : (
          <>
            {/* Pending approvals banner */}
            {pendingCount > 0 && (
              <button
                className="w-full text-left"
                onClick={() => setShowManage(true)}
              >
                <Card className="bg-amber-500/10 border-amber-400/30 hover:border-amber-400/60 transition-colors">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <p className="text-sm font-medium text-foreground">
                        {pendingCount} chore{pendingCount !== 1 ? 's' : ''} waiting for approval
                      </p>
                    </div>
                    <span className="text-xs text-amber-600 font-semibold">Approve →</span>
                  </CardContent>
                </Card>
              </button>
            )}

            {/* Kid status cards */}
            {kids.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-3">👶</div>
                <p className="text-muted-foreground text-sm">No kids added yet.</p>
                <Button className="mt-4" onClick={() => setShowManage(true)}>
                  Add a Child
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {kids.map((kid) => {
                  const { earned, missing } = getKidStatus(kid.id);
                  const totalLolaTime = kid.lola_time_from_chores + kid.lola_time_from_school;

                  return (
                    <Card
                      key={kid.id}
                      className={`border-2 transition-all ${
                        earned
                          ? 'border-green-500/30 bg-green-500/5'
                          : 'border-border'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Avatar with Lola status dot */}
                          <div className="relative shrink-0">
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-3xl select-none">
                              {kid.avatar_emoji}
                            </div>
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card ${
                                earned
                                  ? 'bg-green-500'
                                  : totalLolaTime > 0
                                  ? 'bg-amber-400'
                                  : 'bg-muted-foreground/30'
                              }`}
                            />
                          </div>

                          {/* Name + status */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground text-base truncate">
                              {kid.name}
                            </p>
                            {kid.age != null && (
                              <p className="text-xs text-muted-foreground">Age {kid.age}</p>
                            )}

                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="text-xs text-muted-foreground">
                                {totalLolaTime > 0
                                  ? `${totalLolaTime} min Lola time`
                                  : 'No Lola time yet'}
                              </span>
                            </div>

                            {earned ? (
                              <div className="flex items-center gap-1 mt-1">
                                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                                <span className="text-xs font-medium text-green-600">
                                  Lola time earned!
                                </span>
                              </div>
                            ) : missing ? (
                              <div className="flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                                <span className="text-xs text-amber-600">{missing}</span>
                              </div>
                            ) : null}
                          </div>

                          {/* CTA button */}
                          {earned ? (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white shrink-0 font-semibold"
                              onClick={() => navigate('/')}
                            >
                              🐰 Play
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0"
                              onClick={() => setShowManage(true)}
                            >
                              Manage
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Manage family button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowManage(true)}
            >
              👨‍👩‍👧‍👦 Manage Family
            </Button>
          </>
        )}
      </div>

      {/* Full parent management dialog (existing component, untouched) */}
      <ParentDashboard open={showManage} onClose={() => setShowManage(false)} />
    </div>
  );
};

export default ParentDashboardPage;
