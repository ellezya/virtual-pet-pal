import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useFamily } from '@/hooks/useFamily';
import { useToast } from '@/hooks/use-toast';
import { Link, School, Check, AlertCircle, Unlink } from 'lucide-react';

interface LinkStudentDialogProps {
  open: boolean;
  onClose: () => void;
}

interface LinkedStudent {
  id: string;
  name: string;
  student_number: string;
  school_points: number;
  classroom_name?: string;
  kid_name?: string;
}

const LinkStudentDialog = ({ open, onClose }: LinkStudentDialogProps) => {
  const { kids, refreshFamily } = useFamily();
  const { toast } = useToast();
  
  const [linkCode, setLinkCode] = useState('');
  const [selectedKid, setSelectedKid] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [studentPreview, setStudentPreview] = useState<{ name: string; classroom_name: string } | null>(null);
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [showLinked, setShowLinked] = useState(false);

  // Fetch linked students when dialog opens
  const fetchLinkedStudents = async () => {
    const kidIds = kids.map(k => k.id);
    if (kidIds.length === 0) return;

    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        name,
        student_number,
        school_points,
        linked_kid_id,
        classrooms!inner(name)
      `)
      .in('linked_kid_id', kidIds);

    if (!error && data) {
      const mapped = data.map(s => ({
        id: s.id,
        name: s.name,
        student_number: s.student_number,
        school_points: s.school_points || 0,
        classroom_name: (s.classrooms as any)?.name || 'Unknown',
        kid_name: kids.find(k => k.id === s.linked_kid_id)?.name
      }));
      setLinkedStudents(mapped);
    }
  };

  // Look up student by code
  const lookupCode = async () => {
    if (linkCode.length < 6) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        name,
        link_code,
        linked_kid_id,
        classrooms!inner(name)
      `)
      .eq('link_code', linkCode.toUpperCase())
      .maybeSingle();

    setLoading(false);

    if (error || !data) {
      setStudentPreview(null);
      toast({
        title: 'Code not found',
        description: 'Please check the code and try again',
        variant: 'destructive'
      });
      return;
    }

    if (data.linked_kid_id) {
      toast({
        title: 'Already linked',
        description: 'This student is already linked to a family account',
        variant: 'destructive'
      });
      return;
    }

    setStudentPreview({
      name: data.name,
      classroom_name: (data.classrooms as any)?.name || 'Unknown'
    });
  };

  const handleLink = async () => {
    if (!selectedKid || !linkCode) return;

    setLoading(true);
    
    // Find the student by link code
    const { data: student, error: findError } = await supabase
      .from('students')
      .select('id, linked_kid_id')
      .eq('link_code', linkCode.toUpperCase())
      .maybeSingle();

    if (findError || !student) {
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Could not find student with that code',
        variant: 'destructive'
      });
      return;
    }

    if (student.linked_kid_id) {
      setLoading(false);
      toast({
        title: 'Already linked',
        description: 'This student is already linked to a family account',
        variant: 'destructive'
      });
      return;
    }

    // Link the student to the kid
    const { error: updateError } = await supabase
      .from('students')
      .update({ linked_kid_id: selectedKid })
      .eq('id', student.id);

    setLoading(false);

    if (updateError) {
      toast({
        title: 'Error linking',
        description: updateError.message,
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: '✓ Linked successfully!',
      description: 'School points will now sync to Lola time'
    });

    // Reset form
    setLinkCode('');
    setSelectedKid('');
    setStudentPreview(null);
    await refreshFamily();
    await fetchLinkedStudents();
    setShowLinked(true);
  };

  const handleUnlink = async (studentId: string) => {
    const { error } = await supabase
      .from('students')
      .update({ linked_kid_id: null })
      .eq('id', studentId);

    if (error) {
      toast({
        title: 'Error unlinking',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    toast({ title: 'Student unlinked' });
    await fetchLinkedStudents();
  };

  // Fetch linked students when showing that tab
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      fetchLinkedStudents();
    } else {
      onClose();
      setLinkCode('');
      setSelectedKid('');
      setStudentPreview(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="w-5 h-5 text-primary" />
            Link School Account
          </DialogTitle>
          <DialogDescription>
            Connect your child to their classroom to sync school points → Lola time
          </DialogDescription>
        </DialogHeader>

        {/* Toggle between Link New and View Linked */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={!showLinked ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowLinked(false)}
            className="flex-1"
          >
            <Link className="w-4 h-4 mr-2" />
            Link New
          </Button>
          <Button
            variant={showLinked ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowLinked(true)}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-2" />
            Linked ({linkedStudents.length})
          </Button>
        </div>

        {!showLinked ? (
          <div className="space-y-4">
            {/* Step 1: Enter Code */}
            <div className="space-y-2">
              <Label>1. Enter link code from teacher</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="XXXXXX"
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="font-mono text-lg tracking-widest uppercase"
                />
                <Button 
                  variant="outline" 
                  onClick={lookupCode}
                  disabled={linkCode.length < 6 || loading}
                >
                  Look up
                </Button>
              </div>
            </div>

            {/* Student Preview */}
            {studentPreview && (
              <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
                <div className="flex items-center gap-2 text-success">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">Found: {studentPreview.name}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Classroom: {studentPreview.classroom_name}
                </p>
              </div>
            )}

            {/* Step 2: Select Child */}
            {studentPreview && (
              <div className="space-y-2">
                <Label>2. Select your child</Label>
                <Select value={selectedKid} onValueChange={setSelectedKid}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a child..." />
                  </SelectTrigger>
                  <SelectContent>
                    {kids.map((kid) => (
                      <SelectItem key={kid.id} value={kid.id}>
                        {kid.avatar_emoji} {kid.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Info */}
            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Ask your child's teacher for the student link code. Each code is unique to a student.
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button 
                onClick={handleLink}
                disabled={!selectedKid || !studentPreview || loading}
              >
                {loading ? 'Linking...' : 'Link Account'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            {linkedStudents.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <School className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No linked students yet</p>
              </div>
            ) : (
              linkedStudents.map((student) => (
                <div 
                  key={student.id}
                  className="p-3 bg-card border rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.classroom_name} • {student.student_number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      → Linked to {student.kid_name} • {student.school_points} pts
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUnlink(student.id)}
                    title="Unlink"
                  >
                    <Unlink className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LinkStudentDialog;
