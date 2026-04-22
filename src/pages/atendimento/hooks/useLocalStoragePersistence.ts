
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
}

export const useLocalStoragePersistence = ({
  pacienteSelecionado,
  form
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

  // Carregamento automático removido conforme solicitado para evitar que 
  // um novo atendimento puxe dados de um rascunho existente automaticamente.
  // useEffect(() => { ... }) foi removido.

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
        modelosPrescricaoSelecionados: form.modelosPrescricaoSelecionados || [],
        custom_prescription: form.prescricaoPersonalizada,
        exam_requests: form.examesSelecionados,
        exam_observations: form.observacoesExames,
        exam_results: form.resultadoExames,
        images_data: form.images,
        // Garantir que são Dates válidos antes de chamar toISOString
        attendance_start_at: form.dataInicioAtendimento instanceof Date && !isNaN(form.dataInicioAtendimento.getTime())
          ? form.dataInicioAtendimento.toISOString()
          : new Date().toISOString(),
        attendance_end_at: form.dataFimAtendimento instanceof Date && !isNaN(form.dataFimAtendimento.getTime())
          ? form.dataFimAtendimento.toISOString()
          : null,
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
