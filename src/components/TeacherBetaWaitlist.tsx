import { useState } from 'react';
import { School, Clock, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTeacherBeta } from '@/hooks/useTeacherBeta';
import { toast } from 'sonner';

interface TeacherBetaWaitlistProps {
  onAccessGranted?: () => void;
}

export const TeacherBetaWaitlist = ({ onAccessGranted }: TeacherBetaWaitlistProps) => {
  const { isOnWaitlist, schoolName, joinWaitlist, hasBetaAccess } = useTeacherBeta();
  const [school, setSchool] = useState(schoolName || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!school.trim()) {
      toast.error('Please enter your school name');
      return;
    }

    setLoading(true);
    const result = await joinWaitlist(school.trim());
    setLoading(false);

    if (result.success) {
      toast.success("You're on the waitlist! We'll notify you when teacher features launch.");
    } else {
      toast.error(result.error || 'Failed to join waitlist');
    }
  };

  if (isOnWaitlist) {
    return (
      <Card className="border-2 border-amber-300/30 bg-gradient-to-br from-amber-950/20 to-background">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <CardTitle className="text-xl">You're on the Waitlist!</CardTitle>
          <CardDescription className="text-base">
            Teacher features are coming soon. We'll notify you at your email when they're ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground">School</p>
            <p className="font-medium">{schoolName}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">We'll email you when access opens</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
          <School className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="text-xl flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          Teacher Features Coming Soon!
        </CardTitle>
        <CardDescription className="text-base">
          We're in beta with select schools. Join our waitlist to be notified when teacher features launch for everyone!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="school">What school do you teach at?</Label>
            <Input
              id="school"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g., Twin Cities Academy"
              className="bg-background/50"
            />
            <p className="text-xs text-muted-foreground">
              Teachers from select partner schools get immediate access during beta.
            </p>
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Joining...' : 'Join Waitlist'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TeacherBetaWaitlist;
