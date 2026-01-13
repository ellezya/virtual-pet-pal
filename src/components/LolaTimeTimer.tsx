import { useEffect, useState } from 'react';
import { useFamily } from '@/hooks/useFamily';
import { Timer, Pause, Play, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LolaTimeTimerProps {
  compact?: boolean;
  onTimeUp?: () => void;
}

const LolaTimeTimer = ({ compact = false, onTimeUp }: LolaTimeTimerProps) => {
  const { 
    activeKid, 
    timeRemaining, 
    isTimeUp, 
    isTimePaused,
    pauseTime,
    resumeTime 
  } = useFamily();
  
  const [showWarning, setShowWarning] = useState(false);
  const [shownOneMinWarning, setShownOneMinWarning] = useState(false);
  const [shownThirtySecWarning, setShownThirtySecWarning] = useState(false);

  // Show warnings at key times
  useEffect(() => {
    if (timeRemaining === 60 && !shownOneMinWarning) {
      setShowWarning(true);
      setShownOneMinWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
    }
    if (timeRemaining === 30 && !shownThirtySecWarning) {
      setShowWarning(true);
      setShownThirtySecWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
    }
    if (timeRemaining === 0 && shownOneMinWarning) {
      onTimeUp?.();
    }
  }, [timeRemaining, shownOneMinWarning, shownThirtySecWarning, onTimeUp]);

  // Reset warnings when kid changes
  useEffect(() => {
    setShownOneMinWarning(false);
    setShownThirtySecWarning(false);
  }, [activeKid?.id]);

  if (!activeKid) return null;

  const totalMinutes = activeKid.lola_time_from_chores + activeKid.lola_time_from_school;
  
  // Don't show if no time available
  if (totalMinutes <= 0) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (isTimeUp) return 'bg-muted text-muted-foreground';
    if (timeRemaining <= 30) return 'bg-red-100 text-red-700 border-red-300';
    if (timeRemaining <= 60) return 'bg-amber-100 text-amber-700 border-amber-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium border ${getTimerColor()}`}>
        <Timer className="w-3 h-3" />
        <span>{isTimeUp ? '0:00' : formatTime(timeRemaining)}</span>
      </div>
    );
  }

  return (
    <>
      {/* Timer Bar */}
      <div className={`rounded-xl p-3 border-2 transition-all ${getTimerColor()} ${
        timeRemaining <= 60 && !isTimeUp ? 'animate-pulse' : ''
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5" />
            <div>
              <span className="font-bold text-lg">
                {isTimeUp ? "Time's up!" : formatTime(timeRemaining)}
              </span>
              {isTimePaused && !isTimeUp && (
                <span className="ml-2 text-xs opacity-70">(paused)</span>
              )}
            </div>
          </div>
          
          {!isTimeUp && (
            <Button
              variant="ghost"
              size="sm"
              onClick={isTimePaused ? resumeTime : pauseTime}
              className="h-8 w-8 p-0"
            >
              {isTimePaused ? (
                <Play className="w-4 h-4" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
        
        {timeRemaining <= 60 && !isTimeUp && (
          <p className="text-xs mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {timeRemaining <= 30 ? 'Almost done!' : 'One minute left!'}
          </p>
        )}
      </div>

      {/* Warning Toast */}
      {showWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-amber-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <Timer className="w-5 h-5" />
            <span className="font-medium">
              {timeRemaining <= 30 ? '30 seconds left!' : '1 minute left!'}
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default LolaTimeTimer;
