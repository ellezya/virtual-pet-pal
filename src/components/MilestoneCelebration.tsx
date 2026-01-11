import { useEffect, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Milestone {
  id: string;
  type: 'streak' | 'chores' | 'sessions' | 'school';
  value: number;
  title: string;
  emoji: string;
  message: string;
  bonusMinutes: number;
}

// Define streak milestones with bonus time rewards
const STREAK_MILESTONES: Milestone[] = [
  { id: 'streak-3', type: 'streak', value: 3, title: '3-Day Streak!', emoji: '🔥', message: 'Great start! Keep it up!', bonusMinutes: 5 },
  { id: 'streak-7', type: 'streak', value: 7, title: '7-Day Streak!', emoji: '🎉', message: "A whole week! You're amazing!", bonusMinutes: 10 },
  { id: 'streak-14', type: 'streak', value: 14, title: '2-Week Streak!', emoji: '🌟', message: "Two weeks strong! You're a superstar!", bonusMinutes: 15 },
  { id: 'streak-30', type: 'streak', value: 30, title: '30-Day Streak!', emoji: '🏆', message: 'A whole month! Incredible!', bonusMinutes: 30 },
  { id: 'streak-100', type: 'streak', value: 100, title: '100-Day Streak!', emoji: '👑', message: 'LEGENDARY! 100 days!', bonusMinutes: 60 },
];

const CHORE_MILESTONES: Milestone[] = [
  { id: 'chores-5', type: 'chores', value: 5, title: '5 Chores Done!', emoji: '✨', message: 'Great helper!', bonusMinutes: 3 },
  { id: 'chores-10', type: 'chores', value: 10, title: '10 Chores Done!', emoji: '🌈', message: 'Super helpful!', bonusMinutes: 5 },
  { id: 'chores-25', type: 'chores', value: 25, title: '25 Chores Done!', emoji: '⭐', message: 'Chore champion!', bonusMinutes: 10 },
  { id: 'chores-50', type: 'chores', value: 50, title: '50 Chores Done!', emoji: '🎖️', message: 'Master helper!', bonusMinutes: 15 },
  { id: 'chores-100', type: 'chores', value: 100, title: '100 Chores Done!', emoji: '🏅', message: 'Chore legend!', bonusMinutes: 30 },
];

const SESSION_MILESTONES: Milestone[] = [
  { id: 'sessions-10', type: 'sessions', value: 10, title: '10 Play Sessions!', emoji: '🎮', message: 'Lola loves seeing you!', bonusMinutes: 5 },
  { id: 'sessions-50', type: 'sessions', value: 50, title: '50 Play Sessions!', emoji: '🎈', message: 'Best friends forever!', bonusMinutes: 10 },
  { id: 'sessions-100', type: 'sessions', value: 100, title: '100 Play Sessions!', emoji: '💫', message: 'Super duper best friends!', bonusMinutes: 15 },
];

export const ALL_MILESTONES = [...STREAK_MILESTONES, ...CHORE_MILESTONES, ...SESSION_MILESTONES];

interface MilestoneCelebrationProps {
  milestone: Milestone | null;
  onClose: () => void;
  onBonusTimeAdded?: (minutes: number) => void;
}

const fireConfetti = () => {
  // Fire confetti from both sides
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
  
  // Left side burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0.1, y: 0.6 },
    colors,
    startVelocity: 45,
    gravity: 0.8,
  });
  
  // Right side burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0.9, y: 0.6 },
    colors,
    startVelocity: 45,
    gravity: 0.8,
  });
  
  // Center burst
  setTimeout(() => {
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { x: 0.5, y: 0.5 },
      colors,
      startVelocity: 55,
      gravity: 0.7,
    });
  }, 200);
};

const MilestoneCelebration = ({ milestone, onClose, onBonusTimeAdded }: MilestoneCelebrationProps) => {
  const [showBonus, setShowBonus] = useState(false);
  
  useEffect(() => {
    if (milestone) {
      fireConfetti();
      // Show bonus time message after initial celebration
      const timer = setTimeout(() => {
        setShowBonus(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [milestone]);
  
  const handleClose = useCallback(() => {
    if (milestone && onBonusTimeAdded) {
      onBonusTimeAdded(milestone.bonusMinutes);
    }
    setShowBonus(false);
    onClose();
  }, [milestone, onClose, onBonusTimeAdded]);
  
  if (!milestone) return null;
  
  return (
    <Dialog open={!!milestone} onOpenChange={() => handleClose()}>
      <DialogContent className="bg-card border-4 border-primary/50 rounded-2xl max-w-sm text-center overflow-hidden">
        <div className="py-6 px-4">
          {/* Big emoji celebration */}
          <div className="text-7xl mb-4 animate-bounce">
            {milestone.emoji}
          </div>
          
          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {milestone.title}
          </h2>
          
          {/* Message */}
          <p className="text-muted-foreground mb-4">
            {milestone.message}
          </p>
          
          {/* Bonus time reward */}
          {showBonus && milestone.bonusMinutes > 0 && (
            <div className="bg-primary/20 border-2 border-primary/30 rounded-xl p-4 mb-4 animate-scale-in">
              <p className="text-sm text-muted-foreground mb-1">Bonus Reward!</p>
              <p className="text-xl font-bold text-primary">
                +{milestone.bonusMinutes} minutes of Lola time! ⏰
              </p>
            </div>
          )}
          
          {/* Close button */}
          <Button 
            onClick={handleClose}
            className="pet-button-play w-full text-lg py-6"
          >
            Yay! 🎉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MilestoneCelebration;

// Helper to check if a milestone was just reached
export const checkMilestone = (
  type: 'streak' | 'chores' | 'sessions' | 'school',
  currentValue: number,
  previousValue: number,
  celebratedMilestones: string[]
): Milestone | null => {
  const milestones = ALL_MILESTONES.filter(m => m.type === type);
  
  for (const milestone of milestones) {
    // Check if we just crossed this milestone threshold
    if (currentValue >= milestone.value && 
        previousValue < milestone.value && 
        !celebratedMilestones.includes(milestone.id)) {
      return milestone;
    }
  }
  
  return null;
};

// Trigger confetti manually for testing
export const triggerTestConfetti = () => {
  fireConfetti();
};
