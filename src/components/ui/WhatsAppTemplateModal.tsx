
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MessageSquare, Eye, Send } from 'lucide-react';
import { useTemplatesByType } from '@/hooks/useWhatsAppTemplates';
import { whatsappTemplateService } from '@/services/whatsappTemplateService';
import { TemplateVariables } from '@/types/whatsappTemplate';
import { Badge } from '@/components/ui/badge';

// Interface para as props do modal de seleção de templates WhatsApp
interface WhatsAppTemplateModalProps {
  // Tipo de template a ser buscado (prontuario, exames, etc)
  templateType: string;
  // Nome do paciente (opcional)
  patientName?: string;
  // Data da consulta (opcional)
  consultDate?: string;
  // URL do documento a ser compartilhado
  documentUrl: string;
  // Função callback chamada quando uma mensagem é gerada e confirmada
  onMessageConfirmed: (message: string) => void;
  // Estado de abertura do modal
  isOpen: boolean;
  // Função para controlar abertura/fechamento do modal
  onOpenChange: (open: boolean) => void;
  // Elemento que dispara a abertura do modal (opcional)
  trigger?: React.ReactNode;
}

// Modal completo para seleção e personalização de templates WhatsApp
export const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  templateType,
  patientName = '',
  consultDate = '',
  documentUrl,
  onMessageConfirmed,
  isOpen,
  onOpenChange,
  trigger
}) => {
  // Hook para buscar templates do tipo especificado
  const { data: templates, isLoading } = useTemplatesByType(templateType);
  
  // Estado para o template selecionado
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  
  // Estado para as variáveis personalizáveis do template
  const [customVariables, setCustomVariables] = useState<TemplateVariables>({
    nome: patientName,
    data_consulta: consultDate,
    link: documentUrl,
  });
  
  // Estado para a mensagem final gerada
  const [generatedMessage, setGeneratedMessage] = useState('');
  
  // Estado para controle de preview
  const [showPreview, setShowPreview] = useState(false);

  // Busca o template selecionado
  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  // Função chamada quando um template é selecionado
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      generateMessage(template.template);
      setShowPreview(true);
    }
  };

  // Gera a mensagem processando o template com as variáveis
  const generateMessage = (template?: string) => {
    const templateText = template || selectedTemplate?.template || '';
    if (!templateText) return;

    const variables: TemplateVariables = {
      ...customVariables,
      link: documentUrl,
    };

    const message = whatsappTemplateService.processTemplate(templateText, variables);
    setGeneratedMessage(message);
  };

  // Atualiza uma variável específica e regenera a mensagem
  const handleVariableChange = (key: string, value: string) => {
    const updated = { ...customVariables, [key]: value };
    setCustomVariables(updated);
    
    if (selectedTemplate) {
      const message = whatsappTemplateService.processTemplate(selectedTemplate.template, {
        ...updated,
        link: documentUrl,
      });
      setGeneratedMessage(message);
    }
  };

  // Confirma o uso da mensagem e fecha o modal
  const handleConfirmMessage = () => {
    onMessageConfirmed(generatedMessage);
    onOpenChange(false);
    // Reset do estado
    setSelectedTemplateId('');
    setShowPreview(false);
    setGeneratedMessage('');
  };

  // Atualiza variáveis quando props mudam
  React.useEffect(() => {
    setCustomVariables(prev => ({
      ...prev,
      nome: patientName,
      data_consulta: consultDate,
      link: documentUrl,
    }));
  }, [patientName, consultDate, documentUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Selecionar Template WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escolha um template e personalize as variáveis para gerar a mensagem
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção do Template */}
          <div>
            <Label htmlFor="template-select">Template</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template..." />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      {template.name}
                      <Badge variant="outline" className="text-xs">
                        {template.template_type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exibição do Template Original */}
          {selectedTemplate && (
            <div>
              <Label>Template Original</Label>
              <div className="p-3 bg-gray-50 rounded-md text-sm border">
                {selectedTemplate.template}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-gray-500">Variáveis detectadas:</span>
                {selectedTemplate.variables.map((variable) => (
                  <Badge key={variable} variant="secondary" className="text-xs">
                    {`{${variable}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Formulário de Variáveis */}
          {selectedTemplate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTemplate.variables
                .filter(v => v !== 'saudacao' && v !== 'data' && v !== 'link')
                .map((variable) => (
                  <div key={variable}>
                    <Label htmlFor={variable}>
                      {variable === 'nome' ? 'Nome do Paciente' :
                       variable === 'data_consulta' ? 'Data da Consulta' :
                       variable.charAt(0).toUpperCase() + variable.slice(1)}
                    </Label>
                    <Input
                      id={variable}
                      value={customVariables[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      placeholder={`Digite ${variable}...`}
                    />
                  </div>
                ))}
            </div>
          )}

          {/* Preview da Mensagem */}
          {showPreview && generatedMessage && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4" />
                <Label>Preview da Mensagem</Label>
              </div>
              <Textarea
                value={generatedMessage}
                onChange={(e) => setGeneratedMessage(e.target.value)}
                rows={6}
                className="bg-green-50 border-green-200"
                placeholder="Mensagem será gerada aqui..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Você pode editar a mensagem diretamente antes de enviar
              </p>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            
            {showPreview && generatedMessage && (
              <Button 
                onClick={handleConfirmMessage}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar WhatsApp
              </Button>
            )}
          </div>

          {/* Estados de Loading e Empty */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-500">Carregando templates...</p>
            </div>
          )}

          {!isLoading && (!templates || templates.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium">Nenhum template encontrado</p>
              <p className="text-sm">
                Crie templates em Configurações → Templates WhatsApp
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
