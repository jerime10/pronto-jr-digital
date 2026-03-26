
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings2, Sparkles, Save, Eraser, Loader2 } from 'lucide-react';
import { FormState } from '../hooks/useFormData';
import { FieldAutocompleteMulti } from '@/components/ui/field-autocomplete-multi';
import { useIndividualFieldTemplates } from '@/hooks/useIndividualFieldTemplates';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { AIPromptModal } from './AIPromptModal';
import { AudioRecorderButton } from '@/components/ui/audio-recorder-button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  const isMobile = useIsMobile();
  const { searchFieldTemplates, saveFieldTemplate, deleteFieldTemplate } = useIndividualFieldTemplates();
  const [isSavingEvolucao, setIsSavingEvolucao] = useState(false);
  const [selectedEvolucoes, setSelectedEvolucoes] = useState<string[]>([]);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  // Salvar Evolução
  const handleSaveEvolucao = async () => {
    if (!form.evolucao.trim()) return;
    setIsSavingEvolucao(true);
    try {
      await saveFieldTemplate({
        fieldKey: 'evolucao',
        fieldLabel: 'Evolução do Paciente',
        fieldContent: form.evolucao,
        modelName: 'ATENDIMENTO'
      });
    } finally {
      setIsSavingEvolucao(false);
    }
  };

  // Limpar Evolução
  const handleClearEvolucao = () => {
    onFieldChange('evolucao', '');
  };

  // Handler para mudança de modelos (agora recebe conteúdos, não IDs)
  const handleEvolucaoModelChange = (selectedContents: string[]) => {
    console.log('📝 [EVOLUÇÃO] Conteúdos selecionados:', selectedContents);
    setSelectedEvolucoes(selectedContents);
    
    // Append único preservando texto existente
    const existingLines = (form.evolucao || '')
      .split(/\n+/)
      .map(s => s.trim())
      .filter(s => s.length);
    const newLines = selectedContents
      .map(s => s.trim())
      .filter(s => s.length)
      .filter(s => !existingLines.includes(s));
    const finalText = [...existingLines, ...newLines].join('\n');
    onFieldChange('evolucao', finalText);
  };

  const handleAudioTranscription = (transcribedText: string) => {
    const currentText = form.evolucao || '';
    const separator = currentText.trim() ? '\n' : '';
    onFieldChange('evolucao', `${currentText}${separator}${transcribedText}`);
    toast({
      title: "Áudio transcrito",
      description: "O texto foi adicionado à sua evolução."
    });
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="evolucao" className="border-none">
            <AccordionTrigger className="bg-slate-900 px-6 py-5 rounded-2xl hover:no-underline transition-all">
              <div className="flex items-center gap-3">
                <span className="text-white font-black text-lg">Evolução do Paciente</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="bg-slate-900/95 mt-1 rounded-2xl p-6 space-y-4 overflow-visible">
              <div className="space-y-4">
                <FieldAutocompleteMulti
                  selectedValues={selectedEvolucoes}
                  onChange={handleEvolucaoModelChange}
                  onSearch={(searchTerm) => searchFieldTemplates('evolucao', searchTerm, 'ATENDIMENTO')}
                  placeholder="Digite para buscar e selecionar múltiplas evoluções..."
                  fieldName="evolucao"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl"
                />
                
                <div className="relative">
                  <Textarea
                    value={form.evolucao}
                    onChange={(e) => onFieldChange('evolucao', e.target.value)}
                    placeholder="Digite a evolução personalizada..."
                    rows={8}
                    className="w-full bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl p-4 focus:ring-emerald-500/20 transition-all resize-none"
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <AudioRecorderButton onTranscription={handleAudioTranscription} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-slate-400 hover:text-white hover:bg-white/10"
                      onClick={() => onProcessAI('evolution')}
                      disabled={isProcessingAI.evolution || !form.evolucao.trim()}
                    >
                      <Sparkles className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <AIPromptModal 
          isOpen={isPromptModalOpen} 
          onClose={() => setIsPromptModalOpen(false)} 
          fieldType="evolucao" 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Evolução do Paciente
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsPromptModalOpen(true)}
                title="Configurar instruções da IA"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onProcessAI('evolution')}
                disabled={isProcessingAI.evolution || !form.evolucao.trim()}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {isProcessingAI.evolution ? 'Processando...' : 'Melhorar com IA'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Selecionar Modelos de Evolução
                <span className="text-xs text-muted-foreground ml-2">
                  (Clique no X para remover da seleção, no lixeira 🗑️ para excluir permanentemente)
                </span>
              </Label>
            </div>
            <FieldAutocompleteMulti
              selectedValues={selectedEvolucoes}
              onChange={handleEvolucaoModelChange}
              onSearch={(searchTerm) => searchFieldTemplates('evolucao', searchTerm, 'ATENDIMENTO')}
              placeholder="Digite para buscar e selecionar múltiplas evoluções..."
              fieldName="evolucao"
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evolução Personalizada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">
              Edite ou adicione informações adicionais
            </Label>
            <div className="flex gap-2">
              <AudioRecorderButton onTranscription={handleAudioTranscription} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveEvolucao}
                disabled={!form.evolucao.trim() || isSavingEvolucao}
                title="Salvar conteúdo do campo"
              >
                {isSavingEvolucao ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearEvolucao}
                disabled={!form.evolucao.trim()}
                title="Limpar campo"
              >
                <Eraser className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Textarea
            value={form.evolucao}
            onChange={(e) => onFieldChange('evolucao', e.target.value)}
            placeholder="Digite a evolução personalizada..."
            rows={8}
            className="w-full"
          />
        </CardContent>
      </Card>
      
      <AIPromptModal 
        isOpen={isPromptModalOpen} 
        onClose={() => setIsPromptModalOpen(false)} 
        fieldType="evolucao" 
      />
    </div>
  );
};

export default EvolucaoTab;
