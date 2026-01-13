import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFamily } from '@/hooks/useFamily';
import { AlertCircle, Clock, LogIn } from 'lucide-react';

interface KidPinLoginProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 300; // 5 minutes

const KidPinLogin = ({ open, onClose, onSuccess }: KidPinLoginProps) => {
  const { kids, loginKid, isParent } = useFamily();
  const [selectedKid, setSelectedKid] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Lockout state
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [lockedUntil, setLockedUntil] = useState<Record<string, number>>({});
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Check lockout status
  useEffect(() => {
    if (!selectedKid) return;
    
    const lockTime = lockedUntil[selectedKid];
    if (!lockTime) return;
    
    const remaining = Math.ceil((lockTime - Date.now()) / 1000);
    if (remaining <= 0) {
      // Lockout expired
      setLockedUntil(prev => {
        const next = { ...prev };
        delete next[selectedKid];
        return next;
      });
      setAttempts(prev => ({ ...prev, [selectedKid]: 0 }));
      setLockoutRemaining(0);
      return;
    }
    
    setLockoutRemaining(remaining);
    
    const interval = setInterval(() => {
      const newRemaining = Math.ceil((lockTime - Date.now()) / 1000);
      if (newRemaining <= 0) {
        setLockedUntil(prev => {
          const next = { ...prev };
          delete next[selectedKid];
          return next;
        });
        setAttempts(prev => ({ ...prev, [selectedKid]: 0 }));
        setLockoutRemaining(0);
        clearInterval(interval);
      } else {
        setLockoutRemaining(newRemaining);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [selectedKid, lockedUntil]);

  const handlePinDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      
      // Auto-submit when 4 digits entered
      if (newPin.length === 4 && selectedKid) {
        handleSubmit(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = async (pinToCheck?: string) => {
    const checkPin = pinToCheck || pin;
    if (!selectedKid || checkPin.length !== 4) return;
    
    // Check if locked out
    if (lockedUntil[selectedKid] && lockedUntil[selectedKid] > Date.now()) {
      return;
    }

    setLoading(true);
    const success = await loginKid(selectedKid, checkPin);
    setLoading(false);

    if (success) {
      setPin('');
      setSelectedKid(null);
      setAttempts({});
      onSuccess?.();
      onClose();
    } else {
      const newAttempts = (attempts[selectedKid] || 0) + 1;
      setAttempts(prev => ({ ...prev, [selectedKid]: newAttempts }));
      
      if (newAttempts >= MAX_ATTEMPTS) {
        // Lock out for 5 minutes
        const lockTime = Date.now() + (LOCKOUT_SECONDS * 1000);
        setLockedUntil(prev => ({ ...prev, [selectedKid]: lockTime }));
        setError(`Too many wrong attempts. Try again in ${Math.ceil(LOCKOUT_SECONDS / 60)} minutes.`);
      } else {
        setError(`Wrong PIN! ${MAX_ATTEMPTS - newAttempts} ${MAX_ATTEMPTS - newAttempts === 1 ? 'try' : 'tries'} left.`);
      }
      setPin('');
    }
  };

  const handleKidSelect = (kidId: string) => {
    setSelectedKid(kidId);
    setPin('');
    setError('');
  };

  const handleBack = () => {
    setSelectedKid(null);
    setPin('');
    setError('');
  };

  const formatLockoutTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLocked = selectedKid ? (lockedUntil[selectedKid] && lockedUntil[selectedKid] > Date.now()) : false;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm border-4 border-primary/20">
        {!selectedKid ? (
          <>
            <DialogHeader className="text-center">
              <div className="text-5xl mb-2">👋</div>
              <DialogTitle className="text-2xl font-bold">
                Who's playing?
              </DialogTitle>
              <DialogDescription>
                Select your name to log in
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 pt-4">
              {kids.map((kid) => (
                <Button
                  key={kid.id}
                  onClick={() => handleKidSelect(kid.id)}
                  variant="outline"
                  className="w-full py-6 text-lg justify-start gap-3 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <span className="text-2xl">{kid.avatar_emoji}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{kid.name}</p>
                    {kid.age && (
                      <p className="text-xs text-muted-foreground">Age {kid.age}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {kid.lola_time_from_chores + kid.lola_time_from_school} min
                  </div>
                </Button>
              ))}
              
              {kids.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-4xl mb-3">👶</div>
                  <p>No kids added yet.</p>
                  <p className="text-sm">Ask a parent to set you up!</p>
                </div>
              )}
              
              {isParent && (
                <Button variant="ghost" onClick={onClose} className="w-full text-muted-foreground">
                  Back to parent view
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="text-center">
              <div className="text-5xl mb-2">
                {kids.find(k => k.id === selectedKid)?.avatar_emoji || '👶'}
              </div>
              <DialogTitle className="text-2xl font-bold">
                Hi {kids.find(k => k.id === selectedKid)?.name}!
              </DialogTitle>
              <DialogDescription>
                Enter your PIN
              </DialogDescription>
            </DialogHeader>
            
            <div className="pt-4">
              {/* Lockout Notice */}
              {isLocked && (
                <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-center">
                  <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                  <p className="font-medium text-destructive">Too many wrong attempts</p>
                  <div className="flex items-center justify-center gap-2 mt-2 text-destructive">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono text-lg">{formatLockoutTime(lockoutRemaining)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ask a parent if you forgot your PIN
                  </p>
                </div>
              )}
              
              {!isLocked && (
                <>
                  {/* PIN Display */}
                  <div className="flex justify-center gap-3 mb-6">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all
                          ${pin.length > i 
                            ? 'bg-primary/10 border-primary scale-105' 
                            : 'bg-muted border-border'
                          }
                          ${error && 'border-destructive animate-shake'}
                        `}
                      >
                        {pin.length > i ? '●' : ''}
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="flex items-center justify-center gap-2 text-destructive text-sm mb-4 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  {/* Number Pad */}
                  <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <Button
                        key={num}
                        variant="outline"
                        className="h-14 text-xl font-bold hover:bg-primary/10 hover:border-primary transition-all"
                        onClick={() => handlePinDigit(num.toString())}
                        disabled={loading}
                      >
                        {num}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      className="h-14 text-sm text-muted-foreground"
                      onClick={handleClear}
                      disabled={loading}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="outline"
                      className="h-14 text-xl font-bold hover:bg-primary/10 hover:border-primary transition-all"
                      onClick={() => handlePinDigit('0')}
                      disabled={loading}
                    >
                      0
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-14 text-xl"
                      onClick={handleBackspace}
                      disabled={loading}
                    >
                      ⌫
                    </Button>
                  </div>
                </>
              )}

              <Button
                variant="ghost"
                onClick={handleBack}
                className="w-full mt-4 text-muted-foreground"
              >
                ← Different person
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-2">
                Forgot PIN? Ask your parent
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default KidPinLogin;
