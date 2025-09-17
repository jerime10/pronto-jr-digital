
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FormState } from './useFormData';
import { submitMedicalRecordToWebhook } from '@/services/medicalRecordSubmissionService';

// Types for this hook
interface Patient {
  id: string;
  name: string;
  sus: string;
  phone: string;
  address: string;
  date_of_birth: string | null;
  age: number;
  gender: string;
}

interface Professional {
  id: string;
  nome: string;
  email: string;
  tipo: 'ADMIN' | 'COMUM';
}

interface ExamModel {
  id: string;
  name: string;
}

interface UseSaveActionsProps {
  pacienteSelecionado: Patient | null;
  profissionalAtual: Professional | null;
  form: FormState;
  examModels: ExamModel[];
  resetForm: () => void;
  selectedModelTitle?: string | null;
  appointmentId?: string;
}

export const useSaveActions = ({
  pacienteSelecionado,
  profissionalAtual,
  form,
  examModels,
  resetForm,
  selectedModelTitle,
  appointmentId
}: UseSaveActionsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const navigate = useNavigate();

  // Função para salvar dados localmente no localStorage
  const saveToLocalStorage = (recordData: any) => {
    try {
      const localStorageKey = `atendimento_${pacienteSelecionado?.id}_temp`;
      localStorage.setItem(localStorageKey, JSON.stringify({
        ...recordData,
        timestamp: new Date().toISOString()
      }));
      console.log('Dados salvos no localStorage:', localStorageKey);
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
  };

  // Função para limpar dados locais após envio bem-sucedido
  const clearLocalStorage = () => {
    if (pacienteSelecionado?.id) {
      const localStorageKey = `atendimento_${pacienteSelecionado.id}_temp`;
      localStorage.removeItem(localStorageKey);
      console.log('Dados temporários removidos do localStorage');
    }
  };

  const handleSalvarAtendimento = async () => {
    if (!pacienteSelecionado || !profissionalAtual) {
      toast.error('Paciente e profissional devem estar selecionados');
      return;
    }

    if (!form.queixaPrincipal.trim()) {
      toast.error('Queixa principal é obrigatória');
      return;
    }

    if (!form.dataInicioAtendimento) {
      toast.error('Data/hora de início do atendimento é obrigatória');
      return;
    }

    try {
      setIsSaving(true);

      // Preparar dados do atendimento
      const recordData = {
        id: `temp-${Date.now()}`,
        patient_id: pacienteSelecionado.id,
        professional_id: profissionalAtual.id,
        main_complaint: form.queixaPrincipal,
        history: form.antecedentes,
        allergies: form.alergias,
        evolution: form.evolucao,
        custom_prescription: form.prescricaoPersonalizada,
        prescription_model_id: form.modeloPrescricao || null,
        exam_requests: form.examesSelecionados,
        exam_observations: form.observacoesExames,
        exam_results: form.resultadoExames,
        images_data: form.images,
        attendance_start_at: form.dataInicioAtendimento?.toISOString(),
        attendance_end_at: form.dataFimAtendimento?.toISOString() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Salvar localmente para persistência
      saveToLocalStorage(recordData);

      console.log('Atendimento salvo localmente:', recordData);
      toast.success(`Atendimento salvo localmente! ${form.images.length > 0 ? `${form.images.length} imagens anexadas.` : ''}`);
      
      return recordData;
    } catch (error) {
      console.error('Erro ao salvar atendimento:', error);
      toast.error('Erro ao salvar atendimento. Tente novamente.');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleGerarPDF = async () => {
    if (!pacienteSelecionado) {
      toast.error('Paciente deve estar selecionado');
      return;
    }

    try {
      setIsGeneratingPDF(true);
      toast.info('Funcionalidade de geração de PDF não implementada');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSubmitMedicalRecord = async () => {
    if (!pacienteSelecionado || !profissionalAtual) {
      toast.error('Paciente e profissional devem estar selecionados');
      return;
    }

    if (!form.queixaPrincipal.trim()) {
      toast.error('Queixa principal é obrigatória');
      return;
    }

    if (!form.dataInicioAtendimento) {
      toast.error('Data/hora de início do atendimento é obrigatória');
      return;
    }

    try {
      setIsSubmittingRecord(true);
      console.log('Iniciando submissão do prontuário...');
      
      // Convert images data to JSON compatible format
      const imagesDataJson = form.images.map(img => ({
        id: img.id,
        base64: img.base64,
        description: img.description,
        filename: img.filename,
        size: img.size,
        type: img.type
      }));
      
      // Primeiro verificar se o profissional existe na tabela professionals
      const { data: professionalExists, error: professionalCheckError } = await supabase
        .from('professionals')
        .select('id')
        .eq('custom_user_id', profissionalAtual.id)
        .maybeSingle();

      if (professionalCheckError) {
        console.error('Erro ao verificar profissional:', professionalCheckError);
      }

      let professionalIdToUse = profissionalAtual.id;
      
      // Se não exists um profissional correspondente, criar um
      if (!professionalExists) {
        console.log('Criando registro de profissional...');
        const { data: newProfessional, error: createProfessionalError } = await supabase
          .from('professionals')
          .insert({
            custom_user_id: profissionalAtual.id,
            name: profissionalAtual.nome,
            specialty: 'Enfermeiro Obstetra',
            license_type: 'Coren',
            license_number: '542061',
            contact: profissionalAtual.email
          })
          .select('id')
          .single();

        if (createProfessionalError) {
          console.error('Erro ao criar profissional:', createProfessionalError);
          throw new Error(`Erro ao criar registro do profissional: ${createProfessionalError.message}`);
        }

        professionalIdToUse = newProfessional.id;
        console.log('Profissional criado com ID:', professionalIdToUse);
      } else {
        professionalIdToUse = professionalExists.id;
        console.log('Usando profissional existente com ID:', professionalIdToUse);
      }
      
      // Converter datas para ISO string se forem objetos Date
      const attendanceStartAt = form.dataInicioAtendimento instanceof Date 
        ? form.dataInicioAtendimento.toISOString()
        : typeof form.dataInicioAtendimento === 'string' 
          ? form.dataInicioAtendimento
          : new Date(form.dataInicioAtendimento).toISOString();

      const attendanceEndAt = form.dataFimAtendimento 
        ? (form.dataFimAtendimento instanceof Date 
           ? form.dataFimAtendimento.toISOString()
           : typeof form.dataFimAtendimento === 'string'
             ? form.dataFimAtendimento
             : new Date(form.dataFimAtendimento).toISOString())
        : null;
      
      // Salvar no banco de dados com o ID correto do profissional
      console.log('Salvando prontuário no banco de dados...');
      console.log('🔍 appointmentId para salvar:', appointmentId);
      const { data: savedRecord, error: saveError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: pacienteSelecionado.id,
          professional_id: professionalIdToUse,
          appointment_id: appointmentId || null,
          main_complaint: form.queixaPrincipal,
          history: form.antecedentes,
          allergies: form.alergias,
          evolution: form.evolucao,
          custom_prescription: form.prescricaoPersonalizada,
          prescription_model_id: form.modeloPrescricao || null,
          exam_requests: form.examesSelecionados as any,
          exam_observations: form.observacoesExames,
          exam_results: form.resultadoExames,
          images_data: imagesDataJson as any,
          attendance_start_at: attendanceStartAt,
          attendance_end_at: attendanceEndAt
        })
        .select(`
          *,
          patients!inner(*),
          professionals!inner(*)
        `)
        .single();

      if (saveError) {
        console.error('Erro ao salvar no banco:', saveError);
        throw new Error(`Erro ao salvar prontuário: ${saveError.message}`);
      }

      if (!savedRecord) {
        throw new Error('Falha ao salvar o prontuário no banco de dados');
      }

      console.log('Prontuário salvo no banco:', savedRecord);

      // Preparar dados completos para envio via webhook
      const medicalRecordData = {
        id: savedRecord.id,
        patient_id: savedRecord.patient_id,
        professional_id: savedRecord.professional_id,
        main_complaint: savedRecord.main_complaint,
        history: savedRecord.history,
        allergies: savedRecord.allergies,
        evolution: savedRecord.evolution,
        custom_prescription: savedRecord.custom_prescription,
        prescription_model_id: savedRecord.prescription_model_id,
        exam_requests: Array.isArray(savedRecord.exam_requests) 
          ? savedRecord.exam_requests.map(req => String(req))
          : savedRecord.exam_requests ? [String(savedRecord.exam_requests)] : [],
        exam_observations: savedRecord.exam_observations,
        exam_results: savedRecord.exam_results,
        attendance_start_at: savedRecord.attendance_start_at,
        attendance_end_at: savedRecord.attendance_end_at,
        created_at: savedRecord.created_at,
        updated_at: savedRecord.updated_at,
        patient: {
          name: pacienteSelecionado.name,
          sus: pacienteSelecionado.sus,
          phone: pacienteSelecionado.phone,
          address: pacienteSelecionado.address,
          gender: pacienteSelecionado.gender,
          date_of_birth: pacienteSelecionado.date_of_birth
        },
        professional: {
          name: profissionalAtual.nome,
          specialty: 'Enfermeiro Obstetra',
          license_type: 'Coren',
          license_number: '542061'
        }
      };

      // Enviar via webhook com dados completos
      const webhookResult = await submitMedicalRecordToWebhook({
        medicalRecord: medicalRecordData,
        images: form.images,
        selectedModelTitle: selectedModelTitle
      });

      if (!webhookResult.success) {
        console.error('Erro no webhook:', webhookResult.error);
        throw new Error(webhookResult.error || 'Erro ao enviar prontuário via webhook');
      }

      console.log('Prontuário enviado com sucesso via webhook:', webhookResult);
      
      // Atualizar status do agendamento para 'finalizado' se appointmentId estiver disponível
      if (appointmentId) {
        console.log('🔍 Atualizando status do agendamento para finalizado:', appointmentId);
        try {
          const { error: updateError } = await supabase
            .from('appointments')
            .update({ status: 'finalizado' })
            .eq('id', appointmentId);

          if (updateError) {
            console.error('Erro ao atualizar status do agendamento:', updateError);
            // Não interrompe o fluxo, apenas loga o erro
          } else {
            console.log('Status do agendamento atualizado para finalizado com sucesso');
          }
        } catch (error) {
          console.error('Erro ao atualizar status do agendamento:', error);
          // Não interrompe o fluxo, apenas loga o erro
        }
      }
      
      // Limpar dados temporários do localStorage após sucesso
      clearLocalStorage();
      
      // Resetar o formulário após envio bem-sucedido
      resetForm();
      
      toast.success(`Prontuário salvo e enviado com sucesso! ${form.images.length > 0 ? `${form.images.length} imagens incluídas.` : ''}`);
      
      // Navigate to medical records history page
      navigate('/historico');
      
    } catch (error) {
      console.error('Erro ao enviar prontuário:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao enviar prontuário: ${errorMessage}`);
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  return {
    isSaving,
    isGeneratingPDF,
    isSubmittingRecord,
    handleSalvarAtendimento,
    handleGerarPDF,
    handleSubmitMedicalRecord
  };
};
