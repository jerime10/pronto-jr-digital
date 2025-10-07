import { supabase } from '@/integrations/supabase/client';
import { Usuario, UsuarioFormData, PartnerLink, UserPermissions } from '@/types/database';

export class UserService {
  // ============================================
  // MÉTODOS PARA GERENCIAMENTO DE USUÁRIOS
  // ============================================

  /**
   * Busca todos os usuários do sistema
   */
  static async getAllUsers(): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      throw new Error('Erro ao buscar usuários');
    }

    return data || [];
  }

  /**
   * Busca usuário por ID
   */
  static async getUserById(id: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }

    return data;
  }

  /**
   * Busca usuário por username
   */
  static async getUserByUsername(username: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      console.error('Erro ao buscar usuário por username:', error);
      return null;
    }

    return data;
  }

  /**
   * Cria um novo usuário
   */
  static async createUser(userData: UsuarioFormData): Promise<Usuario> {
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        username: userData.username,
        password: userData.password || '',
        user_type: userData.user_type,
        permissions: userData.permissions,
        full_name: userData.full_name,
        email: userData.email,
        phone: userData.phone,
        commission_percentage: userData.commission_percentage || 0,
        is_active: userData.is_active !== false
      }])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      throw new Error('Erro ao criar usuário');
    }

    return data;
  }

  /**
   * Atualiza um usuário existente
   */
  static async updateUser(id: string, userData: Partial<UsuarioFormData>): Promise<Usuario> {
    const updateData: any = { ...userData };
    
    // Remove password se estiver vazio
    if (!updateData.password) {
      delete updateData.password;
    }

    const { data, error } = await supabase
      .from('usuarios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw new Error('Erro ao atualizar usuário');
    }

    return data;
  }

  /**
   * Deleta um usuário
   */
  static async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar usuário:', error);
      throw new Error('Erro ao deletar usuário');
    }
  }

  // ============================================
  // MÉTODOS PARA SISTEMA DE PARCERIAS
  // ============================================

  /**
   * Busca todos os parceiros ativos
   */
  static async getActivePartners(): Promise<Usuario[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('user_type', 'partner')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar parceiros:', error);
      throw new Error('Erro ao buscar parceiros');
    }

    return data || [];
  }

  /**
   * Gera link de agendamento para um parceiro
   */
  static async getPartnerBookingLink(username: string): Promise<string> {
    const { data, error } = await supabase
      .rpc('get_partner_booking_link', { partner_username: username });

    if (error) {
      console.error('Erro ao gerar link do parceiro:', error);
      throw new Error('Erro ao gerar link do parceiro');
    }

    return data;
  }

  /**
   * Busca informações do link de um parceiro
   */
  static async getPartnerLinkInfo(username: string): Promise<PartnerLink | null> {
    const user = await this.getUserByUsername(username);
    
    if (!user || user.user_type !== 'partner' || !user.is_active) {
      return null;
    }

    const bookingUrl = await this.getPartnerBookingLink(username);

    return {
      username: user.username,
      partner_code: user.partner_code || '',
      booking_url: bookingUrl,
      commission_percentage: user.commission_percentage
    };
  }

  /**
   * Verifica se usuário tem permissão específica
   */
  static hasPermission(user: Usuario, permission: keyof UserPermissions): boolean {
    if (user.user_type === 'admin') {
      return true; // Admin tem todas as permissões
    }

    return user.permissions?.[permission] === true;
  }

  /**
   * Atualiza último login do usuário
   */
  static async updateLastLogin(userId: string): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Erro ao atualizar último login:', error);
    }
  }

  /**
   * Valida credenciais de login
   */
  static async validateLogin(username: string, password: string): Promise<Usuario | null> {
    const { data, error } = await supabase
      .rpc('validate_simple_user', {
        input_username: username,
        input_password: password
      });

    if (error || !data) {
      console.error('Erro na validação de login:', error);
      return null;
    }

    // Busca dados completos do usuário
    const user = await this.getUserByUsername(username);
    
    if (user && user.is_active) {
      // Atualiza último login
      await this.updateLastLogin(user.id);
      return user;
    }

    return null;
  }
}