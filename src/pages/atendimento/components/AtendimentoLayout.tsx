
import React from 'react';
import { AtendimentoHeader } from './AtendimentoHeader';
import PacienteBusca from './PacienteBusca';
import { AtendimentoTabs } from './AtendimentoTabs';
import { TabValue } from '../types';
import { FormState } from '../hooks/useFormData';
import { Button } from '@/components/ui/button';
import { Save, FileText, Send, MoreVertical, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  // Bridge function para lidar com a mudança de campo
  const handleFieldChange = React.useCallback((fieldName: keyof FormState, value: any) => {
    updateFormField(fieldName, value);
  }, [updateFormField]);

  // Bridge function para processar AI
  const handleProcessAI = React.useCallback(async (field: string, content: string, providedDynamicFields?: Record<string, string>) => {
    await processAIContent(field, content, providedDynamicFields);
  }, [processAIContent]);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#f8fafc] overflow-hidden relative">
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

      <div className="flex-1 overflow-y-auto px-4 md:px-12 py-8 pb-32 md:pb-12 space-y-12 animate-in fade-in duration-700 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-12">
          <section className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-xl shadow-slate-200/20 transition-all hover:shadow-2xl hover:shadow-slate-200/30">
            <div className="p-2 md:p-4 bg-gradient-to-br from-slate-50 to-white">
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
            <div className="animate-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
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

      {/* Barra de Ações Mobile (Design Ultra-Moderno) */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-[110] animate-in slide-in-from-bottom-20 duration-700 delay-300 fill-mode-both">
        <div className="bg-slate-900/95 backdrop-blur-2xl rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1 shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/10 rounded-xl h-10 w-10 transition-all active:scale-90"
              onClick={handleSalvarAtendimento}
              disabled={isSaving || !pacienteSelecionado}
            >
              <Save className="h-5 w-5" />
            </Button>
          </div>

          <Button
            size="default"
            onClick={handleSubmitMedicalRecord}
            disabled={isSubmittingRecord || !pacienteSelecionado}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl h-10 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all truncate"
          >
            {isSubmittingRecord ? '...' : 'Finalizar Atendimento'}
          </Button>

          <div className="shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="text-white hover:bg-white/10 rounded-xl h-10 w-10">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="bg-slate-900 border-white/10 text-white rounded-xl p-2 mb-4 min-w-[180px] shadow-2xl">
                <DropdownMenuItem className="focus:bg-white/10 rounded-lg py-3 px-3 cursor-pointer font-bold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Ver Rascunhos
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-white/10 rounded-lg py-3 px-3 cursor-pointer font-bold text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-400" />
                  Configurações
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};
