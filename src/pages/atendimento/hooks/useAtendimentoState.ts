
import { useTabState } from './useTabState';
import { usePacienteSearch } from './usePacienteSearch';
import { useProfessionalData } from './useProfessionalData';
import { useFormData } from './useFormData';
import { useAIProcessing } from './useAIProcessing';
import { useSaveActions } from './useSaveActions';
import { useAtendimentoHelpers } from './useAtendimentoHelpers';
import { useLocalStoragePersistence } from './useLocalStoragePersistence';

export const useAtendimentoState = (selectedModelTitle?: string | null) => {
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
    handleInputBlur
  } = usePacienteSearch();
  
  const { professional: profissionalAtual, isLoadingProfessional } = useProfessionalData();
  
  const { 
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
  } = useFormData();
  
  const { isProcessingAI, processAIContent } = useAIProcessing();
  
  // Hook para persistência localStorage
  const { hasLocalData, getLocalStorageKey } = useLocalStoragePersistence({
    pacienteSelecionado: pacienteSelecionado as any,
    form,
    setFormData
  });
  
  const { 
    isSaving, 
    isGeneratingPDF,
    isSubmittingRecord,
    handleSalvarAtendimento, 
    handleGerarPDF,
    handleSubmitMedicalRecord
  } = useSaveActions({
    pacienteSelecionado: pacienteSelecionado as any,
    profissionalAtual,
    form,
    examModels,
    resetForm, // Passando a função resetForm para o hook
    selectedModelTitle
  });

  // Use our new helper hook to handle AI content processing
  const { processAIContent: processAIContentHelper } = useAtendimentoHelpers({
    processAI: processAIContent,
    updateFormField
  });

  return {
    activeTab,
    setActiveTab,
    buscarPaciente,
    pacienteSelecionado,
    mostrarResultadosBusca,
    profissionalAtual,
    isProcessingAI: {
      mainComplaint: isProcessingAI.mainComplaint,
      evolution: false,
      examResults: false
    },
    form,
    prescriptionModels,
    isLoadingPrescriptions,
    examModels,
    isLoadingExams,
    filteredPacientes,
    isSearchingPacientes,
    isSaving,
    isGeneratingPDF,
    isSubmittingRecord,
    handleChange,
    handlePacienteSearch,
    handleSelectPaciente,
    handleClearPaciente,
    handleInputFocus,
    handleInputBlur,
    handleModeloPrescricaoChange,
    handleExamesChange,
    processAIContent: processAIContentHelper,
    handleSalvarAtendimento,
    handleGerarPDF,
    handleSubmitMedicalRecord,
    updateFormField,
    setFormData,
    resetForm,
    hasLocalData,
    getLocalStorageKey
  };
};
