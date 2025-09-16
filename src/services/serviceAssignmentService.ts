import { enhancedSupabase } from '@/lib/enhancedSupabaseClient';

export interface ServiceAssignment {
  id: string;
  service_id: string;
  service_name: string;
  service_price: number;
  service_duration: number;
  attendant_id: string;
  attendant_name: string;
  attendant_position: string;
  created_at?: string;
  updated_at?: string;
}

export const serviceAssignmentService = {
  // Criar nova atribuição de serviço
  async createAssignment(serviceId: string, attendantId: string): Promise<ServiceAssignment> {
    console.log('Creating service assignment:', { serviceId, attendantId });
    
    try {
      // Buscar dados do serviço
      const { data: service, error: serviceError } = await enhancedSupabase
        .from('services')
        .select('id, name, price, duration')
        .eq('id', serviceId)
        .single();
      
      if (serviceError) {
        console.error('Error fetching service:', serviceError);
        throw serviceError;
      }
      
      // Buscar dados do atendente
      const { data: attendant, error: attendantError } = await enhancedSupabase
        .from('attendants')
        .select('id, name, position')
        .eq('id', attendantId)
        .single();
      
      if (attendantError) {
        console.error('Error fetching attendant:', attendantError);
        throw attendantError;
      }
      
      // Criar a atribuição
      const { data, error } = await enhancedSupabase
        .from('service_assignments')
        .insert({
          service_id: serviceId,
          service_name: service.name,
          service_price: service.price,
          service_duration: service.duration,
          attendant_id: attendantId,
          attendant_name: attendant.name,
          attendant_position: attendant.position
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating service assignment:', error);
        throw error;
      }
      
      console.log('Service assignment created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in createAssignment:', error);
      throw error;
    }
  },
  
  // Buscar atribuições por atendente
  async getAssignmentsByAttendant(attendantId: string): Promise<ServiceAssignment[]> {
    console.log('Fetching assignments for attendant:', attendantId);
    
    try {
      const { data, error } = await enhancedSupabase
        .from('service_assignments')
        .select('*')
        .eq('attendant_id', attendantId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching assignments:', error);
        throw error;
      }
      
      console.log('Assignments fetched successfully:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error in getAssignmentsByAttendant:', error);
      throw error;
    }
  },
  
  // Remover atribuição
  async removeAssignment(assignmentId: string): Promise<void> {
    console.log('Removing assignment:', assignmentId);
    
    try {
      const { error } = await enhancedSupabase
        .from('service_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) {
        console.error('Error removing assignment:', error);
        throw error;
      }
      
      console.log('Assignment removed successfully');
    } catch (error) {
      console.error('Error in removeAssignment:', error);
      throw error;
    }
  },
  
  // Verificar se um serviço já está atribuído a um atendente
  async checkExistingAssignment(serviceId: string, attendantId: string): Promise<boolean> {
    console.log('Checking existing assignment:', { serviceId, attendantId });
    
    try {
      const { data, error } = await enhancedSupabase
        .from('service_assignments')
        .select('id')
        .eq('service_id', serviceId)
        .eq('attendant_id', attendantId)
        .limit(1);
      
      if (error) {
        console.error('Error checking assignment:', error);
        throw error;
      }
      
      const exists = data && data.length > 0;
      console.log('Assignment exists:', exists);
      return exists;
    } catch (error) {
      console.error('Error in checkExistingAssignment:', error);
      throw error;
    }
  }
};

export default serviceAssignmentService;