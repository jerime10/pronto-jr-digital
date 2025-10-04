
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
  dynamicFields?: Record<string, string>;
}

export const useSaveActions = ({
  pacienteSelecionado,
  profissionalAtual,
  form,
  examModels,
  resetForm,
  selectedModelTitle,
  appointmentId,
  dynamicFields
}: UseSaveActionsProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);
  const navigate = useNavigate();

  // Função para validar se o paciente tem dados válidos
  const isValidPatient = (patient: Patient | null): patient is Patient => {
    if (!patient) {
      console.error('❌ Paciente é null ou undefined');
      return false;
    }
    
    if (!patient.id || patient.id === 'null' || patient.id === 'undefined') {
      console.error('❌ ID do paciente é inválido:', patient.id);
      return false;
    }
    
    // Verificar se é um UUID válido OU um ID temporário
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isTempId = patient.id.toString().startsWith('temp-');
    
    if (!uuidRegex.test(patient.id) && !isTempId) {
      console.error('❌ ID do paciente não é um UUID válido nem um ID temporário:', patient.id);
      return false;
    }
    
    console.log('✅ Paciente válido:', patient.id);
    return true;
  };



  // Função para validar se o profissional tem dados válidos
  const isValidProfessional = (professional: Professional | null): professional is Professional => {
    if (!professional) {
      console.error('❌ Profissional é null ou undefined');
      return false;
    }
    
    if (!professional.id || professional.id === 'null' || professional.id === 'undefined') {
      console.error('❌ ID do profissional é inválido:', professional.id);
      return false;
    }
    
    console.log('✅ Profissional válido:', professional.id);
    return true;
  };

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
    // Debug logs para rastrear o problema do UUID
    console.log('🔍 handleSalvarAtendimento - pacienteSelecionado:', pacienteSelecionado);
    console.log('🔍 handleSalvarAtendimento - profissionalAtual:', profissionalAtual);
    
    // Usar as funções de validação
    if (!isValidPatient(pacienteSelecionado)) {
      toast.error("Dados do paciente são inválidos. Tente selecionar o paciente novamente.");
      return;
    }

    if (!isValidProfessional(profissionalAtual)) {
      toast.error("Dados do profissional são inválidos. Tente fazer login novamente.");
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
        id: crypto.randomUUID(),
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
    // Debug logs para rastrear o problema do patient_id
    console.log('🔍 handleSubmitMedicalRecord - pacienteSelecionado:', pacienteSelecionado);
    console.log('🔍 handleSubmitMedicalRecord - profissionalAtual:', profissionalAtual);
    console.log('🔍 handleSubmitMedicalRecord - appointmentId:', appointmentId);
    
    // Usar as funções de validação
    if (!isValidPatient(pacienteSelecionado)) {
      toast.error("Dados do paciente são inválidos. Tente selecionar o paciente novamente.");
      return;
    }

    if (!isValidProfessional(profissionalAtual)) {
      toast.error("Dados do profissional são inválidos. Tente fazer login novamente.");
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
      
      // Validar paciente apenas no momento do salvamento final
      if (!isValidPatient(pacienteSelecionado)) {
        throw new Error('Dados do paciente inválidos. Verifique se o paciente foi selecionado corretamente.');
      }

      // Verificar se o paciente existe na tabela patients
      const { data: patientExists, error: patientCheckError } = await supabase
        .from('patients')
        .select('id, name')
        .eq('id', pacienteSelecionado.id)
        .single();

      if (patientCheckError) {
        console.error('❌ Erro ao verificar paciente na tabela:', patientCheckError);
        throw new Error(`Paciente não encontrado na base de dados: ${patientCheckError.message}`);
      }

      if (!patientExists) {
        throw new Error('Paciente não encontrado na base de dados. Verifique se o paciente foi cadastrado corretamente.');
      }

      console.log('✅ Paciente validado:', patientExists);
      
      // Usar o ID do paciente selecionado
      const patientIdToUse = pacienteSelecionado.id;
      
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
      const { data: professionalExists, error: professionalCheckError } = await (supabase as any)
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
        const { data: newProfessional, error: createProfessionalError } = await (supabase as any)
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
      
      // Salvar no banco de dados com o ID correto do paciente e profissional
      console.log('Salvando prontuário no banco de dados...');
      console.log('🔍 appointmentId para salvar:', appointmentId);
      console.log('🔍 patientIdToUse antes da inserção:', patientIdToUse);
      console.log('🔍 professionalIdToUse antes da inserção:', professionalIdToUse);
      
      const { data: savedRecord, error: saveError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: patientIdToUse,
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
      const medicalRecordData: any = {
        id: savedRecord.id,
        patient_id: savedRecord.patient_id,
        professional_id: savedRecord.professional_id,
        attendant_id: savedRecord.attendant_id || null,
        appointment_id: savedRecord.appointment_id || appointmentId || null,
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

      // FILTRAR campos dinâmicos para enviar apenas os do modelo selecionado
      let filteredDynamicFields = dynamicFields || {};
      
      if (selectedModelTitle && dynamicFields && Object.keys(dynamicFields).length > 0) {
        console.log('🔍 [FILTER] ===== FILTRANDO CAMPOS DINÂMICOS =====');
        console.log('🔍 [FILTER] Modelo selecionado:', selectedModelTitle);
        console.log('🔍 [FILTER] Campos antes da filtragem:', Object.keys(dynamicFields));
        
        try {
          // Buscar campos válidos do modelo selecionado
          const { data: validFields, error: fieldsError } = await supabase
            .from('individual_field_templates')
            .select('field_key')
            .eq('model_name', selectedModelTitle);

          if (fieldsError) {
            console.error('❌ [FILTER] Erro ao buscar campos válidos:', fieldsError);
          } else if (validFields && validFields.length > 0) {
            const validFieldKeys = new Set(validFields.map(f => f.field_key));
            console.log('✅ [FILTER] Campos válidos do modelo:', Array.from(validFieldKeys));
            
            // Filtrar apenas campos válidos
            filteredDynamicFields = Object.entries(dynamicFields)
              .filter(([key]) => validFieldKeys.has(key))
              .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
            
            console.log('✅ [FILTER] Campos após filtragem:', Object.keys(filteredDynamicFields));
            console.log('✅ [FILTER] Total de campos filtrados:', Object.keys(filteredDynamicFields).length);
          } else {
            console.log('⚠️ [FILTER] Nenhum campo válido encontrado, mantendo todos');
          }
        } catch (error) {
          console.error('❌ [FILTER] Erro ao filtrar campos:', error);
        }
        
        console.log('🔍 [FILTER] ===== FIM DA FILTRAGEM =====');
      }

      // Enviar via webhook com dados completos e campos filtrados
      console.log('📋 [WEBHOOK] ===== ENVIANDO PARA N8N =====');
      console.log('📋 [WEBHOOK] selectedModelTitle:', selectedModelTitle);
      console.log('📋 [WEBHOOK] dynamicFields originais:', dynamicFields ? Object.keys(dynamicFields).length : 0);
      console.log('📋 [WEBHOOK] dynamicFields filtrados:', Object.keys(filteredDynamicFields).length);
      console.log('📋 [WEBHOOK] Campos enviados:', filteredDynamicFields);
      
      const webhookResult = await submitMedicalRecordToWebhook({
        medicalRecord: medicalRecordData,
        images: form.images,
        selectedModelTitle: selectedModelTitle,
        dynamicFields: filteredDynamicFields
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

// Validação de paciente
const isValidPatient = (patient: Patient): boolean => {
  if (!patient || !patient.id) {
    console.error('❌ Paciente não fornecido ou sem ID');
    return false;
  }

  // Verificar se é um UUID válido
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isValidUUID = uuidRegex.test(patient.id.toString());

  if (!isValidUUID) {
    console.error('❌ ID do paciente não é um UUID válido:', patient.id);
    return false;
  }

  return true;
};
