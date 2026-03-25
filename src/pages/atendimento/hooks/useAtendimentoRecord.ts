import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTabState } from './useTabState';
import { Patient } from '@/types/database';
import { FormState } from './useFormData';

export const useAtendimentoRecord = (id: string | undefined, isEditing: boolean) => {
  const { setActiveTab: setGlobalActiveTab } = useTabState();
  const [patientData, setPatientData] = useState<Patient | null>(null);
  
  // Query for existing record when editing
  const { data: existingRecord, isLoading: isLoadingRecord } = useQuery({
    queryKey: ['medical_record', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          paciente:patients(*)
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Erro ao buscar prontuário:', error);
        return null;
      }
      
      return data;
    },
    enabled: isEditing,
  });
  
  return {
    existingRecord,
    isLoadingRecord,
    patientData,
    setPatientData,
    setGlobalActiveTab
  };
};