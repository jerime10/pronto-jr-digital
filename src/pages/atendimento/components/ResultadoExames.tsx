import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Trash2, Save, Eraser } from 'lucide-react';
import { toast } from 'sonner';
import { calculateDUMFromIG } from '@/utils/obstetricUtils';
import { useAIProcessing } from '../hooks/useAIProcessing';
import { FieldAutocompleteMulti } from '@/components/ui/field-autocomplete-multi';
import { useIndividualFieldTemplates } from '@/hooks/useIndividualFieldTemplates';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
    return { fields: [], template: '' };
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
      const hasMultipleFields = (
        (line.includes('SITUAÇÃO') && (line.includes('IG') || line.includes('DPP'))) ||
        (line.includes('DPP') && line.includes('SITUAÇÃO')) ||
        (line.includes('IG') && line.includes('DPP'))
      );
      
      if (hasMultipleFields) {
        console.log(`🔧 [PARSE] Linha com múltiplos campos encontrada: "${line}"`);
        
        // Separar campos usando regex mais robusta
        const fieldPatterns = [
          /(SITUAÇÃO[^,]*(?:\([^)]*\))?)/gi,
          /(IG[^,]*(?:\([^)]*\))?)/gi,
          /(DPP[^,]*(?:\([^)]*\))?)/gi
        ];
        
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
    return text.toLowerCase()
      .replace(/[áàâãä]/g, 'a')
      .replace(/[éèêë]/g, 'e')
      .replace(/[íìîï]/g, 'i')
      .replace(/[óòôõö]/g, 'o')
      .replace(/[úùûü]/g, 'u')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '')
      .replace(/\s+/g, '');
  };
  
  // Função auxiliar para determinar tipo de campo
  const getFieldType = (key: string, label: string): 'input' | 'textarea' | 'date' => {
    // Campos de data
    if (key.includes('data') || key.includes('dpp') || label.toLowerCase().includes('data')) {
      return 'date';
    }
    
    // Campos que devem ser textarea (textos longos)
    const textareaFields = [
      'impressaodiagnostica', 'impressao', 'diagnostica',
      'achadosadicionais', 'achados', 'adicionais',
      'recomendacoes', 'observacoes', 'conclusao',
      'apresentacao', 'situacao', 'cordaoumbilical',
      'placenta', 'gravidez', 'feto', 'comentarios'
    ];
    
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
  console.log('🔍 [PARSE] Campos:', fields.map(f => ({ label: f.label, key: f.key, type: f.type })));
  console.log('🔍 [PARSE] ===== FIM parseTemplateToFields =====');
  
  return { fields, template };
};

interface ResultadoExamesProps {
  patientId?: string;
  examResults: string;
  onExamResultsChange: (value: string) => void;
  examObservations: string;
  onExamObservationsChange: (value: string) => void;
  isProcessingAI: { examResults: boolean };
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
  const [fieldToDelete, setFieldToDelete] = useState<{ key: string; label: string } | null>(null);
  const [selectedFieldValues, setSelectedFieldValues] = useState<Record<string, string[]>>({});
  const [isSavingField, setIsSavingField] = useState<string | null>(null);
  const [isProcessingField, setIsProcessingField] = useState<string | null>(null);
  
  // Hook para gerenciar templates salvos
  const {
    searchFieldTemplates,
    saveFieldTemplate,
    deleteFieldTemplate,
    isSaving,
    isDeleting,
  } = useIndividualFieldTemplates();
  
  // Hook para processamento de IA (fallback se não vier das props)
  const { processAIContent: processAIContentLocal } = useAIProcessing();
  
  // Criar processAIContent customizado que inclui updateDynamicFieldsFromAI
  const processAIContentWithCallback = React.useCallback(async (
    field: 'main_complaint' | 'evolution' | 'exam_result',
    content: string,
    dynamicFieldsParam?: Record<string, string>
  ) => {
    if (processAIContentProp) {
      // processAIContentProp tem assinatura: (field: string, content: string, dynamicFields?: Record<string, string>)
      console.log('🔄 [ResultadoExames] Usando processAIContent das props');
      await processAIContentProp(field, content, dynamicFieldsParam);
    } else {
      // processAIContentLocal tem assinatura: (content, type, onSuccess, selectedModelTitle, dynamicFields)
      console.log('🔄 [ResultadoExames] Usando processAIContent local');
      await processAIContentLocal(content, field, (processed) => {
        console.log('✅ Conteúdo processado via local');
      }, null, dynamicFieldsParam);
    }
  }, [processAIContentProp, processAIContentLocal]);
  
