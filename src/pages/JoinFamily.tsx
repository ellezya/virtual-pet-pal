import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Home, ArrowLeft, Loader2, CheckCircle2, Users, KeyRound } from 'lucide-react';

const JoinFamily = () => {
  const [searchParams] = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';
  
  const [familyCode, setFamilyCode] = useState(codeFromUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [familyInfo, setFamilyInfo] = useState<{ id: string; name: string } | null>(null);
  const [showPinEntry, setShowPinEntry] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-check family when code is provided via URL
  useEffect(() => {
    if (codeFromUrl && codeFromUrl.length >= 4) {
      checkFamily(codeFromUrl);
    }
  }, [codeFromUrl]);

  const checkFamily = async (code: string) => {
    if (code.length < 4) return;
    
    setIsLoading(true);
    try {
      // Use security definer function to lookup by code (doesn't expose all families)
      const { data, error } = await supabase
        .rpc('lookup_family_by_code', { p_code: code });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setFamilyInfo({ id: data[0].id, name: data[0].name });
      } else {
        setFamilyInfo(null);
        if (code.length >= 6) {
          toast({
            title: "Family not found",
            description: "Please check your code and try again",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error('Error checking family:', err);
      setFamilyInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const upperCode = value.toUpperCase().slice(0, 6);
    setFamilyCode(upperCode);
    setFamilyInfo(null);
    setShowPinEntry(false);
    
    if (upperCode.length >= 6) {
      checkFamily(upperCode);
    }
  };

  const handleContinue = () => {
    if (familyInfo) {
      // Store family info and navigate to main page with family context
      sessionStorage.setItem('pendingFamilyId', familyInfo.id);
      setShowPinEntry(true);
    }
  };

  const handleGoToLogin = () => {
    // Navigate to home with the family query param so kids can log in
    navigate(`/?family=${familyInfo?.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-strong border-4 border-primary/20">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Home className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Join Your Family
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter the family code from your parent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showPinEntry ? (
            <>
              {/* Family Code Input */}
              <div className="space-y-2">
                <Label htmlFor="code" className="font-bold">Family Code</Label>
                <div className="relative">
                  <Input
                    id="code"
                    type="text"
                    placeholder="ABC123"
                    value={familyCode}
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

              {/* Family Found */}
              {familyInfo && (
                <div className="bg-success/10 border-2 border-success/30 rounded-lg p-4 text-center">
                  <Users className="w-6 h-6 text-success mx-auto mb-2" />
                  <p className="font-bold text-foreground">{familyInfo.name}</p>
                  <p className="text-sm text-muted-foreground">Ready to join!</p>
                </div>
              )}

              {/* Continue Button */}
              <Button
                onClick={handleContinue}
                disabled={!familyInfo}
                className="w-full pet-button-feed py-6 text-lg"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Continue
              </Button>
            </>
          ) : (
            <>
              {/* Family confirmed - show PIN entry prompt */}
              <div className="bg-success/10 border-2 border-success/30 rounded-lg p-4 text-center">
                <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2" />
                <p className="font-bold text-foreground">Found: {familyInfo?.name}</p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-primary" />
                </div>
                <p className="text-muted-foreground">
                  Now enter your <strong>4-digit PIN</strong> on the next screen to start playing with Lola!
                </p>
                <Button
                  onClick={handleGoToLogin}
                  className="w-full pet-button-feed py-6 text-lg"
                >
                  Enter My PIN
                </Button>
              </div>
            </>
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

export default JoinFamily;
