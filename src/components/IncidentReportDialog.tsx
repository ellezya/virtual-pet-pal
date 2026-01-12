import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  INCIDENT_TYPES, 
  INCIDENT_LOCATIONS, 
  INCIDENT_SEVERITIES,
  useIncidents 
} from '@/hooks/useIncidents';
import { Search, AlertTriangle, Mic } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  student_number: string;
  avatar_emoji: string;
}

interface IncidentReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  classroomId: string | null;
}

const IncidentReportDialog = ({ 
  open, 
  onOpenChange, 
  students, 
  classroomId 
}: IncidentReportDialogProps) => {
  const { reportIncident } = useIncidents(classroomId);
  
  const [step, setStep] = useState<'student' | 'details'>('student');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [incidentType, setIncidentType] = useState<string>('');
  const [location, setLocation] = useState<string>('classroom');
  const [severity, setSeverity] = useState<string>('minor');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !incidentType) return;

    setIsSubmitting(true);
    const result = await reportIncident({
      student_id: selectedStudent.id,
      incident_type: incidentType,
      location,
      severity,
      description: description || undefined,
    });

    setIsSubmitting(false);

    if (result) {
      handleClose();
    }
  };

  const handleClose = () => {
    setStep('student');
    setSearchQuery('');
    setSelectedStudent(null);
    setIncidentType('');
    setLocation('classroom');
    setSeverity('minor');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Report Incident
          </DialogTitle>
        </DialogHeader>

        {step === 'student' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or #number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-input border-border text-foreground"
              />
            </div>

            <ScrollArea className="h-64">
              <div className="space-y-2">
                {filteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                  >
                    <span className="text-2xl">{student.avatar_emoji}</span>
                    <div>
                      <div className="font-medium text-foreground">{student.name}</div>
                      <div className="text-sm text-muted-foreground font-mono">{student.student_number}</div>
                    </div>
                  </button>
                ))}
                {filteredStudents.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No students found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {step === 'details' && selectedStudent && (
          <div className="space-y-4">
            {/* Selected Student */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <span className="text-2xl">{selectedStudent.avatar_emoji}</span>
              <div>
                <div className="font-medium text-foreground">{selectedStudent.name}</div>
                <div className="text-sm text-muted-foreground font-mono">{selectedStudent.student_number}</div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStep('student')}
                className="ml-auto"
              >
                Change
              </Button>
            </div>

            {/* What happened */}
            <div className="space-y-2">
              <Label className="text-foreground">What happened?</Label>
              <div className="flex flex-wrap gap-2">
                {INCIDENT_TYPES.map(type => (
                  <Button
                    key={type.value}
                    variant={incidentType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIncidentType(type.value)}
                    className={incidentType === type.value ? "bg-primary text-primary-foreground" : ""}
                  >
                    {type.emoji} {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-foreground">Where?</Label>
              <div className="flex flex-wrap gap-2">
                {INCIDENT_LOCATIONS.map(loc => (
                  <Button
                    key={loc.value}
                    variant={location === loc.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocation(loc.value)}
                    className={location === loc.value ? "bg-primary text-primary-foreground" : ""}
                  >
                    {loc.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label className="text-foreground">Severity</Label>
              <div className="flex gap-2">
                {INCIDENT_SEVERITIES.map(sev => (
                  <Button
                    key={sev.value}
                    variant={severity === sev.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSeverity(sev.value)}
                    className={severity === sev.value ? `${sev.color} text-white border-0` : ""}
                  >
                    {sev.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-foreground">Additional Details (optional)</Label>
              <div className="relative">
                <Textarea
                  placeholder="Describe what happened..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-input border-border text-foreground min-h-[80px] pr-10"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                  title="Voice input (coming soon)"
                  disabled
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setStep('student')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!incidentType || isSubmitting}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default IncidentReportDialog;
