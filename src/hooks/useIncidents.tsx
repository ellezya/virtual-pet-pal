import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Incident {
  id: string;
  student_id: string;
  classroom_id: string;
  reported_by: string;
  incident_type: string;
  location: string;
  severity: string;
  description: string | null;
  status: string;
  parent_notified_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const INCIDENT_TYPES = [
  { value: 'disruption', label: 'Disruption', emoji: '🔔' },
  { value: 'disrespect', label: 'Disrespect', emoji: '😤' },
  { value: 'safety_concern', label: 'Safety Concern', emoji: '⚠️' },
  { value: 'physical_altercation', label: 'Physical Altercation', emoji: '🥊' },
  { value: 'other', label: 'Other', emoji: '📝' },
];

export const INCIDENT_LOCATIONS = [
  { value: 'classroom', label: 'Classroom' },
  { value: 'hallway', label: 'Hallway' },
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'playground', label: 'Playground' },
  { value: 'other', label: 'Other' },
];

export const INCIDENT_SEVERITIES = [
  { value: 'minor', label: 'Minor', color: 'bg-yellow-500' },
  { value: 'major', label: 'Major', color: 'bg-orange-500' },
  { value: 'safety', label: 'Safety', color: 'bg-red-500' },
];

export const useIncidents = (classroomId: string | null) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchIncidents = async () => {
    if (!classroomId) {
      setIncidents([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('behavior_incidents')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [classroomId]);

  const reportIncident = async (data: {
    student_id: string;
    incident_type: string;
    location: string;
    severity: string;
    description?: string;
  }) => {
    if (!classroomId || !user) return null;

    try {
      const { data: incident, error } = await supabase
        .from('behavior_incidents')
        .insert({
          ...data,
          classroom_id: classroomId,
          reported_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Incident Reported",
        description: "Report submitted. Team notified.",
      });

      fetchIncidents();
      return incident;
    } catch (error) {
      console.error('Error reporting incident:', error);
      toast({
        title: "Error",
        description: "Failed to report incident",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateIncidentStatus = async (incidentId: string, status: string, notes?: string) => {
    if (!user) return false;

    try {
      const updates: Record<string, unknown> = { status };
      
      if (status === 'parent_contacted') {
        updates.parent_notified_at = new Date().toISOString();
      } else if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = user.id;
      }
      
      if (notes !== undefined) {
        updates.notes = notes;
      }

      const { error } = await supabase
        .from('behavior_incidents')
        .update(updates)
        .eq('id', incidentId);

      if (error) throw error;

      toast({
        title: "Incident Updated",
        description: `Status changed to ${status}`,
      });

      fetchIncidents();
      return true;
    } catch (error) {
      console.error('Error updating incident:', error);
      toast({
        title: "Error",
        description: "Failed to update incident",
        variant: "destructive",
      });
      return false;
    }
  };

  const getStudentIncidents = (studentId: string) => {
    return incidents.filter(i => i.student_id === studentId);
  };

  const getActiveIncidents = (studentId: string) => {
    return incidents.filter(i => i.student_id === studentId && i.status !== 'resolved');
  };

  return {
    incidents,
    loading,
    reportIncident,
    updateIncidentStatus,
    getStudentIncidents,
    getActiveIncidents,
    refetch: fetchIncidents,
  };
};
