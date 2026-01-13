import { X, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EncouragementFlagProps {
  onDismiss: () => void;
}

export const EncouragementFlag = ({ onDismiss }: EncouragementFlagProps) => {
  return (
    <Card className="border-2 border-yellow-300/50 bg-gradient-to-r from-yellow-950/20 to-primary/10 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 flex justify-between px-4 py-1">
        <span className="text-yellow-400">🎉</span>
        <span className="text-yellow-400">🎉</span>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm"
        className="absolute top-1 right-1 h-6 w-6 p-0 hover:bg-transparent"
        onClick={onDismiss}
      >
        <X className="w-4 h-4" />
      </Button>
      
      <CardContent className="pt-8 pb-4 text-center">
        <p className="text-foreground font-medium mb-2">
          💭 You unlocked everything! Now what?
        </p>
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
          Try caring for yourself too! Check the stats button below
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </p>
      </CardContent>
    </Card>
  );
};
