
import React from 'react';
import { AtendimentoHeader } from './AtendimentoHeader';
import PacienteBusca from './PacienteBusca';
import { AtendimentoTabs } from './AtendimentoTabs';
import { TabValue } from '../types';
import { FormState } from '../hooks/useFormData';
import { Button } from '@/components/ui/button';
import { Save, FileText, Send, MoreVertical, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface Patient {
  id: string;
  name: string;
  sus: string;
  phone: string;
  address: string;
  date_of_birth: string | null;
  age: number | null;
  gender: string | null;
  bairro: string | null;
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
  setMostrarResultadosBusca: (mostrar: boolean) => void;
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
  handleModelosPrescricaoChange: (modelosIds: string[]) => void;
  updateFormField: (fieldName: keyof FormState, value: any) => void;
  handleSalvarAtendimento: () => Promise<any>;
  handleSubmitMedicalRecord: () => Promise<void>;
  profissionalAtual: Professional | null;
  setFormData: (formData: FormState) => void;
  onSelectedModelChange?: (modelTitle: string | null) => void;
  onDynamicFieldsChange?: (fields: Record<string, string>) => void;
  dynamicFields?: Record<string, string>;
  updateDynamicFieldsFromAI?: (fields: Record<string, string>) => void;
  selectedExamModelId?: string;
  onExamModelChange?: (modelId: string) => void;
}

export const AtendimentoLayout: React.FC<AtendimentoLayoutProps> = ({
  isEditing,
  isSaving,
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
        setMostrarResultadosBusca,
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
  handleModelosPrescricaoChange,
  updateFormField,
  handleSalvarAtendimento,
  handleSubmitMedicalRecord,
  profissionalAtual,
  setFormData,
  onSelectedModelChange,
  onDynamicFieldsChange,
  dynamicFields,
  updateDynamicFieldsFromAI,
  selectedExamModelId,
  onExamModelChange
}) => {
  const isMobile = useIsMobile();

  // Bridge function para lidar com a mudança de campo
  const handleFieldChange = React.useCallback((fieldName: keyof FormState, value: any) => {
    updateFormField(fieldName, value);
  }, [updateFormField]);

  // Bridge function para processar AI
  const handleProcessAI = React.useCallback(async (field: string, content: string, providedDynamicFields?: Record<string, string>) => {
    await processAIContent(field, content, providedDynamicFields);
  }, [processAIContent]);

  return (
    <div className={cn(
      "h-[calc(100vh-64px)] flex flex-col overflow-hidden relative",
      isMobile ? "bg-slate-50" : "bg-[#f8fafc]"
    )}>
      <AtendimentoHeader
        isEditing={isEditing}
        isSaving={isSaving}
        isSubmittingRecord={isSubmittingRecord}
        pacienteSelecionado={pacienteSelecionado}
        profissionalAtual={profissionalAtual}
        form={form}
        setFormData={setFormData}
        handleSelectPaciente={handleSelectPaciente}
        handleSalvarAtendimento={handleSalvarAtendimento}
        handleSubmitMedicalRecord={handleSubmitMedicalRecord}
        dynamicFields={dynamicFields}
        onDynamicFieldsChange={onDynamicFieldsChange}
      />

      <div className={cn(
        "flex-1 overflow-y-auto custom-scrollbar transition-all",
        isMobile ? "px-4 py-6 pb-40 space-y-6" : "px-4 md:px-12 py-8 pb-32 md:pb-12 space-y-12 animate-in fade-in duration-700"
      )}>
        <div className={cn("max-w-[1600px] mx-auto", isMobile ? "space-y-6" : "space-y-12")}>
          <section className={cn(
            "transition-all",
            isMobile 
              ? "" // Estilo customizado dentro do PacienteBusca para mobile
              : "bg-white rounded-[2.5rem] border border-slate-200/50 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-slate-200/30"
          )}>
            <div className={cn(
              isMobile ? "" : "p-2 md:p-4 bg-gradient-to-br from-slate-50 to-white"
            )}>
              <PacienteBusca
                buscarPaciente={buscarPaciente}
                onBuscarPacienteChange={handlePacienteSearch}
                pacienteSelecionado={pacienteSelecionado}
                onSelectPaciente={handleSelectPaciente}
                onClearPaciente={handleClearPaciente}
                onInputFocus={handleInputFocus}
                onInputBlur={handleInputBlur}
                setMostrarResultadosBusca={setMostrarResultadosBusca}
                filteredPacientes={filteredPacientes}
                isSearchingPacientes={isSearchingPacientes}
                mostrarResultadosBusca={mostrarResultadosBusca}
                startDateTime={form.dataInicioAtendimento}
                endDateTime={form.dataFimAtendimento}
                onStartDateTimeChange={(date) => handleFieldChange('dataInicioAtendimento', date)}
                onEndDateTimeChange={(date) => handleFieldChange('dataFimAtendimento', date)}
              />
            </div>
          </section>

          {pacienteSelecionado && (
            <div className={cn(
              "animate-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both",
              isMobile ? "space-y-6" : ""
            )}>
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
                handleModelosPrescricaoChange={handleModelosPrescricaoChange}
                updateFormField={handleFieldChange}
                onSelectedModelChange={onSelectedModelChange}
                patientId={pacienteSelecionado.id}
                onDynamicFieldsChange={onDynamicFieldsChange}
                dynamicFields={dynamicFields}
                updateDynamicFieldsFromAI={updateDynamicFieldsFromAI}
                selectedExamModelId={selectedExamModelId}
                onExamModelChange={onExamModelChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Barra de Ações Mobile (Rodapé Fixo como no modelo) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[110] bg-white border-t border-slate-200">
        <div className="p-4">
          <div className="flex gap-3">
            <Button
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white rounded-xl h-14 font-bold text-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              onClick={handleSubmitMedicalRecord}
              disabled={isSubmittingRecord || !pacienteSelecionado}
            >
              {isSubmittingRecord ? 'Finalizando...' : 'Finalizar Atendimento'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
