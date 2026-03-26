
import React from 'react';
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MultiSelectSearchExams } from '@/components/ui/multi-select-search-exams';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center p-8",
        isMobile ? "text-white" : "text-muted-foreground"
      )}>
        <Loader2 className="h-6 w-6 animate-spin mr-3" />
        <span>Carregando exames disponíveis...</span>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Busca Inteligente de Exames
        </p>
        <MultiSelectSearchExams
          options={availableExams}
          selectedValues={examRequests}
          onSelectionChange={onExamRequestsChange}
          placeholder="Buscar exames..."
          disabled={isLoading}
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl"
        />
        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
          💡 Clique no <strong className="text-slate-300">X</strong> para remover, no <strong className="text-slate-300">🗑️ lixeira</strong> para excluir permanentemente.
        </p>
      </div>
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
