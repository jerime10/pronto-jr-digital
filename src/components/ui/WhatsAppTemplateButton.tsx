
import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useActiveTemplate } from '@/hooks/useWhatsAppTemplates';
import { whatsappTemplateService } from '@/services/whatsappTemplateService';
import { toast } from 'sonner';

// Interface para as props do botão de WhatsApp simplificado
interface WhatsAppTemplateButtonProps {
  // Nome do paciente
  patientName?: string;
  // Data da consulta  
  consultDate?: string;
  // URL do documento
  documentUrl: string;
  // Telefone do paciente
  patientPhone?: string;
  // Variante do botão (opcional)
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  // Tamanho do botão (opcional)
  size?: 'default' | 'sm' | 'lg' | 'icon';
  // Texto do botão (opcional)
  children?: React.ReactNode;
  // Classes CSS adicionais
  className?: string;
  // Estado de desabilitado (opcional)
  disabled?: boolean;
}

// Botão que usa automaticamente o template ativo para enviar mensagem WhatsApp
export const WhatsAppTemplateButton: React.FC<WhatsAppTemplateButtonProps> = ({
  patientName,
  consultDate,
  documentUrl,
  patientPhone,
  variant = 'outline',
  size = 'sm',
  children,
  className,
  disabled = false,
}) => {
  const { data: activeTemplate, isLoading } = useActiveTemplate();

  // Função para enviar mensagem WhatsApp
  const handleWhatsAppSend = async () => {
    try {
      // Verificar se há template ativo
      if (!activeTemplate) {
        toast.error('Nenhum template WhatsApp está ativo. Configure um template primeiro.');
        return;
      }

      // Verificar se há telefone
      if (!patientPhone || patientPhone.trim() === '') {
        toast.error('Telefone do paciente não disponível');
        return;
      }

      // Validar e formatar telefone
      const cleanPhone = patientPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        toast.error('Número de telefone inválido');
        return;
      }

      const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      // Processar template com variáveis
      const message = whatsappTemplateService.processTemplate(activeTemplate.template, {
        nome: patientName || 'Paciente',
        data_consulta: consultDate || '',
        link: documentUrl
      });

      // Criar URL do WhatsApp
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank');
      toast.success('WhatsApp aberto com a mensagem do template ativo');

    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      toast.error('Erro ao processar template WhatsApp');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleWhatsAppSend}
      className={className}
      disabled={disabled || isLoading || !activeTemplate}
      title={
        !activeTemplate ? 'Nenhum template WhatsApp ativo' :
        disabled ? 'Telefone do paciente não disponível' :
        undefined
      }
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      {children || 'WhatsApp'}
    </Button>
  );
};
