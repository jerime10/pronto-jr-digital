import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdvancedSelect } from '@/components/ui/advanced-select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Trash2, Save, Eraser, Mic, MicOff, Settings2, X, CheckCircle2, Calendar as CalendarIcon, Info } from 'lucide-react';
import { toast } from 'sonner';
import { calculateDUMFromIG, formatDateInput, parseNaturalDate } from '@/utils/obstetricUtils';
import { calculateFetalPercentile } from '@/utils/fetalCalculations';
import { AIPromptModal } from './AIPromptModal';
import { useWhisperTranscription } from '@/hooks/useWhisperTranscription';
import { useIndividualFieldTemplates } from '@/hooks/useIndividualFieldTemplates';
import { useAIProcessing } from '@/pages/atendimento/hooks/useAIProcessing';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ExamModel {
  id: string;
  name: string;
  result_template: string | null;
}
interface DynamicField {
  key: string;
  label: string;
  type: 'input' | 'textarea' | 'date';
  placeholder: string;
  section?: string;
}
interface ModelTemplate {
  name: string;
  fields: DynamicField[];
  resultTemplate: string;
}
interface ParsedTemplate {
  fields: DynamicField[];
  template: string;
}

// Função para interpretar tipos de campo baseados nas dicas do banco
const getFieldTypeFromHint = (hint: string): 'input' | 'textarea' | 'date' => {
  const lowerHint = hint.toLowerCase();
  if (lowerHint.includes('multilinha') || lowerHint.includes('textarea')) {
    return 'textarea';
  }
  if (lowerHint.includes('data') || lowerHint.includes('dd/mm/aaaa')) {
    return 'date';
  }
  if (lowerHint.includes('texto longo')) {
    return 'textarea';
  }

  // Por padrão, usar input para texto curto
  return 'input';
};

