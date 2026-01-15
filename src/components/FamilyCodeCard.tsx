import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Share2 } from 'lucide-react';
import { getShareOrigin } from '@/lib/publicOrigin';

interface FamilyCodeCardProps {
  familyCode: string;
  familyName?: string;
}

const FamilyCodeCard = ({ familyCode, familyName }: FamilyCodeCardProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const appUrl = getShareOrigin();
  const joinUrl = `${appUrl}/join-family?code=${familyCode}`;

  const instructions = `🏠 Join the ${familyName || 'family'}!

1. Go to: ${joinUrl}
2. Enter code: ${familyCode}
3. Enter your PIN to play with Lola! 🐰`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(familyCode);
      setCopied(true);
      toast({
        title: '✓ Code copied!',
        description: 'Share this code with your kids',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Please copy the code manually',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${familyName || 'our family'} on Lola`,
          text: instructions,
          url: joinUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          // Fallback to copying
          await navigator.clipboard.writeText(instructions);
          toast({
            title: '✓ Instructions copied!',
            description: 'Share with your kids via text or email',
          });
        }
      }
    } else {
      await navigator.clipboard.writeText(instructions);
      toast({
        title: '✓ Instructions copied!',
        description: 'Share with your kids via text or email',
      });
    }
  };

  return (
    <Card className="bg-primary/5 border-2 border-primary/20">
      <CardContent className="pt-4 space-y-3">
        <div className="text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            Family Join Code
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-mono font-bold tracking-widest text-primary">
              {familyCode}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopyCode}
              className="h-8 w-8"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        <p className="text-xs text-center text-muted-foreground">
          Kids enter this code at <strong>/join-family</strong> then use their PIN
        </p>

        <Button
          onClick={handleShare}
          variant="outline"
          className="w-full gap-2"
          size="sm"
        >
          <Share2 className="w-4 h-4" />
          Share Instructions
        </Button>
      </CardContent>
    </Card>
  );
};

export default FamilyCodeCard;
