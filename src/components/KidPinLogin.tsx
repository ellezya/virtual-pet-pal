import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFamily } from '@/hooks/useFamily';

interface KidPinLoginProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const KidPinLogin = ({ open, onClose, onSuccess }: KidPinLoginProps) => {
  const { kids, loginKid } = useFamily();
  const [selectedKid, setSelectedKid] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    const success = await loginKid(selectedKid, checkPin);
    setLoading(false);

    if (success) {
      setPin('');
      setSelectedKid(null);
      onSuccess?.();
      onClose();
    } else {
      setError('Wrong PIN. Try again!');
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
                  className="w-full py-6 text-lg justify-start gap-3 border-2"
                >
                  <span className="text-2xl">{kid.avatar_emoji}</span>
                  {kid.name}
                </Button>
              ))}
              
              {kids.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No kids added yet. Ask a parent to set you up!
                </p>
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
              {/* PIN Display */}
              <div className="flex justify-center gap-3 mb-6">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-2xl font-bold
                      ${pin.length > i 
                        ? 'bg-primary/10 border-primary' 
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
                <p className="text-center text-destructive text-sm mb-4 font-medium">
                  {error}
                </p>
              )}

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    className="h-14 text-xl font-bold"
                    onClick={() => handlePinDigit(num.toString())}
                    disabled={loading}
                  >
                    {num}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="h-14 text-lg"
                  onClick={handleClear}
                  disabled={loading}
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  className="h-14 text-xl font-bold"
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

              <Button
                variant="ghost"
                onClick={handleBack}
                className="w-full mt-4 text-muted-foreground"
              >
                ← Different person
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default KidPinLogin;
