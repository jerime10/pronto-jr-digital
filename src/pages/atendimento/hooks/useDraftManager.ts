
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FormState } from './useFormData';

export interface Patient {
  id: string;
  name: string;
  sus: string;
  phone: string;
  address: string;
  date_of_birth: string | null;
  age: number;
  gender: string;
  created_at: string;
  updated_at: string;
}

export interface Draft {
  id: string;
  patient_id: string;
  professional_id: string;
  title: string;
  form_data: FormState;
  patient_data: Patient;
  created_at: string;
  updated_at: string;
}

interface UseDraftManagerProps {
  pacienteSelecionado: Patient | null;
  profissionalAtual: { id: string; nome: string } | null;
  form: FormState;
  setFormData: (formData: FormState) => void;
  handleSelectPaciente: (patient: Patient) => void;
  dynamicFields?: Record<string, string>;
  onDynamicFieldsChange?: (fields: Record<string, string>) => void;
}

export const useDraftManager = ({
  pacienteSelecionado,
  profissionalAtual,
  form,
  setFormData,
  handleSelectPaciente,
  dynamicFields = {},
  onDynamicFieldsChange
}: UseDraftManagerProps) => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Carregar rascunhos do profissional atual
  const loadDrafts = async () => {
    if (!profissionalAtual?.id) return;

    setIsLoadingDrafts(true);
    try {
      // Carregar rascunhos usando type assertion para contornar problemas de tipagem
      // Limitando a 50 rascunhos para evitar timeout
      const { data: draftsData, error: draftsError } = await (supabase as any)
        .from('medical_record_drafts')
        .select('id, patient_id, professional_id, title, form_data, created_at, updated_at')
        .eq('professional_id', profissionalAtual.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (draftsError) throw draftsError;

      if (!draftsData || draftsData.length === 0) {
        setDrafts([]);
        return;
      }

      // Buscar dados dos pacientes separadamente
      const patientIds = draftsData.map((draft: any) => draft.patient_id);
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .in('id', patientIds);

      if (patientsError) throw patientsError;

      // Combinar os dados
      const mappedDrafts = draftsData.map((draft: any) => {
        const patientData = patientsData?.find(p => p.id === draft.patient_id);
        return {
          id: draft.id,
          patient_id: draft.patient_id,
          professional_id: draft.professional_id,
          title: draft.title || 'Rascunho sem título',
          form_data: draft.form_data as FormState,
          patient_data: patientData as Patient,
          created_at: draft.created_at,
          updated_at: draft.updated_at
        };
      });

      setDrafts(mappedDrafts);
    } catch (error) {
      console.error('Erro ao carregar rascunhos:', error);
      toast.error('Erro ao carregar rascunhos');
      setDrafts([]);
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  // Salvar rascunho atual - agora aceita título e sempre cria novo
  const saveDraft = async (title?: string, formData?: FormState, fields?: Record<string, string>) => {
    if (!pacienteSelecionado || !profissionalAtual) {
      console.error('❌ [useDraftManager] Dados insuficientes para salvar rascunho:', { 
        paciente: !!pacienteSelecionado, 
        profissional: !!profissionalAtual 
      });
      toast.error('Selecione um paciente e profissional antes de salvar o rascunho.');
      return;
    }

    const dataToSave = formData || form;
    
    // Combinar formData com dynamicFields (usar o que foi passado ou o do estado)
    const camposDinamicosParaSalvar = fields || dynamicFields || {};
    
    console.log('💾 [useDraftManager] Salvando rascunho com campos dinâmicos:', camposDinamicosParaSalvar);
    
    const formDataWithDynamicFields = {
      ...dataToSave,
      dynamicFields: camposDinamicosParaSalvar
    };

    try {
      setIsSavingDraft(true);
      console.log('🔍 Verificando se paciente existe na tabela patients...');
      
      // Verificar se o paciente existe na tabela patients
      const { data: existingPatient, error: checkError } = await supabase
        .from('patients')
        .select('id')
        .eq('id', pacienteSelecionado.id)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Erro ao verificar paciente na tabela patients:', checkError);
        toast.error('Erro ao verificar dados do paciente.');
        return;
      }

      // Se o paciente não existir, criar automaticamente
      if (!existingPatient) {
        console.log('⚠️ Paciente não encontrado na tabela patients. Criando automaticamente...');
        
        const { error: createError } = await supabase
          .from('patients')
          .insert([{
            id: pacienteSelecionado.id,
            name: pacienteSelecionado.name,
            sus: pacienteSelecionado.sus,
            phone: pacienteSelecionado.phone || '',
            address: pacienteSelecionado.address || '',
            date_of_birth: pacienteSelecionado.date_of_birth,
            age: pacienteSelecionado.age || 0,
            gender: pacienteSelecionado.gender || '',
            created_at: pacienteSelecionado.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (createError) {
          console.error('❌ Erro ao criar paciente na tabela patients:', createError);
          toast.error('Erro ao criar registro do paciente. Tente novamente.');
          return;
        }

        console.log('✅ Paciente criado automaticamente na tabela patients');
        toast.success('Paciente registrado automaticamente no sistema.');
      } else {
        console.log('✅ Paciente já existe na tabela patients');
      }

      // Gerar título automático se não fornecido
      const draftTitle = title || `Rascunho - ${new Date().toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;

      // SEMPRE criar novo rascunho (não sobrescrever)
      console.log('💾 Criando novo rascunho...');
      const { data, error } = await supabase
        .from('medical_record_drafts')
        .insert({
          patient_id: pacienteSelecionado.id,
          professional_id: profissionalAtual.id,
          title: draftTitle,
          form_data: formDataWithDynamicFields as any,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar rascunho:', error);
        toast.error('Erro ao salvar rascunho. Tente novamente.');
        return;
      }

      console.log('✅ Rascunho salvo com sucesso:', data);
      toast.success(`Rascunho "${draftTitle}" salvo com sucesso!`);
      
      // Recarregar a lista de rascunhos
      await loadDrafts();
      
    } catch (error) {
      console.error('❌ Erro inesperado ao salvar rascunho:', error);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Carregar rascunho
  const loadDraft = async (draft: Draft) => {
    try {
      console.log('📂 [useDraftManager] Carregando rascunho:', draft);
      
      // Separar dynamicFields do form_data
      const { dynamicFields: loadedDynamicFields, ...formDataWithoutDynamicFields } = draft.form_data;
      
      console.log('📂 [useDraftManager] Campos dinâmicos do rascunho:', loadedDynamicFields);
      console.log('📂 [useDraftManager] Dados do formulário (sem campos dinâmicos):', formDataWithoutDynamicFields);
      
      // PRIMEIRO: Carregar campos dinâmicos se existirem e o callback estiver disponível
      if (loadedDynamicFields && onDynamicFieldsChange) {
        console.log('📂 [useDraftManager] Chamando onDynamicFieldsChange com:', loadedDynamicFields);
        onDynamicFieldsChange(loadedDynamicFields);
      } else {
        console.warn('⚠️ [useDraftManager] Campos dinâmicos não carregados:', {
          temCamposDinamicos: !!loadedDynamicFields,
          temCallback: !!onDynamicFieldsChange,
          campos: loadedDynamicFields
        });
      }
      
      // DEPOIS: Carregar dados do formulário
      setFormData(formDataWithoutDynamicFields);
      
      // POR ÚLTIMO: Selecionar o paciente
      handleSelectPaciente(draft.patient_data);
      
      toast.success(`Rascunho de ${draft.patient_data.name} carregado!`);
    } catch (error) {
      console.error('❌ [useDraftManager] Erro ao carregar rascunho:', error);
      toast.error('Erro ao carregar rascunho');
    }
  };

  // Deletar rascunho
  const deleteDraft = async (draftId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('medical_record_drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;

      toast.success('Rascunho deletado com sucesso!');
      
      // Recarregar lista de rascunhos
      await loadDrafts();
    } catch (error) {
      console.error('Erro ao deletar rascunho:', error);
      toast.error('Erro ao deletar rascunho');
    }
  };

  // Carregar rascunhos quando o profissional for definido
  useEffect(() => {
    if (profissionalAtual?.id) {
      loadDrafts();
    }
  }, [profissionalAtual?.id]);

  return {
    drafts,
    isLoadingDrafts,
    isSavingDraft,
    saveDraft,
    loadDraft,
    deleteDraft,
    loadDrafts
  };
};
