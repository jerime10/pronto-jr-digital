
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { whatsappTemplateService } from '@/services/whatsappTemplateService';
import { WhatsAppTemplate } from '@/types/whatsappTemplate';

export const useWhatsAppTemplates = () => {
  const queryClient = useQueryClient();

  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: whatsappTemplateService.getTemplates,
  });

  const { data: activeTemplate } = useQuery({
    queryKey: ['whatsapp-active-template'],
    queryFn: whatsappTemplateService.getActiveTemplate,
  });

  const setActiveTemplateMutation = useMutation({
    mutationFn: whatsappTemplateService.setActiveTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-active-template'] });
      toast.success('Template ativo definido com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao definir template ativo: ${error.message}`);
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: whatsappTemplateService.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-active-template'] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao criar template: ${error.message}`);
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<WhatsAppTemplate> }) =>
      whatsappTemplateService.updateTemplate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-active-template'] });
      toast.success('Template atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar template: ${error.message}`);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: whatsappTemplateService.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-active-template'] });
      toast.success('Template excluído com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao excluir template: ${error.message}`);
    },
  });

  return {
    templates: templates || [],
    activeTemplate,
    isLoading,
    error,
    createTemplate: createTemplateMutation.mutate,
    updateTemplate: updateTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    setActiveTemplate: setActiveTemplateMutation.mutate,
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
    isSettingActive: setActiveTemplateMutation.isPending,
  };
};

export const useTemplatesByType = (type: string) => {
  return useQuery({
    queryKey: ['whatsapp-templates', type],
    queryFn: () => whatsappTemplateService.getTemplatesByType(type),
  });
};

export const useActiveTemplate = () => {
  return useQuery({
    queryKey: ['whatsapp-active-template'],
    queryFn: whatsappTemplateService.getActiveTemplate,
  });
};
