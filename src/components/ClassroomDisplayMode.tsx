import React, { useState, useEffect } from 'react';
import { useClassroomSession } from '@/hooks/useClassroomSession';
import { useClassroom } from '@/hooks/useClassroom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Moon, 
  Sun, 
  X, 
  Monitor,
  Users,
  Clock,
  Timer,
  ChevronRight,
  Maximize2,
  EyeOff,
  Eye
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Import bunny assets
import bunnyHappy from '@/assets/bunny-happy.png';
import bunnySleeping from '@/assets/bunny-sleeping.png';

// Import video backgrounds
import lofiRoomBg from '@/assets/lofi-room-couch.mp4';

interface ClassroomDisplayModeProps {
  onClose: () => void;
}

const ClassroomDisplayMode = ({ onClose }: ClassroomDisplayModeProps) => {
  const { students, activeClassroom } = useClassroom();
  const {
    session,
    timeRemaining,
    formattedTime,
    loading,
    currentStudent,
    rotationQueue,
    startSession,
    endSession,
    skipStudent,
    togglePause,
    toggleSleep,
  } = useClassroomSession();

  const [showSetup, setShowSetup] = useState(!session);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [timePerStudent, setTimePerStudent] = useState(600); // 10 min default
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [anonymousMode, setAnonymousMode] = useState(false); // Privacy mode

  // Setup form
  const handleStartSession = async () => {
    if (selectedStudents.length === 0) return;
    await startSession(selectedStudents, timePerStudent, 'manual');
    setShowSetup(false);
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    setSelectedStudents(students.map(s => s.id));
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  // Enter fullscreen for SmartBoard
  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  // Exit fullscreen
  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Format time slider value
  const formatTimeLabel = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  // Session Setup Dialog
  if (showSetup || !session) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Start Classroom Display
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Time per student */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Time per student: {formatTimeLabel(timePerStudent)}
              </label>
              <Slider
                value={[timePerStudent]}
                onValueChange={([val]) => setTimePerStudent(val)}
                min={60}
                max={1200}
                step={60}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 min</span>
                <span>20 min</span>
              </div>
            </div>

            {/* Student selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Select students ({selectedStudents.length})
                </label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllStudents}>
                    All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[200px] border border-border rounded-lg p-2">
                <div className="space-y-1">
                  {students.map((student, index) => (
                    <button
                      key={student.id}
                      onClick={() => toggleStudentSelection(student.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-all ${
                        selectedStudents.includes(student.id)
                          ? 'bg-primary/20 border border-primary'
                          : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{student.avatar_emoji}</span>
                        <span className="font-mono text-sm text-muted-foreground">
                          {student.student_number}
                        </span>
                      </div>
                      {selectedStudents.includes(student.id) && (
                        <Badge variant="outline" className="text-xs">
                          #{selectedStudents.indexOf(student.id) + 1}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                Tip: Students will take turns in selection order
              </p>
            </div>

            {/* Anonymous Mode Toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="anonymous-mode" className="text-sm font-medium cursor-pointer">
                  Anonymous Mode
                </Label>
              </div>
              <Switch
                id="anonymous-mode"
                checked={anonymousMode}
                onCheckedChange={setAnonymousMode}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Shows only student numbers for privacy during presentations
            </p>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleStartSession}
              disabled={selectedStudents.length === 0 || loading}
              className="bg-primary text-primary-foreground"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Display
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Active Session Display (SmartBoard View)
  return (
    <div className={`fixed inset-0 z-50 bg-background ${isFullscreen ? '' : ''}`}>
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={lofiRoomBg} type="video/mp4" />
      </video>

      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-4">
        {/* Top Bar - Teacher Controls (hidden in fullscreen or show minimized) */}
        {!isFullscreen && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-background/80 backdrop-blur text-foreground">
                {activeClassroom?.name}
              </Badge>
              {session.is_paused && (
                <Badge variant="destructive">PAUSED</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={enterFullscreen}
                className="bg-background/80 backdrop-blur"
                title="Fullscreen for SmartBoard"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                className="bg-background/80 backdrop-blur"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Main Display Area */}
        <div className="flex-1 flex items-center justify-center gap-8">
          {/* Lola Widget */}
          <div className="relative">
            <div className="w-64 h-80 flex items-center justify-center">
              <img
                src={session.lola_sleeping ? bunnySleeping : bunnyHappy}
                alt="Lola"
                className={`max-w-full max-h-full object-contain drop-shadow-2xl ${
                  session.lola_sleeping ? 'opacity-80' : 'animate-bounce-gentle'
                }`}
                style={{
                  animation: session.lola_sleeping ? 'none' : 'bounce-gentle 3s ease-in-out infinite',
                }}
              />
            </div>
            
            {/* Sleep indicator */}
            {session.lola_sleeping && (
              <div className="absolute top-4 right-4 text-4xl animate-pulse">
                💤
              </div>
            )}
          </div>

          {/* Current Caretaker Card */}
          <Card className="bg-background/90 backdrop-blur border-border w-80">
            <CardContent className="pt-6 text-center">
              {currentStudent ? (
                <>
                  {/* Show emoji only if not in anonymous mode */}
                  {!anonymousMode && (
                    <div className="text-6xl mb-4">{currentStudent.avatar_emoji}</div>
                  )}
                  {anonymousMode && (
                    <div className="text-6xl mb-4">🎓</div>
                  )}
                  <div className="text-2xl font-mono font-bold text-foreground mb-2">
                    {anonymousMode ? `Student ${currentStudent.student_number}` : currentStudent.student_number}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    Current Caretaker
                  </div>
                  
                  {/* Timer */}
                  <div className={`text-5xl font-mono font-bold ${
                    timeRemaining < 60 ? 'text-destructive animate-pulse' : 'text-primary'
                  }`}>
                    {formattedTime}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Time Remaining
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active caretaker</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rotation Queue (Bottom) */}
        <div className="mt-4">
          <Card className="bg-background/80 backdrop-blur border-border">
            <CardContent className="py-3">
              <div className="flex items-center gap-4 overflow-x-auto">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Up Next:
                </span>
                {rotationQueue.length > 0 ? (
                  rotationQueue.slice(0, 5).map((student, index) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1"
                    >
                      {!anonymousMode && (
                        <span className="text-lg">{student.avatar_emoji}</span>
                      )}
                      <span className="font-mono text-sm">{student.student_number}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No more students in queue</span>
                )}
                {rotationQueue.length > 5 && (
                  <Badge variant="outline">+{rotationQueue.length - 5} more</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teacher Quick Controls (visible in fullscreen too) */}
        <div className="fixed bottom-4 right-4 flex flex-col gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={togglePause}
            className="bg-background/90 backdrop-blur w-12 h-12"
            title={session.is_paused ? 'Resume' : 'Pause'}
          >
            {session.is_paused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={skipStudent}
            className="bg-background/90 backdrop-blur w-12 h-12"
            title="Skip to next student"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSleep}
            className="bg-background/90 backdrop-blur w-12 h-12"
            title={session.lola_sleeping ? 'Wake Lola' : 'Sleep Lola'}
          >
            {session.lola_sleeping ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Anonymous Mode Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setAnonymousMode(!anonymousMode)}
            className={`bg-background/90 backdrop-blur w-12 h-12 ${anonymousMode ? 'border-primary text-primary' : ''}`}
            title={anonymousMode ? 'Show names' : 'Hide names (Anonymous)'}
          >
            {anonymousMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </Button>

          {isFullscreen && (
            <Button
              variant="outline"
              size="icon"
              onClick={exitFullscreen}
              className="bg-background/90 backdrop-blur w-12 h-12"
              title="Exit fullscreen"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* End Session Button (bottom left) */}
        <div className="fixed bottom-4 left-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('End this session?')) {
                endSession();
                onClose();
              }
            }}
            className="bg-destructive/80 backdrop-blur"
          >
            End Session
          </Button>
        </div>
      </div>

      {/* CSS for gentle bounce animation */}
      <style>{`
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default ClassroomDisplayMode;
