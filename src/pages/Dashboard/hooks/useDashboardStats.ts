
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfToday, startOfWeek, endOfWeek } from 'date-fns';

export const useDashboardStats = () => {
  // Get total patient count
  const { data: patientCount, isLoading: isLoadingPatients } = useQuery({
    queryKey: ['dashboard_patients_count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Get new patients this week
  const { data: newPatientsCount } = useQuery({
    queryKey: ['dashboard_new_patients'],
    queryFn: async () => {
      const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      const { count, error } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Get today's medical records
  const { data: todayAppointments, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ['dashboard_today_medical_records'],
    queryFn: async () => {
      const today = startOfToday();
      const { count, error } = await supabase
        .from('medical_records')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())
        .lt('created_at', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Get this week's prescriptions
  const { data: weeklyPrescriptions, isLoading: isLoadingPrescriptions } = useQuery({
    queryKey: ['dashboard_weekly_prescriptions'],
    queryFn: async () => {
      const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
      const { count, error } = await supabase
        .from('medical_records')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .not('custom_prescription', 'is', null);
      
      if (error) throw error;
      return count || 0;
    }
  });

  // Get pending exams
  const { data: pendingExams, isLoading: isLoadingExams } = useQuery({
    queryKey: ['dashboard_pending_exams'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('medical_records')
        .select('*', { count: 'exact', head: true })
        .not('exam_requests', 'is', null);
      
      if (error) throw error;
      return count || 0;
    }
  });

  return {
    patientCount,
    newPatientsCount,
    todayAppointments,
    weeklyPrescriptions,
    pendingExams,
    isLoading: isLoadingPatients || isLoadingAppointments || isLoadingPrescriptions || isLoadingExams
  };
};
