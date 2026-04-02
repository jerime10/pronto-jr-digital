
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SolicitacaoExames from './SolicitacaoExames';
import ResultadoExames from './ResultadoExames';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  onProcessWithAI: (selectedFieldsKeys?: string[]) => void;
  onSelectedModelChange?: (modelTitle: string | null) => void;
  patientId?: string;
  onDynamicFieldsChange?: (fields: Record<string, string>) => void;
  processAIContent?: (field: string, content: string, dynamicFields?: Record<string, string>, selectedFieldsKeys?: string[]) => Promise<void>;
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
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("");
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

  if (isMobile) {
    return (
      <div className="space-y-4">
        <Accordion type="single" collapsible className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
          <AccordionItem value="solicitar" className="border-none">
            <AccordionTrigger className="bg-slate-900 px-6 py-5 rounded-2xl hover:no-underline transition-all">
              <div className="flex items-center gap-3">
                <span className="text-white font-black text-lg">Solicitar Exames</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="bg-slate-900/95 mt-1 rounded-2xl p-6 space-y-4 overflow-visible">
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
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="resultados" className="border-none">
            <AccordionTrigger className="bg-slate-900 px-6 py-5 rounded-2xl hover:no-underline transition-all">
              <div className="flex items-center gap-3">
                <span className="text-white font-black text-lg">Resultados de Exames</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="bg-slate-900/95 mt-1 rounded-2xl p-6 space-y-4">
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  }

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
