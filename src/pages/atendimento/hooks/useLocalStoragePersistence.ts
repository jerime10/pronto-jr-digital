
import { useEffect } from 'react';
import { FormState } from './useFormData';

interface Patient {
  id: string;
  name: string;
  sus: string;
  phone: string;
  address: string;
  date_of_birth: string | null;
  age: number;
  gender: string;
  created_at: string;
  updated_at: string;
}

interface UseLocalStoragePersistenceProps {
  pacienteSelecionado: Patient | null;
  form: FormState;
  setFormData: (formData: FormState) => void;
}

export const useLocalStoragePersistence = ({
  pacienteSelecionado,
  form,
  setFormData
}: UseLocalStoragePersistenceProps) => {
  const getLocalStorageKey = () => {
    if (!pacienteSelecionado?.id) return null;
    return `atendimento_${pacienteSelecionado.id}_temp`;
  };

  const hasLocalData = () => {
    const key = getLocalStorageKey();
    if (!key) return false;
    return localStorage.getItem(key) !== null;
  };

  // Load data from localStorage when patient is selected
  useEffect(() => {
    const key = getLocalStorageKey();
    if (!key) return;

    try {
      const savedData = localStorage.getItem(key);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log('Carregando dados salvos do localStorage:', parsedData);
        
        // Convert date strings back to Date objects
        const formData: FormState = {
          queixaPrincipal: parsedData.main_complaint || '',
          antecedentes: parsedData.history || '',
          alergias: parsedData.allergies || '',
          evolucao: parsedData.evolution || '',
          modeloPrescricao: parsedData.prescription_model_id || '',
          prescricaoPersonalizada: parsedData.custom_prescription || '',
          examesSelecionados: Array.isArray(parsedData.exam_requests) 
            ? parsedData.exam_requests.map(item => String(item))
            : [],
          observacoesExames: parsedData.exam_observations || '',
          resultadoExames: parsedData.exam_results || '',
          images: parsedData.images_data || [],
          // Convert ISO strings back to Date objects
          dataInicioAtendimento: parsedData.attendance_start_at 
            ? new Date(parsedData.attendance_start_at) 
            : new Date(),
          dataFimAtendimento: parsedData.attendance_end_at 
            ? new Date(parsedData.attendance_end_at) 
            : undefined,
        };
        
        setFormData(formData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
      // Remove corrupted data
      localStorage.removeItem(key);
    }
  }, [pacienteSelecionado?.id, setFormData]);

  // Auto-save form data to localStorage when it changes
  useEffect(() => {
    const key = getLocalStorageKey();
    if (!key || !pacienteSelecionado) return;

    // Don't save if form is empty
    if (!form.queixaPrincipal.trim()) return;

    try {
      const dataToSave = {
        patient_id: pacienteSelecionado.id,
        main_complaint: form.queixaPrincipal,
        history: form.antecedentes,
        allergies: form.alergias,
        evolution: form.evolucao,
        prescription_model_id: form.modeloPrescricao || null,
        custom_prescription: form.prescricaoPersonalizada,
        exam_requests: form.examesSelecionados,
        exam_observations: form.observacoesExames,
        exam_results: form.resultadoExames,
        images_data: form.images,
        attendance_start_at: form.dataInicioAtendimento?.toISOString(),
        attendance_end_at: form.dataFimAtendimento?.toISOString() || null,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem(key, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  }, [form, pacienteSelecionado, getLocalStorageKey]);

  return {
    hasLocalData: hasLocalData(),
    getLocalStorageKey
  };
};
