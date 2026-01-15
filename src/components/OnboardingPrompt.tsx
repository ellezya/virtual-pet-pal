import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useFamily } from '@/hooks/useFamily';
import { useClassroom } from '@/hooks/useClassroom';
import { supabase } from '@/integrations/supabase/client';
import ParentOnboarding from '@/components/ParentOnboarding';
import { School, Users, Sparkles } from 'lucide-react';

interface OnboardingPromptProps {
  onOpenParentDashboard: () => void;
  onOpenTeacherDashboard: () => void;
}

const OnboardingPrompt = ({ onOpenParentDashboard, onOpenTeacherDashboard }: OnboardingPromptProps) => {
  const { user } = useAuth();
  const { family, isParent, kids, loading: familyLoading } = useFamily();
  const { classrooms, isTeacher, loading: classroomLoading } = useClassroom();
  
  const [showPrompt, setShowPrompt] = useState(false);
  const [showParentOnboarding, setShowParentOnboarding] = useState(false);
  const [promptType, setPromptType] = useState<'setup-family' | 'setup-classroom' | 'choose-role' | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user || familyLoading || classroomLoading || dismissed) {
      setShowPrompt(false);
      return;
    }

    // Check if user needs onboarding
    const checkOnboardingNeeds = async () => {
      try {
        // Get user's roles
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        const hasParentRole = roles?.some(r => r.role === 'parent');
        const hasTeacherRole = roles?.some(r => r.role === 'teacher');
        
        // Parent without family/kids setup
        if (hasParentRole && (!family || kids.length === 0)) {
          setPromptType('setup-family');
          setShowPrompt(true);
          return;
        }
        
        // Teacher without classroom
        if (hasTeacherRole && classrooms.length === 0) {
          setPromptType('setup-classroom');
          setShowPrompt(true);
          return;
        }
        
        // No specific roles set, but is authenticated - prompt to choose
        if (!hasParentRole && !hasTeacherRole && !roles?.length) {
          // Check if this is a new-ish user (created in last 5 minutes)
          const { data: profile } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            const createdAt = new Date(profile.created_at);
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            
            if (createdAt > fiveMinutesAgo) {
              setPromptType('choose-role');
              setShowPrompt(true);
              return;
            }
          }
        }
        
        setShowPrompt(false);
      } catch (error) {
        console.error('Error checking onboarding needs:', error);
      }
    };

    checkOnboardingNeeds();
  }, [user, family, kids, classrooms, familyLoading, classroomLoading, dismissed, isParent, isTeacher]);

  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
  };

  const handleSetupFamily = () => {
    setShowPrompt(false);
    setShowParentOnboarding(true);
  };

  const handleSetupClassroom = () => {
    setShowPrompt(false);
    onOpenTeacherDashboard();
  };

  const handleChooseParent = async () => {
    if (!user) return;
    
    // Add parent role
    await supabase
      .from('user_roles')
      .upsert({ user_id: user.id, role: 'parent' }, { onConflict: 'user_id,role' });
    
    setShowPrompt(false);
    setShowParentOnboarding(true);
  };

  const handleChooseTeacher = async () => {
    if (!user) return;
    
    // Add teacher role
    await supabase
      .from('user_roles')
      .upsert({ user_id: user.id, role: 'teacher' }, { onConflict: 'user_id,role' });
    
    setShowPrompt(false);
    onOpenTeacherDashboard();
  };

  const handleJustPlaying = () => {
    handleDismiss();
  };

  if (showParentOnboarding) {
    return (
      <ParentOnboarding
        open={true}
        onComplete={() => {
          setShowParentOnboarding(false);
          setDismissed(true);
        }}
      />
    );
  }

  if (!showPrompt || !promptType) return null;

  return (
    <Dialog open={showPrompt} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="max-w-md border-4 border-primary/20">
        {promptType === 'setup-family' && (
          <>
            <DialogHeader className="text-center">
              <div className="text-5xl mb-2">👨‍👩‍👧‍👦</div>
              <DialogTitle className="text-2xl font-bold">
                Set Up Your Family
              </DialogTitle>
              <DialogDescription>
                Add your kids so they can play with Lola and earn time through chores!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              <Button onClick={handleSetupFamily} className="w-full py-6 text-lg">
                <Users className="w-5 h-5 mr-2" />
                Set Up Family
              </Button>
              <Button variant="ghost" onClick={handleDismiss} className="w-full">
                Maybe Later
              </Button>
            </div>
          </>
        )}

        {promptType === 'setup-classroom' && (
          <>
            <DialogHeader className="text-center">
              <div className="text-5xl mb-2">👩‍🏫</div>
              <DialogTitle className="text-2xl font-bold">
                Create Your Classroom
              </DialogTitle>
              <DialogDescription>
                Set up your first classroom to start using Lola with your students!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              <Button onClick={handleSetupClassroom} className="w-full py-6 text-lg">
                <School className="w-5 h-5 mr-2" />
                Create Classroom
              </Button>
              <Button variant="ghost" onClick={handleDismiss} className="w-full">
                Maybe Later
              </Button>
            </div>
          </>
        )}

        {promptType === 'choose-role' && (
          <>
            <DialogHeader className="text-center">
              <div className="text-5xl mb-2">🐰✨</div>
              <DialogTitle className="text-2xl font-bold">
                Welcome to Lola!
              </DialogTitle>
              <DialogDescription>
                How would you like to use Lola?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              <Button onClick={handleChooseParent} variant="outline" className="w-full py-5 text-lg border-2">
                <Users className="w-5 h-5 mr-2" />
                I'm a Parent
              </Button>
              <Button onClick={handleChooseTeacher} variant="outline" className="w-full py-5 text-lg border-2">
                <School className="w-5 h-5 mr-2" />
                I'm a Teacher
              </Button>
              <Button onClick={handleJustPlaying} className="w-full py-6 text-lg">
                <Sparkles className="w-5 h-5 mr-2" />
                Just Playing
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingPrompt;