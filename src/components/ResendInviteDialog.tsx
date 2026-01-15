import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getShareOrigin } from '@/lib/publicOrigin';
import { Copy, Share2, Check } from 'lucide-react';

interface ResendInviteDialogProps {
  open: boolean;
  onClose: () => void;
  kidName: string;
  familyCode?: string;
}

const ResendInviteDialog = ({ open, onClose, kidName, familyCode }: ResendInviteDialogProps) => {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);

  const appUrl = getShareOrigin();
  const joinUrl = familyCode ? `${appUrl}/join-family?code=${familyCode}` : `${appUrl}/join-family`;

  const instructions = `🐰 ${kidName}, you can play with Lola!

1. Go to: ${joinUrl}
2. Enter family code: ${familyCode || '(ask parent)'}
3. Enter your PIN

Have fun! 🎉`;

  const handleCopyCode = async () => {
    if (!familyCode) return;
    try {
      await navigator.clipboard.writeText(familyCode);
      setCopiedCode(true);
      toast({
        title: '✓ Code copied!',
        description: 'Share this code with ' + kidName,
      });
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${kidName}'s Lola Invitation`,
          text: instructions,
          url: joinUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(instructions);
          toast({
            title: '✓ Instructions copied!',
          });
        }
      }
    } else {
      await navigator.clipboard.writeText(instructions);
      toast({
        title: '✓ Instructions copied!',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader className="text-center">
          <div className="text-5xl mb-2">📱</div>
          <DialogTitle className="text-xl">Remind {kidName}</DialogTitle>
          <DialogDescription>
            Share the family code - they'll need their PIN
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Family Code */}
          {familyCode && (
            <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Family Code
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-mono font-bold tracking-widest text-primary">
                  {familyCode}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyCode}
                  className="h-8 w-8"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Simple Instructions */}
          <div className="text-sm text-muted-foreground text-center space-y-1">
            <p>📱 Go to <strong>/join-family</strong></p>
            <p>🔑 Enter code: <strong>{familyCode}</strong></p>
            <p>🔐 Enter your PIN</p>
          </div>

          <Button
            onClick={handleShare}
            className="w-full gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share Instructions
          </Button>

          <Button 
            onClick={onClose} 
            variant="ghost" 
            className="w-full"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResendInviteDialog;
