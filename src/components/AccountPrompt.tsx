import { useState } from 'react';
import { X, Cloud, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

interface AccountPromptProps {
  onDismiss: () => void;
}

const AccountPrompt = ({ onDismiss }: AccountPromptProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;
    } catch (err: any) {
      toast({
        title: "Sign in failed",
        description: err.message || "Could not sign in with Google",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) throw error;
      
      setMagicLinkSent(true);
      toast({
        title: "Check your email! 📧",
        description: "We sent you a magic link to sign in",
      });
    } catch (err: any) {
      toast({
        title: "Failed to send link",
        description: err.message || "Could not send magic link",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-card border-4 border-primary/30 rounded-2xl shadow-strong p-6 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">📧</div>
          <h3 className="text-xl font-bold text-foreground mb-2">Check your email!</h3>
          <p className="text-muted-foreground mb-4">
            We sent a magic link to <strong>{email}</strong>. Click it to sign in!
          </p>
          <Button variant="ghost" onClick={onDismiss} className="w-full">
            Continue playing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-card border-4 border-primary/30 rounded-2xl shadow-strong p-6 max-w-sm w-full relative">
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🐰☁️</div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Save your progress?
          </h3>
          <p className="text-muted-foreground text-sm">
            Create a free account to sync Lola across all your devices
          </p>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cloud className="w-4 h-4 text-primary" />
            <span>Sync across devices</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="w-4 h-4 text-primary" />
            <span>Never lose your progress</span>
          </div>
        </div>

        {!showMagicLink ? (
          <div className="space-y-3">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full pet-button-feed py-5 text-base gap-2"
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
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            <button
              onClick={() => setShowMagicLink(true)}
              className="w-full text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Or use email magic link
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-2 border-border"
            />
            <Button
              onClick={handleMagicLink}
              disabled={isLoading || !email}
              className="w-full pet-button-water py-5"
            >
              {isLoading ? 'Sending...' : 'Send magic link'}
            </Button>
            <button
              onClick={() => setShowMagicLink(false)}
              className="w-full text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Back to Google sign in
            </button>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={onDismiss}
            className="w-full text-muted-foreground"
          >
            Keep playing as guest
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccountPrompt;
