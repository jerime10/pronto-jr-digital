
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useDashboardAppointments = () => {
  // Get recent medical records as recent appointments
  const { data: recentAppointments, isLoading: isLoadingRecentAppointments } = useQuery({
    queryKey: ['dashboard_recent_medical_records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          id, 
          created_at,
          main_complaint,
          patients!medical_records_patient_id_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (error) throw error;
      return data?.map(item => ({
        id: item.id,
        created_at: item.created_at,
        main_complaint: item.main_complaint || 'Consulta médica',
        patients: { name: item.patients?.name || 'Paciente' }
      })) || [];
    }
  });

  // Get upcoming appointments (future medical records)
  const { data: upcomingAppointments, isLoading: isLoadingUpcomingAppointments } = useQuery({
    queryKey: ['dashboard_upcoming_appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          id, 
          created_at,
          main_complaint,
          patients!medical_records_patient_id_fkey(name)
        `)
        .order('created_at', { ascending: true })
        .limit(4);
      
      if (error) throw error;
      return data?.map(item => ({
        id: item.id,
        created_at: item.created_at,
        main_complaint: item.main_complaint || 'Próxima consulta',
        patients: { name: item.patients?.name || 'Paciente' }
      })) || [];
    }
  });

  return {
    recentAppointments,
    upcomingAppointments,
    isLoading: isLoadingRecentAppointments || isLoadingUpcomingAppointments
  };
};
