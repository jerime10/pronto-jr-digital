import { supabase } from '@/integrations/supabase/client';

export interface Patient {
  id: string;
  name: string;
  sus: string;
  phone: string;
  address: string;
  date_of_birth: string | null;
  age: number | null;
  gender: string | null;
  bairro: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Busca um paciente no banco de dados por nome
 * @param patientName Nome do paciente para buscar
 * @returns Paciente encontrado ou null se não encontrado
 */
export const findPatientByName = async (patientName: string): Promise<Patient | null> => {
  try {
    // Buscar paciente por nome exato (case insensitive)
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .ilike('name', patientName)
      .single();

    if (error) {
      // Se não encontrou por nome exato, tentar busca parcial
      if (error.code === 'PGRST116') {
        const { data: partialData, error: partialError } = await supabase
          .from('patients')
          .select('*')
          .ilike('name', `%${patientName}%`)
          .limit(1);

        if (partialError) {
          console.error('Erro ao buscar paciente:', partialError);
          return null;
        }

        return partialData && partialData.length > 0 ? partialData[0] : null;
      }
      
      console.error('Erro ao buscar paciente:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    return null;
  }
};

/**
 * Busca um paciente no banco de dados por SUS
 * @param susNumber Número do SUS para buscar
 * @returns Paciente encontrado ou null se não encontrado
 */
export const findPatientBySUS = async (susNumber: string): Promise<Patient | null> => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('sus', susNumber)
      .single();

    if (error) {
      console.error('Erro ao buscar paciente por SUS:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar paciente por SUS:', error);
    return null;
  }
};

/**
 * Busca pacientes por nome ou SUS (busca mais flexível)
 * @param searchTerm Termo de busca (nome ou SUS)
 * @returns Lista de pacientes encontrados
 */
export const searchPatients = async (searchTerm: string): Promise<Patient[]> => {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,sus.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error('Erro ao buscar pacientes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    return [];
  }
};