import React, { useState } from 'react';
import { useClassroom, PRESET_POINT_REASONS } from '@/hooks/useClassroom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Mic,
  X,
  ChevronDown,
  Clock
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
    removeStudent,
    awardPoints,
  } = useClassroom();

  const [showNewClassroom, setShowNewClassroom] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAwardPoints, setShowAwardPoints] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  
  const [newClassroomName, setNewClassroomName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pointsToAward, setPointsToAward] = useState(1);
  const [pointReason, setPointReason] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

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

            {/* Search & Add Student */}
            <div className="flex gap-2">
              <div className="relative flex-1">
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
                    Add Student
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
            </div>

            {/* Student List */}
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
                      {filteredStudents.map(student => (
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
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Recent Points Log */}
            {pointsLog.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {pointsLog.slice(0, 10).map(log => {
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
            )}
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
    </div>
  );
};

export default TeacherDashboard;
