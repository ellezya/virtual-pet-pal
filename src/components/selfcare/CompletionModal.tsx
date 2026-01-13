import { useState } from 'react';
import { PartyPopper, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CareItem, useSelfCare } from '@/hooks/useSelfCare';
import confetti from 'canvas-confetti';

interface CompletionModalProps {
  item: CareItem;
  onComplete: () => void;
  onClose: () => void;
}

const quickEmojis = ['💪', '🎉', '✨', '😊', '🌟', '💚', '🥳'];

export const CompletionModal = ({ item, onComplete, onClose }: CompletionModalProps) => {
  const { markItemComplete } = useSelfCare();
  const [journalEntry, setJournalEntry] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (skipJournal: boolean) => {
    setSaving(true);
    const success = await markItemComplete(item.id, skipJournal ? undefined : journalEntry);
    
    if (success) {
      // Trigger confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFB6C1', '#98D8AA', '#FFD700', '#87CEEB'],
      });
    }
    
    setSaving(false);
    onComplete();
  };

  const addEmoji = (emoji: string) => {
    setJournalEntry(prev => prev + emoji);
  };

  const difficultyMessage = item.difficulty_text 
    ? `even though ${item.difficulty_text.toLowerCase()}.`
    : '';

  return (
    <Card className="border-2 border-green-300/30 bg-gradient-to-br from-background to-green-950/10">
      <CardHeader className="pb-4 text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-xl">
          <PartyPopper className="w-5 h-5 text-yellow-400" />
          You cared for yourself!
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-foreground font-medium">{item.item_text}</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground text-center">
          I'm so proud of you! You took care of something that was hard
          {difficultyMessage && ` ${difficultyMessage}`} That takes courage! 💚
        </p>
        
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">
            Add to your care journal?
          </label>
          <Input
            value={journalEntry}
            onChange={(e) => setJournalEntry(e.target.value)}
            placeholder="Add a note or emoji about how it went"
            className="bg-background/50"
          />
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground">Quick add:</span>
            {quickEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="text-lg hover:scale-125 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex gap-3 pt-2">
          <Button 
            onClick={() => handleSave(false)}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500"
            disabled={saving}
          >
            Save to Journal
          </Button>
          <Button 
            onClick={() => handleSave(true)}
            variant="outline"
            className="flex-1"
            disabled={saving}
          >
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
