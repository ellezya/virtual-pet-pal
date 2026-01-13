import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Flame, Heart, Gamepad2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProgress } from '@/hooks/useProgress';
import { useAuth } from '@/hooks/useAuth';
import { useSelfCare } from '@/hooks/useSelfCare';
import { SelfCareButton, MyCareTab, EncouragementFlag } from '@/components/selfcare';

const Stats = () => {
  const navigate = useNavigate();
  const { progress, isGuest } = useProgress();
  const { user } = useAuth();
  const { hasCareItems, showEncouragementFlag, dismissEncouragementFlag } = useSelfCare();

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
  
  // Check if all 6 toys are unlocked
  const allToysUnlocked = progress.unlockedToys.length >= 6;

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
            <h1 className="text-2xl font-bold text-foreground">💗 My LaLaLola Care Journal</h1>
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

        {/* Sessions & Play Sessions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Sessions</p>
                <div className="text-2xl font-bold text-foreground">
                  {progress.totalSessions}
                </div>
                <p className="text-xs text-muted-foreground">visits to Lola</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center justify-center gap-1">
                  <Gamepad2 className="w-3 h-3" /> Play Sessions
                </p>
                <div className="text-2xl font-bold text-foreground">
                  {progress.playSessions || 0}
                </div>
                <p className="text-xs text-muted-foreground">toys played</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Unlocked Toys */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <p className="font-medium text-foreground">Unlocked Toys</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {progress.unlockedToys.map((toyId) => {
                const toyEmojis: Record<string, string> = {
                  hayPile: '🪺',
                  balloon: '🎈',
                  yarn: '🧶',
                  cardboard: '📦',
                  tunnel: '🪵',
                  trampoline: '🎪',
                };
                return (
                  <div
                    key={toyId}
                    className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-xl"
                    title={toyId}
                  >
                    {toyEmojis[toyId] || '🎁'}
                  </div>
                );
              })}
              {6 - progress.unlockedToys.length > 0 && (
                <div className="text-sm text-muted-foreground flex items-center gap-1 ml-2">
                  +{6 - progress.unlockedToys.length} more to unlock
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Encouragement Flag - shows after all toys unlocked */}
        {allToysUnlocked && showEncouragementFlag && (
          <EncouragementFlag onDismiss={dismissEncouragementFlag} />
        )}

        {/* Self Care Button - replaces "Lola Time Available" */}
        <SelfCareButton />

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