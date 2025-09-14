
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
  isGeneratingPDF: boolean;
  isSubmittingRecord: boolean;
  pacienteSelecionado: Patient | null;
  profissionalAtual: { id: string; nome: string } | null;
  form: FormState;
  setFormData: (formData: FormState) => void;
  handleSelectPaciente: (patient: Patient) => void;
  handleSalvarAtendimento: () => Promise<any>;
  handleGerarPDF: () => Promise<void>;
  handleSubmitMedicalRecord: () => Promise<void>;
}

export const AtendimentoHeader: React.FC<AtendimentoHeaderProps> = ({
  isEditing,
  isSaving,
  isGeneratingPDF,
  isSubmittingRecord,
  pacienteSelecionado,
  profissionalAtual,
  form,
  setFormData,
  handleSelectPaciente,
  handleSalvarAtendimento,
  handleGerarPDF,
  handleSubmitMedicalRecord,
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/historico')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Button>
          
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              {isEditing ? 'Editar Atendimento' : 'Novo Atendimento'}
            </h1>
            {pacienteSelecionado && (
              <p className="text-sm text-gray-600">
                Paciente: {pacienteSelecionado.name} • SUS: {pacienteSelecionado.sus}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Gerenciador de Rascunhos */}
          <DraftManager
            pacienteSelecionado={pacienteSelecionado}
            profissionalAtual={profissionalAtual}
            form={form}
            setFormData={setFormData}
            handleSelectPaciente={handleSelectPaciente}
          />

          {/* Botões de ação existentes */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSalvarAtendimento}
            disabled={isSaving || !pacienteSelecionado}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGerarPDF}
            disabled={isGeneratingPDF || !pacienteSelecionado}
            className="flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>{isGeneratingPDF ? 'Gerando...' : 'Gerar PDF'}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSubmitMedicalRecord}
            disabled={isSubmittingRecord || !pacienteSelecionado}
            className="flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmittingRecord ? 'Enviando...' : 'Finalizar Atendimento'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
