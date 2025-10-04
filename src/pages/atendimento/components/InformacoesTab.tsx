import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
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
  const { searchFieldTemplates } = useIndividualFieldTemplates();

  const handleSearchMainComplaint = async (searchTerm: string) => {
    return await searchFieldTemplates('main_complaint', searchTerm, 'GERAL');
  };

  const handleSearchHistory = async (searchTerm: string) => {
    return await searchFieldTemplates('history', searchTerm, 'GERAL');
  };

  const handleSearchAllergies = async (searchTerm: string) => {
    return await searchFieldTemplates('allergies', searchTerm, 'GERAL');
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
          <FieldAutocomplete
            value={form.queixaPrincipal}
            onChange={(value) => onFieldChange('queixaPrincipal', value)}
            onSearch={handleSearchMainComplaint}
            placeholder="Descreva a queixa principal do paciente..."
            type="textarea"
            className="w-full min-h-[100px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Antecedentes</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldAutocomplete
            value={form.antecedentes}
            onChange={(value) => onFieldChange('antecedentes', value)}
            onSearch={handleSearchHistory}
            placeholder="Descreva os antecedentes médicos do paciente..."
            type="textarea"
            className="w-full min-h-[100px]"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alergias</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldAutocomplete
            value={form.alergias}
            onChange={(value) => onFieldChange('alergias', value)}
            onSearch={handleSearchAllergies}
            placeholder="Liste as alergias conhecidas do paciente..."
            type="textarea"
            className="w-full min-h-[75px]"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default InformacoesTab;
