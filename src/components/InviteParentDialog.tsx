import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFamily } from '@/hooks/useFamily';
import { useToast } from '@/hooks/use-toast';
import { Mail, Users, Check, ArrowRight } from 'lucide-react';

interface InviteParentDialogProps {
  open: boolean;
  onClose: () => void;
}

const InviteParentDialog = ({ open, onClose }: InviteParentDialogProps) => {
  const { family, kids } = useFamily();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendInvitation = async () => {
    if (!email || !email.includes('@')) {
      toast({ 
        title: 'Please enter a valid email', 
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    
    // Simulate sending invitation
    // In a full implementation, this would call an edge function to send email
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setLoading(false);
    setSent(true);
    
    toast({
      title: '📧 Invitation sent!',
      description: `We sent an invitation to ${email}`
    });
  };

  const handleClose = () => {
    setEmail('');
    setSent(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {!sent ? (
          <>
            <DialogHeader className="text-center">
              <div className="text-5xl mb-2">👪</div>
              <DialogTitle className="text-2xl font-bold">
                Invite Another Parent
              </DialogTitle>
              <DialogDescription>
                Share family management with a co-parent or caregiver
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                <p className="text-sm font-medium">They'll be able to:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    See all kids in the family
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Create and manage chores
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Approve completed chores
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    View kids' journals
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Other parent's email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="partner@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-lg"
                />
              </div>

              <Button 
                onClick={handleSendInvitation}
                disabled={loading || !email}
                className="w-full py-6 text-lg"
              >
                {loading ? (
                  'Sending...'
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="text-center">
              <div className="text-5xl mb-2">📧</div>
              <DialogTitle className="text-2xl font-bold">
                Invitation sent!
              </DialogTitle>
              <DialogDescription className="text-base">
                We sent an invitation to <strong>{email}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-sm text-green-700">
                  They'll receive an email with a link to join <strong>{family?.name}</strong>.
                  Once they accept, they'll have full parent access to manage the family.
                </p>
              </div>

              {kids.length > 0 && (
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-sm font-medium mb-2">Kids in this family:</p>
                  <div className="flex flex-wrap gap-2">
                    {kids.map(kid => (
                      <div 
                        key={kid.id}
                        className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full text-sm"
                      >
                        <span>{kid.avatar_emoji}</span>
                        <span>{kid.name}</span>
                        {kid.age && <span className="text-muted-foreground">({kid.age})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handleClose} className="w-full py-6 text-lg">
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteParentDialog;