// Função para parsear template do banco de dados e gerar campos dinâmicos
const parseTemplateToFields = (template: string, modelName: string): ParsedTemplate => {
  console.log('🔍 [PARSE] ===== INÍCIO parseTemplateToFields =====');
  console.log('🔍 [PARSE] Template recebido:', template);
  console.log('🔍 [PARSE] Modelo:', modelName);
  if (!template) {
    return {
      fields: [],
      template: ''
    };
  }
  const fields: DynamicField[] = [];

  // Correção específica para modelo obstétrico - separar campos que estão na mesma linha
  let correctedTemplate = template;
  if (modelName.includes('OBSTÉTRICA')) {
    console.log('🔧 [PARSE] Aplicando correção para modelo obstétrico...');
    const tempLines = template.split('\n');
    const correctedLines = [];
    for (let line of tempLines) {
      console.log(`🔍 [PARSE] Analisando linha: "${line}"`);

      // Verificar se a linha contém múltiplos campos separados por vírgulas ou espaços
      const hasMultipleFields = line.includes('SITUAÇÃO') && (line.includes('IG') || line.includes('DPP')) || line.includes('DPP') && line.includes('SITUAÇÃO') || line.includes('IG') && line.includes('DPP');
      if (hasMultipleFields) {
        console.log(`🔧 [PARSE] Linha com múltiplos campos encontrada: "${line}"`);

        // Separar campos usando regex mais robusta
        const fieldPatterns = [/(SITUAÇÃO[^,]*(?:\([^)]*\))?)/gi, /(IG[^,]*(?:\([^)]*\))?)/gi, /(DPP[^,]*(?:\([^)]*\))?)/gi];
        const extractedFields = [];
        for (const pattern of fieldPatterns) {
          const matches = line.match(pattern);
          if (matches) {
            matches.forEach(match => {
              const cleanField = match.trim().replace(/,$/, ''); // Remove vírgula final
              if (cleanField) {
                extractedFields.push(cleanField);
                console.log(`🔧 [PARSE] Campo extraído: "${cleanField}"`);
              }
            });
          }
        }
        if (extractedFields.length > 0) {
          console.log(`🔧 [PARSE] Separando ${extractedFields.length} campos em linhas diferentes`);
          correctedLines.push(...extractedFields);
        } else {
          console.log(`⚠️ [PARSE] Não foi possível extrair campos, mantendo linha original`);
          correctedLines.push(line);
        }
      } else {
        correctedLines.push(line);
      }
    }
    correctedTemplate = correctedLines.join('\n');
    console.log('🔧 [PARSE] Template corrigido:', correctedTemplate);
  }
  const lines = correctedTemplate.split('\n');
  const addedKeys = new Set<string>(); // Para evitar duplicatas

  console.log('🔍 [PARSE] Total de linhas:', lines.length);
  console.log('🔍 [PARSE] Linhas:', lines);

  // Função auxiliar para normalizar chaves
  const normalizeKey = (text: any): string => {
    try {
      if (!text || typeof text !== 'string') return '';
      return text.toLowerCase()
        .replace(/[áàâãä]/g, 'a')
        .replace(/[éèêë]/g, 'e')
        .replace(/[íìîï]/g, 'i')
        .replace(/[óòôõö]/g, 'o')
        .replace(/[úùûü]/g, 'u')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '')
        .replace(/\s+/g, '');
    } catch (e) {
      return '';
    }
  };

  // Função auxiliar para determinar tipo de campo
  const getFieldType = (key: string, label: string): 'input' | 'textarea' | 'date' => {
    // Campos de data
    if (key.includes('data') || key.includes('dpp') || label.toLowerCase().includes('data')) {
      return 'date';
    }

    // Campos que devem ser textarea (textos longos)
    const textareaFields = ['impressaodiagnostica', 'impressao', 'diagnostica', 'achadosadicionais', 'achados', 'adicionais', 'recomendacoes', 'observacoes', 'conclusao', 'apresentacao', 'situacao', 'cordaoumbilical', 'placenta', 'gravidez', 'feto', 'comentarios'];
    if (textareaFields.some(field => key.includes(field))) {
      return 'textarea';
    }
    return 'input';
  };

  // Função auxiliar para gerar placeholder
  const getPlaceholder = (label: string, type: 'input' | 'textarea' | 'date', unit?: string): string => {
    if (type === 'date') {
      return 'DD/MM/AAAA';
    }
    if (unit) {
      return `Valor em ${unit}`;
    }
    if (type === 'textarea') {
      return `Descrição de ${label.toLowerCase()}`;
    }
    return `Valor de ${label.toLowerCase()}`;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    console.log(`🔍 [PARSE] Linha ${i + 1}: "${line}"`);
    if (!line) {
      continue;
    }

    // Log especial para modelo obstétrico
    if (modelName.includes('OBSTÉTRICA')) {
      console.log(`🔍 [OBSTÉTRICO] Analisando linha: "${line}"`);

      // Log específico para campos SITUAÇÃO e IG
      if (line.includes('SITUAÇÃO') || line.includes('IG')) {
        console.log(`🎯 [OBSTÉTRICO-SITUACAO-IG] Linha problemática: "${line}"`);
        console.log(`🎯 [OBSTÉTRICO-SITUACAO-IG] Caracteres da linha:`, line.split('').map((char, idx) => `${idx}: '${char}' (${char.charCodeAt(0)})`));
      }
    }

    // Padrão 0: Campos obstétricos específicos - CAMPO: _______________
    const obstetricFieldMatch = line.match(/^([A-ZÀ-ÿ\s\(\)]+):\s*_{10,}$/);
    if (obstetricFieldMatch) {
      const label = obstetricFieldMatch[1].trim();
      const key = normalizeKey(label);
      if (!addedKeys.has(key)) {
        const fieldType = getFieldType(key, label);
        fields.push({
          key,
          label,
          type: fieldType,
          placeholder: getPlaceholder(label, fieldType)
        });
        addedKeys.add(key);
        console.log(`✅ [OBSTÉTRICO] Campo capturado: "${label}" -> key: "${key}"`);
      }
      continue;
    }

    // Padrão 0.5: Campos obstétricos com underscores na próxima linha - CAMPO:
    const obstetricNextLineMatch = line.match(/^([A-ZÀ-ÿ\s\(\)]+):\s*$/);
    if (obstetricNextLineMatch && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      const hasUnderscores = nextLine.match(/^_{10,}$/);
      if (hasUnderscores) {
        const label = obstetricNextLineMatch[1].trim();
        const key = normalizeKey(label);
        if (!addedKeys.has(key)) {
          const fieldType = getFieldType(key, label);
          fields.push({
            key,
            label,
            type: fieldType,
            placeholder: getPlaceholder(label, fieldType)
          });
          addedKeys.add(key);
          console.log(`✅ [OBSTÉTRICO-NEXTLINE] Campo capturado: "${label}" -> key: "${key}"`);
        }
        continue;
      }
    }

    // Padrão 1: Campos com dois pontos e underscores - CAMPO: ___UNIDADE
    const colonFieldMatch = line.match(/^([A-ZÁÊÇÕ\s\(\)]+):\s*_{2,}([A-Z]*)/);
    if (colonFieldMatch) {
      const label = colonFieldMatch[1].trim();
      const unit = colonFieldMatch[2] || '';
      const key = normalizeKey(label);
      if (!addedKeys.has(key)) {
        const fieldType = getFieldType(key, label);
        fields.push({
          key,
          label: unit ? `${label} (${unit})` : label,
          type: fieldType,
          placeholder: getPlaceholder(label, fieldType, unit)
        });
        addedKeys.add(key);
      }
      continue;
    }

    // Padrão 4: CAMPO (tipo de campo) - formato do banco
    const bankPattern1 = line.match(/^([A-ZÀ-ÿ\s\(\)]+?)\s*\((.+?)\)\s*$/);
    console.log(`🔍 [PARSE] Testando Padrão 4 em "${line}":`, bankPattern1);
    if (bankPattern1) {
      const label = bankPattern1[1].trim();
      const typeHint = bankPattern1[2].trim();
      const key = normalizeKey(label);
      if (!addedKeys.has(key)) {
        const fieldType = getFieldTypeFromHint(typeHint);
        fields.push({
          key,
          label,
          type: fieldType,
          placeholder: getPlaceholder(label, fieldType, '')
        });
        addedKeys.add(key);
      }
      continue;
    }

    // Padrão 5: CAMPO: (tipo de campo) - formato do banco
    const bankPattern2 = line.match(/^([A-ZÀ-ÿ\s\(\)]+?):\s*\((.+?)\)\s*$/);
    console.log(`🔍 [PARSE] Testando Padrão 5 em "${line}":`, bankPattern2);
    if (bankPattern2) {
      const label = bankPattern2[1].trim();
      const typeHint = bankPattern2[2].trim();
      const key = normalizeKey(label);
      if (!addedKeys.has(key)) {
        const fieldType = getFieldTypeFromHint(typeHint);
        fields.push({
          key,
          label,
          type: fieldType,
          placeholder: getPlaceholder(label, fieldType, '')
        });
        addedKeys.add(key);
        console.log(`✅ [BANK-PATTERN-2] Campo capturado: "${label}" -> key: "${key}"`);
      }
      continue;
    }

    // Padrão 6: CAMPO: (tipo) - formato específico após seções (ex: OVÁRIO DIREITO: (texto curto))
    const sectionFieldPattern = line.match(/^([A-ZÀ-ÿ\s\(\)]+?):\s*\((texto [^)]+)\)\s*$/);
    console.log(`🔍 [PARSE] Testando Padrão 6 (seção) em "${line}":`, sectionFieldPattern);
    if (sectionFieldPattern) {
      const label = sectionFieldPattern[1].trim();
      const typeHint = sectionFieldPattern[2].trim();
      const key = normalizeKey(label);
      if (!addedKeys.has(key)) {
        const fieldType = getFieldTypeFromHint(typeHint);
        fields.push({
          key,
          label,
          type: fieldType,
          placeholder: getPlaceholder(label, fieldType, '')
        });
        addedKeys.add(key);
        console.log(`✅ [SECTION-FIELD] Campo capturado: "${label}" -> key: "${key}"`);
      }
      continue;
    }

    // Padrão 2: Campos de data - CAMPO: __/__/____
    const dateFieldMatch = line.match(/^([A-ZÁÊÇÕ\s]+):\s*__\/__\/____/);
    if (dateFieldMatch) {
      const label = dateFieldMatch[1].trim();
      const key = normalizeKey(label);
      if (!addedKeys.has(key)) {
        fields.push({
          key,
          label,
          type: 'date',
          placeholder: 'DD/MM/AAAA'
        });
        addedKeys.add(key);
      }
      continue;
    }

    // Padrão 3: Campos com underscores longos - CAMPO _____
    const underscoreFieldMatch = line.match(/^([A-ZÁÊÇÕ\s\(\)]+)\s+_{3,}/);
    if (underscoreFieldMatch) {
      const label = underscoreFieldMatch[1].trim();
      const key = normalizeKey(label);
      if (!addedKeys.has(key)) {
        const fieldType = getFieldType(key, label);
        fields.push({
          key,
          label,
          type: fieldType,
          placeholder: getPlaceholder(label, fieldType)
        });
        addedKeys.add(key);
      }
      continue;
    }

    // Padrão 4: Seções com dois pontos seguidas de ponto e underscores
    const sectionMatch = line.match(/^([A-ZÁÊÇÕ\s]+):\s*$/);
    if (sectionMatch) {
      const label = sectionMatch[1].trim();
      const key = normalizeKey(label);

      // Verificar se a próxima linha tem ponto com underscores
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
      const hasDotField = nextLine.match(/^\.\s+_{3,}/);
      if (hasDotField && !addedKeys.has(key)) {
        fields.push({
          key,
          label,
          type: 'textarea',
          placeholder: getPlaceholder(label, 'textarea')
        });
        addedKeys.add(key);
      }
      continue;
    }

    // Padrão 5: Linhas que começam com ponto e underscores
    const dotFieldMatch = line.match(/^\.\s+_{2,}/);
    if (dotFieldMatch && i > 0) {
      const prevLine = lines[i - 1].trim();
      const prevSectionMatch = prevLine.match(/^([A-ZÁÊÇÕ\s]+):\s*$/);
      if (prevSectionMatch) {
        const label = prevSectionMatch[1].trim();
        const key = normalizeKey(label);
        if (!addedKeys.has(key)) {
          fields.push({
            key,
            label,
            type: 'textarea',
            placeholder: getPlaceholder(label, 'textarea')
          });
          addedKeys.add(key);
        }
      }
      continue;
    }

    // Padrão 6: Campos complexos com múltiplos underscores
    const complexFieldMatch = line.match(/^([A-ZÁÊÇÕ\s]+):\s*_{3,}[A-Z\s\+\-]*_{3,}/);
    if (complexFieldMatch) {
      const label = complexFieldMatch[1].trim();
      const key = normalizeKey(label);
      if (!addedKeys.has(key)) {
        const fieldType = getFieldType(key, label);
        fields.push({
          key,
          label,
          type: fieldType,
          placeholder: getPlaceholder(label, fieldType)
        });
        addedKeys.add(key);
      }
      continue;
    }

    // Padrão 7: Campo específico IG (IDADE GESTACIONAL)
    const igFieldMatch = line.match(/^IG\s*\(IDADE GESTACIONAL\)\s+_{3,}/);
    if (igFieldMatch) {
      const key = 'idadegestacional';
      if (!addedKeys.has(key)) {
        fields.push({
          key,
          label: 'IDADE GESTACIONAL',
          type: 'input',
          placeholder: 'Semanas e dias (ex: 32s 4d)'
        });
        addedKeys.add(key);
      }
      continue;
    }

    // Padrão 8: Campos simples com underscores no final - CAMPO ___
    const simpleFieldMatch = line.match(/^([A-ZÁÊÇÕ\s\(\)]+)\s+_{2,}$/);
    if (simpleFieldMatch) {
      const label = simpleFieldMatch[1].trim();
      const key = normalizeKey(label);
      if (!addedKeys.has(key)) {
        const fieldType = getFieldType(key, label);
        fields.push({
          key,
          label,
          type: fieldType,
          placeholder: getPlaceholder(label, fieldType)
        });
        addedKeys.add(key);
      }
      continue;
    }

    // Padrão 9: Campos especiais como AF (MAIOR BOLSÃO VERTICAL): __MM
    const specialFieldMatch = line.match(/^([A-Z]+)\s*\([^)]+\):\s*_{2,}([A-Z]*)$/);
    if (specialFieldMatch) {
      const fullLabel = line.match(/^([^:]+):/)?.[1]?.trim() || '';
      const key = normalizeKey(specialFieldMatch[1]);
      if (!addedKeys.has(key) && fullLabel) {
        const unit = specialFieldMatch[2] || '';
        const fieldType = getFieldType(key, fullLabel);
        fields.push({
          key,
          label: fullLabel,
          type: fieldType,
          placeholder: getPlaceholder(fullLabel, fieldType, unit)
        });
        addedKeys.add(key);
      }
      continue;
    }

    // Se chegou até aqui, nenhum padrão foi reconhecido
    console.log(`⚠️ [PARSE] Linha não reconhecida: "${line}"`);
    if (modelName.includes('OBSTÉTRICA')) {
      console.log(`⚠️ [OBSTÉTRICO] Linha não reconhecida: "${line}"`);
    }
  }
  console.log('🔍 [PARSE] ===== RESULTADO FINAL =====');
  console.log('🔍 [PARSE] Total de campos encontrados:', fields.length);
  console.log('🔍 [PARSE] Campos:', fields.map(f => ({
    label: f.label,
    key: f.key,
    type: f.type
  })));
  console.log('🔍 [PARSE] ===== FIM parseTemplateToFields =====');
  return {
    fields,
    template
  };
};
interface ResultadoExamesProps {
  patientId?: string;
  examResults: string;
  onExamResultsChange: (value: string) => void;
  examObservations: string;
  onExamObservationsChange: (value: string) => void;
  isProcessingAI: {
    examResults: boolean;
  };
  onProcessWithAI: (selectedFieldsKeys?: string[]) => void;
  onSelectedModelChange?: (modelTitle: string | null) => void;
  onDynamicFieldsChange?: (fields: Record<string, string>) => void;
  processAIContent?: (field: string, content: string, dynamicFields?: Record<string, string>, selectedFieldsKeys?: string[]) => Promise<void>;
  updateDynamicFieldsFromAI?: (fields: Record<string, string>) => void;
  dynamicFields?: Record<string, string>;
  initialSelectedModelId?: string;
  onModelIdChange?: (modelId: string) => void;
}
export const ResultadoExames: React.FC<ResultadoExamesProps> = ({
  patientId,
  examResults,
  onExamResultsChange,
  examObservations,
  onExamObservationsChange,
  isProcessingAI,
  onProcessWithAI,
  onSelectedModelChange,
  onDynamicFieldsChange,
  processAIContent: processAIContentProp,
  updateDynamicFieldsFromAI,
  dynamicFields: dynamicFieldsFromProps,
  initialSelectedModelId,
  onModelIdChange
}) => {
  const isMobile = useIsMobile();
  console.log('🚀 ResultadoExames renderizado - PatientId:', patientId);
  console.log('🔧 [INIT] initialSelectedModelId recebido:', initialSelectedModelId);
  const [completedExams, setCompletedExams] = useState<ExamModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<ExamModel | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ParsedTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<Record<string, string>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<{
    key: string;
    label: string;
  } | null>(null);
  const [selectedFieldValues, setSelectedFieldValues] = useState<Record<string, string[]>>({});
  const [isSavingField, setIsSavingField] = useState<string | null>(null);
  const [isProcessingField, setIsProcessingField] = useState<string | null>(null);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());
  const [missingFields, setMissingFields] = useState<DynamicField[]>([]);
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [allModelFields, setAllModelFields] = useState<DynamicField[]>([]);
  const [lastUsedPrompt, setLastUsedPrompt] = useState<string | null>(null);
  const [showPromptDebug, setShowPromptDebug] = useState(false);
  const [selectedAIFields, setSelectedAIFields] = useState<Set<string>>(new Set());
  const isUpdatingRef = useRef(false);
  
  // Estado para arrastar o modal no desktop
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (window.innerWidth < 768) return; // Só arrasta no desktop
    setIsDragging(true);
    setDragStart({
      x: e.clientX - modalPosition.x,
      y: e.clientY - modalPosition.y
    });
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setModalPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Texto fixo para observações
  const FIXED_OBSERVATIONS = `- A avaliação do bem-estar e a conduta clínica devem ser individualizadas e baseadas na avaliação completa da paciente pelo profissional médico, que deverá tomar a conduta final.\n- Exame realizado conforme Resolução Cofen 679/2021, que autoriza enfermeiros especialistas a executar ultrassonografia à beira do leito e em ambiente pré-hospitalar.`;

  const hasInitializedAIFields = useRef<string | null>(null);

  // Inicializar selectedAIFields quando o template mudar ou campos forem carregados (rascunho)
  useEffect(() => {
    if (selectedTemplate && hasInitializedAIFields.current !== selectedTemplate.id) {
      const instruction = '(INFORME EM IMPRESSÃO DIAGNÓSTICA.)';
      const initialSelected = new Set<string>();
      let hasFoundDraftInstructions = false;

      // Verificar se algum campo já tem a instrução (caso de rascunho)
      selectedTemplate.fields.forEach(field => {
        const value = dynamicFields[field.key] || '';
        if (value.includes(instruction)) {
          initialSelected.add(field.key);
          hasFoundDraftInstructions = true;
        }
      });

      // Só marcamos o modelo como "inicializado" se:
      // 1. Encontramos instruções de rascunho (rascunho carregado)
      // 2. OU se os dynamicFields estão vazios (novo modelo sendo selecionado)
      const isNewModel = Object.keys(dynamicFields).length === 0;
      
      if (hasFoundDraftInstructions || isNewModel) {
        console.log('🎯 [AI-SELECT] Inicializando checkboxes:', { 
          model: selectedTemplate.name, 
          isNewModel, 
          hasFoundDraftInstructions,
          selected: Array.from(initialSelected)
        });
        setSelectedAIFields(initialSelected);
        hasInitializedAIFields.current = selectedTemplate.id;
      }
    }
  }, [selectedTemplate, dynamicFields]);

  // Resetar o ref de inicialização se o modelo mudar para string vazia
  useEffect(() => {
    if (!selectedModelId) {
      hasInitializedAIFields.current = null;
    }
  }, [selectedModelId]);

  // Hook para transcrição de voz global
  const {
    isRecording: isRecordingGlobal,
    toggleRecording: toggleRecordingGlobal
  } = useWhisperTranscription({
    onTranscriptionComplete: async (text) => {
      console.log('🎙️ [VOICE-GLOBAL] Transcrição recebida:', text);
      if (!text.trim()) return;

      setIsProcessingVoice(true);
      const loadingToast = toast.loading('Processando comandos de voz...');

      try {
        const availableFieldsList = selectedTemplate?.fields.map(f => ({
          key: f.key,
          label: f.label
        })) || [];

        const { data, error } = await supabase.functions.invoke('ai-webhook', {
          body: {
            text,
            type: 'voice_command',
            availableFields: availableFieldsList,
            selectedModelId: selectedModel?.id || null,
            selectedModelTitle: selectedModel?.name || null
          }
        });

        if (error) throw error;

        if (data?.individual_fields) {
          const aiResults = data.individual_fields;
          const updatedKeys = Object.keys(aiResults);
          
          // Verificar se o campo observações deve receber texto fixo
          if (!aiResults.observacoes && !dynamicFields.observacoes) {
            aiResults.observacoes = FIXED_OBSERVATIONS;
            updatedKeys.push('observacoes');
          }

          // Identificar campos que NÃO foram preenchidos (ignorando Percentil)
          const missing = selectedTemplate?.fields.filter(f => 
            !aiResults[f.key] && !dynamicFields[f.key] && !f.key.toLowerCase().includes('percentil')
          ) || [];

          // Marcar campos modificados para destaque visual
          setModifiedFields(new Set(updatedKeys));
          
          // Limpar destaque após 5 segundos
          setTimeout(() => setModifiedFields(new Set()), 5000);

          const newFields = {
            ...dynamicFields,
            ...aiResults
          };
          
          setDynamicFields(newFields);
          updateExamResults(newFields);
          
          if (missing.length > 0) {
            // Guardar todos os campos do modelo atual para exibição completa se necessário
            setAllModelFields(selectedTemplate?.fields || []);
            setMissingFields(missing);
            setShowMissingModal(true);
          }

          toast.success(`${updatedKeys.length} campo(s) atualizado(s) via voz!`, { id: loadingToast });
        } else {
          toast.info('Nenhuma informação mapeada para os campos.', { id: loadingToast });
        }
      } catch (err) {
        console.error('❌ [VOICE] Erro ao processar comando de voz:', err);
        toast.error('Erro ao processar comando de voz', { id: loadingToast });
      } finally {
        setIsProcessingVoice(false);
      }
    }
  });

  // Hook para gerenciar templates salvos
  const {
    templates,
    isLoading: isLoadingTemplates,
    searchFieldTemplates,
    saveFieldTemplate,
    updateFieldTemplate,
    deleteFieldTemplate,
    isSaving,
    isDeleting
  } = useIndividualFieldTemplates();

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
      await deleteFieldTemplate(option.id);
    } catch (e) {
      console.error('Erro ao excluir:', e);
    }
  };

  // Hook para processamento de IA (fallback se não vier das props)
  const {
    processAIContent: processAIContentLocal
  } = useAIProcessing();

  // Criar processAIContent customizado que inclui updateDynamicFieldsFromAI
  const processAIContentWithCallback = React.useCallback(async (field: 'main_complaint' | 'evolution' | 'exam_result', content: string, dynamicFieldsParam?: Record<string, string>, selectedFieldsKeys?: string[]) => {
    if (processAIContentProp) {
      // processAIContentProp tem assinatura: (field: string, content: string, dynamicFields?: Record<string, string>, selectedFieldsKeys?: string[])
      console.log('🔄 [ResultadoExames] Usando processAIContent das props');
      await processAIContentProp(field, content, dynamicFieldsParam, selectedFieldsKeys);
    } else {
      // processAIContentLocal tem assinatura: (content, type, onSuccess, selectedModelTitle, dynamicFields, selectedModelId, selectedFieldsKeys)
      console.log('🔄 [ResultadoExames] Usando processAIContent local');
      await processAIContentLocal(content, field, processed => {
        console.log('✅ Conteúdo processado via local');
      }, null, dynamicFieldsParam, null, selectedFieldsKeys);
    }
  }, [processAIContentProp, processAIContentLocal]);

  // Usar o processAIContent customizado
  const processAIContent = processAIContentWithCallback;

  // Ref para rastrear o último modelo selecionado e evitar duplicação de dados
  const lastSelectedModelIdRef = React.useRef<string | null>(null);

  // useEffect para rastrear mudanças de modelo - NÃO interfere no examResults
  // O updateExamResults é responsável por gerar o resultado APENAS com campos preenchidos
  useEffect(() => {
    if (selectedModel && selectedModel.id) {
      console.log('🎯 [EFFECT] Modelo selecionado:', selectedModel.name);
      
      // Apenas atualizar a referência para rastrear mudanças
      if (lastSelectedModelIdRef.current !== selectedModel.id) {
        console.log('🔄 [EFFECT] Modelo mudou de', lastSelectedModelIdRef.current, 'para', selectedModel.id);
        lastSelectedModelIdRef.current = selectedModel.id;
      }
    }
  }, [selectedModel]);

  // Ref para rastrear se os campos dinâmicos foram atualizados externamente
  const externalFieldsRef = React.useRef<Record<string, string>>({});

  // Função local para atualizar campos dinâmicos vindos do processamento de IA
  const updateLocalDynamicFieldsFromAI = React.useCallback((aiFields: Record<string, string>) => {
    console.log('🎯 [AI-UPDATE] ===== INÍCIO updateLocalDynamicFieldsFromAI =====');
    console.log('🎯 [AI-UPDATE] Campos recebidos da IA:', aiFields);
    console.log('🎯 [AI-UPDATE] Campos atuais antes da mesclagem:', dynamicFields);

    // Marcar que os campos foram atualizados pela IA (timestamp)
    aiUpdateRef.current = Date.now();
    console.log('🎯 [AI-UPDATE] Timestamp aiUpdateRef.current definido como:', aiUpdateRef.current);

    // Mesclar com campos existentes, preservando valores existentes
    const formattedAIFields: Record<string, string> = {};
    Object.entries(aiFields).forEach(([key, value]) => {
      // Se a chave for explicitamente "titulo_campo_NOME", vamos mapear de volta para "NOME"
      const cleanKey = key.startsWith('titulo_campo_') ? key.replace('titulo_campo_', '') : key;
      
      let cleanValue = value;
      // Procura o label real do campo nos campos do modelo (se existir)
      const targetField = selectedTemplate?.fields?.find(f => f.key === cleanKey);
      if (targetField && targetField.label) {
        const escapedLabel = targetField.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapar caracteres especiais
        const prefixRegex = new RegExp(`^${escapedLabel}[\\s:]*`, 'i');
        cleanValue = cleanValue.replace(prefixRegex, '').trim();
      }
      
      // Maiúscula na primeira letra
      if (cleanValue.length > 0) {
        cleanValue = cleanValue.charAt(0).toUpperCase() + cleanValue.slice(1);
      }

      formattedAIFields[cleanKey] = formatFieldValue(cleanKey, cleanValue);
    });

    const mergedFields = {
      ...dynamicFields,
      ...formattedAIFields
    };
    console.log('🎯 [AI-UPDATE] Campos após mesclagem:', mergedFields);
    console.log('🎯 [AI-UPDATE] Quantidade de campos mesclados:', Object.keys(mergedFields).length);

    // Atualizar estado local
    console.log('🎯 [AI-UPDATE] Chamando setDynamicFields...');
    setDynamicFields(mergedFields);

    // SEMPRE atualizar o Resultado Final com os campos mesclados
    if (selectedTemplate && selectedModel) {
      console.log('🎯 [AI-UPDATE] Atualizando Resultado Final com campos individuais...');
      updateExamResults(mergedFields);
    } else {
      console.log('⚠️ [AI-UPDATE] Template ou modelo não disponível para atualização');
    }

    console.log('🎯 [AI-UPDATE] ===== FIM updateLocalDynamicFieldsFromAI =====');
  }, [dynamicFields, selectedTemplate, selectedModel, onDynamicFieldsChange, dynamicFieldsFromProps]);

  // SOLUÇÃO: Sempre usar a função local, ignorando a das props
  // Isso garante que os campos sejam atualizados corretamente
  const effectiveUpdateDynamicFieldsFromAI = updateLocalDynamicFieldsFromAI;

  // Ref para rastrear quando os campos foram atualizados pela IA (timestamp)
  const aiUpdateRef = React.useRef(0);

  // Sincronizar dynamicFields local com as props (apenas se não estiver vazio e não foi atualizado pela IA)
  useEffect(() => {
    console.log('🔄 [SYNC] ===== INÍCIO Sincronização =====');
    console.log('🔄 [SYNC] dynamicFieldsFromProps:', dynamicFieldsFromProps);
    console.log('🔄 [SYNC] aiUpdateRef.current:', aiUpdateRef.current);
    console.log('🔄 [SYNC] dynamicFields locais atuais:', dynamicFields);
    const now = Date.now();
    const timeSinceAIUpdate = now - aiUpdateRef.current;
    const isRecentAIUpdate = timeSinceAIUpdate < 5000; // 5 segundos

    console.log('🔄 [SYNC] Tempo desde última atualização da IA:', timeSinceAIUpdate, 'ms');
    console.log('🔄 [SYNC] É atualização recente da IA:', isRecentAIUpdate);

    if (dynamicFieldsFromProps && !isRecentAIUpdate) {
      console.log('🔄 [SYNC] Condições atendidas para sincronização');

      // Verificar se as props são realmente diferentes dos campos locais atuais para evitar loops infinitos
      const hasChanges = Object.entries(dynamicFieldsFromProps).some(([key, value]) => {
        return dynamicFields[key] !== value;
      });

      if (!hasChanges) {
        console.log('⏭️ [SYNC] Campos idênticos aos locais, ignorando para evitar loop');
        console.log('🔄 [SYNC] ===== FIM Sincronização =====');
        return;
      }

      // Verificar se as props têm conteúdo válido
      const hasValidContent = Object.values(dynamicFieldsFromProps).some(value => value && value.trim());
      console.log('🔄 [SYNC] Props têm conteúdo válido:', hasValidContent);
      if (hasValidContent) {
        console.log('✅ [SYNC] MESCLANDO campos da IA com campos locais!');
        console.log('✅ [SYNC] Campos locais antes:', dynamicFields);
        console.log('✅ [SYNC] Campos da IA:', dynamicFieldsFromProps);

        // Limpar possíveis prefixos de rótulos dos valores vindos da IA global
        const cleanedPropsFields: Record<string, string> = {};
        Object.entries(dynamicFieldsFromProps).forEach(([key, value]) => {
          let cleanValue = value;
          const targetField = selectedTemplate?.fields?.find(f => f.key === key);
          if (targetField && targetField.label && cleanValue) {
            const escapedLabel = targetField.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const prefixRegex = new RegExp(`^${escapedLabel}[\\s:]*`, 'i');
            cleanValue = cleanValue.replace(prefixRegex, '').trim();
            
            if (cleanValue.length > 0) {
              cleanValue = cleanValue.charAt(0).toUpperCase() + cleanValue.slice(1);
            }
          }
          cleanedPropsFields[key] = cleanValue;
        });

        // MESCLAR em vez de sobrescrever - preservar campos existentes
        const mergedFields = {
          ...dynamicFields,
          ...cleanedPropsFields
        };
        console.log('✅ [SYNC] Campos mesclados:', mergedFields);
        setDynamicFields(mergedFields);

        // Atualizar o template com os campos mesclados
        if (selectedTemplate && selectedModel) {
          updateExamResults(mergedFields);
        }
      } else {
        console.log('⚠️ [SYNC] Props estão vazias, mantendo campos locais');
      }
    } else if (isRecentAIUpdate) {
      console.log('🤖 [SYNC] Ignorando sincronização - campos foram atualizados pela IA há', timeSinceAIUpdate, 'ms');
    } else if (!dynamicFieldsFromProps) {
      console.log('⚠️ [SYNC] dynamicFieldsFromProps é null/undefined');
    }
    console.log('🔄 [SYNC] ===== FIM Sincronização =====');
  }, [dynamicFieldsFromProps, dynamicFields, selectedTemplate, selectedModel]);
  useEffect(() => {
    const fetchCompletedExams = async () => {
      try {
        console.log('📥 [FETCH] ===== BUSCANDO MODELOS =====');
        setIsLoading(true);

        // Acessar diretamente a tabela modelo-result-exames
        const {
          data,
          error
        } = await supabase.from('modelo-result-exames').select('id, name, result_template, ai_prompt').order('name');
        console.log('📥 [FETCH] Resposta do banco:', {
          data,
          error
        });
        if (error) {
          console.error('❌ [FETCH] Erro ao buscar modelos de exames:', error);
          toast.error('Erro ao carregar modelos de exames');
          return;
        }
        console.log('✅ [FETCH] Modelos carregados:', data?.length || 0);
        console.log('✅ [FETCH] Dados:', data);
        setCompletedExams(data || []);
      } catch (error) {
        console.error('❌ [FETCH] Erro ao buscar modelos de exames:', error);
        toast.error('Erro ao carregar modelos de exames');
      } finally {
        setIsLoading(false);
        console.log('📥 [FETCH] ===== FIM BUSCA =====');
      }
    };
    fetchCompletedExams();
  }, []);

  // useEffect para restaurar modelo selecionado quando initialSelectedModelId for fornecido
  // Usar ref para rastrear o último ID restaurado e evitar loops infinitos
  const lastRestoredIdRef = React.useRef<string | null>(null);
  useEffect(() => {
    console.log('🔧 [RESTORE] ===== INÍCIO Restauração do Modelo =====');
    console.log('🔧 [RESTORE] initialSelectedModelId:', initialSelectedModelId);
    console.log('🔧 [RESTORE] completedExams carregados:', completedExams.length);
    console.log('🔧 [RESTORE] selectedModelId atual:', selectedModelId);
    console.log('🔧 [RESTORE] lastRestoredId:', lastRestoredIdRef.current);

    // Só restaurar se:
    // 1. initialSelectedModelId foi fornecido
    // 2. completedExams já foi carregado
    // 3. initialSelectedModelId é diferente do selectedModelId atual (permitir restauração mesmo se já tem um modelo)
    // 4. Ainda não restauramos este ID específico (evitar loops)
    if (initialSelectedModelId && completedExams.length > 0 && initialSelectedModelId !== selectedModelId && lastRestoredIdRef.current !== initialSelectedModelId) {
      console.log('🔧 [RESTORE] Condições atendidas, restaurando modelo...');
      const modelToRestore = completedExams.find(exam => exam.id === initialSelectedModelId);
      console.log('🔧 [RESTORE] Modelo encontrado:', modelToRestore);
      if (modelToRestore) {
        console.log('🔧 [RESTORE] Restaurando modelo:', modelToRestore.name);

        // Marcar este ID como restaurado
        lastRestoredIdRef.current = initialSelectedModelId;

        // Restaurar estado do modelo
        setSelectedModelId(initialSelectedModelId);
        setSelectedModel(modelToRestore);
        onSelectedModelChange?.(modelToRestore.name);

        // Parsear template e restaurar campos
        if (modelToRestore.result_template) {
          const parsedTemplate = parseTemplateToFields(modelToRestore.result_template, modelToRestore.name);
          setSelectedTemplate(parsedTemplate);
          
          const orderedKeys = parsedTemplate.fields.map(f => f.key).join(',');

          // Se tiver dynamicFieldsFromProps, usar eles; senão inicializar vazio
          if (dynamicFieldsFromProps && Object.keys(dynamicFieldsFromProps).length > 0) {
            console.log('🔧 [RESTORE] Restaurando campos dinâmicos das props:', dynamicFieldsFromProps);
            const restoredFields = { ...dynamicFieldsFromProps, _ordered_keys: orderedKeys };
            setDynamicFields(restoredFields);
          } else {
            console.log('🔧 [RESTORE] Inicializando campos dinâmicos vazios');
            const newFields: Record<string, string> = { _ordered_keys: orderedKeys };
            parsedTemplate.fields.forEach(field => {
              newFields[field.key] = '';
            });
            setDynamicFields(newFields);
          }
        }
      } else {
        console.warn('⚠️ [RESTORE] Modelo não encontrado na lista de modelos');
      }
    } else {
      console.log('🔧 [RESTORE] Condições não atendidas:', {
        temInitialId: !!initialSelectedModelId,
        temExames: completedExams.length > 0,
        idsDiferentes: initialSelectedModelId !== selectedModelId,
        naoRestauradoAinda: lastRestoredIdRef.current !== initialSelectedModelId
      });
    }
    console.log('🔧 [RESTORE] ===== FIM Restauração do Modelo =====');
  }, [initialSelectedModelId, completedExams, dynamicFieldsFromProps, selectedModelId]);

  // Handler para mudança de valores multi-selecionados dos campos
  const handleFieldModelChange = (fieldKey: string, selectedContents: string[]) => {
    console.log('📝 [MULTI-SELECT] ===== INÍCIO handleFieldModelChange =====');
    console.log('📝 [MULTI-SELECT] Campo:', fieldKey);
    console.log('📝 [MULTI-SELECT] Conteúdos selecionados:', selectedContents);
    console.log('📝 [MULTI-SELECT] Quantidade:', selectedContents.length);

    // Atualizar valores selecionados (são os conteúdos, não IDs)
    setSelectedFieldValues(prev => {
      const updated = {
        ...prev,
        [fieldKey]: selectedContents
      };
      console.log('📝 [MULTI-SELECT] selectedFieldValues atualizado:', updated);
      return updated;
    });

    // Concatenar os valores selecionados sem separadores extras
    const joinedValue = selectedContents.join('\n\n');
    console.log('📝 [MULTI-SELECT] Valor concatenado:', joinedValue);
    console.log('📝 [MULTI-SELECT] Tamanho do valor:', joinedValue.length);

    // Atualizar campo de texto
    const newFields = {
      ...dynamicFields,
      [fieldKey]: joinedValue
    };
    console.log('📝 [MULTI-SELECT] dynamicFields ANTES:', dynamicFields);
    console.log('📝 [MULTI-SELECT] dynamicFields DEPOIS:', newFields);
    setDynamicFields(newFields);
    updateExamResults(newFields);

    console.log('📝 [MULTI-SELECT] ===== FIM handleFieldModelChange =====');
  };

  // useEffect para calcular percentil automaticamente quando PESO ou IG mudarem
  useEffect(() => {
    console.log('🔄 [AUTO-PERCENTIL] ===== VERIFICANDO CÁLCULO AUTOMÁTICO =====');
    const isObstetricModel = selectedModel?.name?.includes('OBSTÉTRICA');
    console.log('🔄 [AUTO-PERCENTIL] É modelo obstétrico?', isObstetricModel);
    console.log('🔄 [AUTO-PERCENTIL] selectedModel:', selectedModel?.name);
    console.log('🔄 [AUTO-PERCENTIL] dynamicFields:', dynamicFields);
    if (!isObstetricModel || !selectedModel) {
      console.log('⏭️ [AUTO-PERCENTIL] Não é modelo obstétrico ou modelo não selecionado, pulando');
      return;
    }

    // Verificar se temos PESO e IG preenchidos
    const pesoKey = Object.keys(dynamicFields).find(k => k.toLowerCase() === 'peso');
    const igKey = Object.keys(dynamicFields).find(k => k.toLowerCase() === 'ig');
    const pesoValue = pesoKey ? dynamicFields[pesoKey] : null;
    const igValue = igKey ? dynamicFields[igKey] : null;
    console.log('🔄 [AUTO-PERCENTIL] PESO key:', pesoKey, 'value:', pesoValue);
    console.log('🔄 [AUTO-PERCENTIL] IG key:', igKey, 'value:', igValue);
    if (!pesoValue || !igValue) {
      console.log('⏭️ [AUTO-PERCENTIL] PESO ou IG não preenchidos, aguardando...');
      return;
    }
    console.log('✅ [AUTO-PERCENTIL] PESO e IG preenchidos, iniciando cálculo...');

    // Calcular percentil
    const calculation = calculateFetalPercentile(dynamicFields);
    console.log('🔄 [AUTO-PERCENTIL] Resultado do cálculo:', calculation);
    if (calculation) {
      console.log('✅ [AUTO-PERCENTIL] Percentil calculado:', calculation);

      // Encontrar campo PERCENTIL
      const percentilKey = Object.keys(dynamicFields).find(k => k.toLowerCase().includes('percentil'));
      console.log('🔄 [AUTO-PERCENTIL] Campo PERCENTIL key:', percentilKey);
      if (percentilKey) {
        // Adicionar alerta se houver
        let formattedValue = calculation.formattedResult;
        if (calculation.warning) {
          formattedValue = `${calculation.formattedResult}\n\n${calculation.warning}`;
        }

        // Verificar se o valor já está correto (evitar loops)
        const currentPercentilValue = dynamicFields[percentilKey];
        if (currentPercentilValue === formattedValue) {
          console.log('⏭️ [AUTO-PERCENTIL] Percentil já está atualizado, pulando');
          return;
        }
        console.log('🔄 [AUTO-PERCENTIL] Atualizando campo PERCENTIL de:', currentPercentilValue);
        console.log('🔄 [AUTO-PERCENTIL] Para:', formattedValue);

        // Atualizar campo PERCENTIL
        const newFields = {
          ...dynamicFields,
          [percentilKey]: formattedValue
        };
        setDynamicFields(newFields);
        updateExamResults(newFields);

        toast.success(`Percentil calculado: ${calculation.formattedResult}`);
        console.log('✅ [AUTO-PERCENTIL] Campo PERCENTIL atualizado com sucesso!');
      } else {
        console.log('⚠️ [AUTO-PERCENTIL] Campo PERCENTIL não encontrado no template');
      }
    } else {
      console.log('⚠️ [AUTO-PERCENTIL] Cálculo falhou (verificar logs de calculateFetalPercentile)');
    }
    console.log('🔄 [AUTO-PERCENTIL] ===== FIM VERIFICAÇÃO =====');
  }, [dynamicFields, selectedModel, onDynamicFieldsChange]);

  // Função central para formatar valores de campos
  const formatFieldValue = (key: string, value: any): string => {
    try {
      // Conversão ultra-segura para string
      const stringValue = (value === null || value === undefined) ? '' : String(value);
      
      if (!stringValue || stringValue.trim() === '') return '';

      const lowerKey = (key || '').toLowerCase();

      // 1. Formatação de Peso: apenas números + "g"
      if (lowerKey === 'peso') {
        const numbers = stringValue.replace(/\D/g, '');
        return numbers ? `${numbers}g` : '';
      }

      // 2. Formatação de Data
      if (lowerKey.includes('data') || lowerKey === 'dpp') {
        const naturalParsed = parseNaturalDate(stringValue);
        if (naturalParsed !== stringValue) {
          return naturalParsed;
        }
        if (stringValue.includes('-') && stringValue.length === 10) {
          const [y, m, d] = stringValue.split('-');
          return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
        }
        if (stringValue.includes('/')) {
          const parts = stringValue.split('/');
          if (parts.length === 3) {
            const [d, m, y] = parts;
            return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
          }
        }
      }

      // 3. Formatação de Impressão Diagnóstica: quebra de linha após cada ponto
      if (lowerKey === 'impressaodiagnostica') {
        return stringValue
          .replace(/\.\s+/g, '.\n')
          .replace(/\n\s+/g, '\n');
      }

      return stringValue;
    } catch (error) {
      console.error(`❌ Erro ao formatar campo ${key}:`, error);
      return String(value || '');
    }
  };

  // Handler para mudança direta do texto do campo
  const handleFieldTextChange = (fieldKey: string, value: string) => {
    console.log('📝 [TEXT-CHANGE] ===== INÍCIO handleFieldTextChange =====');
    console.log('📝 [TEXT-CHANGE] Campo:', fieldKey, 'Valor:', value);

    const instruction = '(INFORME EM IMPRESSÃO DIAGNÓSTICA.)';
    
    // Sincronizar o checkbox se o usuário digitar ou apagar a instrução manualmente
    if (value.includes(instruction)) {
      if (!selectedAIFields.has(fieldKey)) {
        console.log(`✅ [TEXT-CHANGE] Instrução detectada manualmente, marcando checkbox para ${fieldKey}`);
        setSelectedAIFields(prev => {
          const next = new Set(prev);
          next.add(fieldKey);
          return next;
        });
      }
    } else {
      if (selectedAIFields.has(fieldKey)) {
        console.log(`❌ [TEXT-CHANGE] Instrução removida manualmente, desmarcando checkbox para ${fieldKey}`);
        setSelectedAIFields(prev => {
          const next = new Set(prev);
          next.delete(fieldKey);
          return next;
        });
      }
    }

    const finalValue = formatFieldValue(fieldKey, value);

    const newFields = {
      ...dynamicFields,
      [fieldKey]: finalValue
    };
    console.log('📝 [TEXT-CHANGE] newFields DEPOIS:', newFields);
    setDynamicFields(newFields);

    // 🔍 DEBUG ESPECÍFICO: Impressão Diagnóstica
    if (fieldKey === 'impressaodiagnostica') {
      console.log('🔍 [IMPRESSÃO-DIAGNÓSTICA] newFields DEPOIS:', newFields);
      console.log('🔍 [IMPRESSÃO-DIAGNÓSTICA] Campo está em newFields?', fieldKey in newFields);
      console.log('🔍 [IMPRESSÃO-DIAGNÓSTICA] Valor em newFields:', newFields[fieldKey]);
      console.log('🔍🔍🔍 [IMPRESSÃO-DIAGNÓSTICA] ===== FIM =====');
    }

    // Verificar se é um modelo obstétrico e se mudou PESO ou IG
    const isObstetricModel = selectedModel?.name?.includes('OBSTÉTRICA');
    console.log('📝 [TEXT-CHANGE] É modelo obstétrico?', isObstetricModel);
    console.log('📝 [TEXT-CHANGE] Nome do modelo:', selectedModel?.name);
    const measurementFields = ['peso', 'ig', 'idadegestacional'];
    const isMeasurementField = measurementFields.some(f => fieldKey.toLowerCase().includes(f.toLowerCase()));
    console.log('📝 [TEXT-CHANGE] É campo de medida (peso/ig)?', isMeasurementField);
    console.log('📝 [TEXT-CHANGE] Campo alterado:', fieldKey);
    if (isObstetricModel && isMeasurementField) {
      console.log('🧮 [TEXT-CHANGE] ===== INICIANDO CÁLCULO DE PERCENTIL =====');
      console.log('🧮 [TEXT-CHANGE] Campo obstétrico alterado, calculando percentil...');
      console.log('🧮 [TEXT-CHANGE] newFields sendo enviados para cálculo:', newFields);

      // Tentar calcular percentil (requer PESO e IG)
      const calculation = calculateFetalPercentile(newFields);
      console.log('🧮 [TEXT-CHANGE] Resultado do cálculo:', calculation);
      if (calculation) {
        console.log('✅ [TEXT-CHANGE] Cálculo realizado com sucesso:', calculation);

        // Atualizar campo PERCENTIL
        const percentilField = Object.keys(newFields).find(k => k.toLowerCase().includes('percentil'));
        console.log('✅ [TEXT-CHANGE] Campo PERCENTIL encontrado:', percentilField);
        if (percentilField) {
          // Adicionar alerta se houver
          let formattedValue = calculation.formattedResult;
          if (calculation.warning) {
            formattedValue = `${calculation.formattedResult}\n\n${calculation.warning}`;
          }
          newFields[percentilField] = formattedValue;
          console.log('📊 [TEXT-CHANGE] Campo PERCENTIL atualizado:', newFields[percentilField]);
          toast.success(`Percentil calculado: ${calculation.formattedResult}`);
        }

        // Atualizar estado novamente com o percentil calculado
        setDynamicFields(newFields);
      } else {
        console.log('⚠️ [TEXT-CHANGE] Não foi possível calcular o percentil');
        console.log('⚠️ [TEXT-CHANGE] Verificar se PESO e IG estão preenchidos corretamente');
      }
      console.log('🧮 [TEXT-CHANGE] ===== FIM CÁLCULO DE PERCENTIL =====');
    }
    updateExamResults(newFields);

    console.log('📝 [TEXT-CHANGE] ===== FIM handleFieldTextChange =====');
  };
  const handleModelSelect = (modelId: string) => {
    console.log('🎯 [SELECT] ===== MODELO SELECIONADO =====');
    console.log('🎯 [SELECT] Model ID:', modelId);
    console.log('🎯 [SELECT] handleModelSelect CHAMADO!');
    const selectedModel = completedExams.find(exam => exam.id === modelId);
    console.log('🎯 [SELECT] Modelo encontrado:', selectedModel);
    if (selectedModel) {
      console.log('🧹 [SELECT] LIMPANDO campos do modelo anterior...');

      // RESETAR campos dinâmicos quando modelo muda
      setDynamicFields({});
      setSelectedFieldValues({});

      // Notificar componente pai para limpar também
      if (onDynamicFieldsChange) {
        onDynamicFieldsChange({});
        console.log('✅ [SELECT] Campos dinâmicos resetados no componente pai');
      }

      // Atualizar os estados (o useEffect vai cuidar de adicionar o título)
      setSelectedModelId(modelId);
      setSelectedModel(selectedModel);

      // Notificar o componente pai sobre a mudança do modelo
      console.log('🎯 [SELECT] Notificando componente pai sobre modelo selecionado:', selectedModel.name);
      if (onSelectedModelChange) {
        onSelectedModelChange(selectedModel.name);
        console.log('✅ [SELECT] Componente pai notificado com selectedModelTitle:', selectedModel.name);
      } else {
        console.warn('⚠️ [SELECT] onSelectedModelChange NÃO está definido!');
      }

      // Notificar o componente pai sobre mudança do ID (para salvar no rascunho)
      onModelIdChange?.(modelId);

      // Parsear o template do banco de dados para gerar campos dinâmicos
      if (selectedModel.result_template) {
        console.log('🎯 [SELECT] Template encontrado, parseando...');
        const parsedTemplate = parseTemplateToFields(selectedModel.result_template, selectedModel.name);
        console.log('🎯 [SELECT] Template parseado:', parsedTemplate);
        setSelectedTemplate(parsedTemplate);

        const orderedKeys = parsedTemplate.fields.map(f => f.key).join(',');

        // Inicializar novos campos vazios para o novo modelo
        const newFields: Record<string, string> = { _ordered_keys: orderedKeys };
        parsedTemplate.fields.forEach(field => {
          newFields[field.key] = '';
        });
        console.log('🎯 [SELECT] Novos campos inicializados:', newFields);
        setDynamicFields(newFields);

        // Notificar componente pai sobre os novos campos
        if (onDynamicFieldsChange) {
          onDynamicFieldsChange(newFields);
        }
        onExamResultsChange('');
      } else {
        console.log('🎯 [SELECT] Nenhum template encontrado');
        // Se não houver template, limpar tudo
        setSelectedTemplate(null);
        setDynamicFields({});
        onExamResultsChange('');
      }
    } else {
      console.log('🎯 [SELECT] Modelo não encontrado');
    }
    console.log('🎯 [SELECT] ===== FIM SELEÇÃO =====');
  };
  const updateExamResults = (fields: Record<string, string>, customTemplate?: any) => {
    try {
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;
      
      console.log('🔄 [UPDATE] ===== INÍCIO updateExamResults =====');
      console.log('🔄 [UPDATE] Campos recebidos:', fields);
      
      if (!selectedTemplate || !selectedModel) {
        console.log('🔄 [UPDATE] Nenhum template ou modelo selecionado, saindo...');
        return;
      }

      // Garantir que fields seja um objeto
      const safeFields = fields && typeof fields === 'object' ? fields : {};

      // Aplicar formatação a todos os campos recebidos
      const enhancedFields: Record<string, string> = {};
      Object.entries(safeFields).forEach(([key, value]) => {
        enhancedFields[key] = formatFieldValue(key, value);
      });

    // Usar o template customizado se fornecido, senão usar o selectedTemplate atual
    const templateToUse = customTemplate || selectedTemplate;

    // NOVO: Calcular percentil fetal automaticamente para modelos obstétricos
    const isObstetricModel = selectedModel?.name?.includes('OBSTÉTRICA');
    if (isObstetricModel) {
      console.log('🧮 [UPDATE] Modelo obstétrico detectado, verificando cálculo de percentil...');
      const calculation = calculateFetalPercentile(enhancedFields);
      if (calculation) {
        console.log('✅ [UPDATE] Percentil calculado:', calculation);

        // Atualizar campo PERCENTIL
        const percentilField = Object.keys(enhancedFields).find(k => k.toLowerCase().includes('percentil'));
        if (percentilField) {
          // Adicionar alerta se houver
          let formattedValue = calculation.formattedResult;
          if (calculation.warning) {
            formattedValue = `${calculation.formattedResult}\n\n${calculation.warning}`;
          }
          enhancedFields[percentilField] = formattedValue;
          console.log('📊 [UPDATE] Campo PERCENTIL atualizado:', enhancedFields[percentilField]);
        }
      }
    }

    // Procurar por campos que contenham "IG" ou "IDADE GESTACIONAL"
    const igField = Object.keys(enhancedFields).find(key => key.toLowerCase().includes('ig') || key.toLowerCase().includes('idadegestacional') || key.toLowerCase().includes('idade') && key.toLowerCase().includes('gestacional'));
    if (igField && enhancedFields[igField]) {
      console.log('🤰 [UPDATE] Campo IG encontrado:', igField, 'Valor:', enhancedFields[igField]);

      // Calcular DUM a partir da IG
      const calculatedDUM = calculateDUMFromIG(enhancedFields[igField]);
      if (calculatedDUM) {
        // Procurar se já existe um campo DUM
        const dumField = Object.keys(enhancedFields).find(key => key.toLowerCase().includes('dum') || key.toLowerCase().includes('dataultimamenstruacao') || key.toLowerCase().includes('data') && key.toLowerCase().includes('ultima') && key.toLowerCase().includes('menstruacao'));
        if (dumField) {
          // Se já existe campo DUM, atualizar apenas se estiver vazio
          if (!enhancedFields[dumField]) {
            enhancedFields[dumField] = calculatedDUM;
            console.log('📅 [UPDATE] DUM calculada e preenchida:', calculatedDUM);
            toast.success('DUM calculada automaticamente a partir da IG');

            // Atualizar o estado dos campos dinâmicos
            setDynamicFields(enhancedFields);
          }
        }
      }
    }

    // Função auxiliar para formatar data
    const formatDate = (dateValue: string): string => {
      if (!dateValue) return '';

      // Se já está no formato DD/MM/YYYY, retornar como está
      if (dateValue.includes('/')) return dateValue;

      // Se está no formato YYYY-MM-DD, converter para DD/MM/YYYY
      if (dateValue.includes('-') && dateValue.length === 10) {
        const [year, month, day] = dateValue.split('-');
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
      return dateValue;
    };

    // ========== NOVA LÓGICA: Gerar resultado APENAS com campos preenchidos ==========
    // Em vez de usar o template e substituir placeholders, vamos construir o resultado
    // apenas com os campos que foram efetivamente preenchidos

    const resultLines: string[] = [];
    
    // Adicionar título do modelo
    const modelTitle = selectedModel?.name || '';
    if (modelTitle) {
      resultLines.push(modelTitle);
      resultLines.push(''); // Linha vazia após o título
    }

    console.log('🔄 [UPDATE] Gerando resultado apenas com campos preenchidos...');

    // Iterar sobre os campos do template e adicionar apenas os preenchidos
    templateToUse.fields.forEach((field: any) => {
      const value = enhancedFields[field.key] || '';
      const formattedValue = field.type === 'date' ? formatDate(value) : value;

      // Só adicionar se o campo tiver valor
      if (formattedValue && formattedValue.trim()) {
        console.log(`✅ [UPDATE] Campo preenchido: ${field.label} = ${formattedValue}`);
        
        // Formatar a linha conforme o tipo de campo
        if (field.type === 'textarea') {
          // Para textarea, colocar o valor em nova linha
          resultLines.push(`${field.label}:`);
          resultLines.push(formattedValue);
        } else {
          // Para outros campos, formato "LABEL: valor"
          resultLines.push(`${field.label}: ${formattedValue}`);
        }
      } else {
        console.log(`⚠️ [UPDATE] Campo vazio (ignorado): ${field.label}`);
      }
    });

    // Montar resultado final
    const result = resultLines.join('\n');
    
    console.log('🔄 [UPDATE] Resultado final gerado (apenas campos preenchidos):', result);
    console.log('🔄 [UPDATE] Total de linhas no resultado:', resultLines.length);
    console.log('🔄 [UPDATE] ===== FIM updateExamResults =====');
    
    onExamResultsChange(result);

    // Notificar o componente pai sobre os campos dinâmicos apenas se houver mudança real
    if (onDynamicFieldsChange) {
      const hasRealChanges = Object.entries(enhancedFields).some(([key, value]) => {
        return dynamicFieldsFromProps?.[key] !== value;
      });

      if (hasRealChanges) {
        console.log('📤 [UPDATE] Notificando componente pai sobre mudanças nos campos dinâmicos');
        onDynamicFieldsChange(enhancedFields);
      } else {
        console.log('⏭️ [UPDATE] Sem mudanças reais nos campos em relação às props, pulando notificação ao pai');
      }
    }
    } catch (error) {
      console.error('❌ Erro crítico em updateExamResults:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  };
  const handleProcessWithAI = async () => {
    // Verificar se há campos dinâmicos preenchidos ou conteúdo no textarea
    const hasFilledDynamicFields = Object.values(dynamicFields).some(value => value?.trim());
    if (!examResults.trim() && !hasFilledDynamicFields) {
      toast.error('Por favor, adicione alguns resultados de exames ou preencha os campos do modelo primeiro');
      return;
    }

    // A CAIXA DE SELEÇÃO NÃO DEVE INFLUENCIAR NO FLUXO ANTERIOR (ENVIAR TODOS OS CAMPOS PREENCHIDOS)
    const allFilledFields: Record<string, string> = {};
    if (selectedTemplate) {
      selectedTemplate.fields.forEach(field => {
        let value = dynamicFields[field.key];
        if (value && value.trim()) {
          // O usuário solicitou que o valor não contenha o prefixo do título, 
          // apenas a chave deve ser explícita.
          let finalValue = value.trim();
          
          // SOLUÇÃO: Se o campo estiver marcado no checkbox, anexar a instrução para a IA
          if (selectedAIFields.has(field.key)) {
            finalValue = `${finalValue} (INFORME EM IMPRESSÃO DIAGNÓSTICA.)`;
          }
          
          // Enviando o nome do campo de forma ultra explícita como chave do JSON
          const explicitKey = `titulo_campo_${field.key}`;
          allFilledFields[explicitKey] = finalValue;
        }
      });
    }

    // Identificar quais campos estão selecionados via checkbox
    const selectedFieldsKeys = Array.from(selectedAIFields);

    console.log('🤖 [AI-GLOBAL] Processando todos os campos preenchidos:', Object.keys(allFilledFields));
    console.log('🤖 [AI-GLOBAL] Campos selecionados para análise de conclusão:', selectedFieldsKeys);

    // Log para verificar a injeção da instrução
    selectedFieldsKeys.forEach(key => {
      if (allFilledFields[key]) {
        console.log(`💉 [AI-GLOBAL] Injeção confirmada no campo ${key}:`, allFilledFields[key].substring(Math.max(0, allFilledFields[key].length - 40)));
      }
    });

    // Se temos a prop processAIContentProp, usamos ela com todos os campos e a lista de selecionados
    if (processAIContentProp) {
      await processAIContentProp('resultadoExames', '', allFilledFields, selectedFieldsKeys);
    } else {
      // Fallback para onProcessWithAI
      onProcessWithAI(selectedFieldsKeys);
    }
  };

  // Nova função para processar um campo individual com IA (ENVIO SELETIVO)
  // Handler para processar um campo individual com IA (ENVIO SELETIVO)
  useEffect(() => {
    if (selectedModel) {
      console.log(`%c 🎯 [PROMPT-CHECK] Modelo: ${selectedModel.name} `, 'background: #222; color: #00bcd4; font-weight: bold;');
      console.log('%c Prompt Personalizado do Modelo:', 'color: #00bcd4;', selectedModel.ai_prompt || 'NENHUM (Usará o global)');
    }
  }, [selectedModel]);

  const handleProcessFieldWithAI = async (field: DynamicField) => {
    // Para o campo de impressão diagnóstica, não exigimos que ele mesmo esteja preenchido,
    // pois ele será formulado a partir dos outros campos selecionados.
    const isImpressao = field.key === 'impressaodiagnostica';
    const fieldValue = dynamicFields[field.key];
    
    if (!isImpressao && !fieldValue?.trim()) {
      toast.error(`Por favor, preencha o campo ${field.label} primeiro`);
      return;
    }
    
    console.log('🤖 [AI-FIELD] ===== PROCESSANDO CAMPO INDIVIDUAL (ENVIO SELETIVO) =====');
    console.log('🤖 [AI-FIELD] Campo:', field.label, '(', field.key, ')');
    
    setIsProcessingField(field.key);
    try {
      // Determinar quais campos enviar (comportamento anterior: enviar todos os preenchidos para contexto)
      const allFilledFields: Record<string, string> = {};
      if (selectedTemplate) {
        selectedTemplate.fields.forEach(f => {
          let value = dynamicFields[f.key];
          if (value && value.trim()) {
            // O usuário solicitou que o valor não contenha o prefixo do título
            let finalValue = value.trim();
            
            // SOLUÇÃO: Se o campo estiver marcado no checkbox, anexar a instrução para a IA
            if (selectedAIFields.has(f.key)) {
              finalValue = `${finalValue} (INFORME EM IMPRESSÃO DIAGNÓSTICA.)`;
            }
            
            // Enviando o nome do campo de forma ultra explícita como chave do JSON
            const explicitKey = `titulo_campo_${f.key}`;
            allFilledFields[explicitKey] = finalValue;
          }
        });
      }

      // Identificar quais campos estão selecionados via checkbox
      const selectedFieldsKeys = Array.from(selectedAIFields);

      console.log('🤖 [AI-FIELD] Enviando todos os campos preenchidos para contexto:', Object.keys(allFilledFields));
      console.log('🤖 [AI-FIELD] Campos selecionados via checkbox:', selectedFieldsKeys);
      console.log('🤖 [AI-FIELD] Campo a ser processado:', field.key);
      
      // Log para verificar a injeção da instrução
      selectedFieldsKeys.forEach(key => {
        if (allFilledFields[key]) {
          console.log(`💉 [AI-FIELD] Injeção confirmada no campo ${key}:`, allFilledFields[key].substring(Math.max(0, allFilledFields[key].length - 40)));
        }
      });

      // Chamar a edge function com todos os campos e a informação de seleção
      const {
        data,
        error
      } = await supabase.functions.invoke('ai-webhook', {
        body: {
          ...allFilledFields,
          selectedFieldsKeys,
          selectedModelId: selectedModel?.id || null,
          selectedModelTitle: selectedModel?.name || null,
          fieldKey: field.key,
          type: 'exam_result'
        }
      });
      if (error) {
        console.error('🤖 [AI-FIELD] Erro ao processar:', error);
        toast.error('Erro ao processar campo com IA');
        return;
      }
      console.log('🤖 [AI-FIELD] Resposta da IA:', data);
      
      // Armazenar o prompt para o debug na tela
      if (data?.debug_prompt) {
        setLastUsedPrompt(data.debug_prompt);
      }
      
      // LOG DE AUDITORIA DO PROMPT (Para fins de teste)
      if (data?.debug_prompt) {
        console.group('%c 🧪 AUDITORIA DE PROMPT IA (CAMPO INDIVIDUAL) ', 'background: #222; color: #bada55; font-size: 12px; font-weight: bold;');
        console.log('%c Prompt de Sistema Utilizado:', 'font-weight: bold; color: #4CAF50;');
        console.log(data.debug_prompt);
        console.log('%c Campo:', 'font-weight: bold; color: #2196F3;', field.label);
        console.log('%c ID do Modelo:', 'font-weight: bold; color: #FF9800;', selectedModel?.id || 'Nenhum (Global)');
        console.groupEnd();
      }
      
      // Extrair o conteúdo processado da resposta
      let processedContent = '';
      const explicitKey = `titulo_campo_${field.key}`;
      
      if (data.individual_fields && data.individual_fields[explicitKey]) {
        processedContent = data.individual_fields[explicitKey];
      } else if (data.individual_fields && data.individual_fields[field.key]) {
        processedContent = data.individual_fields[field.key];
      } else if (data.processed_content) {
        processedContent = data.processed_content;
      } else if (data[explicitKey]) {
        processedContent = data[explicitKey];
      } else if (data[field.key]) {
        processedContent = data[field.key];
      }
      
      if (processedContent) {
        console.log('🤖 [AI-FIELD] Conteúdo processado:', processedContent);

        // Limpar possíveis instruções que a IA possa ter retornado no texto
        let cleanContent = processedContent.replace(/INFORME EM IMPRESSÃO DIAGNÓSTICA\.?/gi, '').trim();
        cleanContent = cleanContent.replace(/\( \)/g, '').trim(); // Remove parênteses vazios se sobrarem

        // Remover o título caso a IA ainda teime em repeti-lo (ex: "RIM DIREITO: ...")
        // Também lidamos com variações onde a IA não colocou os dois pontos.
        const escapedLabel = field.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escapar caracteres especiais
        const labelPrefixRegex = new RegExp(`^${escapedLabel}[\\s:]*`, 'i');
        cleanContent = cleanContent.replace(labelPrefixRegex, '').trim();

        // Opcional: Se a string após a remoção começar com minúscula, torná-la maiúscula
        if (cleanContent.length > 0) {
          cleanContent = cleanContent.charAt(0).toUpperCase() + cleanContent.slice(1);
        }

        // Atualizar apenas este campo específico
        const updatedFields = {
          ...dynamicFields,
          [field.key]: formatFieldValue(field.key, cleanContent)
        };
        setDynamicFields(updatedFields);
        updateExamResults(updatedFields);
        toast.success(`Campo ${field.label} processado com sucesso!`);
      } else {
        console.warn('🤖 [AI-FIELD] Nenhum conteúdo processado retornado');
        toast.warning('Nenhum conteúdo foi processado pela IA');
      }
    } catch (err) {
      console.error('🤖 [AI-FIELD] Erro inesperado:', err);
      toast.error('Erro ao processar campo com IA');
    } finally {
      setIsProcessingField(null);
      console.log('🤖 [AI-FIELD] ===== PROCESSAMENTO CONCLUÍDO =====');
    }
  };

  // Função para alternar a seleção de um campo para a IA
  const toggleFieldAISelection = (fieldKey: string) => {
    console.log(`🎯 [AI-SELECT] Alternando seleção do campo: ${fieldKey}`);
    
    const instruction = '(INFORME EM IMPRESSÃO DIAGNÓSTICA.)';
    
    setSelectedAIFields(prev => {
      const next = new Set(prev);
      const isRemoving = next.has(fieldKey);
      
      let newFields = { ...dynamicFields };
      let changed = false;

      if (isRemoving) {
        next.delete(fieldKey);
        console.log(`❌ [AI-SELECT] Campo ${fieldKey} REMOVIDO da análise de conclusão`);
        
        const currentText = dynamicFields[fieldKey] || '';
        if (currentText.includes(instruction)) {
          const newText = currentText.replace(instruction, '').replace(/\s\s+/g, ' ').trim();
          newFields[fieldKey] = newText;
          changed = true;
        }
      } else {
        next.add(fieldKey);
        console.log(`✅ [AI-SELECT] Campo ${fieldKey} ADICIONADO para análise de conclusão`);
        
        const currentText = dynamicFields[fieldKey] || '';
        if (!currentText.includes(instruction)) {
          const separator = currentText.trim() ? ' ' : '';
          const newText = `${currentText.trim()}${separator}${instruction}`;
          newFields[fieldKey] = newText;
          changed = true;
        }
      }

      if (changed) {
        setDynamicFields(newFields);
        if (onDynamicFieldsChange) {
          onDynamicFieldsChange(newFields);
        }
      }

      return next;
    });
  };

  // Componente para o microfone individual de cada campo
  const FieldMicrophone = React.useCallback(({ fieldKey, label, onUpdate, variant, className }: { 
    fieldKey: string, 
    label: string, 
    onUpdate: (val: string) => void,
    variant?: any,
    className?: string
  }) => {
    const { isRecording, toggleRecording, isProcessing } = useWhisperTranscription({
      onTranscriptionComplete: (text) => {
        if (text.trim()) {
          console.log(`🎙️ [VOICE-FIELD] Transcrição para ${label}:`, text);
          onUpdate(text);
          toast.success(`Campo ${label} preenchido via voz.`);
        }
      }
    });

    return (
      <Button 
        asChild
        variant={variant || (isRecording ? "destructive" : "outline")} 
        size="sm" 
        className={cn(isRecording ? 'animate-pulse' : '', className)}
      >
        <span
          role="button"
          tabIndex={0}
          title={`Gravar voz para ${label}`}
          onClick={(e) => {
            e.stopPropagation(); // Evita que cliques no botão disparem eventos do pai
            if (isProcessing) return;
            toggleRecording();
          }} 
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              if (isProcessing) return;
              toggleRecording();
            }
          }}
          className={cn(
            "cursor-pointer flex items-center justify-center w-full h-full",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
        >
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </span>
      </Button>
    );
  }, []);
  if (isMobile) {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Modelo de Exame
            </Label>
            <AdvancedSelect
              options={completedExams.map(model => ({ label: model.name, value: model.id }))}
              value={selectedModelId}
              onChange={(value) => handleModelSelect(value as string)}
              disabled={isLoading}
              placeholder="Selecione um modelo..."
              title="Modelos de Exame"
              className="w-full bg-slate-800 border-slate-700 text-white rounded-xl h-12"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isRecordingGlobal ? "destructive" : "outline"}
              className={cn(
                "h-12 flex-1 rounded-xl font-bold transition-all",
                isRecordingGlobal ? "animate-pulse" : "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              )}
              onClick={toggleRecordingGlobal}
              disabled={isProcessingVoice}
            >
              {isProcessingVoice ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : isRecordingGlobal ? <MicOff className="h-5 w-5 mr-2" /> : <Mic className="h-5 w-5 mr-2" />}
              {isRecordingGlobal ? "Parar Gravação" : "Comando de Voz"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              onClick={() => setIsPromptModalOpen(true)}
            >
              <Settings2 className="h-5 w-5" />
            </Button>
          </div>

          <Button 
            onClick={handleProcessWithAI} 
            disabled={isProcessingAI.examResults || !selectedModel}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98]"
          >
            {isProcessingAI.examResults ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...</>
            ) : (
              <><Sparkles className="mr-2 h-5 w-5" /> Refinar Laudo com IA</>
            )}
          </Button>
        </div>

        {selectedTemplate && selectedTemplate.fields.length > 0 && (
          <div className="space-y-6">
            <div className="h-px bg-slate-800 w-full my-2" />
            <div className="space-y-8">
              {selectedTemplate.fields.map(field => {
                // Garantir que o valor do campo seja sempre uma string para evitar erros de renderização
                const rawValue = dynamicFields[field.key];
                const fieldValue = (rawValue === null || rawValue === undefined) ? '' : String(rawValue);
                const selectedValues = selectedFieldValues[field.key] || [];
                
                return (
                  <div key={field.key} className={cn(
                    "space-y-3 transition-all duration-500",
                    modifiedFields.has(field.key) && "bg-emerald-500/10 p-3 rounded-2xl ring-1 ring-emerald-500/30"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {field.key !== 'impressaodiagnostica' && field.key !== 'recomendacoes' && field.key !== 'observacoes' && (
                          <Checkbox 
                            id={`ai-select-mobile-${field.key}`}
                            checked={selectedAIFields.has(field.key)}
                            onCheckedChange={() => toggleFieldAISelection(field.key)}
                            className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                          />
                        )}
                        <Label className="text-sm font-black text-slate-200 uppercase tracking-tight">
                          {field.label}
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        {!field.key.toLowerCase().includes('percentil') && (
                          <FieldMicrophone 
                            fieldKey={field.key} 
                            label={field.label} 
                            onUpdate={(val) => handleFieldTextChange(field.key, val)} 
                          />
                        )}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-white"
                          onClick={() => handleProcessFieldWithAI(field)} 
                          disabled={isProcessingField === field.key || (field.key !== 'impressaodiagnostica' && !fieldValue.trim())}
                        >
                          {isProcessingField === field.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <AdvancedSelect
                      key={`${selectedModel?.id || 'no-model'}-${field.key}`} 
                      options={templates
                        .filter(t => t.field_key === field.key && t.model_name === (selectedModel?.name || ''))
                        .map(t => ({ id: t.id, label: t.field_content, value: t.field_content }))
                      }
                      value={selectedValues} 
                      onChange={selectedContents => handleFieldModelChange(field.key, selectedContents as string[])} 
                      onEdit={handleEditTemplate}
                      onDelete={handleDeleteTemplate}
                      placeholder={`Modelos de ${field.label.toLowerCase()}...`} 
                      searchPlaceholder="Buscar modelo..."
                      title={`Modelos: ${field.label}`}
                      multiple
                      className="bg-slate-800 border-slate-700 text-white rounded-xl h-12" 
                    />

                    {field.type === 'date' ? (
                      <div className="relative">
                        <Input 
                          type="text" 
                          placeholder="DD/MM/AAAA"
                          className="w-full h-12 bg-slate-800/50 border-slate-700 text-white rounded-xl pr-10"
                          value={fieldValue} 
                          onChange={e => handleFieldTextChange(field.key, formatDateInput(e.target.value))} 
                        />
                        <CalendarIcon className="absolute right-3 top-3.5 h-5 w-5 text-slate-500" />
                      </div>
                    ) : (
                      <Textarea 
                        value={fieldValue} 
                        onChange={e => handleFieldTextChange(field.key, e.target.value)} 
                        placeholder={field.placeholder} 
                        rows={field.key === 'percentil' ? 4 : 6} 
                        className={cn(
                          "w-full bg-slate-800/50 border-slate-700 text-white rounded-xl p-4 focus:ring-emerald-500/20 transition-all resize-none",
                          field.key === 'percentil' && "font-bold"
                        )} 
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-6 space-y-3">
          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Resultado Final (Laudo)
          </Label>
          <Textarea 
            value={examResults} 
            onChange={e => onExamResultsChange(e.target.value)} 
            placeholder="O laudo será gerado automaticamente..." 
            className="min-h-[300px] bg-slate-900 border-slate-800 text-emerald-400 font-mono text-sm rounded-2xl p-4" 
            readOnly 
          />
        </div>

        {/* Reutilizar Dialogs e Modais existentes */}
        <AIPromptModal 
          isOpen={isPromptModalOpen} 
          onClose={() => setIsPromptModalOpen(false)} 
          fieldType="exames" 
          modelId={selectedModel?.id}
          modelName={selectedModel?.name}
        />
        {/* ... manter outros modais se necessário ... */}
      </div>
    );
  }

  return <div className="space-y-6">
      <Card>
        <CardHeader className="bg-purple-400">
          <CardTitle className="text-base">Resultado de Exames</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-rose-100">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="w-full md:w-1/2">
              <AdvancedSelect
                options={completedExams.map(model => ({ label: model.name, value: model.id }))}
                value={selectedModelId}
                onChange={(value) => handleModelSelect(value as string)}
                disabled={isLoading}
                placeholder="Selecione um modelo de exame"
                title="Modelos de Exame"
                className="w-full"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0">
              <Button
                type="button"
                variant={isRecordingGlobal ? "destructive" : "outline"}
                size="icon"
                className={`h-10 w-10 shrink-0 ${isRecordingGlobal ? 'animate-pulse' : ''}`}
                onClick={toggleRecordingGlobal}
                disabled={isProcessingVoice}
                title={isRecordingGlobal ? "Parar gravação" : "Gravar comando de voz global para todos os campos"}
              >
                {isProcessingVoice ? <Loader2 className="h-4 w-4 animate-spin" /> : isRecordingGlobal ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => setIsPromptModalOpen(true)}
                title="Configurar instruções da IA"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button onClick={handleProcessWithAI} variant="outline" className="flex-1 md:w-auto" disabled={isProcessingAI.examResults}>
                {isProcessingAI.examResults ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </> : <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Processar com IA
                  </>}
              </Button>
              {lastUsedPrompt && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setShowPromptDebug(!showPromptDebug)}
                  title="Ver último prompt utilizado"
                >
                  <Info className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {showPromptDebug && lastUsedPrompt && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-mono text-emerald-800 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold uppercase tracking-wider">🧪 Último Prompt de Sistema:</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setShowPromptDebug(false)}>Fechar</Button>
              </div>
              <div className="whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar bg-white/50 p-3 rounded border border-emerald-200/50">
                {lastUsedPrompt}
              </div>
            </div>
          )}

          {/* Campos dinâmicos baseados no template */}
          {selectedTemplate && selectedTemplate.fields.length > 0 && (
            <Accordion type="single" collapsible className="space-y-4">
              {selectedTemplate.fields.map(field => {
                // Garantir que o valor do campo seja sempre uma string para evitar erros de renderização
                const rawValue = dynamicFields[field.key];
                const fieldValue = (rawValue === null || rawValue === undefined) ? '' : String(rawValue);
                const selectedValues = selectedFieldValues[field.key] || [];
                
                return (
                  <AccordionItem 
                    key={field.key} 
                    value={field.key} 
                    className={cn(
                      "border-none rounded-[1.5rem] overflow-hidden transition-all duration-300",
                      modifiedFields.has(field.key) ? "ring-2 ring-emerald-500/30" : ""
                    )}
                  >
                    <AccordionTrigger 
                      className="bg-slate-900 px-6 py-5 hover:no-underline transition-all group"
                    >
                      <div className="flex items-center justify-between w-full text-left">
                        <div className="flex items-center gap-3">
                          {field.key !== 'impressaodiagnostica' && field.key !== 'recomendacoes' && field.key !== 'observacoes' && (
                            <div onClick={(e) => e.stopPropagation()} className="flex items-center mr-2">
                              <Checkbox 
                                id={`ai-select-${field.key}`}
                                checked={selectedAIFields.has(field.key)}
                                onCheckedChange={() => toggleFieldAISelection(field.key)}
                                className="border-slate-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                              />
                            </div>
                          )}
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            fieldValue.trim() ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-slate-700"
                          )} />
                          <span className="text-white font-black text-base uppercase tracking-tight">{field.label}</span>
                          {fieldValue.trim() && (
                            <span className="hidden sm:inline-block text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-in fade-in slide-in-from-right-2">
                              Preenchido
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mr-4" onClick={(e) => e.stopPropagation()}>
                          {!field.key.toLowerCase().includes('percentil') && (
                            <FieldMicrophone 
                              fieldKey={field.key} 
                              label={field.label} 
                              onUpdate={(val) => handleFieldTextChange(field.key, val)} 
                              variant="ghost"
                              className="h-10 w-10 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"
                            />
                          )}
                          <Button 
                            asChild
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl"
                          >
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isProcessingField === field.key) return;
                                // Para impressão diagnóstica, permitimos processar mesmo sem valor no campo
                                if (field.key !== 'impressaodiagnostica' && !fieldValue.trim()) return;
                                handleProcessFieldWithAI(field);
                              }} 
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (isProcessingField === field.key) return;
                                  if (field.key !== 'impressaodiagnostica' && !fieldValue.trim()) return;
                                  handleProcessFieldWithAI(field);
                                }
                              }}
                              className={cn(
                                "cursor-pointer flex items-center justify-center w-full h-full",
                                (isProcessingField === field.key || (field.key !== 'impressaodiagnostica' && !fieldValue.trim())) && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {isProcessingField === field.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="bg-slate-900/95 mt-1 rounded-b-[1.5rem] p-6 space-y-6 overflow-visible border-t border-slate-800/50">
                      {/* Seção de Modelos */}
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
                          Modelos Sugeridos
                        </Label>
                        <AdvancedSelect
                          key={`${selectedModel?.id || 'no-model'}-${field.key}`}
                          options={templates
                            .filter(t => t.field_key === field.key && t.model_name === (selectedModel?.name || ''))
                            .map(t => ({ id: t.id, label: t.field_content, value: t.field_content }))
                          }
                          value={selectedValues}
                          onChange={(selectedContents) => handleFieldModelChange(field.key, selectedContents as string[])}
                          onEdit={handleEditTemplate}
                          onDelete={handleDeleteTemplate}
                          placeholder={`Escolher modelos de ${field.label.toLowerCase()}...`}
                          searchPlaceholder="Buscar modelo..."
                          title={`Modelos: ${field.label}`}
                          multiple
                          className="bg-slate-800 border-slate-700 text-white rounded-xl h-12"
                        />
                      </div>

                      {/* Área de Texto */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Descrição Detalhada
                          </Label>
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
                              onClick={async () => {
                                if (!fieldValue.trim()) return;
                                if (!selectedModel) return;
                                setIsSavingField(field.key);
                                try {
                                  await saveFieldTemplate({
                                    fieldKey: field.key,
                                    fieldLabel: field.label,
                                    fieldContent: fieldValue,
                                    modelName: selectedModel.name
                                  });
                                  // O toast de sucesso já é disparado pelo hook
                                } catch (e) {
                                  console.error('Erro ao salvar template de campo:', e);
                                  // O toast de erro já é disparado pelo hook
                                } finally {
                                  setIsSavingField(null);
                                }
                              }} 
                              disabled={!fieldValue.trim() || isSavingField === field.key}
                            >
                              {isSavingField === field.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10"
                              onClick={() => {
                                setFieldToDelete({ key: field.key, label: field.label });
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Eraser className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {field.key === 'percentil' ? (
                          <div className="space-y-2">
                            <Textarea 
                              value={fieldValue} 
                              onChange={e => handleFieldTextChange(field.key, e.target.value)} 
                              placeholder={field.placeholder} 
                              rows={6} 
                              className={cn(
                                "w-full bg-slate-800/50 border-slate-700/50 text-white p-4 rounded-xl resize-none",
                                fieldValue.includes('(AIG)') ? 'text-blue-400' : fieldValue.includes('(PIG)') ? 'text-rose-400' : fieldValue.includes('(GIG)') ? 'text-red-400' : ''
                              )} 
                            />
                            {fieldValue && fieldValue.includes('⚠️') && (
                              <div className="text-amber-400 text-xs font-bold bg-amber-400/10 p-3 rounded-xl border border-amber-400/20">
                                {fieldValue.split('\n').find(line => line.includes('⚠️'))}
                              </div>
                            )}
                          </div>
                        ) : field.type === 'date' ? (
                          <div className="relative">
                            <Input 
                              type="text" 
                              placeholder="DD/MM/AAAA"
                              className="w-full h-12 bg-slate-800/50 border-slate-700/50 text-white rounded-xl pr-10 focus:ring-emerald-500/20 transition-all"
                              value={fieldValue} 
                              onChange={e => handleFieldTextChange(field.key, formatDateInput(e.target.value))} 
                            />
                            <CalendarIcon className="absolute right-3 top-3.5 h-5 w-5 text-slate-500" />
                          </div>
                        ) : (
                          <Textarea 
                            value={fieldValue} 
                            onChange={e => handleFieldTextChange(field.key, e.target.value)} 
                            placeholder={field.placeholder} 
                            rows={6} 
                            className="w-full bg-slate-800/50 border-slate-700/50 text-white p-4 rounded-xl focus:ring-emerald-500/20 transition-all resize-none" 
                          />
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
          
          {/* Dialog de confirmação para limpar template */}
          <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Limpar template salvo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja remover o template salvo do campo{' '}
                  <strong>{fieldToDelete?.label}</strong>? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setFieldToDelete(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                if (fieldToDelete && selectedModel) {
                  // Buscar o template salvo e deletar
                  searchFieldTemplates(fieldToDelete.key, '', selectedModel.name).then(results => {
                    if (results.length > 0) {
                      deleteFieldTemplate(results[0].id);
                    }
                  });
                }
                setFieldToDelete(null);
                setDeleteConfirmOpen(false);
              }}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <div className="space-y-2 bg-lime-500">
            <Label htmlFor="examResults">Resultado Final</Label>
            <Textarea id="examResults" value={examResults} onChange={e => onExamResultsChange(e.target.value)} placeholder="Resultado final do exame será gerado automaticamente" className="min-h-[300px] font-mono" readOnly />
          </div>
        </CardContent>
      </Card>

      <AIPromptModal 
        isOpen={isPromptModalOpen} 
        onClose={() => setIsPromptModalOpen(false)} 
        fieldType="exames" 
        modelId={selectedModel?.id}
        modelName={selectedModel?.name}
      />

      {/* Janela Flutuante de Campos Faltantes */}
      {showMissingModal && missingFields.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 pointer-events-none">
          <Card 
            className="w-full max-w-lg shadow-2xl border-purple-200 animate-in zoom-in-95 duration-300 overflow-hidden pointer-events-auto select-none"
            style={{ 
              transform: `translate(${modalPosition.x}px, ${modalPosition.y}px)`,
              cursor: isDragging ? 'grabbing' : 'auto'
            }}
          >
            <CardHeader 
              className="bg-purple-600 text-white p-4 flex flex-row items-center justify-between space-y-0 cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
            >
              <div className="flex flex-col">
                <CardTitle className="text-lg">Campos não identificados</CardTitle>
                <p className="text-xs text-purple-100 mt-1">Dite ou digite os dados faltantes abaixo (Arraste para mover)</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-purple-700 h-8 w-8 rounded-full" 
                onClick={() => setShowMissingModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4 bg-slate-50">
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {missingFields.map(field => (
                  <div 
                    key={field.key} 
                    className="flex flex-col p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {dynamicFields[field.key]?.trim() ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 animate-in zoom-in duration-300" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                        )}
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-tight">{field.label}</span>
                      </div>
                      <FieldMicrophone 
                        fieldKey={field.key} 
                        label={field.label} 
                        onUpdate={(val) => {
                          // A IA já retorna DD/MM/AAAA, o handleFieldTextChange normaliza se necessário
                          handleFieldTextChange(field.key, val);
                          setModifiedFields(prev => new Set(prev).add(field.key));
                        }} 
                      />
                    </div>
                    
                    {field.type === 'date' ? (
                      <div className="relative">
                        <Input 
                          type="text" 
                          placeholder="DD/MM/AAAA"
                          className="h-9 text-sm border-slate-200 focus:ring-purple-500 pr-10"
                          value={dynamicFields[field.key] || ''}
                          onChange={(e) => {
                            const formatted = formatDateInput(e.target.value);
                            handleFieldTextChange(field.key, formatted);
                          }}
                        />
                        <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <Textarea 
                        placeholder={`Descreva ${field.label.toLowerCase()}...`}
                        className="min-h-[60px] text-sm border-slate-200 focus:ring-purple-500 resize-none"
                        value={dynamicFields[field.key] || ''}
                        onChange={(e) => handleFieldTextChange(field.key, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="pt-2 flex flex-col gap-2">
                <div className="text-[10px] text-center text-slate-400 uppercase font-bold tracking-widest">
                  {missingFields.filter(f => !dynamicFields[f.key]?.trim()).length} campo(s) pendente(s)
                </div>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 shadow-lg text-white font-bold h-11 transition-all active:scale-95" 
                  onClick={() => {
                    setShowMissingModal(false);
                    toast.success('Laudo preenchido! Agora você pode clicar em "Processar com IA" para o refinamento final.');
                  }}
                >
                  CONCLUIR LAUDO
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>;
};
export default ResultadoExames;