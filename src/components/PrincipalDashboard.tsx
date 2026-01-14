import React, { useState } from 'react';
import { useSchoolManagement } from '@/hooks/useSchoolManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  UserPlus, 
  Store, 
  Check,
  X,
  Trash2,
  School
} from 'lucide-react';

interface PrincipalDashboardProps {
  onClose: () => void;
}

const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ onClose }) => {
  const { 
    schools, 
    staff, 
    classrooms, 
    myRole, 
    loading,
    pendingInvites,
    inviteAdmin,
    acceptInvite,
    removeStaff,
    activateStore
  } = useSchoolManagement();

  const [showInviteAdmin, setShowInviteAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle pending invites first
  if (pendingInvites.length > 0) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-hidden flex flex-col">
        <header className="flex items-center justify-between p-4 bg-card border-b border-border">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Pending Invitations</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </header>
        
        <div className="flex-1 overflow-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle>You have pending school invitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingInvites.map(invite => {
                const school = schools.find(s => s.id === invite.school_id);
                return (
                  <div 
                    key={invite.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted"
                  >
                    <div>
                      <p className="font-medium">{school?.name || 'Unknown School'}</p>
                      <Badge variant="outline" className="mt-1">
                        {invite.role === 'principal' ? 'Principal' : 'Admin'}
                      </Badge>
                    </div>
                    <Button 
                      onClick={() => acceptInvite(invite.id)}
                      className="bg-success text-success-foreground"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

  if (schools.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-hidden flex flex-col">
        <header className="flex items-center justify-between p-4 bg-card border-b border-border">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">School Dashboard</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">No Schools Yet</h2>
              <p className="text-muted-foreground mb-4">
                You haven't been added to any schools yet. Ask a teacher to invite you as a principal.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const activeSchool = schools[0]; // For now, use first school
  const schoolStaff = staff.filter(s => s.school_id === activeSchool.id);
  const schoolClassrooms = classrooms.filter(c => c.school_id === activeSchool.id);
  const principals = schoolStaff.filter(s => s.role === 'principal' && s.accepted_at);
  const admins = schoolStaff.filter(s => s.role === 'school_admin' && s.accepted_at);

  const handleInviteAdmin = async () => {
    if (!adminEmail.trim() || !selectedSchoolId) return;
    setIsSubmitting(true);
    const success = await inviteAdmin(selectedSchoolId, adminEmail);
    setIsSubmitting(false);
    if (success) {
      setAdminEmail('');
      setShowInviteAdmin(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden flex flex-col">
      <header className="flex items-center justify-between p-4 bg-card border-b border-border">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">{activeSchool.name}</h1>
            <Badge variant="outline" className="capitalize">{myRole}</Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-4">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 text-center">
              <GraduationCap className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{schoolClassrooms.length}</p>
              <p className="text-sm text-muted-foreground">Classrooms</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Users className="w-8 h-8 mx-auto text-success mb-2" />
              <p className="text-2xl font-bold">{principals.length}</p>
              <p className="text-sm text-muted-foreground">Principals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <School className="w-8 h-8 mx-auto text-warning mb-2" />
              <p className="text-2xl font-bold">{admins.length}</p>
              <p className="text-sm text-muted-foreground">Admins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Store className="w-8 h-8 mx-auto text-secondary mb-2" />
              <p className="text-2xl font-bold">{schoolClassrooms.filter(c => c.school_id).length}</p>
              <p className="text-sm text-muted-foreground">Stores</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="classrooms">
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            {myRole === 'school_admin' && (
              <TabsTrigger value="store">Store Management</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="classrooms">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  School Classrooms
                </CardTitle>
              </CardHeader>
              <CardContent>
                {schoolClassrooms.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No classrooms linked to this school yet. Teachers can link their classrooms.
                  </p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {schoolClassrooms.map(classroom => (
                        <div 
                          key={classroom.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted"
                        >
                          <div>
                            <p className="font-medium">{classroom.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Code: {classroom.classroom_code}
                            </p>
                          </div>
                          {myRole === 'school_admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => activateStore(classroom.id)}
                              className="gap-2"
                            >
                              <Store className="w-4 h-4" />
                              Activate Store
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  School Staff
                </CardTitle>
                {myRole === 'principal' && (
                  <Dialog open={showInviteAdmin} onOpenChange={setShowInviteAdmin}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="gap-2"
                        onClick={() => setSelectedSchoolId(activeSchool.id)}
                      >
                        <UserPlus className="w-4 h-4" />
                        Add Admin
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle>Invite School Admin</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <Input
                          type="email"
                          placeholder="admin@school.org"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          className="bg-input border-border"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          The admin can activate and manage the school store for all classrooms.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowInviteAdmin(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleInviteAdmin}
                          disabled={!adminEmail.trim() || isSubmitting}
                        >
                          {isSubmitting ? 'Inviting...' : 'Send Invite'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Principals */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Principals</h4>
                    {principals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No principals</p>
                    ) : (
                      principals.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-primary">Principal</Badge>
                            <span className="text-sm">{p.user_email || 'User'}</span>
                          </div>
                          {myRole === 'principal' && p.user_id !== staff.find(s => s.role === 'principal')?.user_id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeStaff(p.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Admins */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Administrators</h4>
                    {admins.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No administrators yet</p>
                    ) : (
                      admins.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Admin</Badge>
                            <span className="text-sm">{a.user_email || 'User'}</span>
                          </div>
                          {myRole === 'principal' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeStaff(a.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {myRole === 'school_admin' && (
            <TabsContent value="store">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5" />
                    Store Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Activate the school store for classrooms. Once activated, students can browse and order items with their earned points.
                  </p>
                  {schoolClassrooms.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No classrooms linked to this school yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {schoolClassrooms.map(classroom => (
                        <div 
                          key={classroom.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted"
                        >
                          <div>
                            <p className="font-medium">{classroom.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Code: {classroom.classroom_code}
                            </p>
                          </div>
                          <Button
                            onClick={() => activateStore(classroom.id)}
                            className="bg-success text-success-foreground gap-2"
                          >
                            <Store className="w-4 h-4" />
                            Activate Store
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
