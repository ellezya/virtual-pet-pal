import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFamily } from '@/hooks/useFamily';
import { Check, Clock, Loader2 } from 'lucide-react';

interface KidChoresListProps {
  open: boolean;
  onClose: () => void;
}

const KidChoresList = ({ open, onClose }: KidChoresListProps) => {
  const { activeKid, chores, pendingCompletions, completeChore } = useFamily();
  const [completing, setCompleting] = useState<string | null>(null);

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
    setCompleting(choreId);
    await completeChore(choreId, activeKid.id);
    setCompleting(null);
  };

  const totalLolaTime = activeKid.lola_time_from_chores + activeKid.lola_time_from_school;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="text-4xl mb-2">{activeKid.avatar_emoji}</div>
          <DialogTitle className="text-2xl">
            Hi {activeKid.name}! 
          </DialogTitle>
          <DialogDescription>
            Complete chores to earn Lola time!
          </DialogDescription>
        </DialogHeader>

        {/* Lola Time Balance */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Your Lola Time</p>
          <p className="text-3xl font-bold text-primary">{totalLolaTime} min</p>
          <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>🏠 Chores: {activeKid.lola_time_from_chores} min</span>
            {activeKid.lola_time_from_school > 0 && (
              <span>🏫 School: {activeKid.lola_time_from_school} min</span>
            )}
          </div>
        </div>

        {/* Chores List */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
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
                  className={completed ? 'opacity-60' : ''}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{chore.description}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {chore.minutes_earned} min
                          <span className="text-xs">• {chore.frequency}</span>
                        </div>
                      </div>
                      
                      {completed ? (
                        <div className="flex items-center gap-1 text-amber-600 text-sm">
                          <Clock className="w-4 h-4" />
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

        <Button onClick={onClose} className="w-full">
          🐰 Play with Lola
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default KidChoresList;
