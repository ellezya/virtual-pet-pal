import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Smile } from 'lucide-react';

const MOOD_CONFIG = [
  { emoji: '😊', label: 'Great', color: 'bg-green-500' },
  { emoji: '🙂', label: 'Good', color: 'bg-emerald-400' },
  { emoji: '😐', label: 'Okay', color: 'bg-yellow-400' },
  { emoji: '😔', label: 'Not great', color: 'bg-orange-400' },
  { emoji: '😢', label: 'Struggling', color: 'bg-red-400' },
];

interface ClassMoodOverviewProps {
  classroomId: string;
}

const ClassMoodOverview = ({ classroomId }: ClassMoodOverviewProps) => {
  const [moodCounts, setMoodCounts] = useState<Record<string, number>>({});
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoods = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('daily_checkins')
        .select('mood_emoji')
        .eq('classroom_id', classroomId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59.999`);

      if (error) {
        console.error('Error fetching mood data:', error);
        setLoading(false);
        return;
      }

      const counts: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        counts[row.mood_emoji] = (counts[row.mood_emoji] || 0) + 1;
      });

      setMoodCounts(counts);
      setTotalCheckins(data?.length || 0);
      setLoading(false);
    };

    fetchMoods();
  }, [classroomId]);

  if (loading) {
    return null;
  }

  if (totalCheckins === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-4 text-center">
          <Smile className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No check-ins today yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Smile className="w-4 h-4" />
          Today's Class Mood — {totalCheckins} check-in{totalCheckins !== 1 ? 's' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2">
          {MOOD_CONFIG.map((mood) => {
            const count = moodCounts[mood.emoji] || 0;
            const pct = totalCheckins > 0 ? (count / totalCheckins) * 100 : 0;
            return (
              <div key={mood.emoji} className="flex items-center gap-2">
                <span className="text-lg w-7 text-center">{mood.emoji}</span>
                <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${mood.color} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassMoodOverview;