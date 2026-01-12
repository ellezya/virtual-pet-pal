import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { INCIDENT_TYPES, INCIDENT_SEVERITIES } from '@/hooks/useIncidents';

interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  status: string;
  created_at: string;
}

interface StudentIncidentBadgeProps {
  incidents: Incident[];
}

const StudentIncidentBadge = ({ incidents }: StudentIncidentBadgeProps) => {
  const activeIncidents = incidents.filter(i => i.status !== 'resolved');
  
  if (activeIncidents.length === 0) return null;

  const latestIncident = activeIncidents[0];
  const incidentType = INCIDENT_TYPES.find(t => t.value === latestIncident.incident_type);
  const severity = INCIDENT_SEVERITIES.find(s => s.value === latestIncident.severity);

  const severityColors: Record<string, string> = {
    minor: 'text-yellow-500',
    major: 'text-orange-500',
    safety: 'text-red-500',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-1 ${severityColors[latestIncident.severity] || 'text-orange-500'}`}>
            <AlertTriangle className="w-4 h-4" />
            {activeIncidents.length > 1 && (
              <span className="text-xs font-bold">{activeIncidents.length}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px]">
          <div className="text-sm">
            <div className="font-semibold mb-1">Active Incident{activeIncidents.length > 1 ? 's' : ''}</div>
            <div className="text-xs text-muted-foreground">
              {incidentType?.emoji} {incidentType?.label} ({severity?.label})
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(latestIncident.created_at).toLocaleDateString()}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default StudentIncidentBadge;
