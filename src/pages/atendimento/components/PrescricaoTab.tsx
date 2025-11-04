
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MultiSelectSearch } from '@/components/ui/multi-select-search';
import { FormState } from '../hooks/useFormData';

interface PrescricaoTabProps {
  form: FormState;
  prescriptionModels: Array<{ id: string; name: string; description: string }>;
  isLoadingPrescriptions: boolean;
  onFieldChange: (field: keyof FormState, value: any) => void;
  onModelChange: (modelId: string) => void;
  onMultiModelChange?: (modelosIds: string[]) => void;
}

const PrescricaoTab: React.FC<PrescricaoTabProps> = ({
  form,
  prescriptionModels,
  isLoadingPrescriptions,
  onFieldChange,
  onModelChange,
  onMultiModelChange
}) => {
  // Handler para multisseleção de modelos
  const handleModelosPrescricaoChange = (selectedIds: string[]) => {
    // Usar o handler externo se disponível, senão usar o handler local
    if (onMultiModelChange) {
      onMultiModelChange(selectedIds);
    } else {
      // Fallback para o comportamento local
      onFieldChange('modelosPrescricaoSelecionados', selectedIds);
      
      // Concatenar as descrições dos modelos selecionados
      const selectedModels = prescriptionModels.filter(model => 
        selectedIds.includes(model.id)
      );
      
      const concatenatedDescriptions = selectedModels
        .map(model => model.description)
        .join('\n\n... ... ...\n\n');
      
      // Atualizar a prescrição personalizada com as descrições concatenadas
      onFieldChange('prescricaoPersonalizada', concatenatedDescriptions);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Modelos de Prescrição</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="modelos-prescricao">Selecionar Modelos</Label>
              <MultiSelectSearch
                options={prescriptionModels}
                selectedValues={form.modelosPrescricaoSelecionados || []}
                onSelectionChange={handleModelosPrescricaoChange}
                placeholder="Digite para buscar e selecionar modelos..."
                disabled={isLoadingPrescriptions}
                className="w-full"
                tableName="prescription_models"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prescrição Personalizada</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.prescricaoPersonalizada}
            onChange={(e) => onFieldChange('prescricaoPersonalizada', e.target.value)}
            placeholder="Digite a prescrição personalizada..."
            rows={8}
            className="w-full"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescricaoTab;
