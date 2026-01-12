import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useClassroom, PRESET_POINT_REASONS } from '@/hooks/useClassroom';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  MicOff, 
  Award, 
  Search, 
  Check, 
  X,
  Loader2
} from 'lucide-react';

interface QuickAwardDialogProps {
  open: boolean;
  onClose: () => void;
}

const QuickAwardDialog = ({ open, onClose }: QuickAwardDialogProps) => {
  const { students, awardPoints } = useClassroom();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'select' | 'voice' | 'confirm'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [pointsToAward, setPointsToAward] = useState(1);
  const [reason, setReason] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Use 'any' to avoid TypeScript issues with SpeechRecognition
  const recognitionRef = useRef<any>(null);

  // Filter students by search
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const results = Array.from(event.results) as any[];
          const transcript = results.map((r: any) => r[0].transcript).join('');
          setTranscript(transcript);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
          if (transcript) {
            parseVoiceInput(transcript);
          }
        };

        recognitionRef.current.onerror = () => {
          setIsListening(false);
          toast({
            title: 'Voice recognition error',
            description: 'Please try again or type manually',
            variant: 'destructive',
          });
        };
      }
    }
  }, []);

  // Parse voice input to extract student number and reason
  const parseVoiceInput = (text: string) => {
    setIsProcessing(true);
    
    // Try to find student number pattern (e.g., "student 157", "#157", "number 157")
    const numberMatch = text.match(/(?:student|number|#)\s*(\d+)/i) || text.match(/(\d{1,3})/);
    
    if (numberMatch) {
      const studentNumber = `#${numberMatch[1].padStart(3, '0')}`;
      const student = students.find(s => s.student_number === studentNumber);
      
      if (student) {
        setSelectedStudent(student.id);
        
        // Extract reason (everything after the number)
        const reasonPart = text.replace(numberMatch[0], '').trim();
        if (reasonPart) {
          // Clean up common speech artifacts
          const cleanReason = reasonPart
            .replace(/^(for|because|,|\s)+/i, '')
            .trim();
          setReason(cleanReason || 'Great work!');
        } else {
          setReason('Great work!');
        }
        
        setMode('confirm');
      } else {
        toast({
          title: 'Student not found',
          description: `Could not find student ${studentNumber}`,
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Could not understand',
        description: 'Please say a student number (e.g., "Student 157, great participation")',
        variant: 'destructive',
      });
    }
    
    setIsProcessing(false);
  };

  // Start voice recognition
  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      toast({
        title: 'Voice not supported',
        description: 'Your browser does not support voice recognition',
        variant: 'destructive',
      });
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Handle award
  const handleAward = async () => {
    if (!selectedStudent || !reason) return;
    
    await awardPoints(selectedStudent, pointsToAward, reason);
    resetAndClose();
  };

  // Reset state
  const resetAndClose = () => {
    setMode('select');
    setSearchQuery('');
    setSelectedStudent(null);
    setPointsToAward(1);
    setReason('');
    setTranscript('');
    onClose();
  };

  const selectedStudentData = students.find(s => s.id === selectedStudent);

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-warning" />
            Quick Award
          </DialogTitle>
        </DialogHeader>

        {/* Mode: Select Student */}
        {mode === 'select' && (
          <div className="space-y-4">
            {/* Voice Button - Primary Action */}
            <Button
              onClick={startListening}
              disabled={isListening}
              className="w-full h-24 bg-primary text-primary-foreground text-lg"
            >
              {isListening ? (
                <>
                  <Loader2 className="w-8 h-8 mr-3 animate-spin" />
                  Listening...
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8 mr-3" />
                  Tap to Speak
                </>
              )}
            </Button>

            {isListening && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Say: "Student 157, great participation"
                </p>
                {transcript && (
                  <p className="text-foreground font-medium">"{transcript}"</p>
                )}
                <Button variant="ghost" size="sm" onClick={stopListening} className="mt-2">
                  <MicOff className="w-4 h-4 mr-2" />
                  Done Speaking
                </Button>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or select manually</span>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or #number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-input border-border text-foreground"
              />
            </div>

            {/* Student List */}
            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {filteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => {
                      setSelectedStudent(student.id);
                      setMode('confirm');
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="text-2xl">{student.avatar_emoji}</span>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{student.name}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {student.student_number}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Mode: Confirm Award */}
        {mode === 'confirm' && selectedStudentData && (
          <div className="space-y-4">
            {/* Selected Student */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <span className="text-3xl">{selectedStudentData.avatar_emoji}</span>
              <div>
                <div className="font-bold text-foreground">{selectedStudentData.name}</div>
                <div className="text-sm text-muted-foreground font-mono">
                  {selectedStudentData.student_number}
                </div>
              </div>
            </div>

            {/* Points */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Points</label>
              <div className="flex gap-2">
                {[1, 2, 3, 5, 10].map(pts => (
                  <Button
                    key={pts}
                    variant={pointsToAward === pts ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPointsToAward(pts)}
                    className={pointsToAward === pts ? 'bg-primary text-primary-foreground' : ''}
                  >
                    +{pts}
                  </Button>
                ))}
              </div>
            </div>

            {/* Preset Reasons */}
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Reason</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PRESET_POINT_REASONS.slice(0, 4).map(r => (
                  <Button
                    key={r}
                    variant={reason === r ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReason(r)}
                    className={`text-xs ${reason === r ? 'bg-secondary text-secondary-foreground' : ''}`}
                  >
                    {r}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="Custom reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="bg-input border-border text-foreground"
              />
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="ghost" onClick={() => setMode('select')}>
                Back
              </Button>
              <Button
                onClick={handleAward}
                disabled={!reason}
                className="flex-1 bg-success text-success-foreground"
              >
                <Check className="w-4 h-4 mr-2" />
                Award +{pointsToAward}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuickAwardDialog;
