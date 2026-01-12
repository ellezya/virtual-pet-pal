import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Incident, 
  INCIDENT_TYPES, 
  INCIDENT_LOCATIONS, 
  INCIDENT_SEVERITIES,
  useIncidents 
} from '@/hooks/useIncidents';
import { AlertTriangle, Check, Mail, Clock } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  student_number: string;
  avatar_emoji: string;
}

interface IncidentsListProps {
  classroomId: string | null;
  students: Student[];
}

const IncidentsList = ({ classroomId, students }: IncidentsListProps) => {
  const { incidents, updateIncidentStatus } = useIncidents(classroomId);

  const getStudent = (studentId: string) => {
    return students.find(s => s.id === studentId);
  };

  const getIncidentType = (type: string) => {
    return INCIDENT_TYPES.find(t => t.value === type);
  };

  const getSeverity = (severity: string) => {
    return INCIDENT_SEVERITIES.find(s => s.value === severity);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reported':
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Reported</Badge>;
      case 'parent_contacted':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Parent Contacted</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="border-green-500 text-green-500">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activeIncidents = incidents.filter(i => i.status !== 'resolved');
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved');

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          Incident Reports
          {activeIncidents.length > 0 && (
            <Badge className="bg-orange-500 text-white ml-2">
              {activeIncidents.length} Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {incidents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No incidents reported</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {/* Active Incidents */}
              {activeIncidents.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Active Incidents</h3>
                  {activeIncidents.map(incident => {
                    const student = getStudent(incident.student_id);
                    const type = getIncidentType(incident.incident_type);
                    const severity = getSeverity(incident.severity);

                    return (
                      <div 
                        key={incident.id}
                        className="p-4 rounded-lg bg-muted/50 border border-orange-500/30"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{student?.avatar_emoji || '👤'}</span>
                            <div>
                              <div className="font-medium text-foreground">
                                {student?.name || 'Unknown Student'}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {student?.student_number}
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(incident.status)}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="secondary">
                            {type?.emoji} {type?.label}
                          </Badge>
                          <Badge className={severity?.color + ' text-white'}>
                            {severity?.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {INCIDENT_LOCATIONS.find(l => l.value === incident.location)?.label}
                          </Badge>
                        </div>

                        {incident.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {incident.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(incident.created_at).toLocaleDateString()}
                          </div>
                          
                          <div className="flex gap-2">
                            {incident.status === 'reported' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateIncidentStatus(incident.id, 'parent_contacted')}
                                className="text-xs"
                              >
                                <Mail className="w-3 h-3 mr-1" />
                                Parent Contacted
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => updateIncidentStatus(incident.id, 'resolved')}
                              className="text-xs bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Resolve
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Resolved Incidents */}
              {resolvedIncidents.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground">Resolved ({resolvedIncidents.length})</h3>
                  {resolvedIncidents.slice(0, 5).map(incident => {
                    const student = getStudent(incident.student_id);
                    const type = getIncidentType(incident.incident_type);

                    return (
                      <div 
                        key={incident.id}
                        className="p-3 rounded-lg bg-muted/30 opacity-60"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{student?.avatar_emoji || '👤'}</span>
                            <span className="text-sm text-foreground">{student?.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {type?.emoji} {type?.label}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(incident.resolved_at || incident.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default IncidentsList;
