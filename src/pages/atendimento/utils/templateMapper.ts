
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Mapeia os dados do formulário e do sistema para o formato esperado pelo template premium
 */
export function mapAtendimentoToTemplateData(
  medicalRecord: any,
  patient: any,
  professional: any,
  dynamicFields: Record<string, string>,
  clinicSettings: any
) {
  const getFormattedDate = (dateStr: any) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      // Formatar exatamente como no Histórico para ser 100% fiel
      return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (e) {
      return null;
    }
  };

  const data: Record<string, any> = {
    // Dados do prontuário
    id: medicalRecord.id,
    inicio: getFormattedDate(medicalRecord.attendance_start_at) || 
            getFormattedDate(medicalRecord.start_time) || 
            getFormattedDate((medicalRecord as any).created_at) || 
            'Não informado',
    final: getFormattedDate(medicalRecord.attendance_end_at) || 
           getFormattedDate(medicalRecord.end_time) || 
           'Não informado',
    
    // NOVO: Datas puras para salvamento no banco pela Edge Function
    attendance_start_at: medicalRecord.attendance_start_at,
    attendance_end_at: medicalRecord.attendance_end_at,
    
    // Dados do paciente
    'nome-tratado-sem-caracter-especial': patient.name,
    'nome-limpo-para-arquivo': patient.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]/g, "_").toUpperCase(),
    sus: patient.sus,
    telefone: patient.phone,
    data_nascimento: patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString('pt-BR') : '',
    
    // Dados clínicos
    'QUEIXA PRINCIPAL': medicalRecord.main_complaint || '',
    ANTECEDENTES: medicalRecord.history || '',
    ALERGIAS: medicalRecord.allergies || '',
    'EVOLUÇÃO': medicalRecord.evolution || '',
    'PRESCRIÇÃO': medicalRecord.custom_prescription || '',
    'EXAMES SOLICITADOS': Array.isArray(medicalRecord.exam_requests) ? medicalRecord.exam_requests.join(', ') : (medicalRecord.exam_requests || ''),
    
    // Dados do laudo
    'TITULO MODELO RESULTADO EXAME': dynamicFields.modelTitle || 'LAUDO DE ULTRASSONOGRAFIA',
    GRAVIDEZ: dynamicFields.gravidez || '',
    FETO: dynamicFields.feto || '',
    APRESENTAÇÃO: dynamicFields.apresentacao || '',
    SITUAÇÃO: dynamicFields.situacao || '',
    IG: dynamicFields.ig || '',
    DPP: dynamicFields.dpp || '',
    PLACENTA: dynamicFields.placenta || '',
    'AF MAIO BOLSÃO DE LIQUIDO': dynamicFields.af || '',
    'CORDÃO UMBILICAL': dynamicFields.cordaoumbilical || '',
    SEXO: dynamicFields.sexo || '',
    BPD: dynamicFields.bpd || '',
    HC: dynamicFields.hc || '',
    AC: dynamicFields.ac || '',
    FL: dynamicFields.fl || '',
    PESO: dynamicFields.peso || '',
    PERCENTIL: dynamicFields.percentil || '',
    BCF: dynamicFields.bcf || '',
    'IMPRESSÃO DIAGNÓSTICA': dynamicFields.impressaodiagnostica || '',
    'ACHADOS ADICIONAIS': dynamicFields.achadosadicionais || '',
    RECOMENDAÇÕES: dynamicFields.recomendacoes || '',
    OBSERVAÇÕES: dynamicFields.observacoes || '',
    
    // NOVO: Campos Dinâmicos Genéricos para outros exames
    // O template do PDF agora pode iterar sobre estes campos se não encontrar os específicos
    dynamic_fields_json: JSON.stringify(dynamicFields),
    
    // Dados da clínica
    clinicName: clinicSettings?.clinicName || 'CONSULTÓRIO JRS',
    clinicAddress: clinicSettings?.clinicAddress || 'Endereço não configurado',
    clinicPhone: clinicSettings?.clinicPhone || 'Telefone não configurado',
    
    // Assets e Assinatura
    'assetsData-logomarca-consultorio': clinicSettings?.logoData || '',
    'assinatura-base64-profissional': (professional as any).signature_data || clinicSettings?.signatureData || '',
    'nome-profissional': clinicSettings?.signatureProfessionalName || professional.nome || professional.name || 'Jérime Soares',
    'Profissao': clinicSettings?.signatureProfessionalTitle || (professional as any).specialty || 'Enfermeiro Obstetra',
    'orgao-classe': clinicSettings?.signatureProfessionalRegistry || ((professional as any).license_number 
      ? `${(professional as any).license_type || 'Coren'} ${(professional as any).license_number}` 
      : 'Coren 542061'),

    // RT (Responsável Técnico)
    'rt-assinatura': clinicSettings?.rtSignatureData || '',
    'rt-nome': clinicSettings?.rtName || '',
    'rt-profissao': clinicSettings?.rtTitle || '',
    'rt-registro': clinicSettings?.rtRegistry || ''
  };

  // Imagens (até 15)
  if (medicalRecord.images_data && Array.isArray(medicalRecord.images_data)) {
    medicalRecord.images_data.forEach((img: any, index: number) => {
      data[`imagem${index + 1}-usg`] = img.base64;
      data[`descricao-img${index + 1}`] = img.description;
    });
  }

  return data;
}
