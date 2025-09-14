import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Wand2 } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface ResultadoExamesProps {
  examResults: string;
  onExamResultsChange: (value: string) => void;
  isProcessingAI: { examResults: boolean };
  onProcessWithAI: () => void;
  onSelectedModelChange?: (modelTitle: string | null) => void;
}

interface CompletedExam {
  id: string;
  name: string;
  result_template: string | null;
}

const ResultadoExames: React.FC<ResultadoExamesProps> = ({ 
  examResults, 
  onExamResultsChange, 
  isProcessingAI,
  onProcessWithAI,
  onSelectedModelChange 
}) => {
  const [completedExams, setCompletedExams] = useState<CompletedExam[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchCompletedExams = async () => {
      const storedUser = localStorage.getItem('simple_auth_user');
      
      if (!storedUser) {
        toast.error('Usuario nao autenticado');
        return;
      }
      
      setIsLoading(true);
      try {
        // Acessar diretamente a tabela modelo-result-exames
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('modelo-result-exames' as any)
          .select('id, name, result_template')
          .order('name');
        
        if (fallbackError) {
          throw fallbackError;
        }
        
        setCompletedExams((fallbackData as unknown as CompletedExam[]) || []);
      } catch (error) {
        console.error('Erro ao buscar modelos de laudos:', error);
        toast.error('Nao foi possivel carregar os modelos de laudos');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompletedExams();
  }, []);
  
  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId);
    const selectedModel = completedExams.find(model => model.id === modelId);
    
    if (selectedModel) {
      // Notificar o componente pai sobre o modelo selecionado
      onSelectedModelChange?.(selectedModel.name);
      
      if (selectedModel.result_template) {
        const newText = examResults.trim() 
          ? `${examResults}\n\n${selectedModel.result_template}`
          : selectedModel.result_template;
        
        onExamResultsChange(newText);
      }
    } else {
      // Se nenhum modelo foi selecionado, limpar o título
      onSelectedModelChange?.(null);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="w-full md:w-1/2">
          <Select 
            value={selectedModelId} 
            onValueChange={handleModelSelect}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um modelo de laudo" />
            </SelectTrigger>
            <SelectContent>
              {completedExams.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={onProcessWithAI}
          variant="outline"
          className="w-full md:w-auto"
          disabled={isProcessingAI.examResults}
        >
          {isProcessingAI.examResults ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Processar com IA
            </>
          )}
        </Button>
      </div>
      
      <Textarea
        value={examResults}
        onChange={(e) => onExamResultsChange(e.target.value)}
        placeholder="Digite aqui os resultados dos exames ou utilize um modelo."
        className="min-h-[300px] font-mono"
      />
    </div>
  );
};

export default ResultadoExames;