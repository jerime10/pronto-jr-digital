
import { useState, useCallback } from 'react';
import { usePrescriptionModels, useExamModels } from '@/hooks/useEnhancedQuery';
import { ImageData } from '@/types/imageTypes';

export interface FormState {
  queixaPrincipal: string;
  antecedentes: string;
  alergias: string;
  evolucao: string;
  prescricaoPersonalizada: string;
  modeloPrescricao: string; // Mantido para compatibilidade
  modelosPrescricaoSelecionados: string[]; // Novo campo para múltiplos modelos
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
  modelosPrescricaoSelecionados: [],
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
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleModeloPrescricaoChange = useCallback((modelId: string) => {
    const selectedModel = prescriptionModels.find(model => model.id === modelId);
    setForm(prev => ({
      ...prev,
      modeloPrescricao: modelId,
      prescricaoPersonalizada: selectedModel?.description || prev.prescricaoPersonalizada
    }));
  }, [prescriptionModels]);

  const handleModelosPrescricaoChange = useCallback((modelIds: string[]) => {
    // Atualizar prescrição personalizada com os modelos selecionados
    const selectedModels = prescriptionModels.filter(model => modelIds.includes(model.id));
    const combinedDescription = selectedModels.map(model => model.description).join('\n\n... ... ...\n\n');
    
    setForm(prev => ({
      ...prev,
      modelosPrescricaoSelecionados: modelIds,
      prescricaoPersonalizada: combinedDescription || prev.prescricaoPersonalizada
    }));
  }, [prescriptionModels]);

  const handleExamesChange = useCallback((examIds: string[]) => {
    setForm(prev => ({
      ...prev,
      examesSelecionados: examIds
    }));
  }, []);

  const updateFormField = useCallback((field: keyof FormState, value: any) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
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
    handleModelosPrescricaoChange,
    handleExamesChange,
    updateFormField,
    setFormData,
    resetForm
  };
};
