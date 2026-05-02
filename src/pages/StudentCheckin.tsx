import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const MOODS = [
  { emoji: '😊', label: 'Great', lolaResponse: "That's wonderful! Lola is hopping with joy for you! 🐰✨" },
  { emoji: '🙂', label: 'Good', lolaResponse: "Nice! Lola's glad you're having a good day. Keep it up! 🐰💚" },
  { emoji: '😐', label: 'Okay', lolaResponse: "That's totally fine. Lola's here with you no matter what. 🐰🤍" },
  { emoji: '😔', label: 'Not great', lolaResponse: "Lola sees you. It's okay to feel this way — she's sending you a gentle nuzzle. 🐰💛" },
  { emoji: '😢', label: 'Struggling', lolaResponse: "Lola's right here beside you. You're not alone, and it's brave to share how you feel. 🐰💗" },
] as const;

type Phase = 'pick' | 'response' | 'done';

const StudentCheckin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('pick');
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[number] | null>(null);
  const [classrooms, setClassrooms] = useState<Array<{ student_id: string; classroom_id: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [alreadyCheckedIn, setAlreadyCheckedIn] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Get student records
        const { data: students } = await supabase
          .from('students')
          .select('id, classroom_id')
          .eq('user_id', user.id)
          .eq('status', 'active');

        const list = (students || []).map((s: any) => ({
          student_id: s.id,
          classroom_id: s.classroom_id,
        }));
        setClassrooms(list);

        // Check if already checked in today
        if (list.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const { data: existing } = await supabase
            .from('daily_checkins')
            .select('id')
            .eq('student_id', list[0].student_id)
            .gte('created_at', `${today}T00:00:00`)
            .lt('created_at', `${today}T23:59:59.999`)
            .limit(1);

          if (existing && existing.length > 0) {
            setAlreadyCheckedIn(true);
            setPhase('done');
          }
        }
      } catch (err) {
        console.error('Error loading student data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSelect = async (mood: typeof MOODS[number]) => {
    setSelectedMood(mood);
    setPhase('response');

    // Save check-in for each classroom
    try {
      const inserts = classrooms.map((c) => ({
        student_id: c.student_id,
        classroom_id: c.classroom_id,
        mood_emoji: mood.emoji,
        mood_label: mood.label,
      }));

      if (inserts.length > 0) {
        const { error } = await supabase.from('daily_checkins').insert(inserts);
        if (error) console.error('Failed to save check-in:', error);
      }
    } catch (err) {
      console.error('Check-in save error:', err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-4xl animate-bounce">🐰</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/student')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Daily Check-In</h1>
        </div>

        {/* Lola */}
        <div className="text-center">
          <div className="text-6xl mb-3">🐰</div>
        </div>

        {phase === 'done' && alreadyCheckedIn && (
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6 text-center space-y-3">
              <div className="text-4xl">✅</div>
              <p className="font-bold text-foreground">You already checked in today!</p>
              <p className="text-sm text-muted-foreground">
                Lola remembers — come back tomorrow! 🐰
              </p>
              <Button onClick={() => navigate('/dashboard/student')} className="mt-4">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {phase === 'pick' && (
          <div className="space-y-4">
            <p className="text-center text-lg font-semibold text-foreground">
              How are you feeling today?
            </p>
            <div className="grid grid-cols-1 gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood.label}
                  onClick={() => handleSelect(mood)}
                  className="flex items-center gap-4 p-4 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                >
                  <span className="text-3xl">{mood.emoji}</span>
                  <span className="font-medium text-foreground">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'response' && selectedMood && (
          <Card className="border-2 border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="text-5xl">{selectedMood.emoji}</div>
              <p className="text-lg font-semibold text-foreground">
                You're feeling: {selectedMood.label}
              </p>
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <p className="text-sm text-foreground leading-relaxed">
                  {selectedMood.lolaResponse}
                </p>
              </div>
              <Button
                onClick={() => navigate('/dashboard/student')}
                className="w-full mt-2"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {classrooms.length === 0 && !loading && phase === 'pick' && (
          <p className="text-center text-sm text-muted-foreground">
            You need to join a classroom before checking in.
          </p>
        )}
      </div>
    </div>
  );
};

export default StudentCheckin;