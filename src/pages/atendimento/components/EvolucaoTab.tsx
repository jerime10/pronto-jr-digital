
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { FormState } from '../hooks/useFormData';

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
          <Textarea
            value={form.evolucao}
            onChange={(e) => onFieldChange('evolucao', e.target.value)}
            placeholder="Descreva a evolução do quadro clínico do paciente..."
            rows={6}
            className="w-full"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EvolucaoTab;
