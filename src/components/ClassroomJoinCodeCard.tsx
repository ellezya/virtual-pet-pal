import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, Mail, Link, QrCode, Users } from 'lucide-react';

interface ClassroomJoinCodeCardProps {
  classroomCode: string;
  classroomName: string;
  studentCount: number;
}

const ClassroomJoinCodeCard = ({ 
  classroomCode, 
  classroomName,
  studentCount 
}: ClassroomJoinCodeCardProps) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedInstructions, setCopiedInstructions] = useState(false);
  const { toast } = useToast();

  const joinUrl = `${window.location.origin}/join?code=${classroomCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(classroomCode);
    setCopiedCode(true);
    toast({ title: "Code copied!" });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    toast({ title: "Link copied!" });
  };

  const copyInstructions = () => {
    const instructions = `🎉 Join our Lola classroom!

Hi students,

You're invited to join "${classroomName}" on Lola, our classroom pet app!

To join:
1. Go to: ${joinUrl}
2. Enter code: ${classroomCode}
3. Sign in with your school Google account

That's it! Once you join, you'll be able to:
✨ Earn points for good behavior
🏪 Spend points at the class store  
🐰 Take care of our virtual class pet

See you in class!`;

    navigator.clipboard.writeText(instructions);
    setCopiedInstructions(true);
    toast({ 
      title: "Instructions copied! 📋",
      description: "Paste into Schoology or email to your students"
    });
    setTimeout(() => setCopiedInstructions(false), 3000);
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link className="w-5 h-5 text-primary" />
            Student Join Code
          </div>
          <Badge variant="outline" className="text-muted-foreground">
            <Users className="w-3 h-3 mr-1" />
            {studentCount} students
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Large Code Display */}
        <div className="bg-card rounded-xl p-4 border-2 border-dashed border-primary/30 text-center">
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Classroom Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-mono font-bold text-primary tracking-[0.3em]">
              {classroomCode}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyCode}
              className="hover:bg-primary/10"
            >
              {copiedCode ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <Copy className="w-5 h-5 text-primary" />
              )}
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={copyLink}
            className="gap-2 border-primary/30 hover:bg-primary/10"
          >
            <Link className="w-4 h-4" />
            Copy Link
          </Button>
          <Button
            onClick={copyInstructions}
            className="gap-2 bg-primary text-primary-foreground"
          >
            {copiedInstructions ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Copy Email
              </>
            )}
          </Button>
        </div>

        {/* Instructions Preview */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">📋 Email includes:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Join link: {joinUrl.substring(0, 40)}...</li>
            <li>Classroom code: {classroomCode}</li>
            <li>Step-by-step instructions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassroomJoinCodeCard;
