
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
      // Fallback para o comportamento local - manter ordem e evitar duplicatas
      onFieldChange('modelosPrescricaoSelecionados', selectedIds);
      
      // Manter a ordem de seleção e evitar duplicatas
      const selectedModels = selectedIds.map(id => 
        prescriptionModels.find(model => model.id === id)
      ).filter(Boolean); // Remove undefined
      
      // Usar Map para manter ordem e evitar duplicatas
      const uniqueModels = new Map<string, any>();
      
      selectedModels.forEach(model => {
        const description = (model.description || '').trim();
        if (description && !uniqueModels.has(description)) {
          uniqueModels.set(description, model);
        }
      });
      
      // Manter a ordem original de seleção e limpar separadores
      const finalLines = Array.from(uniqueModels.values()).map(model => {
        let desc = (model.description || '').trim();
        
        // Remover linhas de separadores (----)
        desc = desc.replace(/^[-]{3,}.*$/gm, '').trim();
        
        // Remover múltiplas linhas vazias consecutivas
        desc = desc.replace(/\n{3,}/g, '\n\n');
        
        return desc;
      }).filter(Boolean);
      
      // Se não houver modelos selecionados, manter o texto existente do usuário
      const finalText = finalLines.length > 0 
        ? finalLines.join('\n\n') // Apenas espaço duplo entre itens, sem separadores
        : form.prescricaoPersonalizada || '';
      
      onFieldChange('prescricaoPersonalizada', finalText);
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
              <Label htmlFor="modelos-prescricao" className="text-sm font-medium">
                Selecionar Modelos de Prescrição
                <span className="text-xs text-muted-foreground ml-2">
                  (Clique no X para remover da seleção, no lixeira 🗑️ para excluir permanentemente)
                </span>
              </Label>
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
