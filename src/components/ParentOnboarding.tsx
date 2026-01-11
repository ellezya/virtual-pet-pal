import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFamily } from '@/hooks/useFamily';
import { useToast } from '@/hooks/use-toast';

interface ParentOnboardingProps {
  open: boolean;
  onComplete: () => void;
}

type Step = 'family' | 'kid' | 'chore' | 'pin' | 'done';

const AVATAR_OPTIONS = ['👶', '👦', '👧', '🧒', '👱', '👱‍♀️', '🐰', '🦊', '🐱', '🐶'];

const ParentOnboarding = ({ open, onComplete }: ParentOnboardingProps) => {
  const { createFamily, addKid, addChore } = useFamily();
  const { toast } = useToast();
  
  const [step, setStep] = useState<Step>('family');
  const [loading, setLoading] = useState(false);
  
  // Family state
  const [familyName, setFamilyName] = useState('');
  
  // Kid state
  const [kidName, setKidName] = useState('');
  const [kidAge, setKidAge] = useState('');
  const [kidAvatar, setKidAvatar] = useState('👶');
  const [kidPin, setKidPin] = useState('');
  const [kidId, setKidId] = useState<string | null>(null);
  
  // Chore state
  const [choreDescription, setChoreDescription] = useState('');
  const [choreMinutes, setChoreMinutes] = useState('5');
  const [choreFrequency, setChoreFrequency] = useState<'daily' | 'weekly' | 'once'>('daily');

  const handleCreateFamily = async () => {
    setLoading(true);
    const id = await createFamily(familyName || 'My Family');
    setLoading(false);
    
    if (id) {
      setStep('kid');
    }
  };

  const handleAddKid = async () => {
    if (!kidName || !kidPin || kidPin.length !== 4) {
      toast({
        title: 'Please fill in all fields',
        description: 'Name and 4-digit PIN are required',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    const id = await addKid(
      kidName, 
      kidPin, 
      kidAge ? parseInt(kidAge) : undefined, 
      kidAvatar
    );
    setLoading(false);
    
    if (id) {
      setKidId(id);
      setStep('chore');
    }
  };

  const handleAddChore = async () => {
    if (!choreDescription) {
      setStep('pin');
      return;
    }

    setLoading(true);
    await addChore(
      choreDescription,
      parseInt(choreMinutes),
      choreFrequency,
      kidId || undefined
    );
    setLoading(false);
    setStep('pin');
  };

  const handleSkipChore = () => {
    setStep('pin');
  };

  const handleDone = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md border-4 border-primary/20">
        {step === 'family' && (
          <>
            <DialogHeader className="text-center">
              <div className="text-5xl mb-2">👨‍👩‍👧‍👦</div>
              <DialogTitle className="text-2xl font-bold">
                Create Your Family
              </DialogTitle>
              <DialogDescription>
                Set up your family to manage kids and chores
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="familyName">Family Name (optional)</Label>
                <Input
                  id="familyName"
                  placeholder="The Smith Family"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                />
              </div>
              
              <Button
                onClick={handleCreateFamily}
                disabled={loading}
                className="w-full py-6 text-lg"
              >
                {loading ? 'Creating...' : 'Continue'}
              </Button>
            </div>
          </>
        )}

        {step === 'kid' && (
          <>
            <DialogHeader className="text-center">
              <div className="text-5xl mb-2">👶</div>
              <DialogTitle className="text-2xl font-bold">
                Add Your First Child
              </DialogTitle>
              <DialogDescription>
                Set up a profile so they can play with Lola
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="kidName">Child's Name *</Label>
                <Input
                  id="kidName"
                  placeholder="Emma"
                  value={kidName}
                  onChange={(e) => setKidName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kidAge">Age (optional)</Label>
                <Input
                  id="kidAge"
                  type="number"
                  placeholder="7"
                  min="1"
                  max="18"
                  value={kidAge}
                  onChange={(e) => setKidAge(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setKidAvatar(emoji)}
                      className={`text-2xl p-2 rounded-lg transition-all ${
                        kidAvatar === emoji 
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
                <Label htmlFor="kidPin">4-Digit PIN *</Label>
                <Input
                  id="kidPin"
                  type="password"
                  placeholder="••••"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={kidPin}
                  onChange={(e) => setKidPin(e.target.value.replace(/\D/g, ''))}
                />
                <p className="text-xs text-muted-foreground">
                  Your child will use this PIN to log in
                </p>
              </div>
              
              <Button
                onClick={handleAddKid}
                disabled={loading || !kidName || kidPin.length !== 4}
                className="w-full py-6 text-lg"
              >
                {loading ? 'Adding...' : 'Add Child'}
              </Button>
            </div>
          </>
        )}

        {step === 'chore' && (
          <>
            <DialogHeader className="text-center">
              <div className="text-5xl mb-2">✨</div>
              <DialogTitle className="text-2xl font-bold">
                Create First Chore
              </DialogTitle>
              <DialogDescription>
                Kids earn Lola time by completing chores!
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="choreDesc">Chore Description</Label>
                <Input
                  id="choreDesc"
                  placeholder="Make your bed"
                  value={choreDescription}
                  onChange={(e) => setChoreDescription(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="choreMinutes">Minutes Earned</Label>
                  <Select value={choreMinutes} onValueChange={setChoreMinutes}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="20">20 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="choreFreq">Frequency</Label>
                  <Select 
                    value={choreFrequency} 
                    onValueChange={(v) => setChoreFrequency(v as 'daily' | 'weekly' | 'once')}
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
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleSkipChore}
                  variant="outline"
                  className="flex-1 py-6"
                >
                  Skip for Now
                </Button>
                <Button
                  onClick={handleAddChore}
                  disabled={loading}
                  className="flex-1 py-6"
                >
                  {loading ? 'Adding...' : 'Add Chore'}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 'pin' && (
          <>
            <DialogHeader className="text-center">
              <div className="text-5xl mb-2">🔐</div>
              <DialogTitle className="text-2xl font-bold">
                Share PIN with {kidName}
              </DialogTitle>
              <DialogDescription>
                {kidName} will use this PIN to log in and play with Lola
              </DialogDescription>
            </DialogHeader>
            
            <div className="pt-6 text-center">
              <div className="bg-muted rounded-xl p-6 mb-6">
                <p className="text-sm text-muted-foreground mb-2">PIN for {kidName}:</p>
                <p className="text-4xl font-mono font-bold tracking-widest">{kidPin}</p>
              </div>
              
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(kidPin);
                  toast({
                    title: 'PIN copied!',
                    description: 'Share it with your child'
                  });
                }}
                variant="outline"
                className="mb-4"
              >
                📋 Copy PIN
              </Button>
              
              <Button
                onClick={handleDone}
                className="w-full py-6 text-lg"
              >
                Done! Start Playing 🐰
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ParentOnboarding;
