import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'signin'; // signin, signup, parent, teacher, individual
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(
    mode === 'signin' ? 'signin' : 'signup'
  );
  
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

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

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter your email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      toast({
        title: "Sign in failed",
        description: err.message || "Could not sign in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter your email and password",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signUp(email, password);
      if (error) throw error;
      
      toast({
        title: "Account created! 🎉",
        description: "Welcome to Lola! You're all set to play.",
      });
      navigate('/');
    } catch (err: any) {
      toast({
        title: "Sign up failed",
        description: err.message || "Could not create account",
        variant: "destructive",
      });
    } finally {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-4xl animate-bounce">🐰</div>
      </div>
    );
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-strong border-4 border-primary/20">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">📧</div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Check your email!
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              We sent a magic link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              Click the link in your email to sign in. No password needed!
            </p>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Back to Lola
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRoleMessage = () => {
    switch (mode) {
      case 'parent': return "Set up your family account";
      case 'teacher': return "Access your classroom tools";
      case 'individual': return "Track your self-care journey";
      default: return "Sync Lola across all your devices";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-strong border-4 border-primary/20">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🐰☁️</div>
          <CardTitle className="text-3xl font-extrabold text-foreground">
            Welcome to Lola
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {getRoleMessage()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Sign In - Primary */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
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
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or with email</span>
            </div>
          </div>

          {/* Email/Password Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-2 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-2 border-border focus:border-primary"
                />
              </div>
              <Button
                onClick={handleEmailSignIn}
                disabled={isLoading || !email || !password}
                className="w-full py-5"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
              <Button
                onClick={handleMagicLink}
                disabled={isLoading || !email}
                variant="ghost"
                className="w-full text-sm"
              >
                Forgot password? Send magic link
              </Button>
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-2 border-border focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-2 border-border focus:border-primary"
                />
              </div>
              <Button
                onClick={handleEmailSignUp}
                disabled={isLoading || !email || !password}
                className="w-full py-5"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t border-border text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-muted-foreground"
            >
              ← Back to Lola
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
