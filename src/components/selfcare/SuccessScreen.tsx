import { PartyPopper, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SuccessScreenProps {
  items: string[];
  onClose: () => void;
}

export const SuccessScreen = ({ items, onClose }: SuccessScreenProps) => {
  return (
    <Card className="border-2 border-green-300/30 bg-gradient-to-br from-background to-green-950/10">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <PartyPopper className="w-5 h-5 text-yellow-400" />
          Your care list is saved!
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          I'll gently remind you to care for:
        </p>
        
        <div className="space-y-2">
          {items.map((item, index) => (
            <div 
              key={index}
              className="flex items-start gap-2 p-3 rounded-lg bg-card/50 border border-border/50"
            >
              <span className="text-green-400 font-bold">{index + 1}.</span>
              <span className="text-foreground">{item}</span>
            </div>
          ))}
        </div>
        
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Take your time with these. No pressure!
          </p>
          <Heart className="w-6 h-6 text-green-400 mx-auto mt-2" />
        </div>
        
        <Button 
          onClick={onClose}
          className="w-full bg-gradient-to-r from-primary to-orange-400 hover:from-primary/90 hover:to-orange-500"
        >
          Back to Lola
        </Button>
      </CardContent>
    </Card>
  );
};
