import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Save, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { checkKeyValueColumns, applyKeyValueMigration } from '@/utils/migrationHelper';

interface PublicRegistrationLinks {
  scheduling_url: string;
  exit_url: string;
  public_registration_url: string;
  whatsapp_reminder_webhook_url: string;
  whatsapp_recurring_reminder_webhook_url: string;
  pix_key: string;
}

const PublicRegistrationLinksConfig: React.FC = () => {
  const [links, setLinks] = useState<PublicRegistrationLinks>({
    scheduling_url: '',
    exit_url: '',
    public_registration_url: '',
    whatsapp_reminder_webhook_url: '',
    whatsapp_recurring_reminder_webhook_url: '',
    pix_key: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      setLoading(true);
      
      // Verificar se as colunas existem
      const columnsExist = await checkKeyValueColumns();
      
      if (!columnsExist) {
        console.log('Colunas setting_key/setting_value não encontradas. Aplicando migração...');
        const migrationSuccess = await applyKeyValueMigration();
        
        if (!migrationSuccess) {
          console.error('Falha ao aplicar migração');
        setLinks({
          scheduling_url: 'https://www.google.com/',
          exit_url: 'https://www.google.com/',
          public_registration_url: `${window.location.origin}/cadastro-paciente`,
          whatsapp_reminder_webhook_url: '',
          whatsapp_recurring_reminder_webhook_url: '',
          pix_key: ''
        });
          return;
        }
      }
      
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Erro ao carregar links:', error);
        // Se houver erro, usar URLs padrão
        setLinks({
          scheduling_url: 'https://www.google.com/',
          exit_url: 'https://www.google.com/',
          public_registration_url: `${window.location.origin}/cadastro-paciente`,
          whatsapp_reminder_webhook_url: '',
          whatsapp_recurring_reminder_webhook_url: '',
          pix_key: ''
        });
        return;
      }

      if (data) {
        const siteData = data as any;
        setLinks({
          scheduling_url: siteData.n8n_webhook_url || 'https://www.google.com/',
          exit_url: siteData.medical_record_url_site_jrs || 'https://www.google.com/',
          public_registration_url: siteData.public_registration_url || `${window.location.origin}/cadastro-paciente`,
          whatsapp_reminder_webhook_url: siteData.whatsapp_reminder_webhook_url || '',
          whatsapp_recurring_reminder_webhook_url: siteData.whatsapp_recurring_reminder_webhook_url || '',
          pix_key: siteData.pix_key || ''
        });
      } else {
        // Se não houver dados, usar URLs padrão
        setLinks({
          scheduling_url: 'https://www.google.com/',
          exit_url: 'https://www.google.com/',
          public_registration_url: `${window.location.origin}/cadastro-paciente`,
          whatsapp_reminder_webhook_url: '',
          whatsapp_recurring_reminder_webhook_url: '',
          pix_key: ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar links:', error);
      setLinks({
        scheduling_url: 'https://www.google.com/',
        exit_url: 'https://www.google.com/',
        public_registration_url: `${window.location.origin}/cadastro-paciente`,
        whatsapp_reminder_webhook_url: '',
        whatsapp_recurring_reminder_webhook_url: '',
        pix_key: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const saveLinks = async () => {
    try {
      setSaving(true);

      // Primeiro, verificar se existe algum registro
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1)
        .single();

      if (existing) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('site_settings')
          .update({ 
            n8n_webhook_url: links.scheduling_url,
            medical_record_url_site_jrs: links.exit_url,
            public_registration_url: links.public_registration_url,
            whatsapp_reminder_webhook_url: links.whatsapp_reminder_webhook_url,
            whatsapp_recurring_reminder_webhook_url: links.whatsapp_recurring_reminder_webhook_url,
            pix_key: links.pix_key
          })
          .eq('id', existing.id);
        
        if (error) throw error;
      } else {
        // Inserir novo registro
        const { error } = await supabase
          .from('site_settings')
          .insert({ 
            n8n_webhook_url: links.scheduling_url,
            medical_record_url_site_jrs: links.exit_url,
            public_registration_url: links.public_registration_url,
            whatsapp_reminder_webhook_url: links.whatsapp_reminder_webhook_url,
            whatsapp_recurring_reminder_webhook_url: links.whatsapp_recurring_reminder_webhook_url,
            pix_key: links.pix_key
          });
        
        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Links salvos com sucesso!",
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao salvar links:', error);
      toast({
        title: "Erro",
        description: `Não foi possível salvar os links: ${error.message || error}`,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof PublicRegistrationLinks, value: string) => {
    setLinks(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isValidUrl = (url: string) => {
    if (!url) return true; // URLs vazias são válidas
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Links do Cadastro Público</h2>
        <p className="text-gray-600 mt-2 text-lg">
          Configure os links utilizados nos botões do cadastro público de pacientes
        </p>
      </div>

      {/* Link do Cadastro Público */}
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-blue-800 text-xl">
            <ExternalLink className="h-6 w-6" />
            Link do Cadastro Público
          </CardTitle>
          <CardDescription className="text-blue-700 text-base">
            Configure o link para onde os pacientes serão redirecionados após tentativas fracassadas de CPF/SUS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="public_registration_url" className="text-blue-800 font-medium">URL do Cadastro Público</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="public_registration_url"
                type="url"
                placeholder="https://exemplo.com/cadastro-paciente"
                value={links.public_registration_url}
                onChange={(e) => handleInputChange('public_registration_url', e.target.value)}
                className={`flex-1 ${!isValidUrl(links.public_registration_url) ? 'border-red-500' : 'border-blue-300'} bg-white shadow-sm`}
                disabled={loading}
              />
              {links.public_registration_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(links.public_registration_url, '_blank')}
                  disabled={!isValidUrl(links.public_registration_url)}
                  className="border-blue-300 text-blue-700 hover:bg-blue-200"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            {!isValidUrl(links.public_registration_url) && (
              <p className="text-sm text-red-600 font-medium">URL inválida</p>
            )}
            <p className="text-sm text-blue-700">
              Link para onde o usuário será redirecionado após 3 tentativas fracassadas de CPF/SUS
            </p>
          </div>
          
          <div className="bg-blue-100/50 border border-blue-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-blue-700 font-medium mb-2">🔗 Links gerados automaticamente pelo sistema:</p>
            
            {/* Link de Cadastro */}
            <div className="space-y-2">
              <p className="text-xs text-blue-600 font-medium">Link de Cadastro Público:</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={`${window.location.origin}/cadastro-paciente`}
                  readOnly
                  className="bg-white border-blue-300 text-blue-800 font-mono text-xs flex-1 shadow-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/cadastro-paciente`);
                    toast({
                      title: "Copiado!",
                      description: "Link de cadastro copiado para a área de transferência.",
                      variant: "default"
                    });
                  }}
                  className="border-blue-300 text-blue-700 hover:bg-blue-200 px-4 text-xs"
                >
                  Copiar
                </Button>
              </div>
            </div>

            {/* Link de Agendamento */}
            <div className="space-y-2">
              <p className="text-xs text-blue-600 font-medium">Link de Agendamento Público:</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={`${window.location.origin}/agendamento`}
                  readOnly
                  className="bg-white border-blue-300 text-blue-800 font-mono text-xs flex-1 shadow-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/agendamento`);
                    toast({
                      title: "Copiado!",
                      description: "Link de agendamento copiado para a área de transferência.",
                      variant: "default"
                    });
                  }}
                  className="border-blue-300 text-blue-700 hover:bg-blue-200 px-4 text-xs"
                >
                  Copiar
                </Button>
              </div>
            </div>

            {/* Link de Consulta de Agenda Pública */}
            <div className="space-y-2">
              <p className="text-xs text-blue-600 font-medium">Link de Consulta de Agenda Pública:</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={`${window.location.origin}/public/consultaragenda`}
                  readOnly
                  className="bg-white border-blue-300 text-blue-800 font-mono text-xs flex-1 shadow-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/public/consultaragenda`);
                    toast({
                      title: "Copiado!",
                      description: "Link de consulta de agenda copiado para a área de transferência.",
                      variant: "default"
                    });
                  }}
                  className="border-blue-300 text-blue-700 hover:bg-blue-200 px-4 text-xs"
                >
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-blue-700">
                Página pública para consultar dias e horários disponíveis, sem necessidade de login.
              </p>
            </div>

            {/* Link de Agendamento do Administrador */}
            <div className="space-y-2">
              <p className="text-xs text-amber-600 font-medium">🔐 Link de Agendamento do Administrador:</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={`${window.location.origin}/agendamento?partner=ADM&code=ADM`}
                  readOnly
                  className="bg-amber-50 border-amber-300 text-amber-900 font-mono text-xs flex-1 shadow-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/agendamento?partner=ADM&code=ADM`);
                    toast({
                      title: "Copiado!",
                      description: "Link de agendamento do administrador copiado.",
                      variant: "default"
                    });
                  }}
                  className="border-amber-300 text-amber-700 hover:bg-amber-200 px-4 text-xs"
                >
                  Copiar
                </Button>
              </div>
              <p className="text-xs text-amber-700">
                ⚡ Use este link para criar agendamentos como administrador (rastreável no sistema)
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-3">
              <p className="text-xs text-blue-600">
                ℹ️ <strong>Nota:</strong> Estes são os links corretos gerados pelo sistema. 
                O redirecionamento automático agora usa sempre URLs internas para manter o contexto.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Chave PIX - NOVO */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-green-800 text-xl">
            💰 Chave PIX
          </CardTitle>
          <CardDescription className="text-green-700 text-base">
            Configure a chave PIX para pagamentos dos pacientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label htmlFor="pix_key" className="text-green-800 font-medium">Chave PIX</Label>
            <Input
              id="pix_key"
              type="text"
              placeholder="Digite sua chave PIX (CPF, email, telefone ou chave aleatória)"
              value={links.pix_key}
              onChange={(e) => handleInputChange('pix_key', e.target.value)}
              className="border-green-300 bg-white shadow-sm"
              disabled={loading}
            />
            <p className="text-sm text-green-700">
              Chave PIX que será exibida para os pacientes realizarem pagamentos
            </p>
          </div>
          
          <div className="bg-green-100/50 border border-green-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-green-700 font-medium mb-2">🔗 Link público da Chave PIX:</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={`${window.location.origin}/pix`}
                readOnly
                className="bg-white border-green-300 text-green-800 font-mono text-xs flex-1 shadow-sm"
              />
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/pix`);
                  toast({
                    title: "Copiado!",
                    description: "Link da chave PIX copiado para a área de transferência.",
                    variant: "default"
                  });
                }}
                className="border-green-300 text-green-700 hover:bg-green-200 px-4 text-xs"
              >
                Copiar
              </Button>
            </div>
            <p className="text-xs text-green-700">
              📱 Compartilhe este link para que os pacientes vejam e copiem sua chave PIX
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card de Agendamento */}
        <Card className="shadow-lg border-green-200 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-green-800 text-lg">
              <Link className="h-5 w-5" />
              URL de Agendamento
            </CardTitle>
            <CardDescription className="text-green-700">
              Link para redirecionamento do botão "Agendamento"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="scheduling_url" className="text-green-800 font-medium">URL de Agendamento</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="scheduling_url"
                  type="url"
                  placeholder="https://exemplo.com/agendamento"
                  value={links.scheduling_url}
                  onChange={(e) => handleInputChange('scheduling_url', e.target.value)}
                  className={`flex-1 ${!isValidUrl(links.scheduling_url) ? 'border-red-500' : 'border-green-300'} bg-white shadow-sm`}
                  disabled={loading}
                />
                {links.scheduling_url && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(links.scheduling_url, '_blank')}
                    disabled={!isValidUrl(links.scheduling_url)}
                    className="border-green-300 text-green-700 hover:bg-green-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {!isValidUrl(links.scheduling_url) && (
                <p className="text-sm text-red-600 font-medium">URL inválida</p>
              )}
              <p className="text-sm text-green-700">
                Link para onde o usuário será redirecionado ao clicar em "Agendamento"
              </p>
            </div>
            
            <div className="bg-green-100/50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-600 font-medium mb-2">🔗 Link correto do sistema:</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={`${window.location.origin}/agendamento`}
                  readOnly
                  className="bg-white border-green-300 text-green-800 font-mono text-xs flex-1 shadow-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/agendamento`);
                    toast({
                      title: "Copiado!",
                      description: "Link de agendamento copiado para a área de transferência.",
                      variant: "default"
                    });
                  }}
                  className="border-green-300 text-green-700 hover:bg-green-200 px-4 text-xs"
                >
                  Copiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Site & QR Code PDF */}
        <Card className="shadow-lg border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-orange-800 text-lg">
              <Link className="h-5 w-5" />
              URL Site & QR Code PDF
            </CardTitle>
            <CardDescription className="text-orange-700">
              Link para redirecionamento do botão "Site" e para o QR Code/Link no rodapé do PDF
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="exit_url" className="text-orange-800 font-medium">URL do Site / Avaliação (QR Code)</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="exit_url"
                  type="url"
                  placeholder="https://exemplo.com"
                  value={links.exit_url}
                  onChange={(e) => handleInputChange('exit_url', e.target.value)}
                  className={`flex-1 ${!isValidUrl(links.exit_url) ? 'border-red-500' : 'border-orange-300'} bg-white shadow-sm`}
                  disabled={loading}
                />
                {links.exit_url && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(links.exit_url, '_blank')}
                    disabled={!isValidUrl(links.exit_url)}
                    className="border-orange-300 text-orange-700 hover:bg-orange-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {!isValidUrl(links.exit_url) && (
                <p className="text-sm text-red-600 font-medium">URL inválida</p>
              )}
              <p className="text-sm text-orange-700">
                Este link será usado no botão "Sair" das páginas públicas e também gerará o QR Code de "Avalie meu atendimento" no rodapé dos prontuários PDF.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card de WhatsApp Lembretes - SIMPLIFICADO */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-purple-800 text-xl">
            <ExternalLink className="h-6 w-6" />
            Webhook de Lembretes WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campo 1: Aviso Agendamento */}
          <div className="space-y-3">
            <Label htmlFor="whatsapp_reminder_webhook_url" className="text-purple-800 font-medium">
              URL do Webhook WhatsApp Aviso Agendamento
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="whatsapp_reminder_webhook_url"
                type="url"
                placeholder="https://seu-webhook.n8n.cloud/webhook/..."
                value={links.whatsapp_reminder_webhook_url}
                onChange={(e) => handleInputChange('whatsapp_reminder_webhook_url', e.target.value)}
                className={`flex-1 ${!isValidUrl(links.whatsapp_reminder_webhook_url) && links.whatsapp_reminder_webhook_url ? 'border-red-500' : 'border-purple-300'} bg-white shadow-sm`}
                disabled={loading}
              />
              {links.whatsapp_reminder_webhook_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(links.whatsapp_reminder_webhook_url, '_blank')}
                  disabled={!isValidUrl(links.whatsapp_reminder_webhook_url)}
                  className="border-purple-300 text-purple-700 hover:bg-purple-200"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            {!isValidUrl(links.whatsapp_reminder_webhook_url) && links.whatsapp_reminder_webhook_url && (
              <p className="text-sm text-red-600 font-medium">URL inválida</p>
            )}
          </div>

          {/* Campo 2: Lembretes Recorrentes */}
          <div className="space-y-3">
            <Label htmlFor="whatsapp_recurring_reminder_webhook_url" className="text-purple-800 font-medium">
              URL do Webhook WhatsApp Lembretes Recorrentes
            </Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="whatsapp_recurring_reminder_webhook_url"
                type="url"
                placeholder="https://seu-webhook.n8n.cloud/webhook/..."
                value={links.whatsapp_recurring_reminder_webhook_url}
                onChange={(e) => handleInputChange('whatsapp_recurring_reminder_webhook_url', e.target.value)}
                className={`flex-1 ${!isValidUrl(links.whatsapp_recurring_reminder_webhook_url) && links.whatsapp_recurring_reminder_webhook_url ? 'border-red-500' : 'border-purple-300'} bg-white shadow-sm`}
                disabled={loading}
              />
              {links.whatsapp_recurring_reminder_webhook_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(links.whatsapp_recurring_reminder_webhook_url, '_blank')}
                  disabled={!isValidUrl(links.whatsapp_recurring_reminder_webhook_url)}
                  className="border-purple-300 text-purple-700 hover:bg-purple-200"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            {!isValidUrl(links.whatsapp_recurring_reminder_webhook_url) && links.whatsapp_recurring_reminder_webhook_url && (
              <p className="text-sm text-red-600 font-medium">URL inválida</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alert e Botão de Salvar */}
      <div className="space-y-6">
        <Alert className="border-blue-200 bg-blue-50">
          <Link className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Estes links serão utilizados no formulário público de cadastro de pacientes. 
            Certifique-se de que as URLs estão corretas e acessíveis.
          </AlertDescription>
        </Alert>

        <div className="flex justify-center">
          <Button 
            onClick={saveLinks} 
            disabled={saving || loading || !isValidUrl(links.scheduling_url) || !isValidUrl(links.exit_url)}
            className="flex items-center gap-3 px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg"
            size="lg"
          >
            {saving ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-r-transparent" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PublicRegistrationLinksConfig;
