
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdvancedSelect } from '@/components/ui/advanced-select';
import { FormState } from '../hooks/useFormData';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PrescricaoTabProps {
  form: FormState;
  prescriptionModels: Array<{ id: string; name: string; description: string }>;
  isLoadingPrescriptions: boolean;
  onFieldChange: (field: keyof FormState, value: any) => void;
  onModelChange: (modelId: string) => void;
  onMultiModelChange?: (modelosIds: string[]) => void;
}

const PrescricaoTab: React.FC<PrescricaoTabProps> = ({
  form,
  prescriptionModels,
  isLoadingPrescriptions,
  onFieldChange,
  onModelChange,
  onMultiModelChange
}) => {
  const isMobile = useIsMobile();
  // Handler para multisseleção de modelos
  const handleModelosPrescricaoChange = (selectedIds: string[]) => {
    // Usar o handler externo se disponível, senão usar o handler local
    if (onMultiModelChange) {
      onMultiModelChange(selectedIds);
    } else {
      // Fallback para o comportamento local - manter ordem e evitar duplicatas
      onFieldChange('modelosPrescricaoSelecionados', selectedIds);
      
      // Manter a ordem de seleção e evitar duplicatas
      const selectedModels = selectedIds.map(id => 
        prescriptionModels.find(model => model.id === id)
      ).filter(Boolean); // Remove undefined
      
      // Usar Map para manter ordem e evitar duplicatas
      const uniqueModels = new Map<string, any>();
      
      selectedModels.forEach(model => {
        const description = (model.description || '').trim();
        if (description && !uniqueModels.has(description)) {
          uniqueModels.set(description, model);
        }
      });
      
      // Manter a ordem original de seleção e limpar separadores
      const finalLines = Array.from(uniqueModels.values()).map(model => {
        let desc = (model.description || '').trim();
        
        // Remover linhas de separadores (----)
        desc = desc.replace(/^[-]{3,}.*$/gm, '').trim();
        
        // Remover múltiplas linhas vazias consecutivas
        desc = desc.replace(/\n{3,}/g, '\n\n');
        
        return desc;
      }).filter(Boolean);
      
      // Se não houver modelos selecionados, manter o texto existente do usuário
      const finalText = finalLines.length > 0 
        ? finalLines.join('\n\n') // Apenas espaço duplo entre itens, sem separadores
        : form.prescricaoPersonalizada || '';
      
      onFieldChange('prescricaoPersonalizada', finalText);
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="prescricao" className="border-none">
            <AccordionTrigger className="bg-slate-900 px-6 py-5 rounded-2xl hover:no-underline transition-all">
              <div className="flex items-center gap-3">
                <span className="text-white font-black text-lg">Prescrição Médica</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="bg-slate-900/95 mt-1 rounded-2xl p-6 space-y-4 overflow-visible">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="modelos-prescricao" className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                    Selecionar Modelos
                  </Label>
                  <AdvancedSelect
                    options={prescriptionModels.map(m => ({ label: m.name, value: m.id }))}
                    value={form.modelosPrescricaoSelecionados || []}
                    onChange={(values) => handleModelosPrescricaoChange(values as string[])}
                    placeholder="Buscar modelos..."
                    searchPlaceholder="Digite o nome do modelo..."
                    title="Modelos de Prescrição"
                    multiple
                    disabled={isLoadingPrescriptions}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl h-12"
                  />
                </div>
                
                <div className="relative">
                  <Textarea
                    value={form.prescricaoPersonalizada}
                    onChange={(e) => onFieldChange('prescricaoPersonalizada', e.target.value)}
                    placeholder="Digite a prescrição..."
                    rows={12}
                    className="w-full bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl p-4 focus:ring-emerald-500/20 transition-all resize-none"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Modelos de Prescrição</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="modelos-prescricao" className="text-sm font-medium">
                Selecionar Modelos de Prescrição
              </Label>
              <AdvancedSelect
                options={prescriptionModels.map(m => ({ label: m.name, value: m.id }))}
                value={form.modelosPrescricaoSelecionados || []}
                onChange={(values) => handleModelosPrescricaoChange(values as string[])}
                placeholder="Digite para buscar e selecionar modelos..."
                searchPlaceholder="Digite o nome do modelo..."
                title="Modelos de Prescrição"
                multiple
                disabled={isLoadingPrescriptions}
                className="w-full"
              />
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
