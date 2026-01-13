import { useState } from 'react';
import { Heart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CareItem, useSelfCare } from '@/hooks/useSelfCare';
import { PeptalkModal } from './PeptalkModal';

interface CheckInModalProps {
  item: CareItem;
  onDone: () => void;
  onRemindLater: () => void;
  onClose: () => void;
}

export const CheckInModal = ({ item, onDone, onRemindLater, onClose }: CheckInModalProps) => {
  const { remindMeLater, requestPeptalk } = useSelfCare();
  const [showPeptalk, setShowPeptalk] = useState(false);
  
  const showPeptalkButton = item.remind_later_count >= 3;

  const handleRemindLater = async () => {
    await remindMeLater(item.id);
    onRemindLater();
  };

  const handleNeedPeptalk = async () => {
    await requestPeptalk(item.id);
    setShowPeptalk(true);
  };

  if (showPeptalk) {
    return (
      <PeptalkModal
        item={item}
        onDoItNow={() => {
          setShowPeptalk(false);
          onDone();
        }}
        onTryLater={() => {
          setShowPeptalk(false);
          handleRemindLater();
        }}
      />
    );
  }

  return (
    <Card className="border-2 border-pink-300/30 bg-gradient-to-br from-background to-pink-950/10">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Heart className="w-5 h-5 text-pink-400" />
          Self-Care Check-In
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Ready to care for yourself?
        </p>
        
        <div className="p-4 rounded-xl bg-card/50 border border-border/50">
          <div className="flex items-start gap-2">
            <span className="text-lg">📝</span>
            <span className="text-foreground font-medium">{item.item_text}</span>
          </div>
        </div>
        
        <div className="border-t border-border pt-4 space-y-3">
          <Button 
            onClick={onDone}
            className="w-full bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500"
          >
            ✅ Done!
          </Button>
          
          {showPeptalkButton ? (
            <Button 
              onClick={handleNeedPeptalk}
              variant="outline"
              className="w-full border-pink-300/50 hover:bg-pink-950/20"
            >
              💪 I need a peptalk
            </Button>
          ) : (
            <Button 
              onClick={handleRemindLater}
              variant="outline"
              className="w-full"
            >
              <Clock className="w-4 h-4 mr-2" />
              Remind me later
            </Button>
          )}
        </div>
        
        <Button 
          onClick={onClose}
          variant="ghost"
          className="w-full text-muted-foreground"
        >
          Close
        </Button>
      </CardContent>
    </Card>
  );
};
