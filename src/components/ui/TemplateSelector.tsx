
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { WhatsAppTemplateModal } from './WhatsAppTemplateModal';

// Interface para as props do seletor de templates
interface TemplateSelectorProps {
  // Tipo de template a ser usado
  type: string;
  // Nome do paciente (opcional)
  patientName?: string;
  // Data da consulta (opcional)
  consultDate?: string;
  // URL do documento
  documentUrl: string;
  // Callback quando mensagem é gerada
  onMessageGenerated: (message: string) => void;
  // Elemento trigger personalizado (opcional)
  trigger?: React.ReactNode;
}

// Componente de seleção de templates - agora usa o modal melhorado
export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  type,
  patientName = '',
  consultDate = '',
  documentUrl,
  onMessageGenerated,
  trigger
}) => {
  // Estado para controlar abertura do modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Trigger padrão se não for fornecido
  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <MessageSquare className="h-4 w-4 mr-2" />
      Usar Template
    </Button>
  );

  // Função para abrir o modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // Função chamada quando mensagem é confirmada
  const handleMessageConfirmed = (message: string) => {
    onMessageGenerated(message);
  };

  return (
    <>
      {/* Botão que abre o modal */}
      <div onClick={handleOpenModal} className="cursor-pointer">
        {trigger || defaultTrigger}
      </div>

      {/* Modal de seleção de templates */}
      <WhatsAppTemplateModal
        templateType={type}
        patientName={patientName}
        consultDate={consultDate}
        documentUrl={documentUrl}
        onMessageConfirmed={handleMessageConfirmed}
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
};
