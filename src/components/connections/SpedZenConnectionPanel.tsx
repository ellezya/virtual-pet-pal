import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { FileText, Link2Off, Clock } from 'lucide-react';

interface SpedZenConnectionPanelProps {
  studentId: string;
}

interface ConnectionRow {
  district_student_id: string | null;
  spedzen_student_id: string;
  linked_at: string | null;
}

type PanelState = 'loading' | 'not_connected' | 'connected_pending';

const SpedZenConnectionPanel = ({ studentId }: SpedZenConnectionPanelProps) => {
  const [state, setState] = useState<PanelState>('loading');
  const [connection, setConnection] = useState<ConnectionRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('spedzen_connections')
      .select('district_student_id, spedzen_student_id, linked_at')
      .eq('culturezen_student_id', studentId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) {
          setConnection(data);
          setState('connected_pending');
        } else {
          setState('not_connected');
        }
      });

    return () => { cancelled = true; };
  }, [studentId]);

  if (state === 'loading') {
    return (
      <div className="mt-4 pt-4 border-t border-border">
        <div className="animate-pulse h-12 bg-muted rounded-lg" />
      </div>
    );
  }

  if (state === 'not_connected') {
    return (
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2 mb-1">
          <Link2Off className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">SpedZen</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Not connected to SpedZen. When linked, IEP status, compliance data, and upcoming
          review dates will appear here.
        </p>
      </div>
    );
  }

  // connected_pending — connection row exists but SpedZen live data is not yet available
  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium">SpedZen</span>
        <Badge variant="outline" className="text-xs py-0">
          <Clock className="h-2.5 w-2.5 mr-1" />
          Data pending
        </Badge>
      </div>
      <div className="rounded-lg border border-dashed border-border p-3 space-y-1.5">
        <p className="text-xs text-muted-foreground">
          Connected — SpedZen live data will appear here once the integration is active.
        </p>
        {connection?.district_student_id && (
          <p className="text-xs font-mono text-muted-foreground">
            District ID: {connection.district_student_id}
          </p>
        )}
      </div>
    </div>
  );
};

export default SpedZenConnectionPanel;
