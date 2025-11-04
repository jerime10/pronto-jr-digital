
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, Save, Eraser, Loader2 } from 'lucide-react';
import { FormState } from '../hooks/useFormData';
import { FieldAutocompleteMulti } from '@/components/ui/field-autocomplete-multi';
import { useIndividualFieldTemplates } from '@/hooks/useIndividualFieldTemplates';
import { toast } from '@/hooks/use-toast';

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
  const { searchFieldTemplates, saveFieldTemplate, deleteFieldTemplate } = useIndividualFieldTemplates();
  const [isSavingEvolucao, setIsSavingEvolucao] = useState(false);

  // Salvar Evolução
  const handleSaveEvolucao = async () => {
    if (!form.evolucao.trim()) return;
    setIsSavingEvolucao(true);
    try {
      await saveFieldTemplate({
        fieldKey: 'evolucao',
        fieldLabel: 'Evolução do Paciente',
        fieldContent: form.evolucao,
        modelName: 'ATENDIMENTO'
      });
    } finally {
      setIsSavingEvolucao(false);
    }
  };

  // Limpar Evolução
  const handleClearEvolucao = () => {
    onFieldChange('evolucao', '');
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Evolução do Paciente
                <span className="text-xs text-muted-foreground ml-2">
                  (Digite para ver sugestões salvas. Clique no lixeira 🗑️ para excluir)
                </span>
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveEvolucao}
                  disabled={!form.evolucao.trim() || isSavingEvolucao}
                  title="Salvar conteúdo do campo"
                >
                  {isSavingEvolucao ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearEvolucao}
                  disabled={!form.evolucao.trim()}
                  title="Limpar campo"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <FieldAutocompleteMulti
              selectedValues={Array.isArray(form.evolucao) ? form.evolucao : form.evolucao ? [form.evolucao] : []}
              onChange={(values) => onFieldChange('evolucao', values.join('\n\n... ... ...\n\n'))}
              onSearch={(searchTerm) => searchFieldTemplates('evolucao', searchTerm, 'ATENDIMENTO')}
              placeholder="Digite para buscar e selecionar múltiplas evoluções..."
              fieldName="evolucao"
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvolucaoTab;
