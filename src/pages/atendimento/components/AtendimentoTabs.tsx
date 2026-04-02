
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InformacoesTab from './InformacoesTab';
import EvolucaoTab from './EvolucaoTab';
import PrescricaoTab from './PrescricaoTab';
import ExamesTab from './ExamesTab';
import { ImageUploadTab } from './ImageUploadTab';
import { TabValue } from '../types';
import { FormState } from '../hooks/useFormData';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
  processAIContent: (field: string, content: string, dynamicFields?: Record<string, string>, selectedFieldsKeys?: string[]) => Promise<void>;
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
  const isMobile = useIsMobile();
  const [selectedModelTitle, setSelectedModelTitle] = useState<string | null>(null);

  const handleSelectedModelChange = (modelTitle: string | null) => {
    setSelectedModelTitle(modelTitle);
    onSelectedModelChange?.(modelTitle);
  };
  const handleFieldChange = (field: keyof FormState, value: any) => {
    console.log('🔄 [AtendimentoTabs] handleFieldChange chamado:', { field, value: typeof value === 'string' ? value.substring(0, 50) + (value.length > 50 ? '...' : '') : value });
    updateFormField(field as string, value);
  };

  const handleProcessAI = async (field: 'mainComplaint' | 'evolution' | 'examResults', selectedFieldsKeys?: string[]) => {
    const fieldMap = {
      'mainComplaint': 'queixaPrincipal',
      'evolution': 'evolucao', 
      'examResults': 'resultadoExames'
    } as const;
    
    const formField = fieldMap[field];
    
    // Para exames, enviar apenas os campos dinâmicos separadamente (sem texto concatenado)
    if (field === 'examResults' && dynamicFields) {
      // Verificar se há campos dinâmicos preenchidos
      const hasFilledFields = Object.values(dynamicFields).some(value => {
        const stringValue = (value === null || value === undefined) ? '' : String(value);
        return stringValue.trim() !== '';
      });
      if (hasFilledFields) {
        // Enviar apenas os campos dinâmicos, SEM NENHUM CONTEÚDO
        console.log('🎯 [AtendimentoTabs] GLOBAL - Enviando apenas campos dinâmicos:', Object.keys(dynamicFields).filter(k => dynamicFields[k]?.trim()));
        console.log('🎯 [AtendimentoTabs] GLOBAL - selectedExamModelId:', selectedExamModelId);
        console.log('🎯 [AtendimentoTabs] GLOBAL - selectedFieldsKeys:', selectedFieldsKeys);
        await processAIContent(formField, null, dynamicFields, selectedFieldsKeys);
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
      <div className={cn(
        "z-40 mb-8",
        isMobile 
          ? "bg-white/80 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar" 
          : "bg-white/50 backdrop-blur-sm p-1.5 rounded-[1.5rem] border border-slate-200/60 shadow-sm sticky top-0"
      )}>
        <TabsList className={cn(
          isMobile 
            ? "flex w-full min-w-max justify-between gap-1 bg-transparent h-auto p-0" 
            : "w-full bg-slate-100/50 rounded-[1.2rem] h-12 p-1"
        )}>
          <TabsTrigger 
            className={cn(
              "transition-all font-bold tracking-tight",
              isMobile 
                ? "rounded-xl px-3 py-2.5 h-auto text-[11px] uppercase bg-transparent text-slate-400 data-[state=active]:bg-slate-900 data-[state=active]:text-white shadow-none border-none" 
                : "flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md text-slate-500 text-sm md:text-base h-10"
            )}
            value="info"
          >
            Info
          </TabsTrigger>
          <TabsTrigger 
            className={cn(
              "transition-all font-bold tracking-tight",
              isMobile 
                ? "rounded-xl px-3 py-2.5 h-auto text-[11px] uppercase bg-transparent text-slate-400 data-[state=active]:bg-slate-900 data-[state=active]:text-white shadow-none border-none" 
                : "flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md text-slate-500 text-sm md:text-base h-10"
            )}
            value="evolucao"
          >
            Evolução
          </TabsTrigger>
          <TabsTrigger 
            className={cn(
              "transition-all font-bold tracking-tight",
              isMobile 
                ? "rounded-xl px-3 py-2.5 h-auto text-[11px] uppercase bg-transparent text-slate-400 data-[state=active]:bg-slate-900 data-[state=active]:text-white shadow-none border-none" 
                : "flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md text-slate-500 text-sm md:text-base h-10"
            )}
            value="prescricao"
          >
            Prescrição
          </TabsTrigger>
          <TabsTrigger 
            className={cn(
              "transition-all font-bold tracking-tight",
              isMobile 
                ? "rounded-xl px-3 py-2.5 h-auto text-[11px] uppercase bg-transparent text-slate-400 data-[state=active]:bg-slate-900 data-[state=active]:text-white shadow-none border-none" 
                : "flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md text-slate-500 text-sm md:text-base h-10"
            )}
            value="exames"
          >
            Exames
          </TabsTrigger>
          <TabsTrigger 
            className={cn(
              "transition-all font-bold tracking-tight",
              isMobile 
                ? "rounded-xl px-3 py-2.5 h-auto text-[11px] uppercase bg-transparent text-slate-400 data-[state=active]:bg-slate-900 data-[state=active]:text-white shadow-none border-none" 
                : "flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md text-slate-500 text-sm md:text-base h-10"
            )}
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
          onProcessWithAI={(selectedFieldsKeys) => handleProcessAI('examResults', selectedFieldsKeys)}
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
