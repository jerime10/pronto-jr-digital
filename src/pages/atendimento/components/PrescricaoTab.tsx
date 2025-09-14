
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormState } from '../hooks/useFormData';

interface PrescricaoTabProps {
  form: FormState;
  prescriptionModels: Array<{ id: string; name: string; description: string }>;
  isLoadingPrescriptions: boolean;
  onFieldChange: (field: keyof FormState, value: any) => void;
  onModelChange: (modelId: string) => void;
}

const PrescricaoTab: React.FC<PrescricaoTabProps> = ({
  form,
  prescriptionModels,
  isLoadingPrescriptions,
  onFieldChange,
  onModelChange
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Modelo de Prescrição</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="modelo-prescricao">Selecionar Modelo</Label>
              <Select 
                value={form.modeloPrescricao} 
                onValueChange={onModelChange}
                disabled={isLoadingPrescriptions}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um modelo de prescrição" />
                </SelectTrigger>
                <SelectContent>
                  {prescriptionModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
