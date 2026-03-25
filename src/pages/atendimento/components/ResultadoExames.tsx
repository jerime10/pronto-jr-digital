import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Trash2, Save, Eraser, Mic, MicOff, Settings2, X, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { calculateDUMFromIG, formatDateInput, parseNaturalDate } from '@/utils/obstetricUtils';
import { calculateFetalPercentile } from '@/utils/fetalCalculations';
import { useAIProcessing } from '../hooks/useAIProcessing';
import { useWhisperTranscription } from '@/hooks/useWhisperTranscription';
import { FieldAutocompleteMulti } from '@/components/ui/field-autocomplete-multi';
import { useIndividualFieldTemplates } from '@/hooks/useIndividualFieldTemplates';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AIPromptModal } from './AIPromptModal';

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
  const normalizeKey = (text: string): string => {
    return text.toLowerCase().replace(/[áàâãä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i').replace(/[óòôõö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ç/g, 'c').replace(/[^a-z0-9]/g, '').replace(/\s+/g, '');
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
  onProcessWithAI: () => void;
  onSelectedModelChange?: (modelTitle: string | null) => void;
  onDynamicFieldsChange?: (fields: Record<string, string>) => void;
  processAIContent?: (field: string, content: string, dynamicFields?: Record<string, string>) => Promise<void>;
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
          
          if (onDynamicFieldsChange) {
            onDynamicFieldsChange(newFields);
          }
          
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
    searchFieldTemplates,
    saveFieldTemplate,
    deleteFieldTemplate,
    isSaving,
    isDeleting
  } = useIndividualFieldTemplates();

  // Hook para processamento de IA (fallback se não vier das props)
  const {
    processAIContent: processAIContentLocal
  } = useAIProcessing();

  // Criar processAIContent customizado que inclui updateDynamicFieldsFromAI
  const processAIContentWithCallback = React.useCallback(async (field: 'main_complaint' | 'evolution' | 'exam_result', content: string, dynamicFieldsParam?: Record<string, string>) => {
    if (processAIContentProp) {
      // processAIContentProp tem assinatura: (field: string, content: string, dynamicFields?: Record<string, string>)
      console.log('🔄 [ResultadoExames] Usando processAIContent das props');
      await processAIContentProp(field, content, dynamicFieldsParam);
    } else {
      // processAIContentLocal tem assinatura: (content, type, onSuccess, selectedModelTitle, dynamicFields)
      console.log('🔄 [ResultadoExames] Usando processAIContent local');
      await processAIContentLocal(content, field, processed => {
        console.log('✅ Conteúdo processado via local');
      }, null, dynamicFieldsParam);
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
      formattedAIFields[key] = formatFieldValue(key, value);
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

    // Notificar componente pai
    if (onDynamicFieldsChange) {
      console.log('🎯 [AI-UPDATE] Notificando componente pai...');
      onDynamicFieldsChange(mergedFields);
    }
    console.log('🎯 [AI-UPDATE] ===== FIM updateLocalDynamicFieldsFromAI =====');
  }, [dynamicFields, selectedTemplate, selectedModel, onDynamicFieldsChange]);

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

      // Verificar se as props têm conteúdo válido
      const hasValidContent = Object.values(dynamicFieldsFromProps).some(value => value && value.trim());
      console.log('🔄 [SYNC] Props têm conteúdo válido:', hasValidContent);
      if (hasValidContent) {
        console.log('✅ [SYNC] MESCLANDO campos da IA com campos locais!');
        console.log('✅ [SYNC] Campos locais antes:', dynamicFields);
        console.log('✅ [SYNC] Campos da IA:', dynamicFieldsFromProps);

        // MESCLAR em vez de sobrescrever - preservar campos existentes
        const mergedFields = {
          ...dynamicFields,
          ...dynamicFieldsFromProps
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
  }, [dynamicFieldsFromProps]);
  useEffect(() => {
    const fetchCompletedExams = async () => {
      try {
        console.log('📥 [FETCH] ===== BUSCANDO MODELOS =====');
        setIsLoading(true);

        // Acessar diretamente a tabela modelo-result-exames
        const {
          data,
          error
        } = await supabase.from('modelo-result-exames').select('id, name, result_template').order('name');
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

          // Se tiver dynamicFieldsFromProps, usar eles; senão inicializar vazio
          if (dynamicFieldsFromProps && Object.keys(dynamicFieldsFromProps).length > 0) {
            console.log('🔧 [RESTORE] Restaurando campos dinâmicos das props:', dynamicFieldsFromProps);
            setDynamicFields(dynamicFieldsFromProps);
          } else {
            console.log('🔧 [RESTORE] Inicializando campos dinâmicos vazios');
            const newFields: Record<string, string> = {};
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

    // Notificar componente pai
    if (onDynamicFieldsChange) {
      console.log('📤 [MULTI-SELECT] Notificando componente pai');
      onDynamicFieldsChange(newFields);
    }
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

        // Notificar componente pai
        if (onDynamicFieldsChange) {
          onDynamicFieldsChange(newFields);
        }
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
  const formatFieldValue = (key: string, value: string): string => {
    if (!value) return '';
    let finalValue = value;

    const lowerKey = key.toLowerCase();

    // 1. Formatação de Peso: apenas números + "g"
    if (lowerKey === 'peso') {
      const numbers = value.replace(/\D/g, '');
      return numbers ? `${numbers}g` : '';
    }

    // 2. Formatação de Data
    if (lowerKey.includes('data') || lowerKey === 'dpp') {
      // Tentar parsear linguagem natural (ex: "11 de maio de 2026")
      const naturalParsed = parseNaturalDate(value);
      if (naturalParsed !== value) {
        return naturalParsed;
      }
      // Se vier no formato YYYY-MM-DD (do input date), converter para DD/MM/AAAA
      if (value.includes('-') && value.length === 10) {
        const [y, m, d] = value.split('-');
        return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
      }
      // Se vier com barras, normalizar (ex: 1/1/2024 -> 01/01/2024)
      if (value.includes('/')) {
        const parts = value.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts;
          return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
        }
      }
    }

    // 3. Formatação de Impressão Diagnóstica: quebra de linha após cada ponto
    if (lowerKey === 'impressaodiagnostica') {
      // Substituir ponto seguido de espaço por ponto + nova linha
      // Mantemos o valor original se não houver espaços após o ponto (para evitar quebras enquanto digita o próximo caractere)
      // Mas para o resultado final e IA, queremos a quebra.
      return value
        .replace(/\.\s+/g, '.\n') // Substitui ponto + espaço(s) por ponto + \n
        .replace(/\n\s+/g, '\n'); // Limpa espaços no início de novas linhas
    }

    return finalValue;
  };

  // Handler para mudança direta do texto do campo
  const handleFieldTextChange = (fieldKey: string, value: string) => {
    console.log('📝 [TEXT-CHANGE] ===== INÍCIO handleFieldTextChange =====');
    console.log('📝 [TEXT-CHANGE] Campo:', fieldKey, 'Valor:', value);

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

    // Notificar componente pai
    if (onDynamicFieldsChange) {
      console.log('📤 [TEXT-CHANGE] Notificando componente pai com campos:', Object.keys(newFields));
      if (fieldKey === 'impressaodiagnostica') {
        console.log('🔍 [IMPRESSÃO-DIAGNÓSTICA] Notificando pai com impressaodiagnostica:', newFields.impressaodiagnostica);
      }
      onDynamicFieldsChange(newFields);
    }
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

        // Inicializar novos campos vazios para o novo modelo
        const newFields: Record<string, string> = {};
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
    console.log('🔄 [UPDATE] ===== INÍCIO updateExamResults =====');
    console.log('🔄 [UPDATE] Campos recebidos:', fields);
    
    if (!selectedTemplate || !selectedModel) {
      console.log('🔄 [UPDATE] Nenhum template ou modelo selecionado, saindo...');
      return;
    }

    // Aplicar formatação a todos os campos recebidos
    const enhancedFields: Record<string, string> = {};
    Object.entries(fields).forEach(([key, value]) => {
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

    // Notificar o componente pai sobre os campos dinâmicos
    if (onDynamicFieldsChange) {
      onDynamicFieldsChange(enhancedFields);
    }
  };
  const handleProcessWithAI = async () => {
    // Verificar se há campos dinâmicos preenchidos ou conteúdo no textarea
    const hasFilledDynamicFields = Object.values(dynamicFields).some(value => value?.trim());
    if (!examResults.trim() && !hasFilledDynamicFields) {
      toast.error('Por favor, adicione alguns resultados de exames ou preencha os campos do modelo primeiro');
      return;
    }

    // Usar o callback das props para processar com IA
    onProcessWithAI();
  };

  // Nova função para processar um campo individual com IA (ENVIO SELETIVO)
  // Handler para processar um campo individual com IA (ENVIO SELETIVO)
  const handleProcessFieldWithAI = async (field: DynamicField) => {
    const fieldValue = dynamicFields[field.key];
    if (!fieldValue?.trim()) {
      toast.error(`Por favor, preencha o campo ${field.label} primeiro`);
      return;
    }
    console.log('🤖 [AI-FIELD] ===== PROCESSANDO CAMPO INDIVIDUAL (ENVIO SELETIVO) =====');
    console.log('🤖 [AI-FIELD] Campo:', field.label, '(', field.key, ')');
    console.log('🤖 [AI-FIELD] Valor:', fieldValue);
    setIsProcessingField(field.key);
    try {
      // Campos que precisam de contexto completo (TODOS os campos)
      const fieldsWithFullContext = ['impressaodiagnostica', 'achadosadicionais', 'recomendacoes'];

      // Determinar quais campos enviar
      let fieldsToSend: Record<string, string> = {};
      if (fieldsWithFullContext.includes(field.key)) {
        // ===== ENVIAR TODOS OS CAMPOS =====
        console.log('🎯 [AI-FIELD] Campo especial detectado - Enviando TODOS os campos');
        if (selectedTemplate) {
          selectedTemplate.fields.forEach(f => {
            const value = dynamicFields[f.key];
            if (value) {
              fieldsToSend[f.key] = `${f.label}: ${value}`;
            }
          });
        }
      } else if (field.key === 'percentil') {
        // ===== PERCENTIL: Enviar apenas PERCENTIL + PESO + IG =====
        console.log('🎯 [AI-FIELD] Campo PERCENTIL - Enviando PERCENTIL + PESO + IG');
        fieldsToSend[field.key] = `${field.label}: ${fieldValue}`;

        // Adicionar PESO se existir
        const pesoField = selectedTemplate?.fields.find(f => f.key === 'peso');
        const pesoValue = dynamicFields['peso'];
        if (pesoField && pesoValue) {
          fieldsToSend['peso'] = `${pesoField.label}: ${pesoValue}`;
          console.log('  ✓ PESO incluído:', pesoValue);
        }

        // Adicionar IG se existir
        const igField = selectedTemplate?.fields.find(f => f.key === 'ig');
        const igValue = dynamicFields['ig'];
        if (igField && igValue) {
          fieldsToSend['ig'] = `${igField.label}: ${igValue}`;
          console.log('  ✓ IG incluído:', igValue);
        }
      } else {
        // ===== DEMAIS CAMPOS: Enviar apenas o campo atual =====
        console.log('🎯 [AI-FIELD] Campo padrão - Enviando apenas o campo atual');
        fieldsToSend[field.key] = `${field.label}: ${fieldValue}`;
      }
      console.log('🤖 [AI-FIELD] Campos sendo enviados:', Object.keys(fieldsToSend));
      console.log('🤖 [AI-FIELD] Campo a ser processado:', field.key);

      // Chamar a edge function com os campos seletivos
      const {
        data,
        error
      } = await supabase.functions.invoke('ai-webhook', {
        body: {
          ...fieldsToSend,
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

      // Extrair o conteúdo processado da resposta
      let processedContent = '';
      if (data.individual_fields && data.individual_fields[field.key]) {
        processedContent = data.individual_fields[field.key];
      } else if (data.processed_content) {
        processedContent = data.processed_content;
      } else if (data[field.key]) {
        processedContent = data[field.key];
      }
      if (processedContent) {
        console.log('🤖 [AI-FIELD] Conteúdo processado:', processedContent);

        // Atualizar apenas este campo específico
        const updatedFields = {
          ...dynamicFields,
          [field.key]: formatFieldValue(field.key, processedContent)
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

  // Componente para o microfone individual de cada campo
  const FieldMicrophone = React.useCallback(({ fieldKey, label, onUpdate }: { fieldKey: string, label: string, onUpdate: (val: string) => void }) => {
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
        type="button" 
        variant={isRecording ? "destructive" : "outline"} 
        size="sm" 
        onClick={(e) => {
          e.stopPropagation(); // Evita que cliques no botão disparem eventos do pai
          toggleRecording();
        }} 
        disabled={isProcessing}
        title={`Gravar voz para ${label}`}
        className={isRecording ? 'animate-pulse' : ''}
      >
        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
    );
  }, []);
  return <div className="space-y-6">
      <Card>
        <CardHeader className="bg-purple-400">
          <CardTitle className="text-base">Resultado de Exames</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-rose-100">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="w-full md:w-1/2">
              <Select value={selectedModelId} onValueChange={handleModelSelect} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um modelo de exame" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                  console.log('🎨 [DROPDOWN] Renderizando dropdown com modelos:', completedExams.length);
                  console.log('🎨 [DROPDOWN] Modelos:', completedExams.map(m => ({
                    id: m.id,
                    name: m.name
                  })));
                  return null;
                })()}
                  {completedExams.map(model => <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
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
            </div>
          </div>

          {/* Campos dinâmicos baseados no template */}
          {(() => {
          console.log('🎨 [DEBUG] Renderizando campos - selectedTemplate:', selectedTemplate);
          console.log('🎨 [DEBUG] Campos disponíveis:', selectedTemplate?.fields);
          return null;
        })()}
          {selectedTemplate && selectedTemplate.fields.length > 0 && <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{selectedModel?.name}</h3>
                
              </div>
              <div className="space-y-4">
                 {selectedTemplate.fields.map(field => {
              const fieldValue = dynamicFields[field.key] || '';
              const selectedValues = selectedFieldValues[field.key] || [];
              console.log('🎨 [RENDER-FIELD] Renderizando campo:', {
                key: field.key,
                label: field.label,
                type: field.type,
                fieldValue: fieldValue.substring(0, 50) + (fieldValue.length > 50 ? '...' : ''),
                selectedValues: selectedValues,
                selectedValuesCount: selectedValues.length
              });
              return field.type === 'date' ? <div key={field.key} className={`space-y-2 transition-all duration-500 p-2 rounded-lg ${modifiedFields.has(field.key) ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`}>
                      <div className="flex items-center justify-between">
                        <Label htmlFor={field.key}>{field.label}</Label>
                        <FieldMicrophone 
                          fieldKey={field.key} 
                          label={field.label} 
                          onUpdate={(val) => {
                            handleFieldTextChange(field.key, val);
                            setModifiedFields(prev => new Set(prev).add(field.key));
                          }} 
                        />
                      </div>
                      <div className="relative">
                        <Input 
                          id={field.key} 
                          type="text" 
                          placeholder="DD/MM/AAAA"
                          className="w-full pr-10"
                          value={fieldValue} 
                          onChange={e => {
                            const formatted = formatDateInput(e.target.value);
                            handleFieldTextChange(field.key, formatted);
                          }} 
                        />
                        <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div> : <div key={field.key} className={`space-y-4 transition-all duration-500 p-2 rounded-lg ${modifiedFields.has(field.key) ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/20' : ''}`}>
                      {/* Seção de Modelos - Fundo mais escuro e destacado */}
                      <Card className="border-2 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 shadow-md">
                        <CardHeader className="border-b border-slate-300 dark:border-slate-700 bg-stone-950 rounded-3xl">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold text-slate-50">
                              Modelos: {field.label}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6 bg-stone-950">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Selecionar Modelos de {field.label}
                              
                            </Label>
                            <FieldAutocompleteMulti key={`${selectedModel?.id || 'no-model'}-${field.key}`} selectedValues={selectedValues} onChange={selectedContents => {
                        console.log('🔄 [AUTOCOMPLETE-ONCHANGE] onChange disparado:', {
                          fieldKey: field.key,
                          fieldLabel: field.label,
                          selectedContents
                        });
                        handleFieldModelChange(field.key, selectedContents);
                      }} onSearch={async searchTerm => {
                        console.log('🔍 [AUTOCOMPLETE-ONSEARCH] onSearch disparado:', {
                          fieldKey: field.key,
                          fieldLabel: field.label,
                          searchTerm,
                          modelName: selectedModel?.name || ''
                        });
                        const results = await searchFieldTemplates(field.key, searchTerm, selectedModel?.name || '');
                        console.log('📊 [AUTOCOMPLETE-ONSEARCH] Resultados:', {
                          fieldKey: field.key,
                          count: results.length,
                          results
                        });
                        return results;
                      }} placeholder={`Digite para buscar modelos de ${field.label.toLowerCase()}...`} fieldName={field.key} className="w-full" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Seção Campo - Fundo mais claro */}
                      <Card className="border border-slate-200 dark:border-slate-800 bg-background shadow-sm">
                        <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-lime-500">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold">
                              {field.label}
                            </CardTitle>
                            <div className="flex gap-2">
                              {/* Botão de Voz Individual - Desabilitado para Percentil */}
                              {!field.key.toLowerCase().includes('percentil') && (
                                <FieldMicrophone 
                                  fieldKey={field.key} 
                                  label={field.label} 
                                  onUpdate={(val) => handleFieldTextChange(field.key, val)} 
                                />
                              )}
                              
                              {/* Botão para processar campo individual com IA */}
                              <Button type="button" variant="outline" size="sm" onClick={() => handleProcessFieldWithAI(field)} disabled={!fieldValue.trim() || isProcessingField === field.key} title="Processar este campo com IA">
                                {isProcessingField === field.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              </Button>
                              
                              {/* Botão para salvar template do campo */}
                              <Button type="button" variant="outline" size="sm" onClick={async () => {
                          console.log('🔵 [CLICK] Botão de salvar clicado');
                          console.log('🔵 [CLICK] fieldValue:', fieldValue);
                          console.log('🔵 [CLICK] selectedModel:', selectedModel);
                          if (!fieldValue.trim()) {
                            toast.error('Por favor, preencha o campo antes de salvar.');
                            return;
                          }
                          if (!selectedModel) {
                            toast.error('Selecione um modelo de exame primeiro.');
                            return;
                          }
                          console.log('💾 [SAVE] Salvando campo:', field.key, field.label);
                          setIsSavingField(field.key);
                          try {
                            await saveFieldTemplate({
                              fieldKey: field.key,
                              fieldLabel: field.label,
                              fieldContent: fieldValue,
                              modelName: selectedModel.name
                            });
                            console.log('✅ [SAVE] Campo salvo com sucesso');
                            toast.success(`Campo ${field.label} salvo com sucesso!`);
                          } catch (error) {
                            console.error('❌ [SAVE] Erro ao salvar:', error);
                            toast.error('Não foi possível salvar o template.');
                          } finally {
                            setIsSavingField(null);
                          }
                        }} disabled={!fieldValue.trim() || isSavingField === field.key} title="Salvar este campo como template">
                                {isSavingField === field.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              </Button>
                              
                              {/* Botão para limpar campo */}
                              <Button type="button" variant="outline" size="sm" onClick={() => {
                          setFieldToDelete({
                            key: field.key,
                            label: field.label
                          });
                          setDeleteConfirmOpen(true);
                        }} disabled={isDeleting} title="Limpar dados salvos deste campo">
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eraser className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6 bg-lime-500">
                          <div className="space-y-2">
                            {field.key === 'percentil' ? <div className="space-y-2">
                                <Textarea value={fieldValue} onChange={e => handleFieldTextChange(field.key, e.target.value)} placeholder={field.placeholder} rows={6} className={`w-full font-bold ${fieldValue.includes('(AIG)') ? 'text-blue-600' : fieldValue.includes('(PIG)') ? 'text-rose-600' : fieldValue.includes('(GIG)') ? 'text-red-600' : ''}`} />
                                {fieldValue && fieldValue.includes('⚠️') && <div className="text-amber-600 text-sm font-medium bg-amber-50 p-2 rounded">
                                    {fieldValue.split('\n').find(line => line.includes('⚠️'))}
                                  </div>}
                              </div> : <Textarea value={fieldValue} onChange={e => handleFieldTextChange(field.key, e.target.value)} placeholder={field.placeholder} rows={6} className="w-full" />}
                          </div>
                        </CardContent>
                      </Card>
                    </div>;
            })}
              </div>
            </div>}
          
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