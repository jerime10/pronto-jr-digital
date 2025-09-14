import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTabState } from './useTabState';
import { Patient } from '@/types/database';
import { FormState } from './useFormData';

export const useAtendimentoRecord = (id: string | undefined, isEditing: boolean) => {
  const { setActiveTab: setGlobalActiveTab } = useTabState();
  const [patientData, setPatientData] = useState<Patient | null>(null);
  
  // Mock query for existing record when editing (since this is a pharmacy system)
  const { data: existingRecord, isLoading: isLoadingRecord } = useQuery({
    queryKey: ['medical_record', id],
    queryFn: async () => {
      if (!id) return null;
      // Return null since medical records don't exist in pharmacy system
      return null;
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