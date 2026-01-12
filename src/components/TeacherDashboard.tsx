import React, { useState, useRef } from 'react';
import { useClassroom, PRESET_POINT_REASONS } from '@/hooks/useClassroom';
import { useClassroomSession } from '@/hooks/useClassroomSession';
import { useIncidents } from '@/hooks/useIncidents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClassroomDisplayMode from '@/components/ClassroomDisplayMode';
import QuickAwardDialog from '@/components/QuickAwardDialog';
import StudentLinkCodeDisplay from '@/components/StudentLinkCodeDisplay';
import IncidentReportDialog from '@/components/IncidentReportDialog';
import IncidentsList from '@/components/IncidentsList';
import StudentIncidentBadge from '@/components/StudentIncidentBadge';
import SchoolStoreManager from '@/components/SchoolStoreManager';
import { 
  Plus, 
  Award, 
  Users, 
  School, 
  Copy, 
  Check, 
  Trash2, 
  Search, 
  Star,
  X,
  Clock,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Monitor,
  Play,
  Pause,
  SkipForward,
  Moon,
  Mic,
  Link,
  AlertTriangle,
  Store
} from 'lucide-react';

const TeacherDashboard = ({ onClose }: { onClose: () => void }) => {
  const {
    classrooms,
    activeClassroom,
    students,
    pointsLog,
    loading,
    createClassroom,
    selectClassroom,
    addStudent,
    bulkAddStudents,
    removeStudent,
    awardPoints,
  } = useClassroom();

  // Session management
  const { 
    session, 
    formattedTime, 
    currentStudent, 
    togglePause, 
    skipStudent, 
    toggleSleep 
  } = useClassroomSession();

  const [showNewClassroom, setShowNewClassroom] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAwardPoints, setShowAwardPoints] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showDisplayMode, setShowDisplayMode] = useState(false);
  const [showQuickAward, setShowQuickAward] = useState(false);
  const [showIncidentReport, setShowIncidentReport] = useState(false);

  // Incidents hook
  const { getActiveIncidents } = useIncidents(activeClassroom?.id || null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  
  const [newClassroomName, setNewClassroomName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pointsToAward, setPointsToAward] = useState(1);
  const [pointReason, setPointReason] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  
  // CSV import state
  const [csvPreview, setCsvPreview] = useState<Array<{ name: string }>>([]);
  const [csvError, setCsvError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.student_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateClassroom = async () => {
    if (!newClassroomName.trim()) return;
    await createClassroom(newClassroomName);
    setNewClassroomName('');
    setShowNewClassroom(false);
  };

  const handleAddStudent = async () => {
    if (!newStudentName.trim()) return;
    await addStudent(newStudentName);
    setNewStudentName('');
    setShowAddStudent(false);
  };

  const handleAwardPoints = async () => {
    if (!selectedStudent || !pointReason.trim()) return;
    await awardPoints(selectedStudent, pointsToAward, pointReason);
    setSelectedStudent(null);
    setPointsToAward(1);
    setPointReason('');
    setShowAwardPoints(false);
  };

  const copyClassroomCode = () => {
    if (!activeClassroom) return;
    navigator.clipboard.writeText(activeClassroom.classroom_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const openAwardDialog = (studentId: string) => {
    setSelectedStudent(studentId);
    setShowAwardPoints(true);
  };

  // CSV parsing
  const parseCSV = (text: string): Array<{ name: string }> => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    const results: Array<{ name: string }> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Skip header row if it looks like one
      if (i === 0 && (line.toLowerCase().includes('name') || line.toLowerCase().includes('student'))) {
        continue;
      }
      
      // Handle both comma-separated and single-column
      const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      const name = parts[0];
      
      if (name && name.length > 0 && name.length < 100) {
        results.push({ name });
      }
    }
    
    return results;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCsvError('');
    
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setCsvError('Please upload a CSV or TXT file');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      
      if (parsed.length === 0) {
        setCsvError('No valid student names found in file');
        return;
      }
      
      if (parsed.length > 100) {
        setCsvError('Maximum 100 students per import');
        return;
      }
      
      setCsvPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    if (csvPreview.length === 0) return;
    
    setIsImporting(true);
    const count = await bulkAddStudents(csvPreview);
    setIsImporting(false);
    
    if (count > 0) {
      setCsvPreview([]);
      setShowCsvImport(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const resetCsvImport = () => {
    setCsvPreview([]);
    setCsvError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <School className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Teacher Dashboard</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Classroom Selector */}
        {classrooms.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              <School className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">No Classrooms Yet</h2>
              <p className="text-muted-foreground mb-4">Create your first classroom to get started</p>
              <Dialog open={showNewClassroom} onOpenChange={setShowNewClassroom}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Classroom
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Create New Classroom</DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="Classroom name (e.g., 3rd Grade)"
                    value={newClassroomName}
                    onChange={(e) => setNewClassroomName(e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                  <DialogFooter>
                    <Button onClick={handleCreateClassroom} className="bg-primary text-primary-foreground">
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Classroom Header */}
            <Card className="bg-card border-border">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <select
                      value={activeClassroom?.id || ''}
                      onChange={(e) => selectClassroom(e.target.value)}
                      className="bg-input border border-border rounded-lg px-3 py-2 text-foreground font-semibold"
                    >
                      {classrooms.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <Dialog open={showNewClassroom} onOpenChange={setShowNewClassroom}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Create New Classroom</DialogTitle>
                        </DialogHeader>
                        <Input
                          placeholder="Classroom name"
                          value={newClassroomName}
                          onChange={(e) => setNewClassroomName(e.target.value)}
                          className="bg-input border-border text-foreground"
                        />
                        <DialogFooter>
                          <Button onClick={handleCreateClassroom} className="bg-primary text-primary-foreground">
                            Create
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {activeClassroom && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-sm font-mono border-primary text-primary">
                        {activeClassroom.classroom_code}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={copyClassroomCode}>
                        {copiedCode ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  )}
                </div>
                
                {activeClassroom && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Share this code with parents to link their children
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Controls Bar - Mobile-First Teacher Controls */}
            <Card className="bg-card border-border">
              <CardContent className="py-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  {/* Display Mode Button */}
                  <Button
                    onClick={() => setShowDisplayMode(true)}
                    className="bg-primary text-primary-foreground"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    {session ? 'View Display' : 'Start Display'}
                  </Button>

                  {/* Session Quick Actions (only show if session active) */}
                  {session && (
                    <div className="flex items-center gap-2">
                      {/* Current student indicator */}
                      {currentStudent && (
                        <Badge variant="outline" className="flex items-center gap-2 py-1.5 px-3">
                          <span className="text-lg">{currentStudent.avatar_emoji}</span>
                          <span className="font-mono">{currentStudent.student_number}</span>
                          <span className="text-primary font-bold">{formattedTime}</span>
                        </Badge>
                      )}

                      {/* Quick action buttons */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={togglePause}
                        title={session.is_paused ? 'Resume' : 'Pause'}
                      >
                        {session.is_paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={skipStudent}
                        title="Skip to next"
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleSleep}
                        title={session.lola_sleeping ? 'Wake Lola' : 'Sleep Lola'}
                      >
                        <Moon className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Quick Award Button */}
                  <Button
                    variant="outline"
                    onClick={() => setShowQuickAward(true)}
                    className="border-success text-success hover:bg-success/10"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Quick Award
                  </Button>

                  {/* Report Incident Button */}
                  <Button
                    variant="outline"
                    onClick={() => setShowIncidentReport(true)}
                    className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Report Incident
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search & Add Student */}
            <div className="flex gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or #number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-input border-border text-foreground"
                />
              </div>
              <Dialog open={showAddStudent} onOpenChange={setShowAddStudent}>
                <DialogTrigger asChild>
                  <Button className="bg-primary text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Add New Student</DialogTitle>
                  </DialogHeader>
                  <Input
                    placeholder="Student name"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="bg-input border-border text-foreground"
                  />
                  <DialogFooter>
                    <Button onClick={handleAddStudent} className="bg-primary text-primary-foreground">
                      Add Student
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* CSV Import Button */}
              <Dialog open={showCsvImport} onOpenChange={(open) => {
                setShowCsvImport(open);
                if (!open) resetCsvImport();
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-border">
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5" />
                      Import Students from CSV
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Upload a CSV file with student names. Each name should be on its own row.
                    </div>
                    
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="csv-upload"
                      />
                      <label 
                        htmlFor="csv-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-foreground font-medium">Click to upload CSV</span>
                        <span className="text-xs text-muted-foreground">or drag and drop</span>
                      </label>
                    </div>
                    
                    {csvError && (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {csvError}
                      </div>
                    )}
                    
                    {csvPreview.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            Preview ({csvPreview.length} students)
                          </span>
                          <Button variant="ghost" size="sm" onClick={resetCsvImport}>
                            Clear
                          </Button>
                        </div>
                        <ScrollArea className="h-[150px] border border-border rounded-lg p-2">
                          <div className="space-y-1">
                            {csvPreview.map((student, i) => (
                              <div key={i} className="text-sm text-foreground py-1 px-2 bg-muted/50 rounded">
                                {student.name}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                    
                    <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                      <strong>Format example:</strong>
                      <pre className="mt-1 font-mono">
{`Name
John Smith
Emma Johnson
Michael Brown`}
                      </pre>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setShowCsvImport(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCsvImport}
                      disabled={csvPreview.length === 0 || isImporting}
                      className="bg-primary text-primary-foreground"
                    >
                      {isImporting ? 'Importing...' : `Import ${csvPreview.length} Students`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="students" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="students" className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Students
                </TabsTrigger>
                <TabsTrigger value="incidents" className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Incidents
                </TabsTrigger>
                <TabsTrigger value="store" className="flex items-center gap-1">
                  <Store className="w-4 h-4" />
                  Store
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Activity
                </TabsTrigger>
              </TabsList>

              {/* Students Tab */}
              <TabsContent value="students">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Students ({students.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {students.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No students yet. Add your first student!</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-2">
                          {filteredStudents.map(student => {
                            const studentIncidents = getActiveIncidents(student.id);
                            
                            return (
                              <div
                                key={student.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{student.avatar_emoji}</span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-foreground">{student.name}</span>
                                      <Badge variant="outline" className="text-xs font-mono">
                                        {student.student_number}
                                      </Badge>
                                      {/* Incident Badge */}
                                      <StudentIncidentBadge incidents={studentIncidents} />
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Star className="w-3 h-3 text-warning" />
                                      <span>{student.school_points} points</span>
                                      {student.linked_kid_id && (
                                        <Badge variant="secondary" className="ml-2 text-xs">
                                          ✓ Linked
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <StudentLinkCodeDisplay
                                    studentName={student.name}
                                    studentNumber={student.student_number}
                                    linkCode={(student as any).link_code || '------'}
                                    avatarEmoji={student.avatar_emoji}
                                    isLinked={!!student.linked_kid_id}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => openAwardDialog(student.id)}
                                    className="bg-success/20 text-success hover:bg-success/30"
                                  >
                                    <Award className="w-4 h-4 mr-1" />
                                    Award
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeStudent(student.id)}
                                    className="text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Incidents Tab */}
              <TabsContent value="incidents">
                <IncidentsList 
                  classroomId={activeClassroom?.id || null} 
                  students={students}
                />
              </TabsContent>

              {/* Store Tab */}
              <TabsContent value="store">
                <SchoolStoreManager 
                  classroomId={activeClassroom?.id || null}
                  students={students.map(s => ({
                    ...s,
                    total_points: s.school_points
                  }))}
                />
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity">
                {pointsLog.length > 0 ? (
                  <Card className="bg-card border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {pointsLog.slice(0, 50).map(log => {
                            const student = students.find(s => s.id === log.student_id);
                            return (
                              <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{student?.avatar_emoji}</span>
                                  <span className="text-foreground">{student?.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="bg-success/20 text-success">
                                    +{log.points}
                                  </Badge>
                                  <span className="text-muted-foreground text-xs max-w-[120px] truncate">
                                    {log.reason}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card border-border">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>No activity yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {/* Award Points Dialog */}
      <Dialog open={showAwardPoints} onOpenChange={setShowAwardPoints}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Award className="w-5 h-5 text-warning" />
              Award Points
            </DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              {/* Selected student */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <span className="text-2xl">
                  {students.find(s => s.id === selectedStudent)?.avatar_emoji}
                </span>
                <span className="font-medium text-foreground">
                  {students.find(s => s.id === selectedStudent)?.name}
                </span>
              </div>

              {/* Points selector */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Points to award</label>
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

              {/* Preset reasons */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Reason</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_POINT_REASONS.map(reason => (
                    <Button
                      key={reason}
                      variant={pointReason === reason ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPointReason(reason)}
                      className={pointReason === reason ? 'bg-secondary text-secondary-foreground' : ''}
                    >
                      {reason}
                    </Button>
                  ))}
                </div>
                <Input
                  placeholder="Or type a custom reason..."
                  value={pointReason}
                  onChange={(e) => setPointReason(e.target.value)}
                  className="bg-input border-border text-foreground"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAwardPoints(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAwardPoints}
              disabled={!pointReason.trim()}
              className="bg-success text-success-foreground"
            >
              <Award className="w-4 h-4 mr-2" />
              Award {pointsToAward} Point{pointsToAward > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Classroom Display Mode */}
      {showDisplayMode && (
        <ClassroomDisplayMode onClose={() => setShowDisplayMode(false)} />
      )}

      {/* Quick Award Dialog */}
      <QuickAwardDialog open={showQuickAward} onClose={() => setShowQuickAward(false)} />

      {/* Incident Report Dialog */}
      <IncidentReportDialog 
        open={showIncidentReport}
        onOpenChange={setShowIncidentReport}
        students={students}
        classroomId={activeClassroom?.id || null}
      />
    </div>
  );
};

export default TeacherDashboard;
