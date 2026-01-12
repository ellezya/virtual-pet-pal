import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Check, Link, QrCode } from 'lucide-react';

interface StudentLinkCodeDisplayProps {
  studentName: string;
  studentNumber: string;
  linkCode: string;
  avatarEmoji: string;
  isLinked: boolean;
}

const StudentLinkCodeDisplay = ({ 
  studentName, 
  studentNumber, 
  linkCode, 
  avatarEmoji,
  isLinked 
}: StudentLinkCodeDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(linkCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowDialog(true)}
        className={isLinked ? 'text-success' : 'text-muted-foreground'}
        title={isLinked ? 'Linked to family' : 'Show link code'}
      >
        <Link className="w-4 h-4" />
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-center">
              <span className="text-3xl">{avatarEmoji}</span>
              <br />
              {studentName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground">
              Student Number: {studentNumber}
            </div>

            {isLinked ? (
              <Badge className="bg-success text-success-foreground px-4 py-2">
                <Check className="w-4 h-4 mr-2" />
                Linked to Family
              </Badge>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">
                  Share this code with the parent to link:
                </div>

                <div className="flex items-center justify-center gap-2">
                  <div className="text-3xl font-mono font-bold tracking-widest bg-muted px-6 py-3 rounded-lg">
                    {linkCode}
                  </div>
                  <Button variant="outline" size="icon" onClick={copyCode}>
                    {copied ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Parent enters this in their Lola app to link their child's school points
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StudentLinkCodeDisplay;
