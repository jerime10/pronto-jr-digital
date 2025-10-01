
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MedicalRecord {
  id: string;
  patient_id: string;
  professional_id: string;
  attendant_id?: string | null;
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
          .select(`
            id,
            patient_id,
            professional_id,
            appointment_id,
            main_complaint,
            history,
            allergies,
            evolution,
            prescription_model_id,
            custom_prescription,
            exam_requests,
            exam_observations,
            exam_results,
            file_url_storage,
            created_at,
            updated_at,
            attendance_start_at,
            attendance_end_at,
            patients!inner(
              name,
              sus,
              phone
            ),
            professionals!inner(
              name,
              specialty,
              license_type,
              license_number
            )
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const transformedRecords: MedicalRecord[] = (data || []).map(record => ({
          id: record.id,
          patient_id: record.patient_id,
          professional_id: record.professional_id,
          appointment_id: record.appointment_id,
          main_complaint: record.main_complaint,
          history: record.history,
          allergies: record.allergies,
          evolution: record.evolution,
          prescription_model_id: record.prescription_model_id,
          custom_prescription: record.custom_prescription,
          exam_requests: Array.isArray(record.exam_requests) ? record.exam_requests.map(item => String(item)) : null,
          exam_observations: record.exam_observations,
          exam_results: record.exam_results,
          file_url_storage: record.file_url_storage,
          created_at: record.created_at,
          updated_at: record.updated_at,
          attendance_start_at: record.attendance_start_at,
          attendance_end_at: record.attendance_end_at,
          patient: {
            name: record.patients.name,
            sus: record.patients.sus,
            phone: record.patients.phone
          },
          professional: {
            name: record.professionals.name,
            specialty: record.professionals.specialty,
            license_type: record.professionals.license_type,
            license_number: record.professionals.license_number
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
