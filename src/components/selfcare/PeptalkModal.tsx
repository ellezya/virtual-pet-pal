import { Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CareItem } from '@/hooks/useSelfCare';
import { matchDifficultyToCategory, getRandomPeptalk } from '@/lib/peptalkDatabase';
import { useProgress } from '@/hooks/useProgress';
import { useSelfCare } from '@/hooks/useSelfCare';
import { useState, useEffect } from 'react';

interface PeptalkModalProps {
  item: CareItem;
  onDoItNow: () => void;
  onTryLater: () => void;
}

export const PeptalkModal = ({ item, onDoItNow, onTryLater }: PeptalkModalProps) => {
  const { progress } = useProgress();
  const { todayStats } = useSelfCare();
  const [peptalk, setPeptalk] = useState('');

  useEffect(() => {
    const category = matchDifficultyToCategory(item.difficulty_text);
    const stats = {
      feedCount: progress.totalSessions || 0,
      waterCount: progress.totalSessions || 0,
      playCount: progress.playSessions || 0,
      completedCount: todayStats.completed,
    };
    setPeptalk(getRandomPeptalk(category, stats));
  }, [item.difficulty_text, progress, todayStats.completed]);

  return (
    <Card className="border-2 border-yellow-300/30 bg-gradient-to-br from-background to-yellow-950/10">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          You've Got This!
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="p-4 rounded-xl bg-card/50 border border-border/50">
          <p className="text-foreground leading-relaxed">
            {peptalk}
          </p>
        </div>
        
        <div className="border-t border-border pt-4 space-y-3">
          <Button 
            onClick={onDoItNow}
            className="w-full bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500"
          >
            ✅ Okay, I'll do it now
          </Button>
          
          <Button 
            onClick={onTryLater}
            variant="outline"
            className="w-full"
          >
            <Clock className="w-4 h-4 mr-2" />
            I'll try later
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
