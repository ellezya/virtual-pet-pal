import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFamily } from '@/hooks/useFamily';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Plus, Trash2, Clock, Award } from 'lucide-react';

interface ParentDashboardProps {
  open: boolean;
  onClose: () => void;
}

const AVATAR_OPTIONS = ['👶', '👦', '👧', '🧒', '👱', '👱‍♀️', '🐰', '🦊', '🐱', '🐶'];

const ParentDashboard = ({ open, onClose }: ParentDashboardProps) => {
  const { 
    family, 
    kids, 
    chores, 
    pendingCompletions,
    loading,
    createFamily,
    addKid,
    addChore,
    removeKid,
    removeChore,
    approveCompletion,
    rejectCompletion
  } = useFamily();
  const { toast } = useToast();
  const [creatingFamily, setCreatingFamily] = useState(false);

  // Auto-create family if user doesn't have one
  const handleCreateFamily = async () => {
    setCreatingFamily(true);
    await createFamily();
    setCreatingFamily(false);
  };

  // Add kid state
  const [showAddKid, setShowAddKid] = useState(false);
  const [newKidName, setNewKidName] = useState('');
  const [newKidAge, setNewKidAge] = useState('');
  const [newKidAvatar, setNewKidAvatar] = useState('👶');
  const [newKidPin, setNewKidPin] = useState('');

  // Add chore state
  const [showAddChore, setShowAddChore] = useState(false);
  const [newChoreDesc, setNewChoreDesc] = useState('');
  const [newChoreMinutes, setNewChoreMinutes] = useState('5');
  const [newChoreFreq, setNewChoreFreq] = useState<'daily' | 'weekly' | 'once'>('daily');
  const [newChoreKid, setNewChoreKid] = useState<string>('all');

  const handleAddKid = async () => {
    if (!newKidName || newKidPin.length !== 4) {
      toast({
        title: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    await addKid(newKidName, newKidPin, newKidAge ? parseInt(newKidAge) : undefined, newKidAvatar);
    setShowAddKid(false);
    resetKidForm();
    toast({
      title: '✓ Child added!',
      description: `${newKidName}'s PIN is ${newKidPin}`
    });
  };

  const handleAddChore = async () => {
    if (!newChoreDesc) {
      toast({
        title: 'Please enter a chore description',
        variant: 'destructive'
      });
      return;
    }

    await addChore(
      newChoreDesc,
      parseInt(newChoreMinutes),
      newChoreFreq,
      newChoreKid === 'all' ? undefined : newChoreKid
    );
    setShowAddChore(false);
    resetChoreForm();
  };

  const resetKidForm = () => {
    setNewKidName('');
    setNewKidAge('');
    setNewKidAvatar('👶');
    setNewKidPin('');
  };

  const resetChoreForm = () => {
    setNewChoreDesc('');
    setNewChoreMinutes('5');
    setNewChoreFreq('daily');
    setNewChoreKid('all');
  };

  const getKidName = (kidId: string) => {
    return kids.find(k => k.id === kidId)?.name || 'Unknown';
  };

  const getChoreDesc = (choreId: string) => {
    return chores.find(c => c.id === choreId)?.description || 'Unknown chore';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            👨‍👩‍👧‍👦 {family?.name || 'Family Dashboard'}
          </DialogTitle>
          <DialogDescription>
            Manage kids, chores, and approve completed tasks
          </DialogDescription>
        </DialogHeader>

        {/* Show create family button if no family */}
        {!family ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-xl font-semibold mb-2">Welcome to Family Mode!</h3>
            <p className="text-muted-foreground mb-4">
              Create a family to add kids, assign chores, and track Lola time.
            </p>
            <Button onClick={handleCreateFamily} disabled={creatingFamily} size="lg">
              {creatingFamily ? 'Creating...' : '✨ Create My Family'}
            </Button>
          </div>
        ) : (
        <Tabs defaultValue="approvals" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="approvals" className="relative">
              Approvals
              {pendingCompletions.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {pendingCompletions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="kids">Kids</TabsTrigger>
            <TabsTrigger value="chores">Chores</TabsTrigger>
          </TabsList>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="space-y-4">
            {pendingCompletions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">✨</div>
                No pending approvals
              </div>
            ) : (
              pendingCompletions.map((completion) => (
                <Card key={completion.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{getChoreDesc(completion.chore_id)}</p>
                        <p className="text-sm text-muted-foreground">
                          By {getKidName(completion.kid_id)} • {completion.minutes_earned} min
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive"
                          onClick={() => rejectCompletion(completion.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => approveCompletion(completion.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Kids Tab */}
          <TabsContent value="kids" className="space-y-4">
            <div className="grid gap-4">
              {kids.map((kid) => (
                <Card key={kid.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{kid.avatar_emoji}</span>
                        <div>
                          <p className="font-semibold">{kid.name}</p>
                          {kid.age && <p className="text-sm text-muted-foreground">Age {kid.age}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-4 h-4" />
                            {kid.lola_time_from_chores + kid.lola_time_from_school} min
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Award className="w-4 h-4" />
                            {kid.chores_completed} chores
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => {
                            if (confirm(`Remove ${kid.name}?`)) {
                              removeKid(kid.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {!showAddKid ? (
              <Button 
                onClick={() => setShowAddKid(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Child
              </Button>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add New Child</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        placeholder="Name"
                        value={newKidName}
                        onChange={(e) => setNewKidName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Age</Label>
                      <Input
                        type="number"
                        placeholder="Age"
                        value={newKidAge}
                        onChange={(e) => setNewKidAge(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Avatar</Label>
                    <div className="flex flex-wrap gap-2">
                      {AVATAR_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewKidAvatar(emoji)}
                          className={`text-xl p-1.5 rounded transition-all ${
                            newKidAvatar === emoji 
                              ? 'bg-primary/20 ring-2 ring-primary' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>4-Digit PIN</Label>
                    <Input
                      type="password"
                      placeholder="••••"
                      maxLength={4}
                      value={newKidPin}
                      onChange={(e) => setNewKidPin(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setShowAddKid(false); resetKidForm(); }}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddKid}>Add Child</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Chores Tab */}
          <TabsContent value="chores" className="space-y-4">
            <div className="grid gap-4">
              {chores.map((chore) => (
                <Card key={chore.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{chore.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {chore.minutes_earned} min • {chore.frequency}
                          {chore.kid_id && ` • ${getKidName(chore.kid_id)}`}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => removeChore(chore.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {!showAddChore ? (
              <Button 
                onClick={() => setShowAddChore(true)}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Chore
              </Button>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add New Chore</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Make your bed"
                      value={newChoreDesc}
                      onChange={(e) => setNewChoreDesc(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Minutes</Label>
                      <Select value={newChoreMinutes} onValueChange={setNewChoreMinutes}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 min</SelectItem>
                          <SelectItem value="10">10 min</SelectItem>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="20">20 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select 
                        value={newChoreFreq} 
                        onValueChange={(v) => setNewChoreFreq(v as 'daily' | 'weekly' | 'once')}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="once">One-time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Assign To</Label>
                      <Select value={newChoreKid} onValueChange={setNewChoreKid}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Kids</SelectItem>
                          {kids.map((kid) => (
                            <SelectItem key={kid.id} value={kid.id}>
                              {kid.avatar_emoji} {kid.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setShowAddChore(false); resetChoreForm(); }}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddChore}>Add Chore</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ParentDashboard;
