
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
  processAIContent: (field: string, content: string, dynamicFields?: Record<string, string>) => Promise<void>;
  prescriptionModels: any[];
  isLoadingPrescriptions: boolean;
  handleModeloPrescricaoChange: (value: string) => void;
  handleModelosPrescricaoChange: (modelosIds: string[]) => void;
  updateFormField: (field: string, value: any) => void;
  onSelectedModelChange?: (modelTitle: string | null) => void;
  patientId?: string;
  onDynamicFieldsChange?: (fields: Record<string, string>) => void;
  dynamicFields?: Record<string, string>;
  updateDynamicFieldsFromAI?: (fields: Record<string, string>) => void;
  selectedExamModelId?: string;
  onExamModelChange?: (modelId: string) => void;
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
  handleModelosPrescricaoChange,
  updateFormField,
  onSelectedModelChange,
  patientId,
  onDynamicFieldsChange,
  dynamicFields,
  updateDynamicFieldsFromAI,
  selectedExamModelId,
  onExamModelChange
}) => {
  const [selectedModelTitle, setSelectedModelTitle] = useState<string | null>(null);
  
  const handleSelectedModelChange = (modelTitle: string | null) => {
    setSelectedModelTitle(modelTitle);
    onSelectedModelChange?.(modelTitle);
  };
  const handleFieldChange = (field: keyof FormState, value: any) => {
    console.log('🔄 [AtendimentoTabs] handleFieldChange chamado:', { field, value: typeof value === 'string' ? value.substring(0, 50) + (value.length > 50 ? '...' : '') : value });
    updateFormField(field as string, value);
  };

  const handleProcessAI = async (field: 'mainComplaint' | 'evolution' | 'examResults') => {
    const fieldMap = {
      'mainComplaint': 'queixaPrincipal',
      'evolution': 'evolucao', 
      'examResults': 'resultadoExames'
    } as const;
    
    const formField = fieldMap[field];
    
    // Para exames, enviar apenas os campos dinâmicos separadamente (sem texto concatenado)
    if (field === 'examResults' && dynamicFields) {
      // Verificar se há campos dinâmicos preenchidos
      const hasFilledFields = Object.values(dynamicFields).some(value => value?.trim());
      if (hasFilledFields) {
        // Enviar apenas os campos dinâmicos, SEM NENHUM CONTEÚDO
        console.log('🎯 [AtendimentoTabs] Enviando apenas campos dinâmicos:', Object.keys(dynamicFields).filter(k => dynamicFields[k]?.trim()));
        await processAIContent(formField, null, dynamicFields);
      } else {
        // Se não há campos dinâmicos, usar o conteúdo do textarea
        const content = form[formField] as string;
        if (content?.trim()) {
          console.log('🎯 [AtendimentoTabs] Enviando conteúdo do textarea (sem campos dinâmicos)');
          await processAIContent(formField, content);
        }
      }
    } else {
      // Para outros campos (Evolução, Queixa), usar o comportamento normal, SEM enviar dynamicFields
      // que pertencem à aba de exames e acabavam confundindo o backend
      const content = form[formField] as string;
      if (content?.trim()) {
        console.log(`🎯 [AtendimentoTabs] Enviando conteúdo do textarea para ${field} (sem campos dinâmicos)`);
        await processAIContent(formField, content, undefined); // undefined garante que não envie dynamicFields
      }
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="bg-white/50 backdrop-blur-sm p-1.5 rounded-[1.5rem] border border-slate-200/60 shadow-sm mb-8 sticky top-0 z-40">
        <TabsList className="w-full bg-slate-100/50 rounded-[1.2rem] h-12 p-1">
          <TabsTrigger 
            className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md transition-all font-bold text-slate-500 text-sm md:text-base tracking-tight" 
            value="info"
          >
            Informações
          </TabsTrigger>
          <TabsTrigger 
            className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md transition-all font-bold text-slate-500 text-sm md:text-base tracking-tight" 
            value="evolucao"
          >
            Evolução
          </TabsTrigger>
          <TabsTrigger 
            className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md transition-all font-bold text-slate-500 text-sm md:text-base tracking-tight" 
            value="prescricao"
          >
            Prescrição
          </TabsTrigger>
          <TabsTrigger 
            className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md transition-all font-bold text-slate-500 text-sm md:text-base tracking-tight" 
            value="exames"
          >
            Exames
          </TabsTrigger>
          <TabsTrigger 
            className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md transition-all font-bold text-slate-500 text-sm md:text-base tracking-tight" 
            value="imagens"
          >
            Imagens
          </TabsTrigger>
        </TabsList>
      </div>
      
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
          onMultiModelChange={handleModelosPrescricaoChange}
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
          patientId={patientId}
          onDynamicFieldsChange={onDynamicFieldsChange}
          processAIContent={processAIContent}
          updateDynamicFieldsFromAI={updateDynamicFieldsFromAI}
          dynamicFields={dynamicFields}
          selectedExamModelId={selectedExamModelId}
          onExamModelChange={onExamModelChange}
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