  // Usar o processAIContent customizado
  const processAIContent = processAIContentWithCallback;
  
  // useEffect para adicionar título do modelo ao Resultado Final quando modelo é selecionado
  useEffect(() => {
    if (selectedModel && selectedModel.name) {
      console.log('🎯 [EFFECT] Modelo selecionado mudou, verificando título:', selectedModel.name);
      console.log('🎯 [EFFECT] examResults atual:', examResults);
      
      // Verificar se o título já não está presente
      if (!examResults.includes(selectedModel.name)) {
        console.log('🎯 [EFFECT] Título não presente, adicionando...');
        
        // Preservar conteúdo existente e adicionar título no início
        const examTitle = `${selectedModel.name}\n\n`;
        const newContent = examTitle + (examResults || '');
        
        console.log('🎯 [EFFECT] Novo conteúdo:', newContent);
        
        if (onExamResultsChange) {
          onExamResultsChange(newContent);
          console.log('🎯 [EFFECT] Título adicionado preservando conteúdo existente!');
        } else {
          console.error('❌ [EFFECT] onExamResultsChange não disponível');
        }
      } else {
        console.log('🎯 [EFFECT] Título já presente no Resultado Final');
      }
    }
  }, [selectedModel, onExamResultsChange]);
  
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
    const mergedFields = { ...dynamicFields, ...aiFields };
    
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
            const mergedFields = { ...dynamicFields, ...dynamicFieldsFromProps };
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
        const { data, error } = await supabase
          .from('modelo-result-exames')
          .select('id, name, result_template')
          .order('name');

