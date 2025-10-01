
import React from 'react';
import { AtendimentoHeader } from './AtendimentoHeader';
import PacienteBusca from './PacienteBusca';
import { AtendimentoTabs } from './AtendimentoTabs';
import { TabValue } from '../types';
import { FormState } from '../hooks/useFormData';

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

interface Professional {
  id: string;
  nome: string;
}

interface AtendimentoLayoutProps {
  isEditing: boolean;
  isSaving: boolean;
  isGeneratingPDF: boolean;
  isSubmittingRecord: boolean;
  activeTab: TabValue;
  setActiveTab: (tab: TabValue) => void;
  buscarPaciente: string;
  handlePacienteSearch: (value: string) => void;
  pacienteSelecionado: Patient | null;
  handleSelectPaciente: (patient: Patient) => void;
  handleClearPaciente: () => void;
  handleInputFocus: () => void;
  handleInputBlur: () => void;
  filteredPacientes: Patient[];
  isSearchingPacientes: boolean;
  mostrarResultadosBusca: boolean;
  form: FormState;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isProcessingAI: {
    mainComplaint: boolean;
    evolution: boolean;
    examResults: boolean;
  };
  processAIContent: (field: string, content: string, dynamicFields?: Record<string, string>) => Promise<void>;
  prescriptionModels: any[];
  isLoadingPrescriptions: boolean;
  handleModeloPrescricaoChange: (modeloId: string) => void;
  updateFormField: (fieldName: keyof FormState, value: any) => void;
  handleSalvarAtendimento: () => Promise<any>;
  handleGerarPDF: () => Promise<void>;
  handleSubmitMedicalRecord: () => Promise<void>;
  profissionalAtual: Professional | null;
  setFormData: (formData: FormState) => void;
  onSelectedModelChange?: (modelTitle: string | null) => void;
  onDynamicFieldsChange?: (fields: Record<string, string>) => void;
  dynamicFields?: Record<string, string>;
  updateDynamicFieldsFromAI?: (fields: Record<string, string>) => void;
}

export const AtendimentoLayout: React.FC<AtendimentoLayoutProps> = ({
  isEditing,
  isSaving,
  isGeneratingPDF,
  isSubmittingRecord,
  activeTab,
  setActiveTab,
  buscarPaciente,
  handlePacienteSearch,
  pacienteSelecionado,
  handleSelectPaciente,
  handleClearPaciente,
  handleInputFocus,
  handleInputBlur,
  filteredPacientes,
  isSearchingPacientes,
  mostrarResultadosBusca,
  form,
  handleChange,
  isProcessingAI,
  processAIContent,
  prescriptionModels,
  isLoadingPrescriptions,
  handleModeloPrescricaoChange,
  updateFormField,
  handleSalvarAtendimento,
  handleGerarPDF,
  handleSubmitMedicalRecord,
  profissionalAtual,
  setFormData,
  onSelectedModelChange,
  onDynamicFieldsChange,
  dynamicFields,
  updateDynamicFieldsFromAI
}) => {
  // Bridge function para lidar com a mudança de campo
  const handleFieldChange = React.useCallback((fieldName: keyof FormState, value: any) => {
    updateFormField(fieldName, value);
  }, [updateFormField]);

  // Bridge function para processar AI
  const handleProcessAI = React.useCallback(async (field: string, content: string, providedDynamicFields?: Record<string, string>) => {
    await processAIContent(field, content, providedDynamicFields);
  }, [processAIContent]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AtendimentoHeader
        isEditing={isEditing}
        isSaving={isSaving}
        isGeneratingPDF={isGeneratingPDF}
        isSubmittingRecord={isSubmittingRecord}
        pacienteSelecionado={pacienteSelecionado}
        profissionalAtual={profissionalAtual}
        form={form}
        setFormData={setFormData}
        handleSelectPaciente={handleSelectPaciente}
        handleSalvarAtendimento={handleSalvarAtendimento}
        handleGerarPDF={handleGerarPDF}
        handleSubmitMedicalRecord={handleSubmitMedicalRecord}
        dynamicFields={dynamicFields}
        onDynamicFieldsChange={onDynamicFieldsChange}
      />

      <div className="container mx-auto px-6 py-6 space-y-6">
        <PacienteBusca
          buscarPaciente={buscarPaciente}
          onBuscarPacienteChange={handlePacienteSearch}
          pacienteSelecionado={pacienteSelecionado}
          onSelectPaciente={handleSelectPaciente}
          onClearPaciente={handleClearPaciente}
          onInputFocus={handleInputFocus}
          onInputBlur={handleInputBlur}
          filteredPacientes={filteredPacientes}
          isSearchingPacientes={isSearchingPacientes}
          mostrarResultadosBusca={mostrarResultadosBusca}
          startDateTime={form.dataInicioAtendimento}
          endDateTime={form.dataFimAtendimento}
          onStartDateTimeChange={(date) => handleFieldChange('dataInicioAtendimento', date)}
          onEndDateTimeChange={(date) => handleFieldChange('dataFimAtendimento', date)}
        />

        {pacienteSelecionado && (
          <AtendimentoTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            form={form}
            handleChange={handleChange}
            isProcessingAI={isProcessingAI}
            processAIContent={handleProcessAI}
            prescriptionModels={prescriptionModels}
            isLoadingPrescriptions={isLoadingPrescriptions}
            handleModeloPrescricaoChange={handleModeloPrescricaoChange}
            updateFormField={handleFieldChange}
            onSelectedModelChange={onSelectedModelChange}
            patientId={pacienteSelecionado.id}
            onDynamicFieldsChange={onDynamicFieldsChange}
            dynamicFields={dynamicFields}
            updateDynamicFieldsFromAI={updateDynamicFieldsFromAI}
          />
        )}
      </div>
    </div>
  );
};
