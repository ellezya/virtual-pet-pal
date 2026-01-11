import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AccountPromptModalProps {
  open: boolean;
  onClose: () => void;
  onContinueGuest?: () => void;
}

const AccountPromptModal = ({ open, onClose, onContinueGuest }: AccountPromptModalProps) => {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);

  const handleJustPlaying = () => {
    setShowOptions(true);
  };

  const handleParent = () => {
    navigate('/auth?mode=parent');
    onClose();
  };

  const handleTeacher = () => {
    navigate('/auth?mode=teacher');
    onClose();
  };

  const handleSignIn = () => {
    navigate('/auth?mode=individual');
    onClose();
  };

  const handleContinueGuest = () => {
    onContinueGuest?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-4 border-primary/20">
        <DialogHeader className="text-center">
          <div className="text-5xl mb-2">🐰☁️</div>
          <DialogTitle className="text-2xl font-bold">
            Save your progress?
          </DialogTitle>
          <DialogDescription className="text-base">
            Lola loves playing with you! Want to save your progress?
          </DialogDescription>
        </DialogHeader>

        {!showOptions ? (
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleJustPlaying}
              className="w-full py-6 text-lg bg-primary hover:bg-primary/90"
            >
              🎮 Just Playing
            </Button>
            
            <Button
              onClick={handleParent}
              variant="outline"
              className="w-full py-6 text-lg border-2"
            >
              👨‍👩‍👧 I'm a Parent
            </Button>
            
            <Button
              onClick={handleTeacher}
              variant="outline"
              className="w-full py-6 text-lg border-2"
            >
              👩‍🏫 I'm a Teacher
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleSignIn}
              className="w-full py-6 text-lg gap-3 bg-primary hover:bg-primary/90"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              Sign in with Google
            </Button>
            
            <Button
              onClick={handleContinueGuest}
              variant="ghost"
              className="w-full py-5 text-muted-foreground"
            >
              Continue as Guest
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Guest progress is saved on this device only
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AccountPromptModal;
