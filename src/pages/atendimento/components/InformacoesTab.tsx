
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, Save, Eraser, Loader2 } from 'lucide-react';
import { FormState } from '../hooks/useFormData';
import { FieldAutocomplete } from '@/components/ui/field-autocomplete';
import { useIndividualFieldTemplates } from '@/hooks/useIndividualFieldTemplates';

interface InformacoesTabProps {
  form: FormState;
  onFieldChange: (field: keyof FormState, value: any) => void;
  onProcessAI: (field: 'mainComplaint' | 'evolution' | 'examResults') => void;
  isProcessingAI: {
    mainComplaint: boolean;
    evolution: boolean;
    examResults: boolean;
  };
}

const InformacoesTab: React.FC<InformacoesTabProps> = ({
  form,
  onFieldChange,
  onProcessAI,
  isProcessingAI
}) => {
  const { searchFieldTemplates, saveFieldTemplate, deleteFieldTemplate } = useIndividualFieldTemplates();
  
  const [isSavingQueixa, setIsSavingQueixa] = useState(false);
  const [isSavingAntecedentes, setIsSavingAntecedentes] = useState(false);
  const [isSavingAlergias, setIsSavingAlergias] = useState(false);

  // Salvar Queixa Principal
  const handleSaveQueixa = async () => {
    if (!form.queixaPrincipal.trim()) return;
    setIsSavingQueixa(true);
    try {
      await saveFieldTemplate({
        fieldKey: 'queixa_principal',
        fieldLabel: 'Queixa Principal',
        fieldContent: form.queixaPrincipal,
        modelName: 'ATENDIMENTO'
      });
    } finally {
      setIsSavingQueixa(false);
    }
  };

  // Limpar Queixa Principal
  const handleClearQueixa = () => {
    onFieldChange('queixaPrincipal', '');
  };

  // Salvar Antecedentes
  const handleSaveAntecedentes = async () => {
    if (!form.antecedentes.trim()) return;
    setIsSavingAntecedentes(true);
    try {
      await saveFieldTemplate({
        fieldKey: 'antecedentes',
        fieldLabel: 'Antecedentes',
        fieldContent: form.antecedentes,
        modelName: 'ATENDIMENTO'
      });
    } finally {
      setIsSavingAntecedentes(false);
    }
  };

  // Limpar Antecedentes
  const handleClearAntecedentes = () => {
    onFieldChange('antecedentes', '');
  };

  // Salvar Alergias
  const handleSaveAlergias = async () => {
    if (!form.alergias.trim()) return;
    setIsSavingAlergias(true);
    try {
      await saveFieldTemplate({
        fieldKey: 'alergias',
        fieldLabel: 'Alergias',
        fieldContent: form.alergias,
        modelName: 'ATENDIMENTO'
      });
    } finally {
      setIsSavingAlergias(false);
    }
  };

  // Limpar Alergias
  const handleClearAlergias = () => {
    onFieldChange('alergias', '');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Queixa Principal
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onProcessAI('mainComplaint')}
              disabled={isProcessingAI.mainComplaint || !form.queixaPrincipal.trim()}
              className="ml-auto"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              {isProcessingAI.mainComplaint ? 'Processando...' : 'Melhorar com IA'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Queixa Principal</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveQueixa}
                  disabled={!form.queixaPrincipal.trim() || isSavingQueixa}
                  title="Salvar conteúdo do campo"
                >
                  {isSavingQueixa ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearQueixa}
                  disabled={!form.queixaPrincipal.trim()}
                  title="Limpar campo"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <FieldAutocomplete
              value={form.queixaPrincipal}
              onChange={(value) => onFieldChange('queixaPrincipal', value)}
              onSearch={(searchTerm) => searchFieldTemplates('queixa_principal', searchTerm, 'ATENDIMENTO')}
              onDelete={deleteFieldTemplate}
              placeholder="Descreva a queixa principal do paciente..."
              type="textarea"
              className="w-full min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Antecedentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Antecedentes</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveAntecedentes}
                  disabled={!form.antecedentes.trim() || isSavingAntecedentes}
                  title="Salvar conteúdo do campo"
                >
                  {isSavingAntecedentes ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAntecedentes}
                  disabled={!form.antecedentes.trim()}
                  title="Limpar campo"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <FieldAutocomplete
              value={form.antecedentes}
              onChange={(value) => onFieldChange('antecedentes', value)}
              onSearch={(searchTerm) => searchFieldTemplates('antecedentes', searchTerm, 'ATENDIMENTO')}
              onDelete={deleteFieldTemplate}
              placeholder="Descreva o histórico médico e antecedentes relevantes do paciente..."
              type="textarea"
              className="w-full min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alergias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Alergias</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveAlergias}
                  disabled={!form.alergias.trim() || isSavingAlergias}
                  title="Salvar conteúdo do campo"
                >
                  {isSavingAlergias ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAlergias}
                  disabled={!form.alergias.trim()}
                  title="Limpar campo"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <FieldAutocomplete
              value={form.alergias}
              onChange={(value) => onFieldChange('alergias', value)}
              onSearch={(searchTerm) => searchFieldTemplates('alergias', searchTerm, 'ATENDIMENTO')}
              onDelete={deleteFieldTemplate}
              placeholder="Liste as alergias conhecidas do paciente..."
              type="textarea"
              className="w-full min-h-[100px]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InformacoesTab;
