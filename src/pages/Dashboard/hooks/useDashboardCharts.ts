
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, subDays, format, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useDashboardCharts = (period: number = 30) => {
  // Gráfico de linha temporal de atendimentos
  const { data: attendanceTimeline, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ['dashboard_medical_records_timeline', period],
    queryFn: async () => {
      const startDate = subDays(new Date(), period);
      const { data, error } = await supabase
        .from('medical_records')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Agrupar por dia
      const groupedData = data?.reduce((acc, record) => {
        const date = format(new Date(record.created_at), 'dd/MM', { locale: ptBR });
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};
      
      return Object.entries(groupedData).map(([date, count]) => ({
        date,
        atendimentos: count
      }));
    }
  });

  // Gráfico de pizza de prescrições mais comuns
  const { data: prescriptionData, isLoading: isLoadingPrescriptions } = useQuery({
    queryKey: ['dashboard_prescriptions', period],
    queryFn: async () => {
      const startDate = subDays(new Date(), period);
      const { data, error } = await supabase
        .from('medical_records')
        .select('custom_prescription')
        .gte('created_at', startDate.toISOString())
        .not('custom_prescription', 'is', null);
      
      if (error) throw error;
      
      // Contar tipos de prescrição
      const prescriptionCount: Record<string, number> = {};
      data?.forEach(record => {
        const prescription = record.custom_prescription?.substring(0, 30) || 'Prescrição';
        prescriptionCount[prescription] = (prescriptionCount[prescription] || 0) + 1;
      });
      
      return Object.entries(prescriptionCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5
    }
  });

  // Gráfico de área de novos pacientes por semana
  const { data: newPatientsData, isLoading: isLoadingNewPatients } = useQuery({
    queryKey: ['dashboard_new_patients_weekly', period],
    queryFn: async () => {
      const startDate = subDays(new Date(), period);
      const { data, error } = await supabase
        .from('patients')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // Agrupar por semana
      const weeklyData: Record<string, number> = {};
      data?.forEach(patient => {
        const date = new Date(patient.created_at);
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        const weekLabel = `${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`;
        weeklyData[weekLabel] = (weeklyData[weekLabel] || 0) + 1;
      });
      
      return Object.entries(weeklyData).map(([semana, pacientes]) => ({
        semana,
        pacientes
      }));
    }
  });

  // Dados para gráfico de radar de performance
  const { data: performanceData, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ['dashboard_performance'],
    queryFn: async () => {
      const startDate = subDays(new Date(), 30);
      
      // Buscar várias métricas
      const [
        { count: totalMedicalRecords },
        { count: totalPatients },
        { count: totalProfessionals },
        { count: totalExams }
      ] = await Promise.all([
        supabase.from('medical_records').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()),
        supabase.from('patients').select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString()),
        (supabase as any).from('professionals').select('*', { count: 'exact', head: true }),
        supabase.from('modelo-result-exames' as any).select('*', { count: 'exact', head: true }).gte('created_at', startDate.toISOString())
      ]);
      
      return [
        { metric: 'Atendimentos', value: Math.min((totalMedicalRecords || 0) * 2, 100), fullMark: 100 },
        { metric: 'Pacientes', value: Math.min((totalPatients || 0) * 5, 100), fullMark: 100 },
        { metric: 'Profissionais', value: Math.min((totalProfessionals || 0) * 10, 100), fullMark: 100 },
        { metric: 'Exames', value: Math.min((totalExams || 0) * 4, 100), fullMark: 100 },
        { metric: 'Eficiência', value: 85, fullMark: 100 },
        { metric: 'Qualidade', value: 92, fullMark: 100 }
      ];
    }
  });

  return {
    attendanceTimeline,
    prescriptionData,
    newPatientsData,
    performanceData,
    isLoading: isLoadingTimeline || isLoadingPrescriptions || isLoadingNewPatients || isLoadingPerformance
  };
};
