import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { FormState } from '../hooks/useFormData';
import { FieldAutocomplete } from '@/components/ui/field-autocomplete';
import { useIndividualFieldTemplates } from '@/hooks/useIndividualFieldTemplates';

interface EvolucaoTabProps {
  form: FormState;
  onFieldChange: (field: keyof FormState, value: any) => void;
  onProcessAI: (field: 'mainComplaint' | 'evolution' | 'examResults') => void;
  isProcessingAI: {
    mainComplaint: boolean;
    evolution: boolean;
    examResults: boolean;
  };
}

const EvolucaoTab: React.FC<EvolucaoTabProps> = ({
  form,
  onFieldChange,
  onProcessAI,
  isProcessingAI
}) => {
  const { searchFieldTemplates } = useIndividualFieldTemplates();

  const handleSearchEvolution = async (searchTerm: string) => {
    return await searchFieldTemplates('evolution', searchTerm, 'GERAL');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Evolução do Paciente
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onProcessAI('evolution')}
              disabled={isProcessingAI.evolution || !form.evolucao.trim()}
              className="ml-auto"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              {isProcessingAI.evolution ? 'Processando...' : 'Melhorar com IA'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldAutocomplete
            value={form.evolucao}
            onChange={(value) => onFieldChange('evolucao', value)}
            onSearch={handleSearchEvolution}
            placeholder="Descreva a evolução do quadro clínico do paciente..."
            type="textarea"
            className="w-full min-h-[150px]"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EvolucaoTab;
