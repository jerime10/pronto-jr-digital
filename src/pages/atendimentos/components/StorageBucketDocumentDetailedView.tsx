
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye, MessageCircle, FileText, Trash2, User, Phone, Calendar, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { StorageBucketDocument } from '../hooks/useStorageBucketDocuments';

interface StorageBucketDocumentDetailedViewProps {
  documents: StorageBucketDocument[];
  onRefresh?: () => void;
}

export const StorageBucketDocumentDetailedView: React.FC<StorageBucketDocumentDetailedViewProps> = ({ 
  documents, 
  onRefresh 
}) => {
  const handleView = (document: StorageBucketDocument) => {
    console.log('Opening PDF URL:', document.file_url);
    window.open(document.file_url, '_blank');
    toast.success('Documento aberto em nova aba');
  };

  const handleDownload = async (document: StorageBucketDocument) => {
    try {
      console.log('Downloading PDF from:', document.file_url);
      
      const response = await fetch(document.file_url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.name;
      window.document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(link);
      }, 100);
      
      toast.success('Download concluído!');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const handleWhatsApp = (document: StorageBucketDocument) => {
    const phone = document.patient?.phone || document.metadata.patientPhone;
    
    if (!phone || phone.trim() === '') {
      toast.error('Telefone do paciente não disponível');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Número de telefone inválido');
      return;
    }

    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const patientName = document.patient?.name || document.metadata.patientName;
    const message = `Olá ${patientName}! Segue o documento: ${document.file_url}`;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, '_blank');
    toast.success('WhatsApp aberto com o documento');
  };

  const handleDelete = async (document: StorageBucketDocument) => {
    if (!window.confirm('Tem certeza que deseja excluir este documento?')) {
      return;
    }

    try {
      const { error } = await supabase.storage
        .from('documents')
        .remove([`prontuarios/${document.name}`]);

      if (error) {
        throw error;
      }

      toast.success('Documento excluído com sucesso!');
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Erro ao excluir documento');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Tamanho desconhecido';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {documents.map((document) => {
        const patientName = document.patient?.name || document.metadata.patientName || "Paciente não identificado";
        const patientSus = document.patient?.sus || "Não informado";
        const patientPhone = document.patient?.phone || document.metadata.patientPhone || 'Não informado';
        const hasPhone = patientPhone?.trim() !== '' && patientPhone !== 'Não informado';

        return (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{patientName}</h3>
                    <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs">
                      {document.metadata.documentType === 'prontuario' ? 'Prontuário' : document.metadata.documentType}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleView(document)}
                    variant="outline" 
                    size="sm"
                    className="gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </Button>
                  
                  <Button 
                    onClick={() => handleDownload(document)}
                    variant="outline" 
                    size="sm"
                    className="gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Baixar
                  </Button>

                  <Button 
                    onClick={() => handleWhatsApp(document)}
                    variant="outline" 
                    size="sm"
                    className="gap-1 text-green-600 hover:text-green-700"
                    disabled={!hasPhone}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  
                  <Button 
                    onClick={() => handleDelete(document)}
                    variant="outline" 
                    size="sm"
                    className="gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">SUS:</span>
                    <span className="ml-1 font-medium">{patientSus}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Telefone:</span>
                    <span className="ml-1 font-medium">{patientPhone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Data:</span>
                    <span className="ml-1 font-medium">{formatDate(document.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-gray-500">Tamanho:</span>
                    <span className="ml-1 font-medium">{formatFileSize(document.size)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Arquivo:</span> {document.name}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
