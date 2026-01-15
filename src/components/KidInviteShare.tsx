import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getShareOrigin } from '@/lib/publicOrigin';
import { Copy, Share2, MessageCircle, Mail, Check } from 'lucide-react';

interface KidInviteShareProps {
  open: boolean;
  onClose: () => void;
  kidName: string;
  pin: string;
  familyId?: string;
}

const KidInviteShare = ({ open, onClose, kidName, pin, familyId }: KidInviteShareProps) => {
  const { toast } = useToast();
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Use a short, share-friendly origin (published domain when running in preview)
  const appUrl = getShareOrigin();
  const joinUrl = familyId ? `${appUrl}?family=${familyId}` : appUrl;

  const inviteMessage = `🐰 ${kidName}, you're invited to play with Lola!

Visit: ${joinUrl}

Tap "I have a PIN" and enter your secret code:
📱 PIN: ${pin}

Have fun! 🎉`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      toast({
        title: '✓ Link copied!',
        description: 'Paste it in a text or email',
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please select and copy the link manually',
        variant: 'destructive',
      });
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(inviteMessage);
      setCopiedMessage(true);
      toast({
        title: '✓ Copied!',
        description: 'Ready to paste in a text or email',
      });
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please select and copy the message manually',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${kidName}'s Lola Invitation`,
          text: inviteMessage,
          url: joinUrl,
        });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== 'AbortError') {
          handleCopyMessage(); // Fallback to copy
        }
      }
    } else {
      handleCopyMessage(); // Fallback for browsers without Web Share API
    }
  };

  const handleTextMessage = () => {
    const smsUrl = `sms:?body=${encodeURIComponent(inviteMessage)}`;
    window.open(smsUrl, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${kidName}'s Lola Invitation`);
    const body = encodeURIComponent(inviteMessage);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="text-5xl mb-2">📱</div>
          <DialogTitle className="text-xl">Share with {kidName}</DialogTitle>
          <DialogDescription>
            Copy the link (or send the full message with the PIN)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Invite link</p>
            <div className="flex items-center gap-2 rounded-lg border bg-background p-3">
              <a
                href={joinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-sm font-mono break-all underline underline-offset-4 text-primary"
              >
                {joinUrl}
              </a>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                aria-label="Copy invite link"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Preview of the message */}
          <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-line font-mono border-2 border-dashed border-primary/30">
            {inviteMessage}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Web Share API (mobile-friendly) */}
            {'share' in navigator && (
              <Button onClick={handleShare} className="col-span-2 py-6 text-lg gap-2">
                <Share2 className="w-5 h-5" />
                Share
              </Button>
            )}

            <Button onClick={handleCopyMessage} variant="outline" className="py-5 gap-2">
              {copiedMessage ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copiedMessage ? 'Copied!' : 'Copy Message'}
            </Button>

            <Button onClick={handleTextMessage} variant="outline" className="py-5 gap-2">
              <MessageCircle className="w-4 h-4" />
              Text
            </Button>

            <Button onClick={handleEmail} variant="outline" className="col-span-2 py-4 gap-2">
              <Mail className="w-4 h-4" />
              Send Email
            </Button>
          </div>

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

export default KidInviteShare;
