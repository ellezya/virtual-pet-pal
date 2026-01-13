import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useFamily } from '@/hooks/useFamily';
import { Check, Clock, Loader2, Home, Heart, BookOpen, ChevronRight, Timer, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface KidDashboardProps {
  open: boolean;
  onClose: () => void;
}

const KidDashboard = ({ open, onClose }: KidDashboardProps) => {
  const { 
    activeKid, 
    chores, 
    pendingCompletions, 
    completeChore,
    timeRemaining,
    isTimeUp,
    isTimePaused,
    logoutKid
  } = useFamily();
  
  const [completing, setCompleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chores' | 'journal'>('chores');
  const [showChoreComplete, setShowChoreComplete] = useState(false);
  const [completedChoreNote, setCompletedChoreNote] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [lastCompletedChore, setLastCompletedChore] = useState<string>('');

  if (!activeKid) return null;

  // Get chores for this kid (assigned to them or to all)
  const kidChores = chores.filter(c => 
    c.is_active && (!c.kid_id || c.kid_id === activeKid.id)
  );

  // Check if chore was already completed today (for daily chores)
  const isChoreCompletedToday = (choreId: string) => {
    const today = new Date().toDateString();
    return pendingCompletions.some(p => 
      p.chore_id === choreId && 
      p.kid_id === activeKid.id &&
      new Date(p.completed_at).toDateString() === today
    );
  };

  const handleComplete = async (choreId: string) => {
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;
    
    setCompleting(choreId);
    await completeChore(choreId, activeKid.id);
    setCompleting(null);
    setLastCompletedChore(chore.description);
    setShowChoreComplete(true);
    
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleJournalSubmit = () => {
    // Journal entry will be added when parent approves
    setShowChoreComplete(false);
    setCompletedChoreNote('');
    setSelectedEmoji('');
  };

  const totalLolaTime = activeKid.lola_time_from_chores + activeKid.lola_time_from_school;
  const completedToday = pendingCompletions.filter(p => {
    const today = new Date().toDateString();
    return p.kid_id === activeKid.id && new Date(p.completed_at).toDateString() === today;
  });

  // Format time remaining
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const pendingEmojis = ['💪', '🎉', '✨', '😊', '🌟', '💚', '🥳', '🔥', '👏', '🙌'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="text-4xl mb-2">{activeKid.avatar_emoji}</div>
          <DialogTitle className="text-2xl">
            Hi {activeKid.name}! 👋
          </DialogTitle>
          <DialogDescription>
            Complete chores to earn Lola time!
          </DialogDescription>
        </DialogHeader>

        {/* Timer Display */}
        {totalLolaTime > 0 && !isTimeUp && (
          <div className={`rounded-xl p-3 text-center ${
            timeRemaining <= 60 ? 'bg-amber-100 border-2 border-amber-300 animate-pulse' : 'bg-green-100'
          }`}>
            <div className="flex items-center justify-center gap-2">
              <Timer className={`w-5 h-5 ${timeRemaining <= 60 ? 'text-amber-600' : 'text-green-600'}`} />
              <span className={`text-lg font-bold ${timeRemaining <= 60 ? 'text-amber-700' : 'text-green-700'}`}>
                Lola time: {formatTimer(timeRemaining)}
              </span>
            </div>
            {timeRemaining <= 60 && (
              <p className="text-xs text-amber-600 mt-1">Time almost up!</p>
            )}
          </div>
        )}

        {/* Time's Up Notice */}
        {isTimeUp && (
          <div className="rounded-xl p-4 text-center bg-muted border-2 border-border">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="font-medium text-foreground">Time's up!</p>
            <p className="text-sm text-muted-foreground">
              Complete more chores to earn Lola time 🐰
            </p>
          </div>
        )}

        {/* Lola Time Balance */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Your Lola Time Balance</p>
          <p className="text-3xl font-bold text-primary">{totalLolaTime} min</p>
          <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Home className="w-3 h-3" /> Chores: {activeKid.lola_time_from_chores} min
            </span>
            {activeKid.lola_time_from_school > 0 && (
              <span>🏫 School: {activeKid.lola_time_from_school} min</span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'chores' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setActiveTab('chores')}
          >
            <Home className="w-4 h-4 mr-2" />
            Chores
            {kidChores.length - completedToday.length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                {kidChores.length - completedToday.length}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === 'journal' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setActiveTab('journal')}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Journal
          </Button>
        </div>

        {/* Chores Tab */}
        {activeTab === 'chores' && (
          <div className="space-y-3 max-h-[250px] overflow-y-auto">
            {kidChores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No chores yet!</p>
                <p className="text-sm">Ask a parent to add some.</p>
              </div>
            ) : (
              kidChores.map((chore) => {
                const completed = isChoreCompletedToday(chore.id);
                
                return (
                  <Card 
                    key={chore.id}
                    className={completed ? 'opacity-60 bg-muted/50' : 'hover:border-primary/30 transition-colors'}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            completed ? 'bg-amber-100' : 'bg-blue-100'
                          }`}>
                            {completed ? (
                              <Clock className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Home className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{chore.description}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="text-green-600 font-medium">+{chore.minutes_earned} min</span>
                              <span className="text-xs">• {chore.frequency}</span>
                            </div>
                          </div>
                        </div>
                        
                        {completed ? (
                          <div className="flex items-center gap-1 text-amber-600 text-sm px-2 py-1 bg-amber-50 rounded-lg">
                            <Clock className="w-3 h-3" />
                            Pending
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleComplete(chore.id)}
                            disabled={completing === chore.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {completing === chore.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Done!
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* Journal Tab */}
        {activeTab === 'journal' && (
          <div className="space-y-3 max-h-[250px] overflow-y-auto">
            {completedToday.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No accomplishments today yet!</p>
                <p className="text-sm">Complete a chore to add to your journal.</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">Today's Accomplishments</p>
                {completedToday.map((completion) => {
                  const chore = chores.find(c => c.id === completion.chore_id);
                  return (
                    <Card key={completion.id} className="bg-gradient-to-r from-green-50/50 to-transparent border-green-200/50">
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{chore?.description || 'Chore'}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 text-amber-500" />
                              <span>Waiting for parent approval</span>
                            </div>
                          </div>
                          <span className="text-sm text-green-600 font-medium">
                            +{completion.minutes_earned} min
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={onClose} className="flex-1">
            🐰 Play with Lola
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              logoutKid();
              onClose();
            }}
          >
            Switch User
          </Button>
        </div>

        {/* Chore Complete Modal */}
        {showChoreComplete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card rounded-2xl p-6 max-w-sm w-full mx-4 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-bold mb-2">Great job!</h3>
              <p className="text-muted-foreground mb-4">
                "{lastCompletedChore}" is waiting for parent approval.
              </p>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Add a note to your journal?
                  </p>
                  <Input
                    placeholder="How did it go? (optional)"
                    value={completedChoreNote}
                    onChange={(e) => setCompletedChoreNote(e.target.value)}
                    className="text-center"
                  />
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Add an emoji:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {pendingEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setSelectedEmoji(emoji)}
                        className={`text-2xl p-2 rounded-lg transition-all ${
                          selectedEmoji === emoji 
                            ? 'bg-primary/20 ring-2 ring-primary' 
                            : 'hover:bg-muted'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowChoreComplete(false)} className="flex-1">
                    Skip
                  </Button>
                  <Button onClick={handleJournalSubmit} className="flex-1">
                    Save to Journal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default KidDashboard;
