
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, RefreshCw, Info } from 'lucide-react';
import { useWebhookSettings } from '@/hooks/useWebhookSettings';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WebhookConfig: React.FC<{
  webhookUrl?: string;
  onSave?: (url: string) => void;
  isSaving?: boolean;
}> = ({ 
  webhookUrl: initialWebhookUrl, 
  onSave,
  isSaving: externalIsSaving
}) => {
  // Use the hook for webhook settings
  const { webhookUrl: hookWebhookUrl, saveWebhookUrl, isLoading } = useWebhookSettings();
  const [inputWebhookUrl, setInputWebhookUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState("config");
  
  // Initialize with value from props or hook
  useEffect(() => {
    // Use the initial URL from props if provided, otherwise use the URL from the hook
    const urlToUse = initialWebhookUrl !== undefined ? initialWebhookUrl : hookWebhookUrl;
    setInputWebhookUrl(urlToUse);
  }, [initialWebhookUrl, hookWebhookUrl]);

  // Simple URL validation
  const isValidUrl = (urlString: string): boolean => {
    try {
      // Empty string is valid (clears the webhook)
      if (!urlString) return true;
      
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSave = async () => {
    // Check if URL is valid
    if (inputWebhookUrl && !isValidUrl(inputWebhookUrl)) {
      toast.error("URL inválida. Por favor, insira uma URL válida.");
      return;
    }
    
    // Call both the hook's save method and the onSave prop if provided
    saveWebhookUrl.mutate(inputWebhookUrl);
    
    // Also call the prop's onSave for backward compatibility
    if (onSave) {
      onSave(inputWebhookUrl);
    }
  };

  // Test webhook function
  const testWebhook = async () => {
    if (!inputWebhookUrl) {
      toast.error("Nenhuma URL configurada para testar.");
      return;
    }
    
    if (!isValidUrl(inputWebhookUrl)) {
      toast.error("URL inválida. Por favor, insira uma URL válida.");
      return;
    }
    
    setIsTesting(true);
    
    try {
      // Check if this is the production URL
      const isProdUrl = inputWebhookUrl.includes('n8n.mentoriajrs.com');
      console.log('Testing webhook, production URL detected:', isProdUrl);
      
      // Send test payload directly to the webhook
      const response = await fetch(inputWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
        },
        mode: isProdUrl ? 'no-cors' : undefined, // Use no-cors for production URL
        body: JSON.stringify({
          action: "test",
          text: "Teste de conexão",
          timestamp: new Date().toISOString(),
          test: true
        }),
      });
      
      console.log("Resposta do teste de webhook:", response);
      
      if (isProdUrl || response.ok) {
        toast.success("Webhook testado com sucesso! O servidor respondeu ou a requisição foi enviada.");
      } else {
        toast.error(`Erro no teste do webhook: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Erro ao testar webhook:", error);
      // Check if this is a network error which could be due to CORS
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.info("A requisição foi enviada, mas não foi possível confirmar o status devido a restrições de CORS.");
      } else {
        toast.error(`Erro ao testar webhook: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const isSaving = externalIsSaving || saveWebhookUrl.isPending;
  
  // Check if URL contains "webhook-test" or "webhook"
  const hasTestWebhook = inputWebhookUrl?.includes('webhook-test') || false;
  const hasProductionWebhook = inputWebhookUrl?.includes('webhook/') || false;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Integração para Geração de PDFs</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="config" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="info">Informações</TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Configure a URL do webhook n8n para geração de PDFs de prontuários, prescrições e exames.
              </p>
              
              {hasTestWebhook && (
                <Alert variant="default" className="mb-4 bg-yellow-50 border-yellow-500">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <AlertTitle>Modo de Teste Detectado</AlertTitle>
                  <AlertDescription>
                    O URL contém "webhook-test", que é um formato válido para teste.
                    O formato exato será mantido conforme configurado.
                  </AlertDescription>
                </Alert>
              )}
              
              {hasProductionWebhook && (
                <Alert variant="default" className="mb-4 bg-green-50 border-green-500">
                  <AlertTriangle className="h-4 w-4 text-green-500" />
                  <AlertTitle>Modo de Produção Detectado</AlertTitle>
                  <AlertDescription>
                    O URL contém "webhook/", que é o formato padrão de produção.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="webhook_url">URL do Webhook n8n</Label>
                <Input
                  id="webhook_url"
                  value={inputWebhookUrl}
                  onChange={(e) => setInputWebhookUrl(e.target.value)}
                  placeholder="https://seu-n8n.exemplo.com/webhook/pdf-generator"
                />
                <p className="text-xs text-gray-500">
                  Deixe em branco para desativar a geração de PDFs.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleSave}
                  disabled={isSaving || isLoading}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Configuração'
                  )}
                </Button>
                
                <Button 
                  onClick={testWebhook}
                  disabled={isTesting || !inputWebhookUrl}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Testar Conexão
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info">
            <div className="space-y-4">
              <Alert className="bg-blue-50 border-blue-300">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertTitle>Sobre a Geração de PDFs</AlertTitle>
                <AlertDescription>
                  Os PDFs são gerados pelo n8n e armazenados no Supabase. 
                  Esta integração permite personalizar completamente os modelos de documentos.
                </AlertDescription>
              </Alert>

              <h3 className="font-medium text-base">Formato do Payload Enviado</h3>
              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-64">
                <pre className="text-xs">
                  {JSON.stringify({
                    action: "generate_pdf",
                    documentType: "prontuario", // ou "prescricao", "exames", etc.
                    medicalRecordId: "uuid-do-registro",
                    patientId: "uuid-do-paciente",
                    professionalId: "uuid-do-profissional",
                    title: "Título do Documento",
                    data: {
                      patient: {
                        name: "Nome do Paciente",
                        sus: "123456789",
                        // outros dados do paciente
                      },
                      professional: {
                        name: "Nome do Profissional",
                        specialty: "Especialidade",
                        license: "123456"
                      },
                      record: {
                        mainComplaint: "Queixa principal",
                        evolution: "Evolução do paciente",
                        // outros campos do prontuário
                      }
                    },
                    metadata: {
                      requestId: "id-único-para-rastreamento",
                      timestamp: "2025-05-19T10:00:00Z"
                    }
                  }, null, 2)}
                </pre>
              </div>

              <h3 className="font-medium text-base">Resposta Esperada do n8n</h3>
              <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-64">
                <pre className="text-xs">
                  {JSON.stringify({
                    success: true,
                    documentId: "uuid-do-documento-criado",
                    fileUrl: "url-do-arquivo-no-supabase",
                    documentType: "prontuario",
                    metadata: {
                      requestId: "mesmo-id-enviado",
                      generatedAt: "2025-05-19T10:01:30Z"
                    }
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WebhookConfig;
