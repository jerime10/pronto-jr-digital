
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MedicalRecord {
  id: string;
  patient_id: string;
  professional_id: string;
  appointment_id: string | null;
  main_complaint: string | null;
  history: string | null;
  allergies: string | null;
  evolution: string | null;
  prescription_model_id: string | null;
  custom_prescription: string | null;
  exam_requests: string[] | null;
  exam_observations: string | null;
  exam_results: string | null;
  file_url_storage: string | null;
  created_at: string;
  updated_at: string;
  attendance_start_at: string | null;
  attendance_end_at: string | null;
  patient: {
    name: string;
    sus: string;
    phone: string;
  };
  professional: {
    name: string;
    specialty?: string;
    license_type?: string;
    license_number?: string;
  };
  documents?: Document[];
}

export const useMedicalRecords = () => {
  return useQuery({
    queryKey: ['medical_records'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('medical_records')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const transformedRecords: MedicalRecord[] = (data || []).map((record: any) => ({
          ...record,
          appointment_id: record.appointment_id || null,
          patient: {
            name: 'Paciente',
            sus: '000000000',
            phone: '(00) 00000-0000'
          },
          professional: {
            name: 'Profissional',
            specialty: 'Enfermeiro Obstetra',
            license_type: 'Coren',
            license_number: '542061'
          }
        }));
        
        return transformedRecords;
      } catch (error) {
        console.error('Erro ao carregar prontuários médicos:', error);
        toast.error('Erro ao carregar prontuários médicos');
        throw error;
      }
    },
  });
};
