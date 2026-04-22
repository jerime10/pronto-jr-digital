
import { useMemo } from 'react';
import { useTabState } from './useTabState';
import { usePacienteSearch } from './usePacienteSearch';
import { useProfessionalData } from './useProfessionalData';
import { useFormData } from './useFormData';
import { useAIProcessing } from './useAIProcessing';
import { useSaveActions } from './useSaveActions';
import { useAtendimentoHelpers } from './useAtendimentoHelpers';
import { useLocalStoragePersistence } from './useLocalStoragePersistence';

export const useAtendimentoState = (selectedModelTitle?: string | null, initialPatient?: any, appointmentId?: string, dynamicFields?: Record<string, string>, onDynamicFieldsChange?: (fields: Record<string, string>) => void, updateDynamicFieldsFromAI?: (fields: Record<string, string>) => void, medicalRecordId?: string, existingRecord?: any, selectedExamModelId?: string | null) => {
  
  // Garantir um ID estável para todo o atendimento (novo ou existente)
  const stableMedicalRecordId = useMemo(() => {
    return medicalRecordId || existingRecord?.id || crypto.randomUUID();
  }, [medicalRecordId, existingRecord?.id]);

  const { activeTab, setActiveTab } = useTabState();
  const { 
    buscarPaciente, 
    pacienteSelecionado, 
    mostrarResultadosBusca, 
    filteredPacientes, 
    isSearchingPacientes,
    handlePacienteSearch, 
    handleSelectPaciente,
    handleClearPaciente,
    handleInputFocus,
    handleInputBlur,
    setMostrarResultadosBusca
  } = usePacienteSearch(initialPatient || existingRecord?.paciente);
  
  const { professional: profissionalAtual, isLoadingProfessional } = useProfessionalData();
  
  const { 
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
  } = useFormData();
  
  const { isProcessingAI, processAIContent } = useAIProcessing();
  
  // Hook para persistência localStorage
  const { hasLocalData, getLocalStorageKey } = useLocalStoragePersistence({
    pacienteSelecionado: pacienteSelecionado as any,
    form
  });
  
  const { 
    isSaving, 
    isSubmittingRecord,
    handleSubmitMedicalRecord
  } = useSaveActions({
    pacienteSelecionado: pacienteSelecionado as any,
    profissionalAtual,
    form,
    examModels,
    resetForm, // Passando a função resetForm para o hook
    selectedModelTitle,
    appointmentId,
    dynamicFields,
    medicalRecordId: stableMedicalRecordId,
    existingRecord
  });

  // Use our new helper hook to handle AI content processing
  // Recriado sempre que selectedModelTitle mudar para garantir que o valor correto seja usado
  const { processAIContent: processAIContentHelper } = useAtendimentoHelpers({
    processAI: processAIContent,
    updateFormField,
    selectedModelTitle,
    dynamicFields,
    onIndividualFieldsUpdate: onDynamicFieldsChange,
    updateDynamicFieldsFromAI: updateDynamicFieldsFromAI,
    selectedModelId: selectedExamModelId
  });

  const wrappedHandleSelectPaciente = (paciente: any) => {
    handleSelectPaciente(paciente);
    // Limpar o ID do rascunho e resetar dados do form ao selecionar um novo paciente manualmente
    // (a menos que seja o mesmo paciente)
    if (!pacienteSelecionado || pacienteSelecionado.id !== paciente?.id) {
      setFormData({
        draftId: undefined
      });
    }
  };

  const wrappedHandleClearPaciente = () => {
    handleClearPaciente();
    resetForm();
  };

  return {
    activeTab,
    setActiveTab,
    buscarPaciente,
    pacienteSelecionado,
    mostrarResultadosBusca,
    profissionalAtual,
    isProcessingAI: {
      mainComplaint: isProcessingAI.mainComplaint,
      evolution: isProcessingAI.evolution,
      examResults: isProcessingAI.examResults
    },
    form,
    prescriptionModels,
    isLoadingPrescriptions,
    examModels,
    isLoadingExams,
    filteredPacientes,
    isSearchingPacientes,
    isSaving,
    isSubmittingRecord,
    handleChange,
    handlePacienteSearch,
    handleSelectPaciente: wrappedHandleSelectPaciente,
    handleClearPaciente: wrappedHandleClearPaciente,
    handleInputFocus,
    handleInputBlur,
    setMostrarResultadosBusca,
    handleModeloPrescricaoChange,
    handleModelosPrescricaoChange,
    handleExamesChange,
    processAIContent: processAIContentHelper,
    handleSubmitMedicalRecord,
    updateFormField,
    setFormData,
    resetForm,
    hasLocalData,
    getLocalStorageKey
  };
};