        console.log('📥 [FETCH] Resposta do banco:', { data, error });

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
    if (
      initialSelectedModelId && 
      completedExams.length > 0 && 
      initialSelectedModelId !== selectedModelId &&
      lastRestoredIdRef.current !== initialSelectedModelId
    ) {
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
  const handleFieldModelChange = (fieldKey: string, selectedIds: string[]) => {
    console.log('📝 [MULTI-SELECT] Campo:', fieldKey, 'IDs selecionados:', selectedIds);
    
    // Atualizar valores selecionados
    setSelectedFieldValues(prev => ({
      ...prev,
      [fieldKey]: selectedIds
    }));
    
    // Concatenar os valores selecionados com separador específico
    const joinedValue = selectedIds.join('\n\n... ... ...\n\n');
    
    // Atualizar campo de texto
    const newFields = { ...dynamicFields, [fieldKey]: joinedValue };
    setDynamicFields(newFields);
    updateExamResults(newFields);
    
    // Notificar componente pai
    if (onDynamicFieldsChange) {
      onDynamicFieldsChange(newFields);
    }
  };

  // Handler para mudança direta do texto do campo
  const handleFieldTextChange = (fieldKey: string, value: string) => {
    console.log('📝 [TEXT-CHANGE] Campo:', fieldKey, 'Valor:', value);
    
    // 🔍 DEBUG ESPECÍFICO: Impressão Diagnóstica
    if (fieldKey === 'impressaodiagnostica') {
      console.log('🔍🔍🔍 [IMPRESSÃO-DIAGNÓSTICA] ===== CAMPO DETECTADO =====');
      console.log('🔍 [IMPRESSÃO-DIAGNÓSTICA] Valor recebido:', value);
      console.log('🔍 [IMPRESSÃO-DIAGNÓSTICA] Tamanho:', value?.length || 0);
      console.log('🔍 [IMPRESSÃO-DIAGNÓSTICA] dynamicFields ANTES:', dynamicFields);
    }
    
    const newFields = { ...dynamicFields, [fieldKey]: value };
    setDynamicFields(newFields);
    
    // 🔍 DEBUG ESPECÍFICO: Impressão Diagnóstica
    if (fieldKey === 'impressaodiagnostica') {
      console.log('🔍 [IMPRESSÃO-DIAGNÓSTICA] newFields DEPOIS:', newFields);
      console.log('🔍 [IMPRESSÃO-DIAGNÓSTICA] Campo está em newFields?', fieldKey in newFields);
      console.log('🔍 [IMPRESSÃO-DIAGNÓSTICA] Valor em newFields:', newFields[fieldKey]);
      console.log('🔍🔍🔍 [IMPRESSÃO-DIAGNÓSTICA] ===== FIM =====');
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
    console.log('🔄 [UPDATE] Template customizado recebido:', customTemplate);
    console.log('🔄 [UPDATE] selectedTemplate:', selectedTemplate);
    console.log('🔄 [UPDATE] selectedModel:', selectedModel);
    
    if (!selectedTemplate || !selectedModel) {
      console.log('🔄 [UPDATE] Nenhum template ou modelo selecionado, saindo...');
      return;
    }

    // Usar o template customizado se fornecido, senão usar o selectedTemplate atual
    const templateToUse = customTemplate || selectedTemplate;

    // Verificar se há campo IG e calcular DUM automaticamente
    const enhancedFields = { ...fields };
    
    // Procurar por campos que contenham "IG" ou "IDADE GESTACIONAL"
    const igField = Object.keys(enhancedFields).find(key => 
      key.toLowerCase().includes('ig') || 
      key.toLowerCase().includes('idadegestacional') ||
      key.toLowerCase().includes('idade') && key.toLowerCase().includes('gestacional')
    );
    
    if (igField && enhancedFields[igField]) {
      console.log('🤰 [UPDATE] Campo IG encontrado:', igField, 'Valor:', enhancedFields[igField]);
      
      // Calcular DUM a partir da IG
      const calculatedDUM = calculateDUMFromIG(enhancedFields[igField]);
      
      if (calculatedDUM) {
        // Procurar se já existe um campo DUM
        const dumField = Object.keys(enhancedFields).find(key => 
          key.toLowerCase().includes('dum') || 
          key.toLowerCase().includes('dataultimamenstruacao') ||
          (key.toLowerCase().includes('data') && key.toLowerCase().includes('ultima') && key.toLowerCase().includes('menstruacao'))
        );
        
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

    // Preservar o título do modelo se já estiver presente no examResults
    const currentExamResults = examResults || '';
    const modelTitle = selectedModel?.name || '';
    
    console.log('🔄 [UPDATE] examResults atual:', currentExamResults);
    console.log('🔄 [UPDATE] Título do modelo:', modelTitle);
    
    // Verificar se o título já está presente no início do examResults
    const titleAlreadyPresent = currentExamResults.startsWith(modelTitle);
    console.log('🔄 [UPDATE] Título já presente:', titleAlreadyPresent);
    
    // Usar o template atualizado (customTemplate ou selectedTemplate) em vez do template original do banco
    // Isso garante que campos excluídos não apareçam no resultado
    let result = templateToUse.template || selectedModel.result_template || '';
    
    // Se o título já está presente no examResults, preservá-lo
    if (titleAlreadyPresent && modelTitle) {
      result = `${modelTitle}\n\n${result}`;
      console.log('🔄 [UPDATE] Título preservado no resultado');
    }
    
    console.log('🔄 [UPDATE] Template inicial (com título preservado):', result);
    console.log('🔄 [UPDATE] Template original do banco:', selectedModel.result_template);
    
    // Log específico para modelo obstétrico
    if (selectedModel?.name?.includes('OBSTÉTRICA')) {
      console.log('🎯 [UPDATE-OBSTÉTRICO] Template obstétrico detectado');
      console.log('🎯 [UPDATE-OBSTÉTRICO] Linhas do template:', result.split('\n').map((line, idx) => `${idx}: "${line}"`));
      
      // Verificar se há problema de formatação entre SITUAÇÃO e IG
      const lines = result.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('SITUAÇÃO') && line.includes('IG')) {
          console.log(`🚨 [UPDATE-OBSTÉTRICO] PROBLEMA ENCONTRADO na linha ${idx}: "${line}"`);
          console.log(`🚨 [UPDATE-OBSTÉTRICO] Caracteres:`, line.split('').map((char, charIdx) => `${charIdx}: '${char}'`));
        }
      });
    }
    
    // Usar os campos aprimorados (com DUM calculada se aplicável)
    const fieldsToProcess = enhancedFields;
    
    // Como agora usamos o template já atualizado (sem campos excluídos),
    // não precisamos mais filtrar linhas aqui
    console.log('🔄 [UPDATE] Usando template já filtrado:', result);
    
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
    
    // Substituir campos pelos valores preenchidos
    templateToUse.fields.forEach((field, index) => {
      const value = fields[field.key] || '';
      console.log(`🔍 [UPDATE] Processando campo ${index + 1}:`, {
        key: field.key,
        label: field.label,
        type: field.type,
        value: value,
        hasValue: !!value.trim()
      });
      
      if (!value.trim()) {
        console.log(`⚠️ [UPDATE] Valor vazio para ${field.key}, pulando...`);
        return;
      }
      
      // Escapar caracteres especiais para regex
      const escapedLabel = field.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      console.log(`🔍 [UPDATE] Label escapado: "${escapedLabel}"`);
      
      // Para campos input e date
      const formattedValue = field.type === 'date' ? formatDate(value) : value;
      console.log('🔍 [UPDATE] Valor formatado:', formattedValue);
      
      // Lista de padrões para tentar substituir (em ordem de prioridade)
      const patterns = [
        // Padrão para textarea: CAMPO (Campo de texto multilinha (textarea))
        new RegExp(`${escapedLabel}\\s*\\(Campo de texto multilinha \\(textarea\\)\\)`, 'gi'),
        // Padrão para texto longo: CAMPO (texto longo)
        new RegExp(`${escapedLabel}\\s*\\(texto longo\\)`, 'gi'),
        // Padrão para texto curto: CAMPO (texto curto)
        new RegExp(`${escapedLabel}\\s*\\(texto curto\\)`, 'gi'),
        // Padrão simples: CAMPO: ___
        new RegExp(`${escapedLabel}:\\s*_{2,}`, 'gi'),
        // Campos simples com underscores: CAMPO ___
        new RegExp(`${escapedLabel}\\s+_{2,}`, 'gi'),
        // Campos de data específicos: CAMPO: __/__/____
        new RegExp(`${escapedLabel}:\\s*__\\/__\\/____`, 'gi'),
        // Padrão específico para IG: IG (IDADE GESTACIONAL) (texto curto)
        new RegExp(`IG\\s*\\(IDADE GESTACIONAL\\)\\s*\\(texto curto\\)`, 'gi'),
        // Padrão para campos com dois pontos sem underscores: CAMPO: (texto curto)
        new RegExp(`${escapedLabel}:\\s*\\(texto curto\\)`, 'gi'),
        // Padrão para campos sem dois pontos: CAMPO (texto curto)
        new RegExp(`${escapedLabel}\\s+\\(texto curto\\)`, 'gi'),
        // Padrão específico para AF: AF (MAIOR BOLSÃO VERTICAL): (texto curto)
        new RegExp(`AF\\s*\\(MAIOR BOLSÃO VERTICAL\\):\\s*\\(texto curto\\)`, 'gi'),
        // Padrão para DPP: DPP (formato data "dd/mm/aaaa")
        new RegExp(`DPP\\s*\\(formato data "dd/mm/aaaa"\\)`, 'gi'),
        // Padrão genérico para qualquer campo: QUALQUER_COISA: (texto curto)
        new RegExp(`([A-ZÀ-ÿ\\s\\(\\)]+):\\s*\\(texto curto\\)`, 'gi'),
        // Padrão genérico para qualquer campo sem dois pontos: QUALQUER_COISA (texto curto)
        new RegExp(`([A-ZÀ-ÿ\\s\\(\\)]+)\\s+\\(texto curto\\)`, 'gi')
      ];
      
      let substituted = false;
      
      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        console.log(`🔍 [UPDATE] Testando padrão ${i + 1}:`, pattern);
        
        // Reset regex lastIndex
        pattern.lastIndex = 0;
        const testMatch = result.match(pattern);
        console.log(`🔍 [UPDATE] Match padrão ${i + 1}:`, testMatch);
        
        if (testMatch) {
          // Tratamento especial para IG
          if (i === 6 && (field.key === 'ig' || field.key === 'idadegestacional')) {
            result = result.replace(pattern, `IG (IDADE GESTACIONAL): ${formattedValue}`);
          }
          // Tratamento especial para AF
          else if (i === 9 && (field.key === 'af' || field.key === 'maiorbolsaovertical')) {
            result = result.replace(pattern, `AF (MAIOR BOLSÃO VERTICAL): ${formattedValue}`);
          }
          // Tratamento especial para DPP
          else if (i === 10 && (field.key === 'dpp' || field.key === 'dataprovavelparto')) {
            result = result.replace(pattern, `DPP: ${formattedValue}`);
          }
          // Para textarea, usar formatação especial
          else if (i === 0 && field.type === 'textarea') {
            result = result.replace(pattern, `${field.label}:\n${formattedValue}`);
          } 
          // Para padrões genéricos (últimos dois), usar o grupo capturado
          else if (i >= 11) {
            const match = testMatch[0];
            const capturedLabel = testMatch[1] || field.label;
            result = result.replace(pattern, `${capturedLabel}: ${formattedValue}`);
          }
          else {
            result = result.replace(pattern, `${field.label}: ${formattedValue}`);
          }
          console.log(`✅ [UPDATE] Substituição com padrão ${i + 1} realizada`);
          substituted = true;
          break;
        }
      }
      
      if (!substituted) {
        console.log(`❌ [UPDATE] Nenhum padrão funcionou para o campo: ${field.label}`);
      }
    });

    // Correção final: garantir que nenhum campo seja separado por vírgulas
    if (selectedModel?.name?.includes('OBSTÉTRICA')) {
      console.log('🔧 [UPDATE] Aplicando correção final para modelo obstétrico...');
      
      // Separar linhas que contenham vírgulas entre campos conhecidos
      const lines = result.split('\n');
      const finalCorrectedLines = [];
      
      for (let line of lines) {
        // Verificar se a linha contém vírgulas entre campos obstétricos
        if (line.includes(',') && (
          line.includes('SITUAÇÃO') || line.includes('DPP') || line.includes('IG') ||
          line.includes('BCF') || line.includes('BPD') || line.includes('CC')
        )) {
          console.log(`🔧 [UPDATE] Linha com vírgulas encontrada: "${line}"`);
          
          // Separar por vírgulas e limpar cada parte
          const parts = line.split(',').map(part => part.trim()).filter(part => part.length > 0);
          
          if (parts.length > 1) {
            console.log(`🔧 [UPDATE] Separando ${parts.length} partes:`, parts);
            finalCorrectedLines.push(...parts);
          } else {
            finalCorrectedLines.push(line);
          }
        } else {
          finalCorrectedLines.push(line);
        }
      }
      
      result = finalCorrectedLines.join('\n');
      console.log('🔧 [UPDATE] Resultado final corrigido (sem vírgulas):', result);
    }
    
    console.log('🔄 [UPDATE] Resultado final gerado:', result);
    console.log('🔄 [UPDATE] Ainda contém placeholders?', result.includes('(texto') || result.includes('(Campo de texto'));
    
    if (result.includes('(texto') || result.includes('(Campo de texto')) {
      console.log('❌ [UPDATE] PROBLEMA: Ainda há placeholders não substituídos!');
      const remainingPlaceholders = result.match(/\((texto [^)]+|Campo de texto[^)]+)\)/g);
      console.log('❌ [UPDATE] Placeholders restantes:', remainingPlaceholders);
    } else {
      console.log('✅ [UPDATE] SUCESSO: Todos os placeholders foram substituídos!');
    }
    
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
      const fieldsWithFullContext = [
        'impressaodiagnostica',
        'achadosadicionais',
        'recomendacoes'
      ];
      
      // Determinar quais campos enviar
      let fieldsToSend: Record<string, string> = {};
      
      if (fieldsWithFullContext.includes(field.key)) {
        // ===== ENVIAR TODOS OS CAMPOS =====
        console.log('🎯 [AI-FIELD] Campo especial detectado - Enviando TODOS os campos');
        
        if (selectedTemplate) {
          selectedTemplate.fields.forEach((f) => {
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
      const { data, error } = await supabase.functions.invoke('ai-webhook', {
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
          [field.key]: processedContent
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


  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resultado de Exames</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="w-full md:w-1/2">
              <Select 
                value={selectedModelId} 
                onValueChange={handleModelSelect}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um modelo de exame" />
                </SelectTrigger>
                <SelectContent>
                  {(() => {
                    console.log('🎨 [DROPDOWN] Renderizando dropdown com modelos:', completedExams.length);
                    console.log('🎨 [DROPDOWN] Modelos:', completedExams.map(m => ({ id: m.id, name: m.name })));
                    return null;
                  })()}
                  {completedExams.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              onClick={handleProcessWithAI}
              variant="outline"
              className="w-full md:w-auto"
              disabled={isProcessingAI.examResults}
            >
              {isProcessingAI.examResults ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Processar com IA
                </>
              )}
            </Button>
          </div>

          {/* Campos dinâmicos baseados no template */}
          {(() => {
            console.log('🎨 [DEBUG] Renderizando campos - selectedTemplate:', selectedTemplate);
            console.log('🎨 [DEBUG] Campos disponíveis:', selectedTemplate?.fields);
            return null;
          })()}
          {selectedTemplate && selectedTemplate.fields.length > 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Campos do Exame - {selectedModel?.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  💡 Digite nos campos para ver sugestões salvas. Clique no <strong>🗑️ lixeira</strong> para excluir permanentemente
                </p>
              </div>
              <div className="space-y-4">
                {selectedTemplate.fields.map((field) => {
                  const fieldValue = dynamicFields[field.key] || '';
                  const selectedValues = selectedFieldValues[field.key] || [];
                  
                  return field.type === 'date' ? (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <Input
                        id={field.key}
                        type="date"
                        value={fieldValue}
                        onChange={(e) => {
                          console.log('🎯 [DATE] Campo alterado:', field.key, 'Valor:', e.target.value);
                          const newFields = { ...dynamicFields, [field.key]: e.target.value };
                          console.log('🎯 [DATE] Novos campos:', newFields);
                          setDynamicFields(newFields);
                          updateExamResults(newFields);
                        }}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div key={field.key} className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            Modelos: {field.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">
                              Selecionar Modelos de {field.label}
                              <span className="text-xs text-muted-foreground ml-2">
                                (Clique no X para remover da seleção, no lixeira 🗑️ para excluir permanentemente)
                              </span>
                            </Label>
                            <FieldAutocompleteMulti
                              selectedValues={selectedValues}
                              onChange={(selectedIds) => handleFieldModelChange(field.key, selectedIds)}
                              onSearch={(searchTerm) => searchFieldTemplates(field.key, searchTerm, selectedModel?.name || '')}
                              placeholder={`Digite para buscar modelos de ${field.label.toLowerCase()}...`}
                              fieldName={field.key}
                              className="w-full"
                            />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">
                            {field.label} Personalizado
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm font-medium">
                                Edite ou adicione informações adicionais
                              </Label>
                              <div className="flex gap-2">
                                {/* Botão para processar campo individual com IA */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleProcessFieldWithAI(field)}
                                  disabled={!fieldValue.trim() || isProcessingField === field.key}
                                  title="Processar este campo com IA"
                                >
                                  {isProcessingField === field.key ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Sparkles className="h-4 w-4" />
                                  )}
                                </Button>
                                
                                {/* Botão para salvar template do campo */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
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
                                        modelName: selectedModel.name,
                                      });
                                      console.log('✅ [SAVE] Campo salvo com sucesso');
                                      toast.success(`Campo ${field.label} salvo com sucesso!`);
                                    } catch (error) {
                                      console.error('❌ [SAVE] Erro ao salvar:', error);
                                      toast.error('Não foi possível salvar o template.');
                                    } finally {
                                      setIsSavingField(null);
                                    }
                                  }}
                                  disabled={!fieldValue.trim() || isSavingField === field.key}
                                  title="Salvar este campo como template"
                                >
                                  {isSavingField === field.key ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                </Button>
                                
                                {/* Botão para limpar campo */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setFieldToDelete({ key: field.key, label: field.label });
                                    setDeleteConfirmOpen(true);
                                  }}
                                  disabled={isDeleting}
                                  title="Limpar dados salvos deste campo"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Eraser className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <Textarea
                              value={fieldValue}
                              onChange={(e) => handleFieldTextChange(field.key, e.target.value)}
                              placeholder={field.placeholder}
                              rows={6}
                              className="w-full"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
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
                <AlertDialogAction
                  onClick={() => {
                    if (fieldToDelete && selectedModel) {
                      // Buscar o template salvo e deletar
                      searchFieldTemplates(fieldToDelete.key, '', selectedModel.name).then((results) => {
                        if (results.length > 0) {
                          deleteFieldTemplate(results[0].id);
                        }
                      });
                    }
                    setFieldToDelete(null);
                    setDeleteConfirmOpen(false);
                  }}
                >
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <div className="space-y-2">
            <Label htmlFor="examResults">Resultado Final</Label>
            <Textarea
              id="examResults"
              value={examResults}
              onChange={(e) => onExamResultsChange(e.target.value)}
              placeholder="Resultado final do exame será gerado automaticamente"
              className="min-h-[300px] font-mono"
              readOnly
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultadoExames;