
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SolicitacaoExames from './SolicitacaoExames';
import ResultadoExames from './ResultadoExames';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExamModel {
  id: string;
  name: string;
  instructions: string | null;
}

interface ExamesTabProps {
  examRequests: string[];
  onExamRequestsChange: (exams: string[]) => void;
  examResults: string;
  onExamResultsChange: (value: string) => void;
  examObservations: string;
  onExamObservationsChange: (value: string) => void;
  isProcessingAI: { examResults: boolean };
  onProcessWithAI: () => void;
  onSelectedModelChange?: (modelTitle: string | null) => void;
  patientId?: string;
  onDynamicFieldsChange?: (fields: Record<string, string>) => void;
  processAIContent?: (field: string, content: string, dynamicFields?: Record<string, string>) => Promise<void>;
  updateDynamicFieldsFromAI?: (fields: Record<string, string>) => void;
  dynamicFields?: Record<string, string>;
  selectedExamModelId?: string;
  onExamModelChange?: (modelId: string) => void;
}

const ExamesTab: React.FC<ExamesTabProps> = ({
  examRequests,
  onExamRequestsChange,
  examResults,
  onExamResultsChange,
  examObservations,
  onExamObservationsChange,
  isProcessingAI,
  onProcessWithAI,
  onSelectedModelChange,
  patientId,
  onDynamicFieldsChange,
  processAIContent,
  updateDynamicFieldsFromAI,
  dynamicFields,
  selectedExamModelId,
  onExamModelChange
}) => {
  const [activeTab, setActiveTab] = useState("solicitar");
  const [availableExams, setAvailableExams] = useState<ExamModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchExamModels = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('exam_models')
          .select('id, name, instructions')
          .order('name');

        if (error) {
          throw error;
        }

        setAvailableExams(data || []);
      } catch (error) {
        console.error('Erro ao carregar modelos de exames:', error);
        toast.error('Não foi possível carregar os modelos de exames');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExamModels();
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="solicitar">Solicitar Exames</TabsTrigger>
        <TabsTrigger value="resultados">Resultados</TabsTrigger>
      </TabsList>

      <TabsContent value="solicitar" className="pt-4">
        <SolicitacaoExames 
          examRequests={examRequests} 
          onExamRequestsChange={onExamRequestsChange}
          availableExams={availableExams.map(exam => ({
            id: exam.id,
            name: exam.name,
            instructions: exam.instructions || ''
          }))}
          isLoading={isLoading}
        />
      </TabsContent>

      <TabsContent value="resultados" className="pt-4">
        <ResultadoExames 
          patientId={patientId}
          examResults={examResults}
          onExamResultsChange={onExamResultsChange}
          examObservations={examObservations}
          onExamObservationsChange={onExamObservationsChange}
          isProcessingAI={isProcessingAI}
          onProcessWithAI={onProcessWithAI}
          onSelectedModelChange={onSelectedModelChange}
          onDynamicFieldsChange={onDynamicFieldsChange}
          processAIContent={processAIContent}
          updateDynamicFieldsFromAI={updateDynamicFieldsFromAI}
          dynamicFields={dynamicFields}
          initialSelectedModelId={selectedExamModelId}
          onModelIdChange={onExamModelChange}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ExamesTab;
