import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';

export interface UserPermissions {
  // Funcionalidades principais do menu
  dashboard: boolean;
  pacientes: boolean;
  prescricoes: boolean;
  exames: boolean;
  atendimento: boolean;
  historico_atendimentos: boolean;
  
  // Sistema de agendamento
  agendamentos: boolean;
  atendentes: boolean;
  horarios: boolean;
  servicos: boolean;
  financeiro: boolean;
  
  // Funcionalidades administrativas
  configuracoes: boolean;
  usuarios: boolean;
  
  // Funcionalidades específicas
  links: boolean;
  relatorios: boolean;
  
  // Permissões granulares - Pacientes
  pacientes_criar: boolean;
  pacientes_editar: boolean;
  pacientes_excluir: boolean;
  pacientes_visualizar: boolean;
  
  // Permissões granulares - Prescrições
  prescricoes_criar: boolean;
  prescricoes_editar: boolean;
  prescricoes_excluir: boolean;
  prescricoes_visualizar: boolean;
  
  // Permissões granulares - Exames
  exames_criar: boolean;
  exames_editar: boolean;
  exames_excluir: boolean;
  exames_visualizar: boolean;
  
  // Permissões granulares - Atendimento
  atendimento_criar: boolean;
  atendimento_editar: boolean;
  atendimento_excluir: boolean;
  atendimento_visualizar: boolean;
  
  // Permissões granulares - Agendamentos
  agendamentos_criar: boolean;
  agendamentos_editar: boolean;
  agendamentos_excluir: boolean;
  agendamentos_visualizar: boolean;
  
  // Permissões granulares - Financeiro
  financeiro_visualizar: boolean;
  financeiro_editar: boolean;
  
  // Permissões específicas para parceiros
  partner_dashboard: boolean;
  partner_links: boolean;
  partner_agendamentos_proprios: boolean;
  partner_relatorios_proprios: boolean;
  
  // Informações de contexto
  user_type: 'admin' | 'partner' | 'user';
  is_admin: boolean;
  is_partner: boolean;
}

const defaultPermissions: UserPermissions = {
  dashboard: false,
  pacientes: false,
  prescricoes: false,
  exames: false,
  atendimento: false,
  historico_atendimentos: false,
  agendamentos: false,
  atendentes: false,
  horarios: false,
  servicos: false,
  financeiro: false,
  configuracoes: false,
  usuarios: false,
  links: false,
  relatorios: false,
  pacientes_criar: false,
  pacientes_editar: false,
  pacientes_excluir: false,
  pacientes_visualizar: false,
  prescricoes_criar: false,
  prescricoes_editar: false,
  prescricoes_excluir: false,
  prescricoes_visualizar: false,
  exames_criar: false,
  exames_editar: false,
  exames_excluir: false,
  exames_visualizar: false,
  atendimento_criar: false,
  atendimento_editar: false,
  atendimento_excluir: false,
  atendimento_visualizar: false,
  agendamentos_criar: false,
  agendamentos_editar: false,
  agendamentos_excluir: false,
  agendamentos_visualizar: false,
  financeiro_visualizar: false,
  financeiro_editar: false,
  partner_dashboard: false,
  partner_links: false,
  partner_agendamentos_proprios: false,
  partner_relatorios_proprios: false,
  user_type: 'user',
  is_admin: false,
  is_partner: false,
};

export const usePermissions = () => {
  const { user } = useSimpleAuth();

  const { data: permissions = defaultPermissions, isLoading, error } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return defaultPermissions;
      }

      const { data, error } = await supabase.rpc('get_user_permissions', {
        user_id_input: user.id
      });

      if (error) {
        console.error('Erro ao buscar permissões:', error);
        throw error;
      }

      return { ...defaultPermissions, ...data } as UserPermissions;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });

  // Função para verificar permissão específica
  const hasPermission = (permission: keyof UserPermissions): boolean => {
    return permissions[permission] === true;
  };

  // Função para verificar múltiplas permissões (AND)
  const hasAllPermissions = (permissionList: (keyof UserPermissions)[]): boolean => {
    return permissionList.every(permission => hasPermission(permission));
  };

  // Função para verificar se tem pelo menos uma permissão (OR)
  const hasAnyPermission = (permissionList: (keyof UserPermissions)[]): boolean => {
    return permissionList.some(permission => hasPermission(permission));
  };

  // Função para verificar permissão específica de parceiro
  const checkPartnerPermission = async (permissionKey: string, resourceId?: string) => {
    if (!user?.id) return false;

    const { data, error } = await supabase.rpc('check_partner_permission', {
      user_id_input: user.id,
      permission_key: permissionKey,
      resource_id: resourceId || null
    });

    if (error) {
      console.error('Erro ao verificar permissão de parceiro:', error);
      return false;
    }

    return data === true;
  };

  // Função para obter permissões de menu
  const getMenuPermissions = () => {
    return {
      dashboard: hasPermission('dashboard'),
      pacientes: hasPermission('pacientes'),
      prescricoes: hasPermission('prescricoes'),
      exames: hasPermission('exames'),
      atendimento: hasPermission('atendimento'),
      historico_atendimentos: hasPermission('historico_atendimentos'),
      agendamentos: hasPermission('agendamentos'),
      atendentes: hasPermission('atendentes'),
      horarios: hasPermission('horarios'),
      servicos: hasPermission('servicos'),
      financeiro: hasPermission('financeiro'),
      configuracoes: hasPermission('configuracoes'),
      usuarios: hasPermission('usuarios'),
    };
  };

  // Função para obter permissões específicas de parceiros
  const getPartnerPermissions = () => {
    return {
      partner_dashboard: hasPermission('partner_dashboard'),
      partner_links: hasPermission('partner_links'),
      partner_agendamentos_proprios: hasPermission('partner_agendamentos_proprios'),
      partner_relatorios_proprios: hasPermission('partner_relatorios_proprios'),
    };
  };

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    checkPartnerPermission,
    getMenuPermissions,
    getPartnerPermissions,
    isAdmin: permissions.is_admin,
    isPartner: permissions.is_partner,
    userType: permissions.user_type,
  };
};

export default usePermissions;