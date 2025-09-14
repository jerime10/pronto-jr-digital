
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { MedicalRecord } from '../hooks/useMedicalRecords';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface PDFViewerProps {
  isOpen: boolean;
  onClose: () => void;
  record: MedicalRecord | null;
  onSaveSuccess: (documentUrl: string, documentId: string) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ 
  isOpen, 
  onClose, 
  record,
  onSaveSuccess
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  if (!record) return null;
  
  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      
      if (!record.patient_id || !record.professional_id) {
        toast.error("Dados do paciente ou profissional não disponíveis");
        setIsGenerating(false);
        return;
      }
      
      // Sanitize patient name for filename
      const sanitizedPatientName = record.patient?.name?.replace(/\s+/g, '-').toLowerCase() || 'paciente';
      const sanitizedDate = format(new Date(), 'yyyy-MM-dd');
      const pdfFilename = `prontuario-${sanitizedPatientName}-${sanitizedDate}.pdf`;
      
      // Set up PDF generation content
      const documentContent = {
        clinicInfo: {
          name: 'CONSULTÓRIO JRS',
          address: 'Trav. José Soares, nº 152, Bairro: Fazendão',
          phone: '91-98595-8042',
          logo: null,
          specialty: 'Cuidados Especializados em Enfermagem',
        },
        patientInfo: record.patient,
        professionalInfo: {
          ...record.professional,
          specialty: record.professional?.specialty || 'Enfermeiro Obstetra',
          license_type: record.professional?.license_type || 'Coren',
          license_number: record.professional?.license_number || '542061',
        },
        mainComplaint: record.main_complaint || '',
        history: record.history || '',
        allergies: record.allergies || '',
        evolution: record.evolution || '',
        prescription: record.custom_prescription || '',
        exams: Array.isArray(record.exam_requests) ? record.exam_requests : [],
        examObservations: record.exam_observations || '',
        examResults: record.exam_results || '',
      };
      
      // Call edge function to generate PDF
      const response = await supabase.functions.invoke('pdf-generator', {
        body: {
          medicalRecordId: record.id,
          patientId: record.patient_id,
          professionalId: record.professional_id,
          title: `Prontuário - ${record.patient?.name || 'Paciente'} - ${sanitizedDate}`,
          content: documentContent,
          documentType: 'prontuario',
          forDownload: true
        }
      });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.error?.message || response.data?.error || "Erro ao gerar PDF");
      }

      if (response.data.fileUrl) {
        // Save document and then download
        await saveToDatabaseAndDownload(response.data.fileUrl, response.data.documentId);
      } else {
        throw new Error("URL do arquivo não retornada pela API");
      }
      
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar o PDF: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    } finally {
      setIsGenerating(false);
    }
  };
  
  const saveToDatabaseAndDownload = async (fileUrl: string, documentId: string) => {
    try {
      // Save to database first
      onSaveSuccess(fileUrl, documentId);
      
      // Then trigger download
      const { url, filename } = cleanDocumentUrl(fileUrl);
      
      // Add URL parameter to ensure correct content-type
      const urlWithParams = url.includes('?') 
        ? `${url}&contentType=application/pdf` 
        : `${url}?contentType=application/pdf`;

      // Fetch the document
      const response = await fetch(urlWithParams);
      
      if (!response.ok) {
        throw new Error(`Falha ao baixar documento: ${response.status} ${response.statusText}`);
      }
      
      // Convert response to blob
      const blob = await response.blob();
      
      // Force the content type to be PDF
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      
      // Create a download link
      const downloadUrl = window.URL.createObjectURL(pdfBlob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Erro ao processar documento:', error);
      toast.error(`Erro ao processar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };
  
  // Utility function to clean document URL and extract proper filename
  const cleanDocumentUrl = (fileUrl: string): { url: string, filename: string } => {
    try {
      // Remove query parameters that affect content handling
      const url = new URL(fileUrl);
      const pathname = url.pathname;
      
      // Extract filename from the path and sanitize it
      let filename = pathname.split('/').pop() || 'documento.pdf';
      
      // Clean up the filename
      filename = filename.replace(/[^\w\d.-]/g, '_');
      
      // Ensure .pdf extension
      if (!filename.toLowerCase().endsWith('.pdf')) {
        filename = `${filename}.pdf`;
      }
      
      return {
        url: fileUrl,
        filename
      };
    } catch (e) {
      console.error("Error cleaning URL:", e);
      return {
        url: fileUrl,
        filename: 'documento.pdf'
      };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visualização do Prontuário</DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-center space-x-3 mb-4">
          <Button 
            variant="outline" 
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="w-48"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </>
            )}
          </Button>
        </div>
        
        {record && (
          <div className="bg-white p-8 rounded-md border">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Prontuário Médico</h2>
              <p className="text-gray-600">Este prontuário será gerado como PDF ao clicar em "Baixar PDF"</p>
            </div>
            
            <div className="space-y-4">
              <div className="border p-4 rounded bg-gray-50">
                <h3 className="font-bold mb-2">Dados do Paciente</h3>
                <p><span className="font-medium">Nome:</span> {record.patient?.name || 'N/A'}</p>
                <p><span className="font-medium">SUS:</span> {record.patient?.sus || 'N/A'}</p>
                {record.patient?.phone && (
                  <p><span className="font-medium">Telefone:</span> {record.patient?.phone}</p>
                )}
              </div>
              
              {record.main_complaint && (
                <div className="border p-4 rounded">
                  <h3 className="font-bold mb-2">Queixa Principal</h3>
                  <p className="whitespace-pre-line">{record.main_complaint}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
