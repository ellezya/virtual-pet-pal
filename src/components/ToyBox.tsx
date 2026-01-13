import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Toy {
  id: string;
  emoji: string | null;
  component: React.FC<{ large?: boolean }> | null;
  name: string;
  energyCost: number;
  happinessBoost: number;
  lowEnergy: boolean;
}

interface ToyUnlockRequirement {
  type: 'streak' | 'sessions' | 'chores' | 'school';
  value: number;
  label: string;
}

const TOY_REQUIREMENTS: Record<string, ToyUnlockRequirement> = {
  hayPile: { type: 'streak', value: 0, label: 'Always unlocked' }, // starter toy
  balloon: { type: 'streak', value: 3, label: '3-day care streak' },
  yarn: { type: 'streak', value: 7, label: '7-day care streak' },
  cardboard: { type: 'sessions', value: 20, label: '20 play sessions' },
  tunnel: { type: 'chores', value: 10, label: '10 chores completed' },
  trampoline: { type: 'school', value: 50, label: '50 school points' },
};

interface ToyBoxProps {
  toys: Toy[];
  selectedToy: Toy | null;
  onSelectToy: (toy: Toy) => void;
  toyScale?: number;
}

const ToyBox: React.FC<ToyBoxProps> = ({ toys, selectedToy, onSelectToy, toyScale = 1 }) => {
  const { progress, unlockedToys, checkToyUnlock } = useProgress();
  const [lockedToyModal, setLockedToyModal] = useState<Toy | null>(null);

  const getProgress = (toy: Toy): { current: number; required: number; remaining: number } => {
    const req = TOY_REQUIREMENTS[toy.id];
    if (!req) return { current: 0, required: 0, remaining: 0 };

    let current = 0;
    switch (req.type) {
      case 'streak':
        current = progress.currentStreak;
        break;
      case 'sessions':
        current = progress.playSessions || 0;
        break;
      case 'chores':
        current = progress.choresCompleted || 0;
        break;
      case 'school':
        current = progress.schoolPoints || 0;
        break;
    }

    return {
      current,
      required: req.value,
      remaining: Math.max(0, req.value - current),
    };
  };

  const handleToyClick = (toy: Toy) => {
    if (unlockedToys.includes(toy.id)) {
      onSelectToy(toy);
    } else {
      setLockedToyModal(toy);
    }
  };

  const getProgressLabel = (toy: Toy): string => {
    const req = TOY_REQUIREMENTS[toy.id];
    if (!req) return '';

    const { current, required, remaining } = getProgress(toy);
    
    switch (req.type) {
      case 'streak':
        return `Your progress: ${current} day${current !== 1 ? 's' : ''} (${remaining} more to go!)`;
      case 'sessions':
        return `Your progress: ${current} session${current !== 1 ? 's' : ''} (${remaining} more to go!)`;
      case 'chores':
        return `Your progress: ${current} chore${current !== 1 ? 's' : ''} (${remaining} more to go!)`;
      case 'school':
        return `Your progress: ${current} point${current !== 1 ? 's' : ''} (${remaining} more to go!)`;
      default:
        return '';
    }
  };

  const getRequirementText = (toy: Toy): string => {
    const req = TOY_REQUIREMENTS[toy.id];
    return req ? `Requirement: ${req.label}` : '';
  };

  return (
    <>
      <div className="flex gap-1.5 bg-background/60 backdrop-blur-sm rounded-lg p-1.5 border border-border/50">
        {toys.map((toy) => {
          const isUnlocked = unlockedToys.includes(toy.id);
          const isSelected = selectedToy.id === toy.id;

          // Add pulsing glow to hay pile when no toy is selected
          const shouldPulse = toy.id === 'hayPile' && isUnlocked && !selectedToy;

          return (
            <button
              key={toy.id}
              onClick={() => handleToyClick(toy)}
              className={`
                relative flex items-center justify-center 
                w-10 h-10 rounded-lg transition-all duration-200
                ${isSelected && isUnlocked ? 'bg-primary/20 ring-2 ring-primary scale-110' : ''}
                ${isUnlocked ? 'hover:bg-muted/60 cursor-pointer' : 'cursor-pointer opacity-50'}
                ${shouldPulse ? 'animate-pulse ring-2 ring-yellow-400/80 shadow-[0_0_12px_4px_rgba(250,204,21,0.5)]' : ''}
              `}
              title={isUnlocked ? toy.name : `${toy.name} (Locked)`}
            >
              {toy.component ? (
                <div className={isUnlocked ? '' : 'grayscale brightness-50'}>
                  <toy.component large={false} />
                </div>
              ) : (
                <span 
                  className={`text-xl ${isUnlocked ? '' : 'grayscale brightness-50'}`}
                  style={{ transform: `scale(${toyScale})` }}
                >
                  {toy.emoji}
                </span>
              )}
              
              {!isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                  <Lock className="w-4 h-4 text-white/80" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Locked Toy Modal */}
      <Dialog open={!!lockedToyModal} onOpenChange={() => setLockedToyModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {lockedToyModal?.emoji && <span className="text-2xl grayscale">{lockedToyModal.emoji}</span>}
              {lockedToyModal?.name} - Locked
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <p className="text-muted-foreground">
              Keep caring for Lola to unlock!
            </p>
            
            <div className="space-y-2 text-sm">
              <p className="font-medium">
                {lockedToyModal && getRequirementText(lockedToyModal)}
              </p>
              <p className="text-primary">
                {lockedToyModal && getProgressLabel(lockedToyModal)}
              </p>
            </div>
            
            <Button 
              onClick={() => setLockedToyModal(null)} 
              className="w-full"
            >
              Keep Playing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { ToyBox, TOY_REQUIREMENTS };
export type { ToyUnlockRequirement };
