
import { useEffect, useState } from 'react';
import { usePatient as useEnhancedPatient } from '@/hooks/useEnhancedQuery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Patient } from '@/types/database';
import { calculateAgeInYears, parseDate } from '@/utils/dateUtils';

export const usePatient = (patientId: string | undefined) => {
  // Use enhanced query hook for better data fetching
  const { data: rawPatientData, isLoading: loading, error: queryError } = useEnhancedPatient(patientId);
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [formattedPatient, setFormattedPatient] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (queryError) {
      setError(queryError as Error);
      return;
    }
    
    if (rawPatientData) {
      // Parse date_of_birth if it exists
      const birthDate = rawPatientData.date_of_birth ? parseDate(rawPatientData.date_of_birth) : null;
      
      const patientData: Patient = {
        id: rawPatientData.id,
        name: rawPatientData.name,
        phone: rawPatientData.phone,
        sus: rawPatientData.sus,
        date_of_birth: rawPatientData.date_of_birth,
        age: rawPatientData.age,
        gender: rawPatientData.gender || 'Não informado',
        address: rawPatientData.address,
        bairro: rawPatientData.bairro || '',
        created_at: rawPatientData.created_at || new Date().toISOString(),
        updated_at: rawPatientData.updated_at || new Date().toISOString()
      };
      
      const formatted = {
        ...patientData,
        date_of_birth: birthDate,
        // Recalculate age from date of birth to ensure consistency
        age: birthDate ? calculateAgeInYears(birthDate) : (rawPatientData.age || 0)
      };
      
      setPatient(patientData);
      setFormattedPatient(formatted);
    }
  }, [rawPatientData, queryError]);
  
  const deletePatient = async (): Promise<boolean> => {
    if (!patientId) return false;
    
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);
      
      if (error) throw error;
      
      toast.success("Paciente excluído com sucesso!");
      return true;
    } catch (error) {
      console.error('Error deleting patient:', error);
      toast.error("Erro ao excluir paciente.");
      return false;
    }
  };
  
  return {
    patient,
    formattedPatient,
    loading,
    error,
    deletePatient
  };
};
