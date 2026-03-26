
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FormState } from './useFormData';
import { format } from 'date-fns';

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

  // Evita race-condition: se houver 2 loadDrafts simultâneos, só o último pode setar estado/toast.
  const loadDraftsRequestIdRef = useRef(0);
  // Mantém o último resultado bom para evitar toast/limpeza quando falhar apenas um "refresh".
  const lastSuccessfulDraftsRef = useRef<Draft[]>([]);
  // Evita exibir toast “falso positivo” quando uma tentativa falha mas outra (logo em seguida) funciona.
  const errorToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carregar rascunhos do profissional atual
  const loadDrafts = async (options?: { silent?: boolean }) => {
    if (!profissionalAtual?.id) return;

    // Cancela qualquer toast de erro pendente de uma execução anterior
    if (errorToastTimeoutRef.current) {
      clearTimeout(errorToastTimeoutRef.current);
      errorToastTimeoutRef.current = null;
    }

    const silent = options?.silent ?? false;
    const requestId = ++loadDraftsRequestIdRef.current;
    setIsLoadingDrafts(true);

    try {
      // Carregar rascunhos (lista) sem trazer o JSON completo do form_data (evita statement timeout)
      // Limitando a 50 rascunhos
      const { data: draftsData, error: draftsError } = await (supabase as any)
        .from('medical_record_drafts')
        .select(
          'id, patient_id, professional_id, title, created_at, updated_at, ' +
          'queixa_principal:form_data->>queixaPrincipal, ' +
          'antecedentes:form_data->>antecedentes, ' +
          'alergias:form_data->>alergias, ' +
          'evolucao:form_data->>evolucao, ' +
          'prescricao_personalizada:form_data->>prescricaoPersonalizada, ' +
          'data_inicio_atendimento:form_data->>dataInicioAtendimento'
        )
        .eq('professional_id', profissionalAtual.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (draftsError) throw draftsError;

      if (!draftsData || draftsData.length === 0) {
        if (requestId === loadDraftsRequestIdRef.current) {
          lastSuccessfulDraftsRef.current = [];
          setDrafts([]);
        }
        return;
      }

      // Buscar dados dos pacientes separadamente
      const patientIds = draftsData.map((draft: any) => draft.patient_id);
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('id, name, sus, phone, address, date_of_birth, age, gender, created_at, updated_at')
        .in('id', patientIds);

      if (patientsError) throw patientsError;

      // Combinar os dados
      const mappedDrafts = draftsData.map((draft: any) => {
        const patientData = patientsData?.find((p) => p.id === draft.patient_id);

        // Monta um "form_data" mínimo só para exibição na lista.
        // O form_data completo é carregado sob demanda ao clicar em "Carregar".
        const minimalFormData: Partial<FormState> = {
          queixaPrincipal: draft.queixa_principal ?? '',
          antecedentes: draft.antecedentes ?? '',
          alergias: draft.alergias ?? '',
          evolucao: draft.evolucao ?? '',
          prescricaoPersonalizada: draft.prescricao_personalizada ?? '',
          dataInicioAtendimento: draft.data_inicio_atendimento ?? undefined
        };

        return {
          id: draft.id,
          patient_id: draft.patient_id,
          professional_id: draft.professional_id,
          title: draft.title || 'Rascunho sem título',
          form_data: minimalFormData as FormState,
          patient_data: patientData as Patient,
          created_at: draft.created_at,
          updated_at: draft.updated_at
        };
      });

      if (requestId === loadDraftsRequestIdRef.current) {
        // Se chegou até aqui, deu certo: cancela qualquer toast pendente
        if (errorToastTimeoutRef.current) {
          clearTimeout(errorToastTimeoutRef.current);
          errorToastTimeoutRef.current = null;
        }

        lastSuccessfulDraftsRef.current = mappedDrafts;
        setDrafts(mappedDrafts);
      }
    } catch (error) {
      // Se esse request já não é o mais recente, ignora completamente (evita toast “fantasma”).
      if (requestId !== loadDraftsRequestIdRef.current) return;

      console.error('Erro ao carregar rascunhos:', error);

      // Se já temos rascunhos carregados, não exibir toast de erro (apenas falha de refresh).
      if (lastSuccessfulDraftsRef.current.length > 0) {
        setDrafts(lastSuccessfulDraftsRef.current);
        return;
      }

      // Não exibir toast imediatamente: em ambientes instáveis, uma segunda chamada logo em seguida
      // pode carregar corretamente (e o usuário vê os rascunhos). Então atrasamos o toast.
      if (!silent) {
        errorToastTimeoutRef.current = setTimeout(() => {
          // Só mostra se este ainda for o request mais recente (nenhuma nova tentativa venceu)
          if (requestId !== loadDraftsRequestIdRef.current) return;
          toast.error('Erro ao carregar rascunhos');
        }, 1200);
      }

      setDrafts([]);
    } finally {
      if (requestId === loadDraftsRequestIdRef.current) {
        setIsLoadingDrafts(false);
      }
    }
  };

  // Salvar rascunho atual
  // Regra simplificada:
  // - Sempre atualiza o rascunho existente do mesmo paciente+profissional
  // - Nunca cria duplicados para o mesmo paciente
  const saveDraft = async (formData?: FormState, fields?: Record<string, string>) => {
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

      // Data/hora do momento do clique (última atualização)
      const dataHoraAtual = format(new Date(), 'dd/MM/yyyy HH:mm');

      // Título automático com dados do paciente e data/hora
      const draftTitle = `${pacienteSelecionado.name} - SUS: ${pacienteSelecionado.sus} - ${dataHoraAtual}`;

      const nowIso = new Date().toISOString();

      // Mapear os campos para as colunas individuais do banco de dados
      const draftData = {
        main_complaint: dataToSave.queixaPrincipal,
        history: dataToSave.antecedentes,
        allergies: dataToSave.alergias,
        evolution: dataToSave.evolucao,
        custom_prescription: dataToSave.prescricaoPersonalizada,
        prescription_model_id: (dataToSave as any).modeloPrescricao || null,
        exam_requests: dataToSave.examesSelecionados || [],
        exam_observations: dataToSave.observacoesExames,
        exam_results: (dataToSave as any).resultadoExames || '',
        images_data: dataToSave.images || [],
        attendance_start_at: dataToSave.dataInicioAtendimento?.toISOString(),
        attendance_end_at: dataToSave.dataFimAtendimento?.toISOString(),
        appointment_id: (dataToSave as any).appointment_id || null,
        dum: (camposDinamicosParaSalvar as any).dum || (dataToSave as any).dum || null,
        // Manter form_data para compatibilidade se necessário, mas as novas colunas são prioridade
        form_data: formDataWithDynamicFields as any,
        title: draftTitle,
        updated_at: nowIso
      };

      // Sempre buscar rascunho existente do mesmo paciente+profissional (independente do título)
      const { data: existingDraft, error: existingError } = await (supabase as any)
        .from('medical_record_drafts')
        .select('id')
        .eq('patient_id', pacienteSelecionado.id)
        .eq('professional_id', profissionalAtual.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingError) {
        console.error('❌ Erro ao buscar rascunho existente:', existingError);
        toast.error('Erro ao verificar rascunho existente. Tente novamente.');
        return;
      }

      const existingDraftId = existingDraft?.id ?? null;

      console.log('🔍 [DEBUG] Verificação de rascunho existente:', {
        existingDraft,
        existingDraftId,
        pacienteId: pacienteSelecionado.id,
        profissionalId: profissionalAtual.id
      });

      // Atualiza ou cria
      let data: any = null;
      let error: any = null;
      let isCreating = !existingDraftId;

      if (existingDraftId) {
        console.log('♻️ Atualizando rascunho existente do paciente:', existingDraftId);
        const result = await (supabase as any)
          .from('medical_record_drafts')
          .update(draftData)
          .eq('id', existingDraftId)
          .select()
          .single();

        data = result.data;
        error = result.error;

        console.log('♻️ [DEBUG] Resultado da atualização:', { data, error });
      } else {
        console.log('💾 Criando novo rascunho para o paciente...');
        const result = await (supabase as any)
          .from('medical_record_drafts')
          .insert({
            ...draftData,
            patient_id: pacienteSelecionado.id,
            professional_id: profissionalAtual.id,
            created_at: nowIso
          })
          .select()
          .single();

        data = result.data;
        error = result.error;

        console.log('💾 [DEBUG] Resultado da criação:', { data, error });
      }

      if (error) {
        console.error('❌ Erro ao salvar rascunho:', error);
        toast.error('Erro ao salvar rascunho. Tente novamente.');
        return;
      }

      console.log('✅ Rascunho salvo com sucesso:', data);
      console.log('✅ [DEBUG] isCreating:', isCreating, 'existingDraftId:', existingDraftId);

      // Mostrar mensagem diferente para criação vs atualização
      if (isCreating) {
        toast.success(`Rascunho criado com sucesso: ${dataHoraAtual}`);
      } else {
        toast.success(`Rascunho atualizado: ${dataHoraAtual}`);
      }

      // Recarregar a lista de rascunhos
      await loadDrafts();

    } catch (error) {
      console.error('❌ Erro inesperado ao salvar rascunho:', error);
      toast.error('Erro inesperado. Tente novamente.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Carregar rascunho (form_data completo sob demanda)
  const loadDraft = async (draft: Draft) => {
    try {
      console.log('📂 [useDraftManager] Carregando rascunho:', draft);

      // Buscar todas as colunas individuais e o form_data completo (como fallback)
      const { data: fullDraft, error: fullDraftError } = await (supabase as any)
        .from('medical_record_drafts')
        .select(`
          id, patient_id, professional_id, title, 
          main_complaint, history, allergies, evolution, 
          custom_prescription, prescription_model_id, 
          exam_requests, exam_observations, exam_results, 
          images_data, attendance_start_at, attendance_end_at, 
          appointment_id, dum, form_data, 
          created_at, updated_at
        `)
        .eq('id', draft.id)
        .single();

      if (fullDraftError) throw fullDraftError;

      // Priorizar colunas individuais, usar form_data como fallback
      const fallbackData = (fullDraft?.form_data ?? {}) as any;
      
      const formDataToLoad: Partial<FormState> = {
        queixaPrincipal: fullDraft.main_complaint ?? fallbackData.queixaPrincipal ?? '',
        antecedentes: fullDraft.history ?? fallbackData.antecedentes ?? '',
        alergias: fullDraft.allergies ?? fallbackData.alergias ?? '',
        evolucao: fullDraft.evolution ?? fallbackData.evolucao ?? '',
        prescricaoPersonalizada: fullDraft.custom_prescription ?? fallbackData.prescricaoPersonalizada ?? '',
        modeloPrescricao: fullDraft.prescription_model_id ?? fallbackData.modeloPrescricao ?? '',
        examesSelecionados: fullDraft.exam_requests ?? fallbackData.examesSelecionados ?? [],
        observacoesExames: fullDraft.exam_observations ?? fallbackData.observacoesExames ?? '',
        resultadoExames: fullDraft.exam_results ?? fallbackData.resultadoExames ?? '',
        images: fullDraft.images_data ?? fallbackData.images ?? [],
        dataInicioAtendimento: fullDraft.attendance_start_at ? new Date(fullDraft.attendance_start_at) : (fallbackData.dataInicioAtendimento ? new Date(fallbackData.dataInicioAtendimento) : new Date()),
        dataFimAtendimento: fullDraft.attendance_end_at ? new Date(fullDraft.attendance_end_at) : (fallbackData.dataFimAtendimento ? new Date(fallbackData.dataFimAtendimento) : null),
      };

      // Carregar campos dinâmicos do form_data ou usar o campo dum individual
      const loadedDynamicFields = fallbackData.dynamicFields || {};
      if (fullDraft.dum) {
        loadedDynamicFields.dum = fullDraft.dum;
      }
      
      // Adicionar appointment_id se existir (pode ser útil em outros hooks)
      if (fullDraft.appointment_id) {
        (formDataToLoad as any).appointment_id = fullDraft.appointment_id;
      }

      console.log('📂 [useDraftManager] Campos dinâmicos carregados:', loadedDynamicFields);
      console.log('📂 [useDraftManager] Dados do formulário montados:', formDataToLoad);

      // PRIMEIRO: Carregar campos dinâmicos se existirem e o callback estiver disponível
      if (onDynamicFieldsChange) {
        onDynamicFieldsChange(loadedDynamicFields);
      }

      // DEPOIS: Carregar dados do formulário
      setFormData(formDataToLoad as FormState);

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
      // Carregamento inicial silencioso para evitar toast “fantasma” durante a inicialização/auth.
      loadDrafts({ silent: true });
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
