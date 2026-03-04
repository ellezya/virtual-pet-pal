import { Heart } from 'lucide-react';
import { useProgress } from '@/hooks/useProgress';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { TOY_REQUIREMENTS } from '@/components/ToyBox';

// Care levels with thresholds and rewards
const CARE_LEVELS = [
  { level: 1, minPoints: 0, title: 'New Caretaker', emoji: '🌱', color: 'text-green-500' },
  { level: 2, minPoints: 10, title: 'Caring Friend', emoji: '💚', color: 'text-green-600' },
  { level: 3, minPoints: 25, title: 'Loving Buddy', emoji: '💛', color: 'text-yellow-500' },
  { level: 4, minPoints: 50, title: 'Devoted Pal', emoji: '🧡', color: 'text-orange-500' },
  { level: 5, minPoints: 100, title: 'Heart Hero', emoji: '❤️', color: 'text-red-500' },
  { level: 6, minPoints: 200, title: 'Care Champion', emoji: '💖', color: 'text-pink-500' },
  { level: 7, minPoints: 350, title: 'Love Legend', emoji: '💝', color: 'text-fuchsia-500' },
  { level: 8, minPoints: 500, title: 'Care Master', emoji: '👑', color: 'text-amber-500' },
];

const TOY_NAMES: Record<string, { name: string; emoji: string }> = {
  hayPile: { name: 'Hay Pile', emoji: '🪺' },
  balloon: { name: 'Balloon', emoji: '🎈' },
  cardboard: { name: 'Cardboard Box', emoji: '📦' },
  yarn: { name: 'Yarn Ball', emoji: '🧶' },
  trampoline: { name: 'Trampoline', emoji: '🎪' },
  tunnel: { name: 'Tunnel', emoji: '🪵' },
};

export function getCurrentLevel(points: number) {
  let current = CARE_LEVELS[0];
  for (const level of CARE_LEVELS) {
    if (points >= level.minPoints) current = level;
    else break;
  }
  return current;
}

export function getNextLevel(points: number) {
  for (const level of CARE_LEVELS) {
    if (points < level.minPoints) return level;
  }
  return null; // maxed out
}

const CarePointsBadge = () => {
  const { progress, unlockedToys } = useProgress();
  const [showDetails, setShowDetails] = useState(false);
  const points = progress.totalCareActions || 0;
  const currentLevel = getCurrentLevel(points);
  const nextLevel = getNextLevel(points);

  const progressToNext = nextLevel
    ? ((points - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
    : 100;

  return (
    <>
      <button
        onClick={() => setShowDetails(true)}
        className="flex items-center gap-1 px-2 py-1 rounded-full bg-pink-100/80 hover:bg-pink-200/90 transition-colors shadow-sm"
        title="Care Points"
      >
        <Heart size={14} className="text-pink-500 fill-pink-500" />
        <span className="text-xs font-bold text-pink-700">{points}</span>
      </button>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="text-pink-500 fill-pink-500" size={20} />
              Care Points
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Level */}
            <div className="text-center p-4 rounded-xl bg-gradient-to-b from-pink-50 to-pink-100/50 border border-pink-200/50">
              <div className="text-3xl mb-1">{currentLevel.emoji}</div>
              <p className="font-bold text-foreground">Level {currentLevel.level}: {currentLevel.title}</p>
              <p className="text-2xl font-extrabold text-pink-600 mt-1">
                <Heart className="inline w-5 h-5 fill-pink-500 text-pink-500 -mt-1" /> {points}
              </p>
            </div>

            {/* Progress to Next Level */}
            {nextLevel ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Level {nextLevel.level}: {nextLevel.title}</span>
                  <span>{points}/{nextLevel.minPoints}</span>
                </div>
                <Progress value={progressToNext} className="h-2.5 bg-pink-100" />
                <p className="text-xs text-muted-foreground text-center">
                  {nextLevel.minPoints - points} more care actions to level up!
                </p>
              </div>
            ) : (
              <p className="text-center text-sm text-pink-600 font-medium">
                🎉 Max level reached! You're a true Care Master!
              </p>
            )}

            {/* Toy Unlock Progress */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">🎁 Toy Unlocks</p>
              <div className="space-y-1.5">
                {Object.entries(TOY_REQUIREMENTS).map(([toyId, req]) => {
                  const isUnlocked = unlockedToys.includes(toyId);
                  const toy = TOY_NAMES[toyId];
                  if (!toy) return null;
                  return (
                    <div key={toyId} className="flex items-center gap-2 text-sm">
                      <span className={isUnlocked ? '' : 'grayscale opacity-50'}>{toy.emoji}</span>
                      <span className={isUnlocked ? 'text-foreground' : 'text-muted-foreground'}>
                        {toy.name}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {isUnlocked ? '✅' : `${req.value} pts`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* How to earn */}
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="font-medium text-foreground">How to earn 💗 Care Points:</p>
              <p>🥕 Feed Lola → +1 point</p>
              <p>💧 Give water → +1 point</p>
              <p>🎾 Play with toy → +1 point</p>
              <p>😴 Tuck in for nap → +1 point</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CarePointsBadge;
