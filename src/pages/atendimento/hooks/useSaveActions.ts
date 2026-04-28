
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FormState } from './useFormData';
import { submitMedicalRecordToWebhook } from '@/services/medicalRecordSubmissionService';
import { sendAtendimentoToN8N } from '@/services/n8nWebhookService';
import { generatePremiumPdf } from '@/services/pdfGenerationService';
import { PREMIUM_PRONTUARIO_TEMPLATE } from '@/templates/premiumProntuario';
import { mapAtendimentoToTemplateData } from '../utils/templateMapper';
import { fetchSiteSettings } from '@/services/siteSettingsService';

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
  medicalRecordId?: string;
  existingRecord?: any;
}

export const useSaveActions = ({
  pacienteSelecionado,
  profissionalAtual,
  form,
  examModels,
  resetForm,
  selectedModelTitle,
  appointmentId,
  dynamicFields,
  medicalRecordId,
  existingRecord
}: UseSaveActionsProps) => {
  const [isSaving, setIsSaving] = useState(false);
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

  // Função auxiliar robusta para converter datas para ISO string sem fallback perigoso
  const getSafeDateISO = (val: any): string | null => {
    if (!val) return null;
    try {
      if (val instanceof Date) {
        return isNaN(val.getTime()) ? null : val.toISOString();
      }
      const date = new Date(val);
      return isNaN(date.getTime()) ? (typeof val === 'string' ? val : null) : date.toISOString();
    } catch {
      return typeof val === 'string' ? val : null;
    }
  };

  const generateAndSavePremiumPDF = async (isPreview: boolean = false, forcedId?: string) => {
    // Garantir que temos um ID válido antes de prosseguir
    const finalId = forcedId || medicalRecordId || existingRecord?.id || crypto.randomUUID();
    
    if (!finalId || finalId === 'undefined' || finalId === 'null') {
      console.error('❌ [PDF] ID inválido detectado:', finalId);
      throw new Error('Identificador do prontuário inválido. Por favor, reinicie o atendimento.');
    }

    console.log(`🚀 [PDF] Iniciando geração (Preview: ${isPreview}, ID: ${finalId})...`);
    console.log('🔍 [PDF] pacienteSelecionado:', pacienteSelecionado?.id);
    console.log('🔍 [PDF] profissionalAtual:', profissionalAtual?.id);

    if (!pacienteSelecionado) {
      console.warn('⚠️ [PDF] Geração abortada: Paciente não selecionado');
      toast.error('Paciente deve estar selecionado');
      return null;
    }

    if (!profissionalAtual) {
      console.warn('⚠️ [PDF] Geração abortada: Profissional não identificado');
      toast.error('Profissional não identificado. Faça login novamente.');
      return null;
    }

    try {
      // 1. Buscar configurações da clínica para logos e endereços
      const siteSettings = await fetchSiteSettings();

      // 1.1 Buscar detalhes completos do profissional
      const { data: profDetails } = await (supabase as any)
        .from('professionals')
        .select('*')
        .eq('custom_user_id', profissionalAtual.id)
        .maybeSingle();
      
      const professionalToUse = profDetails || {
        ...profissionalAtual,
        name: profissionalAtual.nome,
        specialty: 'Enfermeiro Obstetra',
        license_type: 'Coren',
        license_number: '542061'
      };
      
      // 1.2 Buscar registro existente se houver ID para garantir datas corretas
      let finalExistingRecord = existingRecord;
      if (finalId && !finalExistingRecord) {
        const { data: fetchedRecord } = await supabase
          .from('medical_records')
          .select('*')
          .eq('id', finalId)
          .maybeSingle();
        if (fetchedRecord) finalExistingRecord = fetchedRecord;
      }

      // Lógica de datas segura: Prioriza SEMPRE o formulário se houver valor
      const attendanceStart = getSafeDateISO(form.dataInicioAtendimento) || 
                             finalExistingRecord?.attendance_start_at || 
                             finalExistingRecord?.created_at || 
                             new Date().toISOString();
        
      const attendanceEnd = getSafeDateISO(form.dataFimAtendimento) || 
                           finalExistingRecord?.attendance_end_at || 
                           null;

      console.log('📅 [PDF] Datas capturadas para o banco:', { attendanceStart, attendanceEnd });

      // 2. Preparar dados do prontuário
      const medicalRecord = {
        ...finalExistingRecord,
        id: finalId, // ID único garantido
        patient_id: pacienteSelecionado.id,
        professional_id: professionalToUse.id || profissionalAtual.id,
        main_complaint: form.queixaPrincipal,
        history: form.antecedentes,
        allergies: form.alergias,
        evolution: form.evolucao,
        custom_prescription: form.prescricaoPersonalizada,
        exam_requests: form.examesSelecionados,
        attendance_start_at: attendanceStart,
        attendance_end_at: attendanceEnd,
        images_data: form.images,
        updated_at: new Date().toISOString()
      };

      // 2.1 Salvar no banco APENAS se não for preview
      if (!isPreview) {
        console.log('💾 [PDF] Salvando estado atual no banco (OFFICIAL)...');
        const { error: upsertError } = await supabase
          .from('medical_records')
          .upsert({
            ...finalExistingRecord,
            id: finalId,
            patient_id: medicalRecord.patient_id,
            professional_id: medicalRecord.professional_id,
            main_complaint: medicalRecord.main_complaint,
            history: medicalRecord.history,
            allergies: medicalRecord.allergies,
            evolution: medicalRecord.evolution,
            custom_prescription: medicalRecord.custom_prescription,
            exam_requests: medicalRecord.exam_requests as any,
            attendance_start_at: medicalRecord.attendance_start_at,
            attendance_end_at: medicalRecord.attendance_end_at,
            images_data: medicalRecord.images_data as any,
            file_url_storage: finalExistingRecord?.file_url_storage || null,
            updated_at: medicalRecord.updated_at
          });

        if (upsertError) {
          console.error('❌ [PDF] Erro ao salvar registro antes do PDF:', upsertError);
          toast.error('Erro ao salvar prontuário.');
          return null;
        }
      }

      // 3. Mapear dados para o template
      const templateData = mapAtendimentoToTemplateData(
        medicalRecord,
        pacienteSelecionado,
        professionalToUse,
        { ...dynamicFields, modelTitle: selectedModelTitle || 'LAUDO DE EXAME' },
        siteSettings
      );
      
      // 4. Chamar a Edge Function (Premium)
      console.log('📡 [PDF] Enviando para Edge Function - ID Final:', finalId);
      const result = await generatePremiumPdf({
        medicalRecordId: String(finalId),
        data: templateData,
        isPreview: isPreview,
        htmlTemplate: PREMIUM_PRONTUARIO_TEMPLATE
      });

      return result;
    } catch (error: any) {
      console.error('❌ [PDF] Erro crítico ao gerar PDF Premium:', error);
      throw error;
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
      
      // Converter datas para ISO string de forma robusta e unificada
      const attendanceStartAt = getSafeDateISO(form.dataInicioAtendimento) || new Date().toISOString();
      const attendanceEndAt = getSafeDateISO(form.dataFimAtendimento);
      
      console.log('📅 [FINALIZAR] Datas finais para o banco:', { attendanceStartAt, attendanceEndAt });
      
      // Salvar no banco de dados com o ID correto do paciente e profissional
      console.log('Salvando prontuário no banco de dados...');
      console.log('🔍 appointmentId para salvar:', appointmentId);
      console.log('🔍 patientIdToUse antes da inserção:', patientIdToUse);
      console.log('🔍 professionalIdToUse antes da inserção:', professionalIdToUse);
      
      // Extrair DUM dos campos dinâmicos (modelos obstétricos)
      // A DUM pode vir como campo 'dum' ou 'dataultimamenstruacao'
      let dumValue: string | null = null;
      if (dynamicFields) {
        const dumKey = Object.keys(dynamicFields).find(k => 
          k.toLowerCase() === 'dum' || 
          k.toLowerCase().includes('ultimamenstruacao') ||
          k.toLowerCase().includes('ultima_menstruacao')
        );
        if (dumKey && dynamicFields[dumKey]) {
          let rawDum = dynamicFields[dumKey];
          // Converter de DD/MM/AAAA para YYYY-MM-DD (formato do banco)
          if (rawDum.includes('/')) {
            const parts = rawDum.split('/');
            if (parts.length === 3) {
              const [day, month, year] = parts;
              rawDum = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          }
          dumValue = rawDum;
          console.log('🔍 DUM extraída dos campos dinâmicos:', dumValue);
        }
      }
      
      // 1. Garantir ID Único e Estável (Fonte Única da Verdade)
      const finalId = medicalRecordId || existingRecord?.id || crypto.randomUUID();
      console.log('🏁 [FINALIZAR] Usando ID único para o atendimento:', finalId);

      // 1.1 Gerar o PDF Premium OFICIAL antes de concluir
      // Isso garante que o documento final seja a versão nova e correta
      toast.info('Gerando documento final...');
      
      // Passamos o isPreview como false para que a função atualize o banco
      const pdfResult = await generateAndSavePremiumPDF(false, finalId);
      
      if (!pdfResult?.success) {
        throw new Error('Falha ao gerar o documento PDF Premium. O atendimento não pode ser finalizado sem o documento.');
      }

      const finalFileUrl = pdfResult.publicUrl;
      console.log('✅ [FINALIZAR] PDF Premium gerado e salvo:', finalFileUrl);

      // 2. Salvar/Atualizar no banco (upsert) para concluir o atendimento
      // O ANTIGO SISTEMA DE WEBHOOK FOI CANCELADO AQUI PARA ELIMINAR DUPLICIDADE
      const { data: savedRecord, error: saveError } = await supabase
        .from('medical_records')
        .upsert({
          id: finalId, // Usando o ID estável garantido
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
          attendance_end_at: attendanceEndAt,
          file_url_storage: finalFileUrl, // Link oficial do PDF Premium
          dum: dumValue,
          updated_at: new Date().toISOString()
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

      console.log('✅ [FINALIZAR] Prontuário concluído com sucesso:', savedRecord);
      
      // 2.2 Enviar para o n8n conforme solicitado pelo usuário
      try {
        const siteSettings = await fetchSiteSettings();
        const n8nPayload = {
          nome: savedRecord.patients?.name || 'Não informado',
          telefone: savedRecord.patients?.phone || 'Não informado',
          id_pdf: savedRecord.id,
          url_pdf: finalFileUrl,
          nome_profissional: savedRecord.professionals?.name || 'Não informado',
          nome_consultorio: siteSettings?.clinicName || 'Consultório JRS',
          data_inicio: savedRecord.attendance_start_at || new Date().toISOString(),
          data_fim: savedRecord.attendance_end_at || new Date().toISOString()
        };
        
        console.log('📤 [FINALIZAR] Enviando para n8n...', n8nPayload);
        await sendAtendimentoToN8N(n8nPayload);
      } catch (n8nError) {
        console.error('Erro ao enviar para o n8n:', n8nError);
        // Não lançamos erro aqui para não travar a finalização se o n8n falhar
      }
      
      // 3. Atualizar status do agendamento para 'finalizado' se appointmentId estiver disponível
      if (appointmentId) {
        console.log('🔍 Atualizando status do agendamento para finalizado:', appointmentId);
        try {
          await supabase
            .from('appointments')
            .update({ status: 'finalizado' })
            .eq('id', appointmentId);
        } catch (error) {
          console.error('Erro ao atualizar status do agendamento:', error);
        }
      }
      
      // 4. Limpar dados temporários e finalizar
      clearLocalStorage();
      resetForm();
      toast.success(`Atendimento finalizado com sucesso! PDF Premium gerado.`);
      
      // Navegar para o histórico
      navigate('/historico');
      
    } catch (error) {
      console.error('Erro ao finalizar atendimento:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao finalizar atendimento: ${errorMessage}`);
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  return {
    isSaving,
    isSubmittingRecord,
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
