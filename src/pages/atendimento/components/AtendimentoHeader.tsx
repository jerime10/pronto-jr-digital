
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, FileText, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DraftManager } from './DraftManager';
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

interface AtendimentoHeaderProps {
  isEditing: boolean;
  isSaving: boolean;
  isSubmittingRecord: boolean;
  pacienteSelecionado: Patient | null;
  profissionalAtual: { id: string; nome: string } | null;
  form: FormState;
  setFormData: (formData: FormState) => void;
  handleSelectPaciente: (patient: Patient) => void;
  handleSalvarAtendimento: () => Promise<any>;
  handleSubmitMedicalRecord: () => Promise<void>;
  dynamicFields?: Record<string, string>;
  onDynamicFieldsChange?: (fields: Record<string, string>) => void;
}

export const AtendimentoHeader: React.FC<AtendimentoHeaderProps> = ({
  isEditing,
  isSaving,
  isSubmittingRecord,
  pacienteSelecionado,
  profissionalAtual,
  form,
  setFormData,
  handleSelectPaciente,
  handleSalvarAtendimento,
  handleSubmitMedicalRecord,
  dynamicFields = {},
  onDynamicFieldsChange
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 z-[100] shadow-sm shrink-0 transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1800px] mx-auto">
        <div className="flex items-center space-x-4 md:space-x-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/historico')}
            className="flex items-center space-x-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all active:scale-95 shrink-0 px-3 h-10"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold hidden sm:inline">Voltar</span>
          </Button>
          
          <div className="border-l-2 border-slate-100 pl-4 md:pl-8 py-1">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">
              {isEditing ? 'Editar Atendimento' : 'Novo Atendimento'}
            </h1>
            {pacienteSelecionado && (
              <div className="flex items-center space-x-3 mt-1.5 animate-in fade-in slide-in-from-left-4 duration-500">
                <span className="text-sm md:text-base font-bold text-emerald-600 tracking-tight">
                  {pacienteSelecionado.name}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                  SUS: {pacienteSelecionado.sus}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Ações Desktop */}
        <div className="hidden md:flex items-center space-x-2">
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
            <DraftManager
              pacienteSelecionado={pacienteSelecionado}
              profissionalAtual={profissionalAtual}
              form={form}
              setFormData={setFormData}
              handleSelectPaciente={handleSelectPaciente}
              dynamicFields={dynamicFields}
              onDynamicFieldsChange={onDynamicFieldsChange}
            />
          </div>

          <div className="h-8 w-px bg-slate-200 mx-1" />

          <div className="flex items-center space-x-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleSalvarAtendimento}
              disabled={isSaving || !pacienteSelecionado}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 h-9 shadow-md transition-all active:scale-95 disabled:opacity-50 font-bold text-xs"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden lg:inline">{isSaving ? 'Salvando...' : 'Salvar'}</span>
              <span className="lg:hidden">{isSaving ? '...' : 'Salvar'}</span>
            </Button>

            <Button
              size="sm"
              onClick={handleSubmitMedicalRecord}
              disabled={isSubmittingRecord || !pacienteSelecionado}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-5 h-9 shadow-md shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 font-black tracking-tight text-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden xl:inline">{isSubmittingRecord ? 'Processando...' : 'Finalizar Atendimento'}</span>
              <span className="xl:hidden">{isSubmittingRecord ? '...' : 'Finalizar'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
