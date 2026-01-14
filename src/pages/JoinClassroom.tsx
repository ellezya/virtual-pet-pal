import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { School, ArrowLeft, Loader2, CheckCircle2, Users } from 'lucide-react';

const JoinClassroom = () => {
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';
  
  const [classroomCode, setClassroomCode] = useState(codeFromUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [classroomInfo, setClassroomInfo] = useState<{ id: string; name: string } | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-check classroom when code is provided via URL
  useEffect(() => {
    if (codeFromUrl && codeFromUrl.length >= 4) {
      checkClassroom(codeFromUrl);
    }
  }, [codeFromUrl]);

  const checkClassroom = async (code: string) => {
    if (code.length < 4) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('id, name')
        .eq('classroom_code', code.toUpperCase())
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setClassroomInfo(data);
      } else {
        setClassroomInfo(null);
        if (code.length >= 6) {
          toast({
            title: "Classroom not found",
            description: "Please check your code and try again",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error('Error checking classroom:', err);
      setClassroomInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const upperCode = value.toUpperCase().slice(0, 6);
    setClassroomCode(upperCode);
    setClassroomInfo(null);
    
    if (upperCode.length >= 6) {
      checkClassroom(upperCode);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsJoining(true);
    try {
      // Store the classroom code in sessionStorage to use after redirect
      if (classroomCode) {
        sessionStorage.setItem('pendingJoinCode', classroomCode);
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/join${classroomCode ? `?code=${classroomCode}` : ''}`,
        },
      });
      
      if (error) throw error;
    } catch (err: any) {
      toast({
        title: "Sign in failed",
        description: err.message || "Could not sign in with Google",
        variant: "destructive",
      });
      setIsJoining(false);
    }
  };

  const handleJoinClassroom = async () => {
    if (!user || !classroomInfo) return;
    
    setIsJoining(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-classroom`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            action: 'student_join',
            classroom_code: classroomCode,
          }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to join classroom');
      }

      setJoinSuccess(true);
      sessionStorage.removeItem('pendingJoinCode');
      
      toast({
        title: "Welcome to the classroom! 🎉",
        description: `You've joined ${classroomInfo.name}`,
      });

      // Redirect to main page after a brief delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      toast({
        title: "Failed to join",
        description: err.message || "Could not join classroom",
        variant: "destructive",
      });
      setIsJoining(false);
    }
  };

  // Auto-join if user is already signed in and we have a valid classroom
  useEffect(() => {
    const pendingCode = sessionStorage.getItem('pendingJoinCode');
    if (user && pendingCode && !classroomCode) {
      setClassroomCode(pendingCode);
      checkClassroom(pendingCode);
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (joinSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-strong border-4 border-success/30">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto bg-success/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              You're in! 🎉
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Welcome to {classroomInfo?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Taking you to your dashboard...
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-strong border-4 border-primary/20">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <School className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Join Your Classroom
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter the code from your teacher to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Classroom Code Input */}
          <div className="space-y-2">
            <Label htmlFor="code" className="font-bold">Classroom Code</Label>
            <div className="relative">
              <Input
                id="code"
                type="text"
                placeholder="ABC123"
                value={classroomCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                className="text-center text-2xl font-mono uppercase tracking-wider border-2 border-border focus:border-primary py-6"
                maxLength={6}
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          {/* Classroom Found */}
          {classroomInfo && (
            <div className="bg-success/10 border-2 border-success/30 rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-success mx-auto mb-2" />
              <p className="font-bold text-foreground">{classroomInfo.name}</p>
              <p className="text-sm text-muted-foreground">Ready to join!</p>
            </div>
          )}

          {/* Sign in / Join Button */}
          {!user ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Sign in with your school Google account to join
              </p>
              <Button
                onClick={handleGoogleSignIn}
                disabled={isJoining || !classroomInfo}
                className="w-full pet-button-feed py-6 text-lg gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isJoining ? 'Signing in...' : 'Sign in with Google'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">Signed in as</p>
                <p className="font-medium text-foreground">{user.email}</p>
              </div>
              <Button
                onClick={handleJoinClassroom}
                disabled={isJoining || !classroomInfo}
                className="w-full pet-button-feed py-6 text-lg"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Join Classroom
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="pt-4 border-t border-border text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-muted-foreground gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinClassroom;
