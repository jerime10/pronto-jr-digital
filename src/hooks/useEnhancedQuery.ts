import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

// Hook principal para queries com fallback
export function useEnhancedQuery<T = any>(queryKey: any[], queryFn: () => Promise<T>) {
  const { user } = useSimpleAuth();
  
  return useQuery<T>({
    queryKey: [...queryKey, user?.id],
    queryFn: async () => {
      try {
        const result = await queryFn();
        console.log(`[Enhanced Query] ✅ Query executada com sucesso`);
        return result;
      } catch (error) {
        console.error(`[Enhanced Query] ❌ Erro na query:`, error);
        throw error;
      }
    },
    enabled: !!user,
    retry: 2,
    staleTime: 2 * 60 * 1000
  });
}

// Hooks especializados
export function usePatients() {
  return useEnhancedQuery(['patients'], async () => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('name');
    if (error) throw error;
    console.log(`[usePatients] Dados carregados:`, data?.length || 0, 'pacientes');
    return data || [];
  });
}

export function usePrescriptionModels() {
  return useEnhancedQuery(['prescription_models'], async () => {
    const { data, error } = await supabase
      .from('prescription_models')
      .select('*')
      .order('name');
    if (error) throw error;
    console.log(`[usePrescriptionModels] Dados carregados:`, data?.length || 0, 'modelos');
    return data || [];
  });
}

export function useExamModels() {
  return useEnhancedQuery(['exam_models'], async () => {
    const { data, error } = await supabase
      .from('exam_models')
      .select('*')
      .order('name');
    if (error) throw error;
    console.log(`[useExamModels] Dados carregados:`, data?.length || 0, 'modelos');
    return data || [];
  });
}

export function usePatient(id: string | undefined) {
  return useEnhancedQuery(['patients', id], async () => {
    if (!id) return null;
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    console.log(`[usePatient] Paciente carregado:`, data?.name || 'não encontrado');
    return data;
  });
}

// Hook de diagnóstico simplificado
export function useDiagnostics() {
  return useQuery({
    queryKey: ['diagnostics'],
    queryFn: async () => {
      const results = await Promise.allSettled([
        supabase.from('patients').select('id').limit(1),
        supabase.from('prescription_models').select('id').limit(1),
        supabase.from('exam_models').select('id').limit(1),
      ]);

      return {
        patients: results[0].status === 'fulfilled' && !results[0].value.error,
        prescriptions: results[1].status === 'fulfilled' && !results[1].value.error,
        exams: results[2].status === 'fulfilled' && !results[2].value.error,
        professionals: true,
      };
    },
    refetchInterval: 10000,
    retry: false,
  });
}