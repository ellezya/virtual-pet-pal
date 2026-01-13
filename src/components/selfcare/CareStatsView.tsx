import { useState } from 'react';
import { Heart, Settings, Edit, Trash2, Plus, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSelfCare, CareItem } from '@/hooks/useSelfCare';
import { useProgress } from '@/hooks/useProgress';
import { toast } from 'sonner';

interface CareStatsViewProps {
  onClose: () => void;
  onEditItems: () => void;
  onReminderSettings: () => void;
}

export const CareStatsView = ({ onClose, onEditItems, onReminderSettings }: CareStatsViewProps) => {
  const { careItems, careSettings } = useSelfCare();
  const { progress } = useProgress();

  const getNextReminderTime = () => {
    if (!careSettings || careSettings.reminder_frequency === 'off') {
      return 'Reminders off';
    }
    const interval = careSettings.reminder_frequency === '1hour' ? '1 hour' : '3 hours';
    return `Every ${interval}`;
  };

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">📊 Today's Care</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Lola care stats */}
        <div className="space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            🐰 CARING FOR LOLA
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-card/50 border border-border/50">
              <div className="text-lg">🥕</div>
              <div className="text-sm font-bold">{progress.totalCareActions || 0}</div>
              <div className="text-xs text-muted-foreground">Fed</div>
            </div>
            <div className="p-2 rounded-lg bg-card/50 border border-border/50">
              <div className="text-lg">💧</div>
              <div className="text-sm font-bold">{progress.totalCareActions || 0}</div>
              <div className="text-xs text-muted-foreground">Watered</div>
            </div>
            <div className="p-2 rounded-lg bg-card/50 border border-border/50">
              <div className="text-lg">🎾</div>
              <div className="text-sm font-bold">{progress.playSessions || 0}</div>
              <div className="text-xs text-muted-foreground">Played</div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border" />
        
        {/* Self care stats */}
        <div className="space-y-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-400" />
            CARING FOR MYSELF
          </h3>
          
          <div className="space-y-2">
            {careItems.map((item) => (
              <div 
                key={item.id}
                className={`p-3 rounded-lg border ${
                  item.completed 
                    ? 'bg-green-500/10 border-green-500/30' 
                    : 'bg-card/50 border-border/50'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={item.completed ? 'text-green-400' : 'text-muted-foreground'}>
                    {item.completed ? '✓' : '☐'}
                  </span>
                  <div className="flex-1">
                    <span className={`${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.item_text}
                    </span>
                    {item.completed && item.completed_at && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (completed at {new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    )}
                    {item.journal_entry && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Journal: {item.journal_entry}
                      </p>
                    )}
                    {!item.completed && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Reminder: {getNextReminderTime()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={onEditItems}
            variant="outline"
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Care Items
          </Button>
          <Button 
            onClick={onReminderSettings}
            variant="outline"
            className="flex-1"
          >
            <Settings className="w-4 h-4 mr-2" />
            Reminder Settings
          </Button>
        </div>
        
        <Button 
          onClick={onClose}
          variant="ghost"
          className="w-full"
        >
          Close
        </Button>
      </CardContent>
    </Card>
  );
};

// Edit care items component
interface EditCareItemsProps {
  onDone: () => void;
}

export const EditCareItems = ({ onDone }: EditCareItemsProps) => {
  const { careItems, updateCareItem, deleteCareItem, saveCareItems } = useSelfCare();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newText, setNewText] = useState('');
  const [newDifficulty, setNewDifficulty] = useState('');

  const handleStartEdit = (item: CareItem) => {
    setEditingId(item.id);
    setEditText(item.item_text);
    setEditDifficulty(item.difficulty_text || '');
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    
    const success = await updateCareItem(editingId, editText, editDifficulty);
    if (success) {
      setEditingId(null);
      toast.success('Care item updated');
    }
  };

  const handleDelete = async (itemId: string) => {
    const success = await deleteCareItem(itemId);
    if (success) {
      toast.success('Care item removed');
    }
  };

  const handleAddNew = async () => {
    if (!newText.trim() || careItems.length >= 3) return;
    
    const existingItems = careItems.map(item => ({
      text: item.item_text,
      difficulty: item.difficulty_text || '',
    }));
    
    const success = await saveCareItems([
      ...existingItems,
      { text: newText, difficulty: newDifficulty },
    ]);
    
    if (success) {
      setAddingNew(false);
      setNewText('');
      setNewDifficulty('');
      toast.success('Care item added');
    }
  };

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Edit Today's Care Items</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {careItems.map((item) => (
          <div 
            key={item.id}
            className={`p-3 rounded-lg border ${
              item.completed 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-card/50 border-border/50'
            }`}
          >
            {editingId === item.id ? (
              <div className="space-y-2">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Care item"
                  maxLength={100}
                />
                <Input
                  value={editDifficulty}
                  onChange={(e) => setEditDifficulty(e.target.value)}
                  placeholder="What makes this hard? (optional)"
                  maxLength={200}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  <span className={item.completed ? 'text-green-400' : 'text-muted-foreground'}>
                    {item.completed ? '✓' : '☐'}
                  </span>
                  <span className={`${item.completed ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {item.item_text}
                    {item.completed && ' (completed)'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleStartEdit(item)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleDelete(item.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {addingNew ? (
          <div className="p-3 rounded-lg border border-border/50 bg-card/50 space-y-2">
            <Input
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="New care item"
              maxLength={100}
              autoFocus
            />
            <Input
              value={newDifficulty}
              onChange={(e) => setNewDifficulty(e.target.value)}
              placeholder="What makes this hard? (optional)"
              maxLength={200}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddNew} disabled={!newText.trim()}>
                <Check className="w-4 h-4 mr-1" /> Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingNew(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : careItems.length < 3 && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setAddingNew(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add new care item
          </Button>
        )}
        
        <Button onClick={onDone} className="w-full">
          Done
        </Button>
      </CardContent>
    </Card>
  );
};
