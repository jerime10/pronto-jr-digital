
import { useState, useCallback } from 'react';
import { usePrescriptionModels, useExamModels } from '@/hooks/useEnhancedQuery';
import { ImageData } from '@/types/imageTypes';

export interface FormState {
  queixaPrincipal: string;
  antecedentes: string;
  alergias: string;
  evolucao: string;
  prescricaoPersonalizada: string;
  modeloPrescricao: string;
  examesSelecionados: string[];
  observacoesExames: string;
  resultadoExames: string;
  images: ImageData[];
  dataInicioAtendimento: Date | null;
  dataFimAtendimento: Date | null;
  dynamicFields?: Record<string, string>;
  selectedExamModelId?: string; // ID do modelo de exame selecionado
}

const initialFormState: FormState = {
  queixaPrincipal: '',
  antecedentes: '',
  alergias: '',
  evolucao: '',
  prescricaoPersonalizada: '',
  modeloPrescricao: '',
  examesSelecionados: [],
  observacoesExames: '',
  resultadoExames: '',
  images: [],
  dataInicioAtendimento: new Date(),
  dataFimAtendimento: null,
};

export const useFormData = () => {
  const [form, setForm] = useState<FormState>(initialFormState);

  // Fetch prescription models
  const { data: prescriptionModels = [], isLoading: isLoadingPrescriptions } = usePrescriptionModels();

  // Fetch exam models  
  const { data: examModels = [], isLoading: isLoadingExams } = useExamModels();

  const handleChange = useCallback((field: keyof FormState, value: any) => {
    console.log('🔵🔵🔵 [FORM-DATA] ===== handleChange CHAMADO =====');
    console.log('🔵 [FORM-DATA] Campo:', field);
    console.log('🔵 [FORM-DATA] Valor:', value);
    console.log('🔵 [FORM-DATA] Estado anterior:', form[field]);
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
    console.log('🔵 [FORM-DATA] Estado atualizado');
    console.log('🔵🔵🔵 [FORM-DATA] ===== FIM =====');
  }, [form]);

  const handleModeloPrescricaoChange = useCallback((modelId: string) => {
    const selectedModel = prescriptionModels.find(model => model.id === modelId);
    setForm(prev => ({
      ...prev,
      modeloPrescricao: modelId,
      prescricaoPersonalizada: selectedModel?.description || prev.prescricaoPersonalizada
    }));
  }, [prescriptionModels]);

  const handleExamesChange = useCallback((examIds: string[]) => {
    setForm(prev => ({
      ...prev,
      examesSelecionados: examIds
    }));
  }, []);

  const updateFormField = useCallback((field: keyof FormState, value: any) => {
    console.log('🟣🟣🟣 [FORM-DATA] ===== updateFormField CHAMADO =====');
    console.log('🟣 [FORM-DATA] Campo:', field);
    console.log('🟣 [FORM-DATA] Valor:', value);
    if (field === 'observacoesExames') {
      console.log('🔴🔴🔴 [FORM-DATA-OBSERVACOES] ===== CAMPO OBSERVAÇÕES =====');
      console.log('🔴 [OBSERVACOES] Valor recebido:', value);
      console.log('🔴 [OBSERVACOES] Tamanho:', value?.length || 0);
      console.log('🔴 [OBSERVACOES] É vazio?', value === '');
      console.log('🔴🔴🔴 [FORM-DATA-OBSERVACOES] ===== FIM =====');
    }
    setForm(prev => {
      const newForm = {
        ...prev,
        [field]: value
      };
      console.log('🟣 [FORM-DATA] Novo estado:', newForm[field]);
      return newForm;
    });
    console.log('🟣🟣🟣 [FORM-DATA] ===== FIM =====');
  }, []);

  const setFormData = useCallback((newFormData: Partial<FormState>) => {
    setForm(prev => ({
      ...prev,
      ...newFormData
    }));
  }, []);

  const resetForm = useCallback(() => {
    setForm({
      ...initialFormState,
      dataInicioAtendimento: new Date()
    });
  }, []);

  return {
    form,
    prescriptionModels,
    isLoadingPrescriptions,
    examModels,
    isLoadingExams,
    handleChange,
    handleModeloPrescricaoChange,
    handleExamesChange,
    updateFormField,
    setFormData,
    resetForm
  };
};
