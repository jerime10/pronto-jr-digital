
import { supabase } from '@/integrations/supabase/client';
import { WhatsAppTemplate, TemplateVariables } from '@/types/whatsappTemplate';

// Função auxiliar para converter Json do banco em array de strings
const convertVariablesToArray = (variables: any): string[] => {
  if (Array.isArray(variables)) {
    return variables;
  }
  if (typeof variables === 'string') {
    try {
      const parsed = JSON.parse(variables);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

// Função auxiliar para transformar linha do banco em WhatsAppTemplate
const transformDbRow = (row: any): WhatsAppTemplate => ({
  id: row.id,
  name: row.name,
  template: row.template,
  variables: convertVariablesToArray(row.variables),
  is_active: row.is_active,
  template_type: row.template_type,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const whatsappTemplateService = {
  // Busca todos os templates
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    const { data, error } = await supabase
      .from('whatsapp_message_templates')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data || []).map(transformDbRow);
  },

  // Busca o template ativo atual
  async getActiveTemplate(): Promise<WhatsAppTemplate | null> {
    const { data, error } = await supabase
      .from('whatsapp_message_templates')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum template ativo encontrado
        return null;
      }
      throw error;
    }
    return data ? transformDbRow(data) : null;
  },

  // Define um template como ativo (os outros ficam inativos automaticamente)
  async setActiveTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('whatsapp_message_templates')
      .update({ is_active: true })
      .eq('id', id);

    if (error) throw error;
  },

  // Busca templates por tipo
  async getTemplatesByType(type: string): Promise<WhatsAppTemplate[]> {
    const { data, error } = await supabase
      .from('whatsapp_message_templates')
      .select('*')
      .eq('template_type', type)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return (data || []).map(transformDbRow);
  },

  // Busca um template específico
  async getTemplate(id: string): Promise<WhatsAppTemplate | null> {
    const { data, error } = await supabase
      .from('whatsapp_message_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? transformDbRow(data) : null;
  },

  // Cria um novo template
  async createTemplate(template: Omit<WhatsAppTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<WhatsAppTemplate> {
    const { data, error } = await supabase
      .from('whatsapp_message_templates')
      .insert({
        ...template,
        variables: JSON.stringify(template.variables)
      })
      .select()
      .single();

    if (error) throw error;
    return transformDbRow(data);
  },

  // Atualiza um template existente
  async updateTemplate(id: string, updates: Partial<WhatsAppTemplate>): Promise<WhatsAppTemplate> {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Converte array de variáveis para string JSON se presente
    if (updates.variables) {
      updateData.variables = JSON.stringify(updates.variables);
    }

    const { data, error } = await supabase
      .from('whatsapp_message_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return transformDbRow(data);
  },

  // Exclui um template
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('whatsapp_message_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Gera saudação automática baseada na hora
  generateGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  },

  // Formata data em português brasileiro
  formatDate(date: Date = new Date()): string {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Processa template substituindo variáveis
  processTemplate(template: string, variables: TemplateVariables): string {
    let processedTemplate = template;

    // Substitui variáveis automaticamente se não fornecidas
    const autoVariables: TemplateVariables = {
      saudacao: this.generateGreeting(),
      data: this.formatDate(),
      ...variables
    };

    // Substitui todas as variáveis no template
    Object.entries(autoVariables).forEach(([key, value]) => {
      if (value) {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        processedTemplate = processedTemplate.replace(regex, value);
      }
    });

    return processedTemplate;
  }
};
