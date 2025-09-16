import { supabase } from '@/integrations/supabase/client';
import { Service, ServiceFormData } from '../types/database';

// ============================================
// GERENCIAMENTO DE SERVIÇOS
// ============================================

export const serviceService = {
  // Criar novo serviço
  async createService(data: ServiceFormData): Promise<Service> {
    console.log('🔍 DEBUG - serviceService.createService recebeu:', data);
    
    const { data: service, error } = await supabase
      .from('services')
      .insert({
        name: data.name,
        price: data.price,
        duration: data.duration,
        available: data.available ?? true
      })
      .select()
      .single();

    console.log('🔍 DEBUG - Resultado da criação:', { service, error });

    if (error) {
      console.error('Erro ao criar serviço:', error);
      throw new Error(`Erro ao criar serviço: ${error.message}`);
    }

    return service;
  },

  // Listar todos os serviços
  async getAllServices(): Promise<Service[]> {
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar serviços:', error);
      throw new Error(`Erro ao buscar serviços: ${error.message}`);
    }

    return services || [];
  },

  // Alias para compatibilidade
  async getServices(): Promise<Service[]> {
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar serviços:', error);
      throw new Error(`Erro ao buscar serviços: ${error.message}`);
    }

    return services || [];
  },

  // Buscar serviço por ID
  async getServiceById(id: string): Promise<Service | null> {
    const { data: service, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Serviço não encontrado
      }
      console.error('Erro ao buscar serviço:', error);
      throw new Error(`Erro ao buscar serviço: ${error.message}`);
    }

    return service;
  },

  // Atualizar serviço
  async updateService(id: string, data: Partial<ServiceFormData>): Promise<Service> {
    console.log('🔍 DEBUG - serviceService.updateService recebeu:', { id, data });
    
    const { data: service, error } = await supabase
      .from('services')
      .update({
        name: data.name,
        price: data.price,
        duration: data.duration,
        available: data.available
      })
      .eq('id', id)
      .select()
      .single();
      
    console.log('🔍 DEBUG - Resultado da atualização:', { service, error });

    if (error) {
      console.error('Erro ao atualizar serviço:', error);
      throw new Error(`Erro ao atualizar serviço: ${error.message}`);
    }

    return service;
  },

  // Deletar serviço
  async deleteService(id: string): Promise<void> {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar serviço:', error);
      throw new Error(`Erro ao deletar serviço: ${error.message}`);
    }
  },

  // Buscar serviços disponíveis
  async getAvailableServices(): Promise<Service[]> {
    const { data: services, error } = await supabase
      .from('services')
      .select('*')
      .eq('available', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar serviços disponíveis:', error);
      throw new Error(`Erro ao buscar serviços disponíveis: ${error.message}`);
    }

    return services || [];
  },

  // Toggle status de disponibilidade do serviço
  async toggleServiceAvailability(id: string): Promise<Service> {
    console.log('🔍 DEBUG - serviceService.toggleServiceAvailability chamado para ID:', id);
    
    // Primeiro, buscar o serviço atual para obter o status
    const currentService = await this.getServiceById(id);
    if (!currentService) {
      throw new Error('Serviço não encontrado');
    }

    // Inverter o status de disponibilidade
    const newAvailability = !currentService.available;
    console.log('🔍 DEBUG - Alterando disponibilidade de', currentService.available, 'para', newAvailability);
    
    const { data: service, error } = await supabase
      .from('services')
      .update({ available: newAvailability })
      .eq('id', id)
      .select()
      .single();
      
    console.log('🔍 DEBUG - Resultado do toggle:', { service, error });

    if (error) {
      console.error('Erro ao alterar status do serviço:', error);
      throw new Error(`Erro ao alterar status do serviço: ${error.message}`);
    }

    return service;
  }
};

export default serviceService;