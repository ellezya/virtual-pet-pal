import { Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useSelfCare } from '@/hooks/useSelfCare';
import { cn } from '@/lib/utils';

interface MyCareTabProps {
  onClick: () => void;
}

export const MyCareTab = ({ onClick }: MyCareTabProps) => {
  const { careItems, todayStats, isReminderActive } = useSelfCare();
  
  if (careItems.length === 0) return null;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 hover:scale-[1.02]",
        isReminderActive 
          ? "my-care-reminder-active border-2" 
          : "border border-pink-300/30 bg-gradient-to-r from-pink-950/10 to-pink-900/5"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {isReminderActive ? (
          <div className="text-center">
            <div className="flex justify-center gap-1 mb-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="animate-pulse">✨</span>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 font-bold text-foreground">
              <Heart className="w-4 h-4 text-pink-400" />
              MY CARE - Time to check in!
              <span className="text-green-400">💚</span>
            </div>
            <div className="flex justify-center gap-1 mt-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="animate-pulse">✨</span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tap here</p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-400" />
              <span className="font-medium text-foreground">My Care</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-foreground">
                {todayStats.completed}/{todayStats.total} cared for today
              </div>
              <p className="text-xs text-muted-foreground">Tap to view</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
