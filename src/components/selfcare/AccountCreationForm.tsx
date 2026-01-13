import { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AccountCreationFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const AccountCreationForm = ({ onSuccess, onCancel }: AccountCreationFormProps) => {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    userType: '' as 'individual' | 'parent' | 'teacher' | 'kid' | '',
    alsoTeacher: false,
    alsoParent: false,
  });

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/stats`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google sign in error:', error);
      toast.error('Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.email.trim() || !formData.password || !formData.userType) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      const displayName = `${formData.firstName} ${formData.lastName}`.trim();
      const { error } = await signUp(formData.email, formData.password, displayName);
      
      if (error) throw error;
      
      // After signup, we need to wait for the user to be created
      // The profile update will happen after email confirmation
      toast.success('Account created! Please check your email to confirm.');
      onSuccess();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const showAlsoTeacher = formData.userType === 'parent';
  const showAlsoParent = formData.userType === 'teacher';

  return (
    <Card className="border-2 border-green-300/30 bg-gradient-to-br from-background to-green-950/10">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Heart className="w-5 h-5 text-green-400" />
          Almost there!
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          To save your care list and get gentle reminders, I need to know your name and email.
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Your first name"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Optional"
                className="bg-background/50"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              className="bg-background/50"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="At least 6 characters"
              className="bg-background/50"
            />
          </div>
          
          <div className="space-y-3">
            <Label>How will you use LaLaLola? *</Label>
            <RadioGroup
              value={formData.userType}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                userType: value as typeof formData.userType,
                alsoTeacher: false,
                alsoParent: false,
              })}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual" className="font-normal cursor-pointer">
                  Just for me (individual)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="parent" id="parent" />
                <Label htmlFor="parent" className="font-normal cursor-pointer">
                  With my kids (parent)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="teacher" id="teacher" />
                <Label htmlFor="teacher" className="font-normal cursor-pointer">
                  With my students (teacher)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="kid" id="kid" />
                <Label htmlFor="kid" className="font-normal cursor-pointer">
                  I'm a student (kid)
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {showAlsoTeacher && (
            <div className="flex items-center space-x-2 pl-6">
              <Checkbox
                id="alsoTeacher"
                checked={formData.alsoTeacher}
                onCheckedChange={(checked) => setFormData({ ...formData, alsoTeacher: !!checked })}
              />
              <Label htmlFor="alsoTeacher" className="font-normal text-sm cursor-pointer">
                I'm also a teacher
              </Label>
            </div>
          )}
          
          {showAlsoParent && (
            <div className="flex items-center space-x-2 pl-6">
              <Checkbox
                id="alsoParent"
                checked={formData.alsoParent}
                onCheckedChange={(checked) => setFormData({ ...formData, alsoParent: !!checked })}
              />
              <Label htmlFor="alsoParent" className="font-normal text-sm cursor-pointer">
                I'm also a parent
              </Label>
            </div>
          )}
          
          <div className="flex flex-col gap-3 pt-4">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Account & Save
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full"
            >
              Continue with Google
            </Button>
            
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} className="w-full">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
