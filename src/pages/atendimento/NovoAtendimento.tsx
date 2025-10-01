
import * as React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAtendimentoState } from './hooks/useAtendimentoState';
import { useAtendimentoRecord } from './hooks/useAtendimentoRecord';
import { AtendimentoLayout } from './components/AtendimentoLayout';
import { TabValue } from './types';
import { FormState } from './hooks/useFormData';

const NovoAtendimento = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!id;
  const [selectedModelTitle, setSelectedModelTitle] = React.useState<string | null>(null);
  const [dynamicFields, setDynamicFields] = React.useState<Record<string, string>>({});
  
  // Função para atualizar campos dinâmicos vindos da IA
  const updateDynamicFieldsFromAI = React.useCallback((fields: Record<string, string>) => {
    console.log('🎯 [NovoAtendimento] updateDynamicFieldsFromAI chamado com:', fields);
    setDynamicFields(prevFields => ({ ...prevFields, ...fields }));
  }, []);
  
  // Handler para capturar os campos dinâmicos
  const handleDynamicFieldsChange = React.useCallback((fields: Record<string, string>) => {
    console.log('🎯 [NovoAtendimento] handleDynamicFieldsChange chamado com:', fields);
    setDynamicFields(fields);
  }, []);
  
  // Função para validar se o paciente tem dados válidos
  const isValidPatient = (patient: any): boolean => {
    if (!patient) {
      return false;
    }
    
    if (!patient.id) {
      return false;
    }
    
    // Aceitar tanto UUIDs quanto IDs temporários
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(patient.id);
    const isTempId = patient.id.toString().startsWith('temp-');
    
    if (!isUUID && !isTempId) {
      return false;
    }
    
    if (!patient.name || patient.name.trim() === '') {
      return false;
    }
    
    return true;
  };

  // Receber dados do paciente e appointment_id via navegação (quando vem do agendamento)
  const rawPatientDataFromNavigation = location.state?.rawPatientDataFromNavigation;
  const appointmentIdFromNavigation = location.state?.appointmentIdFromNavigation;
  
  // Validar dados do paciente antes de usar
  const patientDataFromNavigation = rawPatientDataFromNavigation && isValidPatient(rawPatientDataFromNavigation) 
    ? rawPatientDataFromNavigation 
    : null;
  
  const {
    existingRecord,
    isLoadingRecord,
    setGlobalActiveTab
  } = useAtendimentoRecord(id, isEditing);
  
  const {
    activeTab,
    setActiveTab,
    buscarPaciente,
    pacienteSelecionado,
    mostrarResultadosBusca,
    profissionalAtual,
    isProcessingAI,
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
    handleSelectPaciente,
    handleClearPaciente,
    handleInputFocus,
    handleInputBlur,
    handleModeloPrescricaoChange,
    handleExamesChange,
    processAIContent,
    handleSalvarAtendimento,
    handleSubmitMedicalRecord,
    updateFormField,
    setFormData
  } = useAtendimentoState(selectedModelTitle, patientDataFromNavigation, appointmentIdFromNavigation, dynamicFields, handleDynamicFieldsChange, updateDynamicFieldsFromAI);
  
  // Create a proper change handler for form inputs
  const handleFormChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateFormField(name as keyof FormState, value);
  }, [updateFormField]);
  
  // Populate form data when editing an existing record
  React.useEffect(() => {
    if (existingRecord && isEditing) {
      setFormData({
        queixaPrincipal: existingRecord.main_complaint || '',
        antecedentes: existingRecord.history || '',
        alergias: existingRecord.allergies || '',
        evolucao: existingRecord.evolution || '',
        modeloPrescricao: existingRecord.prescription_model_id || '',
        prescricaoPersonalizada: existingRecord.custom_prescription || '',
        examesSelecionados: Array.isArray(existingRecord.exam_requests) 
          ? existingRecord.exam_requests.map(item => String(item))
          : [],
        observacoesExames: existingRecord.exam_observations || '',
        resultadoExames: existingRecord.exam_results || '',
        images: [], // Para registros existentes, inicia sem imagens (funcionalidade nova)
        dataInicioAtendimento: existingRecord.attendance_start_at ? new Date(existingRecord.attendance_start_at) : new Date(),
        dataFimAtendimento: existingRecord.attendance_end_at ? new Date(existingRecord.attendance_end_at) : undefined,
      });
      
      if (existingRecord.paciente) {
        handleSelectPaciente({
          id: existingRecord.patient_id,
          name: existingRecord.paciente.name,
          sus: existingRecord.paciente.sus,
          phone: existingRecord.paciente.phone || '',
          // Add other required fields with default values
          age: 0,
          gender: '',
          address: '',
          created_at: '',
          updated_at: '',
          date_of_birth: null,
        });
      }
      
      // Sync this component's tab state with the global tab state
      setGlobalActiveTab(activeTab);
    }
  }, [existingRecord, isEditing, setFormData, handleSelectPaciente]);
  
  // Update global tab state when this component's tab changes
  React.useEffect(() => {
    setGlobalActiveTab(activeTab);
  }, [activeTab, setGlobalActiveTab]);
  
  if (isEditing && isLoadingRecord) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <AtendimentoLayout
      isEditing={isEditing}
      isSaving={isSaving}
      isGeneratingPDF={false}
      isSubmittingRecord={isSubmittingRecord}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      buscarPaciente={buscarPaciente}
      handlePacienteSearch={handlePacienteSearch}
      pacienteSelecionado={pacienteSelecionado}
      handleSelectPaciente={handleSelectPaciente}
      handleClearPaciente={handleClearPaciente}
      handleInputFocus={handleInputFocus}
      handleInputBlur={handleInputBlur}
      filteredPacientes={filteredPacientes}
      isSearchingPacientes={isSearchingPacientes}
      mostrarResultadosBusca={mostrarResultadosBusca}
      form={form}
      handleChange={handleFormChange}
      isProcessingAI={isProcessingAI}
      processAIContent={processAIContent}
      prescriptionModels={prescriptionModels}
      isLoadingPrescriptions={isLoadingPrescriptions}
      handleModeloPrescricaoChange={handleModeloPrescricaoChange}
      updateFormField={updateFormField}
      handleSalvarAtendimento={handleSalvarAtendimento}
      handleGerarPDF={() => Promise.resolve()}
      handleSubmitMedicalRecord={handleSubmitMedicalRecord}
      profissionalAtual={profissionalAtual}
      setFormData={setFormData}
      onSelectedModelChange={setSelectedModelTitle}
      onDynamicFieldsChange={handleDynamicFieldsChange}
      dynamicFields={dynamicFields}
      updateDynamicFieldsFromAI={updateDynamicFieldsFromAI}
    />
  );
};

export default NovoAtendimento;
