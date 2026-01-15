import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, KeyRound } from 'lucide-react';

interface KidInviteShareProps {
  open: boolean;
  onClose: () => void;
  kidName: string;
  pin: string;
  familyCode?: string;
}

const KidInviteShare = ({ open, onClose, kidName, pin, familyCode }: KidInviteShareProps) => {
  const { toast } = useToast();
  const [copiedPin, setCopiedPin] = useState(false);

  const handleCopyPin = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopiedPin(true);
      toast({
        title: '✓ PIN copied!',
        description: `Share this PIN with ${kidName}`,
      });
      setTimeout(() => setCopiedPin(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please remember the PIN shown',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <div className="text-5xl mb-2">🎉</div>
          <DialogTitle className="text-xl">{kidName} is ready!</DialogTitle>
          <DialogDescription>
            Share these details with {kidName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Family Code */}
          {familyCode && (
            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Family Code
              </p>
              <span className="text-2xl font-mono font-bold tracking-widest text-primary">
                {familyCode}
              </span>
            </div>
          )}

          {/* PIN */}
          <div className="bg-muted border-2 border-dashed border-primary/30 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {kidName}'s Secret PIN
            </p>
            <div className="flex items-center justify-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <span className="text-3xl font-mono font-bold tracking-[0.3em]">
                {pin}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyPin}
                className="h-8 w-8"
              >
                {copiedPin ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground text-center space-y-1">
            <p>📱 Go to <strong>/join-family</strong></p>
            <p>🔑 Enter family code: <strong>{familyCode}</strong></p>
            <p>🔐 Then enter PIN: <strong>{pin}</strong></p>
          </div>

          <Button 
            onClick={onClose} 
            className="w-full"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KidInviteShare;
