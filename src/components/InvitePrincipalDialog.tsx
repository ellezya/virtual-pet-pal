import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Building2 } from 'lucide-react';
import { useSchoolManagement } from '@/hooks/useSchoolManagement';

interface InvitePrincipalDialogProps {
  trigger?: React.ReactNode;
}

const InvitePrincipalDialog: React.FC<InvitePrincipalDialogProps> = ({ trigger }) => {
  const [open, setOpen] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [principalEmail, setPrincipalEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createSchoolWithPrincipal } = useSchoolManagement();

  const handleSubmit = async () => {
    if (!schoolName.trim() || !principalEmail.trim()) return;
    
    setIsSubmitting(true);
    const success = await createSchoolWithPrincipal(schoolName, principalEmail);
    setIsSubmitting(false);
    
    if (success) {
      setSchoolName('');
      setPrincipalEmail('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Add Principal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Create School & Invite Principal
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="schoolName">School Name</Label>
            <Input
              id="schoolName"
              placeholder="e.g., Twin Cities Academy"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="principalEmail">Principal's Email</Label>
            <Input
              id="principalEmail"
              type="email"
              placeholder="principal@school.org"
              value={principalEmail}
              onChange={(e) => setPrincipalEmail(e.target.value)}
              className="bg-input border-border"
            />
            <p className="text-xs text-muted-foreground">
              The principal must have an account already. They'll receive an invite to accept.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!schoolName.trim() || !principalEmail.trim() || isSubmitting}
            className="bg-primary text-primary-foreground"
          >
            {isSubmitting ? 'Creating...' : 'Create & Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvitePrincipalDialog;
