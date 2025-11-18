
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
    console.log('💊 [useFormData] handleModelosPrescricaoChange chamado com:', modelIds);
    console.log('💊 [useFormData] Ordem original dos IDs:', modelIds);
    
    // Manter a ordem de seleção e evitar duplicatas
    const selectedModels = modelIds.map(id => {
      const model = prescriptionModels.find(model => model.id === id);
      console.log(`💊 [useFormData] Buscando ID ${id}:`, model ? `encontrado (${model.name})` : 'não encontrado');
      return model;
    }).filter(Boolean); // Remove undefined
    
    console.log('💊 [useFormData] Modelos selecionados na ordem:', selectedModels.map(m => ({ id: m.id, name: m.name })));
    
    // Usar Map para manter ordem e evitar duplicatas
    const uniqueModels = new Map<string, any>();
    
    selectedModels.forEach(model => {
      const description = (model.description || '').trim();
      if (description && !uniqueModels.has(description)) {
        uniqueModels.set(description, model);
        console.log('💊 [useFormData] Adicionando modelo único na ordem:', model.name);
      } else if (uniqueModels.has(description)) {
        console.log('💊 [useFormData] Modelo duplicado ignorado:', model.name);
      }
    });
    
    // Manter a ordem original de seleção e limpar separadores
    const finalLines = Array.from(uniqueModels.values()).map(model => {
      let desc = (model.description || '').trim();
      
      // Remover linhas de separadores (----)
      desc = desc.replace(/^[-]{3,}.*$/gm, '').trim();
      
      // Remover múltiplas linhas vazias consecutivas
      desc = desc.replace(/\n{3,}/g, '\n\n');
      
      console.log('💊 [useFormData] Linha final limpa:', model.name, '-', desc.substring(0, 50) + '...');
      return desc;
    }).filter(Boolean);
    
    console.log('💊 [useFormData] Total de modelos únicos na ordem:', finalLines.length);
    
    // Se não houver modelos selecionados, manter o texto existente do usuário
    const finalText = finalLines.length > 0 
      ? finalLines.join('\n\n') // Apenas espaço duplo entre itens, sem separadores
      : form.prescricaoPersonalizada || '';
    
    console.log('💊 [useFormData] Texto final gerado (completo):', finalText);
    console.log('💊 [useFormData] Texto final (primeiros 300 chars):', finalText.substring(0, 300) + (finalText.length > 300 ? '...' : ''));
    
    setForm(prev => ({
      ...prev,
      modelosPrescricaoSelecionados: modelIds,
      prescricaoPersonalizada: finalText
    }));
  }, [prescriptionModels, form.prescricaoPersonalizada]);

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
