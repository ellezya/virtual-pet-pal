import { Moon, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSelfCare } from '@/hooks/useSelfCare';
import { useProgress } from '@/hooks/useProgress';

interface EndOfDayRecapProps {
  onKeep: () => void;
  onStartFresh: () => void;
  onViewJournal?: () => void;
  onClose: () => void;
}

export const EndOfDayRecap = ({ onKeep, onStartFresh, onViewJournal, onClose }: EndOfDayRecapProps) => {
  const { careItems, todayStats, keepItemsForTomorrow, dismissEndOfDay } = useSelfCare();
  const { progress } = useProgress();

  const completedItems = careItems.filter(item => item.completed);
  const incompleteItems = careItems.filter(item => !item.completed);
  const allComplete = incompleteItems.length === 0;
  const noneComplete = completedItems.length === 0;

  const handleKeep = async () => {
    await keepItemsForTomorrow(true);
    await dismissEndOfDay();
    onKeep();
  };

  const handleStartFresh = async () => {
    await dismissEndOfDay();
    onStartFresh();
  };

  const handleClose = async () => {
    await dismissEndOfDay();
    onClose();
  };

  // All items completed view
  if (allComplete && careItems.length > 0) {
    return (
      <Card className="border-2 border-green-300/30 bg-gradient-to-br from-background to-green-950/10">
        <CardHeader className="pb-4 text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Moon className="w-5 h-5 text-blue-400" />
            Amazing Day!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-center text-foreground font-medium">
            You cared for EVERYTHING today! 🎉
          </p>
          
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <p className="text-sm text-muted-foreground">
              <strong>Lola:</strong> Fed {progress.totalCareActions || 0}, 
              Watered {progress.totalCareActions || 0}, 
              Played {progress.playSessions || 0}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Yourself:</p>
            {completedItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span className="text-green-400">✓</span>
                <span className="text-foreground">{item.item_text}</span>
              </div>
            ))}
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            You're incredible! Rest well tonight. 💚🌟
          </p>
          
          <div className="flex gap-3 pt-2">
            {onViewJournal && (
              <Button 
                onClick={onViewJournal}
                variant="outline"
                className="flex-1"
              >
                See full journal
              </Button>
            )}
            <Button 
              onClick={handleClose}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-400"
            >
              Good night!
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Nothing completed view
  if (noneComplete && careItems.length > 0) {
    return (
      <Card className="border-2 border-blue-300/30 bg-gradient-to-br from-background to-blue-950/10">
        <CardHeader className="pb-4 text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Moon className="w-5 h-5 text-blue-400" />
            End of Day
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-center text-foreground">
            Today didn't go as planned? That's completely okay! 💚
          </p>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Your care items:</p>
            {incompleteItems.map((item) => (
              <div key={item.id} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">•</span>
                <span className="text-foreground">{item.item_text}</span>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Want to try again tomorrow, or start fresh?
          </p>
          
          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleKeep}
              variant="outline"
              className="flex-1"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Keep these
            </Button>
            <Button 
              onClick={handleStartFresh}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start fresh
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Either way, you're doing great. Have a peaceful evening! 🌟
          </p>
        </CardContent>
      </Card>
    );
  }

  // Mixed - some complete, some not
  return (
    <Card className="border-2 border-blue-300/30 bg-gradient-to-br from-background to-blue-950/10">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <Moon className="w-5 h-5 text-blue-400" />
          Today's Care Recap
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-center text-foreground">
          You took good care today! 💚
        </p>
        
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-sm font-medium text-foreground mb-1">Cared for Lola:</p>
          <p className="text-sm text-muted-foreground">
            🥕 Fed {progress.totalCareActions || 0} times • 
            💧 Watered {progress.totalCareActions || 0} times • 
            🎾 Played {progress.playSessions || 0} times
          </p>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Cared for Yourself:</p>
          {completedItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span className="text-green-400">✓</span>
              <span className="text-foreground">{item.item_text}</span>
            </div>
          ))}
          {incompleteItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                {item.item_text} → Tomorrow's care
              </span>
            </div>
          ))}
        </div>
        
        <p className="text-sm text-muted-foreground text-center">
          Rest well! Tomorrow's a new day for caring. 🌟
        </p>
        
        <p className="text-sm text-center text-foreground font-medium">
          Keep incomplete items for tomorrow?
        </p>
        
        <div className="flex gap-3">
          <Button 
            onClick={handleKeep}
            variant="outline"
            className="flex-1"
          >
            Keep them
          </Button>
          <Button 
            onClick={handleStartFresh}
            className="flex-1"
          >
            Start fresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
