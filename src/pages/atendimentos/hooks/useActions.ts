
import { useState } from 'react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MedicalRecord } from './useMedicalRecords';
import { downloadDocument, shareViaWhatsApp, deleteDocument } from '@/pages/atendimentos/utils/documentActions';
import { generateDocumentViaWebhook } from '@/services/documentService';

export const useActions = () => {
  const queryClient = useQueryClient();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  const handleDeleteRecord = async (recordId: string) => {
    try {
      console.log('Deletando prontuário médico:', recordId);
      
      const { error } = await supabase
        .from('medical_records')
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error('Erro ao excluir prontuário:', error);
        throw error;
      }

      // Refetch the records after deletion
      queryClient.invalidateQueries({ queryKey: ['medical_records'] });
      queryClient.invalidateQueries({ queryKey: ['historico-documents'] });
      toast.success('Atendimento excluído com sucesso.');
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Erro ao excluir atendimento.');
    }
  };

  const deleteMedicalRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      return handleDeleteRecord(recordId);
    }
  });

  const viewRecord = (record: MedicalRecord) => {
    console.log('Viewing record', record);
    setSelectedRecord(record);
  };

  // Save PDF to database
  const savePDF = useMutation({
    mutationFn: async (data: { record: MedicalRecord }) => {
      try {
        setIsGeneratingPDF(true);
        console.log("Iniciando geração de PDF para o prontuário:", data.record.id);
        
        if (!data.record.patient_id || !data.record.professional_id) {
          throw new Error("Dados incompletos: paciente ou profissional não identificado");
        }
        
        // Preparar dados para enviar ao webhook n8n
        const documentData = {
          documentType: "prontuario",
          medicalRecordId: data.record.id,
          patientId: data.record.patient_id,
          professionalId: data.record.professional_id,
          title: `Prontuário - ${data.record.patient?.name || 'Paciente'} - ${new Date().toLocaleDateString()}`,
          data: {
            patient: data.record.patient,
            professional: {
              ...data.record.professional,
              specialty: data.record.professional?.specialty || 'Enfermeiro Obstetra',
              license_type: data.record.professional?.license_type || 'Coren',
              license_number: data.record.professional?.license_number || '542061',
            },
            record: {
              mainComplaint: data.record.main_complaint || '',
              history: data.record.history || '',
              allergies: data.record.allergies || '',
              evolution: data.record.evolution || '',
              prescription: data.record.custom_prescription || '',
              exams: Array.isArray(data.record.exam_requests) ? data.record.exam_requests : [],
              examObservations: data.record.exam_observations || '',
              examResults: data.record.exam_results || '',
            }
          }
        };
        
        // Chamar o webhook n8n
        toast.info("Enviando dados para o n8n...");
        
        try {
          const result = await generateDocumentViaWebhook(documentData);
          
          console.log("Resultado da geração do PDF:", result);
          
          if (!result.success) {
            throw new Error(result.error || "Erro desconhecido");
          }
          
          // Force update of documents list
          queryClient.invalidateQueries({ queryKey: ['historico-documents'] });
          
          toast.success("PDF gerado com sucesso! Você pode encontrá-lo na aba 'Documentos Gerados'.");
          
          return {
            success: true,
            fileUrl: result.fileUrl,
            documentId: result.documentId
          };
        } catch (error) {
          // When using no-cors, we might get errors parsing JSON even if the request succeeded
          if (error instanceof SyntaxError && error.message.includes("JSON")) {
            console.log("Erro de parsing JSON (esperado com no-cors). Assumindo sucesso:", error);
            
            toast.success("Solicitação enviada! Você poderá encontrar o documento em 'Documentos Gerados' em alguns instantes.");
            
            // Force update of documents list after a delay
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['historico-documents'] });
            }, 3000);
            
            return {
              success: true
            };
          }
          
          throw error;
        }
        
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        throw error;
      } finally {
        setIsGeneratingPDF(false);
      }
    },
    onSuccess: (result) => {
      toast.success('Solicitação de PDF enviada com sucesso. O documento estará disponível em breve.');
      return result;
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar PDF: ${error.message}`);
    }
  });

  return {
    deleteRecord: handleDeleteRecord,
    viewRecord,
    downloadDocument,
    shareViaWhatsApp,
    deleteDocument,
    savePDF,
    isGeneratingPDF,
    selectedRecord,
    setSelectedRecord,
    deleteMedicalRecordMutation
  };
};
