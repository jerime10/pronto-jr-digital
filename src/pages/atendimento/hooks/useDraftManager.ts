
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FormState } from './useFormData';

interface Patient {
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

interface Draft {
  id: string;
  patient_id: string;
  professional_id: string;
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
}

export const useDraftManager = ({
  pacienteSelecionado,
  profissionalAtual,
  form,
  setFormData,
  handleSelectPaciente
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
      const { data: draftsData, error: draftsError } = await (supabase as any)
        .from('medical_record_drafts')
        .select('*')
        .eq('professional_id', profissionalAtual.id)
        .order('updated_at', { ascending: false });

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

  // Salvar rascunho atual
  const saveDraft = async () => {
    if (!pacienteSelecionado || !profissionalAtual || !pacienteSelecionado.id || !profissionalAtual.id) {
      toast.error('Paciente e profissional devem estar selecionados e cadastrados');
      return;
    }

    if (!form.queixaPrincipal.trim()) {
      toast.error('Queixa principal é obrigatória para salvar rascunho');
      return;
    }

    setIsSavingDraft(true);
    try {
      // Verificar se já existe um rascunho para este paciente e profissional
      const { data: existingDrafts, error: searchError } = await (supabase as any)
        .from('medical_record_drafts')
        .select('id')
        .eq('patient_id', pacienteSelecionado.id)
        .eq('professional_id', profissionalAtual.id);

      if (searchError) throw searchError;

      const draftData = {
        patient_id: pacienteSelecionado.id,
        professional_id: profissionalAtual.id,
        form_data: form
      };

      if (existingDrafts && existingDrafts.length > 0) {
        // Atualizar rascunho existente
        const { error } = await (supabase as any)
          .from('medical_record_drafts')
          .update(draftData)
          .eq('id', existingDrafts[0].id);

        if (error) throw error;
        toast.success('Rascunho atualizado com sucesso!');
      } else {
        // Criar novo rascunho
        const { error } = await (supabase as any)
          .from('medical_record_drafts')
          .insert(draftData);

        if (error) throw error;
        toast.success('Rascunho salvo com sucesso!');
      }

      // Recarregar lista de rascunhos
      await loadDrafts();
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      toast.error('Erro ao salvar rascunho');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Carregar rascunho
  const loadDraft = async (draft: Draft) => {
    try {
      // Selecionar o paciente
      handleSelectPaciente(draft.patient_data);
      
      // Carregar dados do formulário
      setFormData(draft.form_data);
      
      toast.success(`Rascunho de ${draft.patient_data.name} carregado!`);
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error);
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
