
import React from 'react';
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelectSearchExams } from '@/components/ui/multi-select-search-exams';

interface SolicitacaoExamesProps {
  examRequests: string[];
  onExamRequestsChange: (exams: string[]) => void;
  availableExams: { id: string; name: string; instructions: string | null }[];
  isLoading: boolean;
}

const SolicitacaoExames: React.FC<SolicitacaoExamesProps> = ({
  examRequests,
  onExamRequestsChange,
  availableExams,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-3" />
            <span className="text-muted-foreground">Carregando exames disponíveis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Solicitar Exames</CardTitle>
        <p className="text-sm text-muted-foreground">
          Use a busca inteligente para encontrar e selecionar múltiplos exames.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          💡 Clique no <strong>X</strong> para remover da seleção, no <strong>🗑️ lixeira</strong> para excluir permanentemente do banco de dados
        </p>
      </CardHeader>
      <CardContent>
        <MultiSelectSearchExams
          options={availableExams}
          selectedValues={examRequests}
          onSelectionChange={onExamRequestsChange}
          placeholder="Buscar exames por nome ou instruções..."
          disabled={isLoading}
        />
      </CardContent>
    </Card>
  );
};

export default SolicitacaoExames;
