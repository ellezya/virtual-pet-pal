import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Link } from 'lucide-react';
import { useSchoolManagement, School } from '@/hooks/useSchoolManagement';

interface LinkToSchoolDialogProps {
  classroomId: string;
  classroomName: string;
  trigger?: React.ReactNode;
}

const LinkToSchoolDialog: React.FC<LinkToSchoolDialogProps> = ({ 
  classroomId, 
  classroomName,
  trigger 
}) => {
  const [open, setOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { schools, linkClassroomToSchool } = useSchoolManagement();

  const handleLink = async () => {
    if (!selectedSchoolId) return;
    
    setIsSubmitting(true);
    const success = await linkClassroomToSchool(classroomId, selectedSchoolId);
    setIsSubmitting(false);
    
    if (success) {
      setSelectedSchoolId('');
      setOpen(false);
    }
  };

  if (schools.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Link className="w-4 h-4" />
            Link to School
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Link Classroom to School
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Link "{classroomName}" to a school so the principal and admin can view and manage it.
          </p>
          
          <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
            <SelectTrigger className="bg-input border-border">
              <SelectValue placeholder="Select a school..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {schools.map(school => (
                <SelectItem key={school.id} value={school.id}>
                  {school.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleLink}
            disabled={!selectedSchoolId || isSubmitting}
            className="bg-primary text-primary-foreground"
          >
            {isSubmitting ? 'Linking...' : 'Link Classroom'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LinkToSchoolDialog;
