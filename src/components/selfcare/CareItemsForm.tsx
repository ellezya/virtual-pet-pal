import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CareItemInput {
  text: string;
  difficulty: string;
}

interface CareItemsFormProps {
  onSubmit: (items: CareItemInput[]) => void;
  onCancel?: () => void;
  initialItems?: CareItemInput[];
}

export const CareItemsForm = ({ onSubmit, onCancel, initialItems }: CareItemsFormProps) => {
  const [items, setItems] = useState<CareItemInput[]>(
    initialItems || [
      { text: '', difficulty: '' },
      { text: '', difficulty: '' },
      { text: '', difficulty: '' },
    ]
  );

  const updateItem = (index: number, field: 'text' | 'difficulty', value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty items and validate
    const validItems = items.filter(item => item.text.trim().length > 0);
    
    if (validItems.length === 0) {
      return;
    }
    
    onSubmit(validItems);
  };

  const filledCount = items.filter(item => item.text.trim().length > 0).length;

  return (
    <Card className="border-2 border-pink-300/30 bg-gradient-to-br from-background to-pink-950/10">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Heart className="w-5 h-5 text-pink-400" />
          3 Ways I'll Care for Myself Today
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          These can be self-care, errands, or things on your to-do list. I'll gently remind you throughout the day.
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className="space-y-3 p-4 rounded-xl bg-card/50 border border-border/50">
              <div className="space-y-2">
                <Label htmlFor={`care-item-${index}`} className="text-sm font-medium">
                  {index + 1}. Care item {index === 0 && <span className="text-pink-400">*</span>}
                </Label>
                <Input
                  id={`care-item-${index}`}
                  value={item.text}
                  onChange={(e) => updateItem(index, 'text', e.target.value)}
                  placeholder="e.g., Take a 15 minute walk"
                  maxLength={100}
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`difficulty-${index}`} className="text-xs text-muted-foreground">
                  What makes this hard to do? (optional)
                </Label>
                <Input
                  id={`difficulty-${index}`}
                  value={item.difficulty}
                  onChange={(e) => updateItem(index, 'difficulty', e.target.value)}
                  placeholder="e.g., I always forget or run out of time"
                  maxLength={200}
                  className="bg-background/50 text-sm"
                />
              </div>
            </div>
          ))}
          
          <div className="flex gap-3 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-to-r from-pink-500 to-pink-400 hover:from-pink-600 hover:to-pink-500"
              disabled={filledCount === 0}
            >
              Save & Continue
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            {filledCount}/3 care items filled • At least 1 required
          </p>
        </form>
      </CardContent>
    </Card>
  );
};
