
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// This is now a placeholder component that informs users about the new PDF generation approach
const PDFTemplateEditor: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Template PDF</h1>
        <p className="text-gray-500 mt-1">Configuração de modelos para geração de PDF</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Geração de PDF com n8n</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              A geração de PDF agora é feita pelo n8n. Configure o webhook do n8n na aba "Integrações".
              Os templates de PDF são gerenciados diretamente no n8n para maior flexibilidade e recursos avançados.
            </AlertDescription>
          </Alert>
          
          <div className="bg-muted rounded-md p-4">
            <h3 className="font-medium mb-2">Como funciona:</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Configure o webhook do n8n na aba "Integrações"</li>
              <li>Ao gerar um documento, os dados são enviados ao n8n</li>
              <li>O n8n cria o PDF e o salva no storage</li>
              <li>O n8n atualiza o banco de dados com a URL do documento</li>
              <li>Os documentos ficam disponíveis na lista de atendimentos</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFTemplateEditor;
