
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles, Save, Eraser, Loader2 } from 'lucide-react';
import { FormState } from '../hooks/useFormData';
import { AdvancedSelect } from '@/components/ui/advanced-select';
import { useIndividualFieldTemplates } from '@/hooks/useIndividualFieldTemplates';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { AIPromptModal } from './AIPromptModal';
import { AudioRecorderButton } from '@/components/ui/audio-recorder-button';
import { Settings2, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface InformacoesTabProps {
  form: FormState;
  onFieldChange: (field: keyof FormState, value: any) => void;
  onProcessAI: (field: 'mainComplaint' | 'evolution' | 'examResults') => void;
  isProcessingAI: {
    mainComplaint: boolean;
    evolution: boolean;
    examResults: boolean;
  };
}

const InformacoesTab: React.FC<InformacoesTabProps> = ({
  form,
  onFieldChange,
  onProcessAI,
  isProcessingAI
}) => {
  const isMobile = useIsMobile();
  const { templates, isLoading: isLoadingTemplates, saveFieldTemplate, deleteFieldTemplate } = useIndividualFieldTemplates();
  
  const [isSavingQueixa, setIsSavingQueixa] = useState(false);
  const [isSavingAntecedentes, setIsSavingAntecedentes] = useState(false);
  const [isSavingAlergias, setIsSavingAlergias] = useState(false);
  
  // Opções para AdvancedSelect
  const queixaOptions = templates
    .filter(t => t.field_key === 'queixa_principal' && t.model_name === 'ATENDIMENTO')
    .map(t => ({ id: t.id, label: t.field_content, value: t.field_content }));
    
  const antecedentesOptions = templates
    .filter(t => t.field_key === 'antecedentes' && t.model_name === 'ATENDIMENTO')
    .map(t => ({ id: t.id, label: t.field_content, value: t.field_content }));
    
  const alergiasOptions = templates
    .filter(t => t.field_key === 'alergias' && t.model_name === 'ATENDIMENTO')
    .map(t => ({ id: t.id, label: t.field_content, value: t.field_content }));

  const { updateFieldTemplate, deleteFieldTemplate: removeFieldTemplate } = useIndividualFieldTemplates();

  const handleEditTemplate = async (option: { id?: string, label: string, value: string }, newContent: string) => {
    if (!option.id) return;
    try {
      await updateFieldTemplate({ id: option.id, fieldContent: newContent });
    } catch (e) {
      console.error('Erro ao editar:', e);
    }
  };

  const handleDeleteTemplate = async (option: { id?: string, label: string, value: string }) => {
    if (!option.id) return;
    try {
      await removeFieldTemplate(option.id);
    } catch (e) {
      console.error('Erro ao excluir:', e);
    }
  };

  // Estados para gerenciar seleções múltiplas
  const [selectedQueixas, setSelectedQueixas] = useState<string[]>([]);
  const [selectedAntecedentes, setSelectedAntecedentes] = useState<string[]>([]);
  const [selectedAlergias, setSelectedAlergias] = useState<string[]>([]);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  // Inicializar valores dos campos se já existirem no formulário
  useEffect(() => {
    if (form.antecedentes && !selectedAntecedentes.length) {
      setSelectedAntecedentes([form.antecedentes]);
    }
    if (form.alergias && !selectedAlergias.length) {
      setSelectedAlergias([form.alergias]);
    }
    if (form.queixaPrincipal && !selectedQueixas.length) {
      setSelectedQueixas([form.queixaPrincipal]);
    }
  }, []); // Removendo dependências para evitar loop infinito

  // Salvar Queixa Principal
  const handleSaveQueixa = async () => {
    if (!form.queixaPrincipal.trim()) return;
    setIsSavingQueixa(true);
    try {
      await saveFieldTemplate({
        fieldKey: 'queixa_principal',
        fieldLabel: 'Queixa Principal',
        fieldContent: form.queixaPrincipal,
        modelName: 'ATENDIMENTO'
      });
    } finally {
      setIsSavingQueixa(false);
    }
  };

  // Limpar Queixa Principal
  const handleClearQueixa = () => {
    onFieldChange('queixaPrincipal', '');
  };

  // Salvar Antecedentes
  const handleSaveAntecedentes = async () => {
    if (!form.antecedentes.trim()) return;
    setIsSavingAntecedentes(true);
    try {
      await saveFieldTemplate({
        fieldKey: 'antecedentes',
        fieldLabel: 'Antecedentes',
        fieldContent: form.antecedentes,
        modelName: 'ATENDIMENTO'
      });
    } finally {
      setIsSavingAntecedentes(false);
    }
  };

  // Limpar Antecedentes
  const handleClearAntecedentes = () => {
    onFieldChange('antecedentes', '');
  };

  // Salvar Alergias
  const handleSaveAlergias = async () => {
    if (!form.alergias.trim()) return;
    setIsSavingAlergias(true);
    try {
      await saveFieldTemplate({
        fieldKey: 'alergias',
        fieldLabel: 'Alergias',
        fieldContent: form.alergias,
        modelName: 'ATENDIMENTO'
      });
    } finally {
      setIsSavingAlergias(false);
    }
  };

  // Limpar Alergias
  const handleClearAlergias = () => {
    onFieldChange('alergias', '');
  };

  // Handlers para mudança de modelos (agora recebem conteúdos, não IDs)
  const handleQueixaModelChange = (selectedContents: string[]) => {
    console.log('📝 [QUEIXA] Conteúdos selecionados:', selectedContents);
    console.log('📝 [QUEIXA] Estado atual de form.queixaPrincipal:', form.queixaPrincipal);
    setSelectedQueixas(selectedContents);
    
    // Append único preservando texto existente
    const existingLines = (form.queixaPrincipal || '')
      .split(/\n+/)
      .map(s => s.trim())
      .filter(s => s.length);
    const newLines = selectedContents
      .map(s => s.trim())
      .filter(s => s.length)
      .filter(s => !existingLines.includes(s));
    const finalText = [...existingLines, ...newLines].join('\n');
    console.log('📝 [QUEIXA] Texto final a ser aplicado:', finalText);
    onFieldChange('queixaPrincipal', finalText);
  };

  const handleAntecedentesModelChange = (selectedContents: string[]) => {
    console.log('📝 [ANTECEDENTES] Conteúdos selecionados:', selectedContents);
    console.log('📝 [ANTECEDENTES] Estado atual de form.antecedentes:', form.antecedentes);
    setSelectedAntecedentes(selectedContents);
    
    // Append único preservando texto existente
    const existingLines = (form.antecedentes || '')
      .split(/\n+/)
      .map(s => s.trim())
      .filter(s => s.length);
    const newLines = selectedContents
      .map(s => s.trim())
      .filter(s => s.length)
      .filter(s => !existingLines.includes(s));
    const finalText = [...existingLines, ...newLines].join('\n');
    console.log('📝 [ANTECEDENTES] Texto final a ser aplicado:', finalText);
    onFieldChange('antecedentes', finalText);
  };

  const handleAlergiasModelChange = (selectedContents: string[]) => {
    console.log('📝 [ALERGIAS] Conteúdos selecionados:', selectedContents);
    console.log('📝 [ALERGIAS] Estado atual de form.alergias:', form.alergias);
    setSelectedAlergias(selectedContents);
    
    // Append único preservando texto existente
    const existingLines = (form.alergias || '')
      .split(/\n+/)
      .map(s => s.trim())
      .filter(s => s.length);
    const newLines = selectedContents
      .map(s => s.trim())
      .filter(s => s.length)
      .filter(s => !existingLines.includes(s));
    const finalText = [...existingLines, ...newLines].join('\n');
    console.log('📝 [ALERGIAS] Texto final a ser aplicado:', finalText);
    onFieldChange('alergias', finalText);
  };

  // Audio Handlers
  const handleQueixaAudio = (transcribedText: string) => {
    const currentText = form.queixaPrincipal || '';
    const separator = currentText.trim() ? '\n' : '';
    onFieldChange('queixaPrincipal', `${currentText}${separator}${transcribedText}`);
    toast({ title: "Áudio transcrito", description: "Texto adicionado à queixa principal." });
  };

  const handleAntecedentesAudio = (transcribedText: string) => {
    const currentText = form.antecedentes || '';
    const separator = currentText.trim() ? '\n' : '';
    onFieldChange('antecedentes', `${currentText}${separator}${transcribedText}`);
    toast({ title: "Áudio transcrito", description: "Texto adicionado aos antecedentes." });
  };

  const handleAlergiasAudio = (transcribedText: string) => {
    const currentText = form.alergias || '';
    const separator = currentText.trim() ? '\n' : '';
    onFieldChange('alergias', `${currentText}${separator}${transcribedText}`);
    toast({ title: "Áudio transcrito", description: "Texto adicionado às alergias." });
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="queixa" className="border-none">
            <AccordionTrigger className="bg-slate-900 px-6 py-5 rounded-2xl hover:no-underline transition-all">
              <div className="flex items-center gap-3">
                <span className="text-white font-black text-lg">Queixa Principal</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="bg-slate-900/95 mt-1 rounded-2xl p-6 space-y-4 overflow-visible">
              <div className="space-y-4">
                <AdvancedSelect
                  options={queixaOptions}
                  value={selectedQueixas}
                  onChange={(values) => handleQueixaModelChange(values as string[])}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                  placeholder="Buscar modelos de queixa principal..."
                  searchPlaceholder="Buscar na lista..."
                  title="Modelos de Queixa Principal"
                  multiple
                  className="bg-slate-800 border-slate-700 text-white rounded-xl h-12"
                />
                
                <div className="relative">
                  <Textarea
                    value={form.queixaPrincipal}
                    onChange={(e) => onFieldChange('queixaPrincipal', e.target.value)}
                    placeholder="Alô, santo!"
                    rows={6}
                    className="w-full bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl p-4 focus:ring-emerald-500/20 transition-all resize-none"
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <AudioRecorderButton onTranscription={handleQueixaAudio} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-slate-400 hover:text-white hover:bg-white/10"
                      onClick={() => onProcessAI('mainComplaint')}
                      disabled={isProcessingAI.mainComplaint || !form.queixaPrincipal.trim()}
                    >
                      <Sparkles className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="antecedentes" className="border-none">
            <AccordionTrigger className="bg-slate-900 px-6 py-5 rounded-2xl hover:no-underline transition-all">
              <div className="flex items-center gap-3">
                <span className="text-white font-black text-lg">Antecedentes</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="bg-slate-900/95 mt-1 rounded-2xl p-6 space-y-4">
              <div className="space-y-4">
                <AdvancedSelect
                  options={antecedentesOptions}
                  value={selectedAntecedentes}
                  onChange={(values) => handleAntecedentesModelChange(values as string[])}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                  placeholder="Buscar modelos de antecedentes..."
                  searchPlaceholder="Buscar na lista..."
                  title="Modelos de Antecedentes"
                  multiple
                  className="bg-slate-800 border-slate-700 text-white rounded-xl h-12"
                />
                <Textarea
                  value={form.antecedentes}
                  onChange={(e) => onFieldChange('antecedentes', e.target.value)}
                  placeholder="Digite os antecedentes..."
                  rows={6}
                  className="w-full bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl p-4 resize-none"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="alergias" className="border-none">
            <AccordionTrigger className="bg-slate-900 px-6 py-5 rounded-2xl hover:no-underline transition-all">
              <div className="flex items-center gap-3">
                <span className="text-white font-black text-lg">Alergias</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="bg-slate-900/95 mt-1 rounded-2xl p-6 space-y-4">
              <div className="space-y-4">
                <AdvancedSelect
                  options={alergiasOptions}
                  value={selectedAlergias}
                  onChange={(values) => handleAlergiasModelChange(values as string[])}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                  placeholder="Buscar modelos de alergias..."
                  searchPlaceholder="Buscar na lista..."
                  title="Modelos de Alergias"
                  multiple
                  className="bg-slate-800 border-slate-700 text-white rounded-xl h-12"
                />
                <Textarea
                  value={form.alergias}
                  onChange={(e) => onFieldChange('alergias', e.target.value)}
                  placeholder="Digite as alergias..."
                  rows={6}
                  className="w-full bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 rounded-xl p-4 resize-none"
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        <AIPromptModal 
          isOpen={isPromptModalOpen} 
          onClose={() => setIsPromptModalOpen(false)} 
          fieldType="queixa" 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Queixa Principal
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
                onClick={() => onProcessAI('mainComplaint')}
                disabled={isProcessingAI.mainComplaint || !form.queixaPrincipal.trim()}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                {isProcessingAI.mainComplaint ? 'Processando...' : 'Melhorar com IA'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Selecionar Modelos de Queixa Principal
              </Label>
            </div>
            <AdvancedSelect
              options={queixaOptions}
              value={selectedQueixas}
              onChange={(values) => handleQueixaModelChange(values as string[])}
              onEdit={handleEditTemplate}
              onDelete={handleDeleteTemplate}
              placeholder="Buscar modelos de queixa principal..."
              searchPlaceholder="Buscar na lista..."
              title="Modelos de Queixa Principal"
              multiple
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Queixa Principal Personalizada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">
                Edite ou adicione informações adicionais
              </Label>
              <div className="flex gap-2">
                <AudioRecorderButton onTranscription={handleQueixaAudio} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveQueixa}
                  disabled={!form.queixaPrincipal.trim() || isSavingQueixa}
                  title="Salvar conteúdo do campo"
                >
                  {isSavingQueixa ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearQueixa}
                  disabled={!form.queixaPrincipal.trim()}
                  title="Limpar campo"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Textarea
              value={form.queixaPrincipal}
              onChange={(e) => onFieldChange('queixaPrincipal', e.target.value)}
              placeholder="Digite a queixa principal personalizada..."
              rows={6}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Antecedentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Selecionar Modelos de Antecedentes
              </Label>
            </div>
            <AdvancedSelect
              options={antecedentesOptions}
              value={selectedAntecedentes}
              onChange={(values) => handleAntecedentesModelChange(values as string[])}
              onEdit={handleEditTemplate}
              onDelete={handleDeleteTemplate}
              placeholder="Buscar modelos de antecedentes..."
              searchPlaceholder="Buscar na lista..."
              title="Modelos de Antecedentes"
              multiple
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Antecedentes Personalizados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">
                Edite ou adicione informações adicionais
              </Label>
              <div className="flex gap-2">
                <AudioRecorderButton onTranscription={handleAntecedentesAudio} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveAntecedentes}
                  disabled={!form.antecedentes.trim() || isSavingAntecedentes}
                  title="Salvar conteúdo do campo"
                >
                  {isSavingAntecedentes ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAntecedentes}
                  disabled={!form.antecedentes.trim()}
                  title="Limpar campo"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Textarea
              value={form.antecedentes}
              onChange={(e) => onFieldChange('antecedentes', e.target.value)}
              placeholder="Digite os antecedentes personalizados..."
              rows={6}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alergias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Selecionar Modelos de Alergias
              </Label>
            </div>
            <AdvancedSelect
              options={alergiasOptions}
              value={selectedAlergias}
              onChange={(values) => handleAlergiasModelChange(values as string[])}
              onEdit={handleEditTemplate}
              onDelete={handleDeleteTemplate}
              placeholder="Buscar modelos de alergias..."
              searchPlaceholder="Buscar na lista..."
              title="Modelos de Alergias"
              multiple
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alergias Personalizadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">
                Edite ou adicione informações adicionais
              </Label>
              <div className="flex gap-2">
                <AudioRecorderButton onTranscription={handleAlergiasAudio} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSaveAlergias}
                  disabled={!form.alergias.trim() || isSavingAlergias}
                  title="Salvar conteúdo do campo"
                >
                  {isSavingAlergias ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearAlergias}
                  disabled={!form.alergias.trim()}
                  title="Limpar campo"
                >
                  <Eraser className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Textarea
              value={form.alergias}
              onChange={(e) => onFieldChange('alergias', e.target.value)}
              placeholder="Digite as alergias personalizadas..."
              rows={6}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>
      
      <AIPromptModal 
        isOpen={isPromptModalOpen} 
        onClose={() => setIsPromptModalOpen(false)} 
        fieldType="queixa" 
      />
    </div>
  );
};

export default InformacoesTab;
