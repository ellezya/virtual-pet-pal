import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Flame, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';

const Stats = () => {
  const navigate = useNavigate();
  const { progress, isGuest } = useProgress();
  const { user } = useAuth();

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const getMilestone = (streak: number) => {
    if (streak >= 30) return { emoji: '🏆', text: 'Monthly Master!' };
    if (streak >= 14) return { emoji: '⭐', text: 'Two Week Wonder!' };
    if (streak >= 7) return { emoji: '🎉', text: 'Week Champion!' };
    if (streak >= 3) return { emoji: '🌟', text: 'Getting Started!' };
    return null;
  };

  const milestone = getMilestone(progress.currentStreak);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Stats</h1>
            <p className="text-sm text-muted-foreground">
              {isGuest ? 'Saved on this device' : `Synced to ${user?.email}`}
            </p>
          </div>
        </div>

        {/* Milestone Banner */}
        {milestone && (
          <Card className="mb-6 border-2 border-primary/30 bg-primary/5">
            <CardContent className="p-4 text-center">
              <div className="text-4xl mb-2">{milestone.emoji}</div>
              <p className="font-bold text-foreground">{milestone.text}</p>
              <p className="text-sm text-muted-foreground">
                {progress.currentStreak}-day streak!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Days Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {progress.daysActive}
              </div>
              <p className="text-xs text-muted-foreground">days with Lola</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time Together
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {formatMinutes(progress.totalMinutes)}
              </div>
              <p className="text-xs text-muted-foreground">total playtime</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {progress.currentStreak}
              </div>
              <p className="text-xs text-muted-foreground">days in a row</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Best Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {progress.longestStreak}
              </div>
              <p className="text-xs text-muted-foreground">personal best</p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Total Sessions</p>
                <p className="text-sm text-muted-foreground">Times you've visited Lola</p>
              </div>
              <div className="text-2xl font-bold text-foreground">
                {progress.totalSessions}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lola Time */}
        <Card className="border-2 border-secondary/30 bg-secondary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground flex items-center gap-2">
                  🐰 Lola Time Available
                </p>
                <p className="text-sm text-muted-foreground">
                  Earned from chores & school
                </p>
              </div>
              <div className="text-2xl font-bold text-secondary">
                {progress.lolaTimeRemaining}m
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guest notice */}
        {isGuest && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Your progress is saved on this device only
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/auth')}
              className="gap-2"
            >
              Create account to sync everywhere
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stats;
