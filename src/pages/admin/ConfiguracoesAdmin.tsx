
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WebhookConfig from './WebhookConfig';
import ClinicInfoSettings from './ClinicInfoSettings';
import MedicalRecordWebhookConfig from './MedicalRecordWebhookConfig';
import WhatsAppTemplateManager from './components/WhatsAppTemplateManager';
import DocumentAssetsUploader from './components/DocumentAssetsUploader';
import PublicRegistrationLinksConfig from './components/PublicRegistrationLinksConfig';
import { IndividualFieldsManager } from './components/IndividualFieldsManager';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const ConfiguracoesAdmin = () => {
  const [activeTab, setActiveTab] = useState('clinic');
  const { settings, saveWebhookUrl, saveMedicalRecordWebhookUrl } = useSiteSettings();

  const handleWebhookSave = (url: string) => {
    saveWebhookUrl.mutate(url);
  };

  const handleMedicalRecordWebhookSave = (url: string) => {
    saveMedicalRecordWebhookUrl.mutate(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
        <p className="text-gray-500 mt-1">Configure as funcionalidades e integrações do sistema</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 h-auto p-2">
          <TabsTrigger value="clinic" className="text-sm px-3 py-2">Informações</TabsTrigger>
          <TabsTrigger value="public-links" className="text-sm px-3 py-2">Links Públicos</TabsTrigger>
          <TabsTrigger value="document-assets" className="text-sm px-3 py-2">Assets Docs</TabsTrigger>
          <TabsTrigger value="saved-fields" className="text-sm px-3 py-2">Campos Salvos</TabsTrigger>
          <TabsTrigger value="whatsapp-templates" className="text-sm px-3 py-2">WhatsApp</TabsTrigger>
          <TabsTrigger value="envio-prontuario" className="text-sm px-3 py-2">Envio Prontuário</TabsTrigger>
          <TabsTrigger value="integrations" className="text-sm px-3 py-2">Integrações</TabsTrigger>
        </TabsList>
        
        <div className="min-h-[600px]">
          <TabsContent value="clinic" className="mt-8 space-y-6">
            <ClinicInfoSettings />
          </TabsContent>
          
          <TabsContent value="public-links" className="mt-8 space-y-6">
            <PublicRegistrationLinksConfig />
          </TabsContent>
          
          <TabsContent value="document-assets" className="mt-8 space-y-6">
            <DocumentAssetsUploader />
          </TabsContent>
          
          <TabsContent value="saved-fields" className="mt-8 space-y-6">
            <IndividualFieldsManager />
          </TabsContent>
          
          <TabsContent value="whatsapp-templates" className="mt-8 space-y-6">
            <WhatsAppTemplateManager />
          </TabsContent>
          
          <TabsContent value="envio-prontuario" className="mt-8 space-y-6">
            <MedicalRecordWebhookConfig 
              webhookUrl={settings?.medicalRecordWebhookUrl || ""}
              onSave={handleMedicalRecordWebhookSave}
              isSaving={saveMedicalRecordWebhookUrl?.isPending}
            />
          </TabsContent>
          
          <TabsContent value="integrations" className="mt-8 space-y-6">
            <WebhookConfig 
              webhookUrl={settings?.n8nWebhookUrl || ""}
              onSave={handleWebhookSave}
              isSaving={saveWebhookUrl.isPending}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ConfiguracoesAdmin;
