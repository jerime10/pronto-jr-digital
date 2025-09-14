
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InformacoesTab from './InformacoesTab';
import EvolucaoTab from './EvolucaoTab';
import PrescricaoTab from './PrescricaoTab';
import ExamesTab from './ExamesTab';
import { ImageUploadTab } from './ImageUploadTab';
import { TabValue } from '../types';
import { FormState } from '../hooks/useFormData';

interface AtendimentoTabsProps {
  activeTab: TabValue;
  setActiveTab: (value: TabValue) => void;
  form: FormState;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isProcessingAI: {
    mainComplaint: boolean;
    evolution: boolean;
    examResults: boolean;
  };
  processAIContent: (field: string, content: string) => Promise<void>;
  prescriptionModels: any[];
  isLoadingPrescriptions: boolean;
  handleModeloPrescricaoChange: (value: string) => void;
  updateFormField: (field: string, value: any) => void;
  onSelectedModelChange?: (modelTitle: string | null) => void;
}

export const AtendimentoTabs: React.FC<AtendimentoTabsProps> = ({
  activeTab,
  setActiveTab,
  form,
  handleChange,
  isProcessingAI,
  processAIContent,
  prescriptionModels,
  isLoadingPrescriptions,
  handleModeloPrescricaoChange,
  updateFormField,
  onSelectedModelChange
}) => {
  const [selectedModelTitle, setSelectedModelTitle] = useState<string | null>(null);
  
  const handleSelectedModelChange = (modelTitle: string | null) => {
    setSelectedModelTitle(modelTitle);
    onSelectedModelChange?.(modelTitle);
  };
  const handleFieldChange = (field: keyof FormState, value: any) => {
    updateFormField(field as string, value);
  };

  const handleProcessAI = async (field: 'mainComplaint' | 'evolution' | 'examResults') => {
    const fieldMap = {
      'mainComplaint': 'queixaPrincipal',
      'evolution': 'evolucao', 
      'examResults': 'resultadoExames'
    } as const;
    
    const formField = fieldMap[field];
    const content = form[formField] as string;
    
    if (content?.trim()) {
      await processAIContent(formField, content);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="w-full">
        <TabsTrigger className="flex-1" value="info">Informações Clínicas</TabsTrigger>
        <TabsTrigger className="flex-1" value="evolucao">Evolução</TabsTrigger>
        <TabsTrigger className="flex-1" value="prescricao">Prescrição</TabsTrigger>
        <TabsTrigger className="flex-1" value="exames">Exames</TabsTrigger>
        <TabsTrigger className="flex-1" value="imagens">Imagens</TabsTrigger>
      </TabsList>
      
      <TabsContent value="info">
        <InformacoesTab
          form={form}
          onFieldChange={handleFieldChange}
          onProcessAI={handleProcessAI}
          isProcessingAI={isProcessingAI}
        />
      </TabsContent>
      
      <TabsContent value="evolucao">
        <EvolucaoTab
          form={form}
          onFieldChange={handleFieldChange}
          onProcessAI={handleProcessAI}
          isProcessingAI={isProcessingAI}
        />
      </TabsContent>
      
      <TabsContent value="prescricao">
        <PrescricaoTab
          form={form}
          prescriptionModels={prescriptionModels}
          isLoadingPrescriptions={isLoadingPrescriptions}
          onFieldChange={handleFieldChange}
          onModelChange={handleModeloPrescricaoChange}
        />
      </TabsContent>
      
      <TabsContent value="exames">
        <ExamesTab
          examRequests={form.examesSelecionados}
          onExamRequestsChange={(exams: string[]) => updateFormField('examesSelecionados', exams)}
          examResults={form.resultadoExames}
          onExamResultsChange={(value: string) => updateFormField('resultadoExames', value)}
          examObservations={form.observacoesExames}
          onExamObservationsChange={(value: string) => updateFormField('observacoesExames', value)}
          isProcessingAI={{ examResults: isProcessingAI.examResults }}
          onProcessWithAI={() => handleProcessAI('examResults')}
          onSelectedModelChange={handleSelectedModelChange}
        />
      </TabsContent>
      
      <TabsContent value="imagens">
        <ImageUploadTab
          images={form.images}
          onImagesChange={(images) => updateFormField('images', images)}
        />
      </TabsContent>
    </Tabs>
  );
};
