import React from 'react';
import { usePermissions, UserPermissions } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: keyof UserPermissions;
  permissions?: (keyof UserPermissions)[];
  requireAll?: boolean; // Se true, requer todas as permissões. Se false, requer pelo menos uma
  fallback?: React.ReactNode;
  showAlert?: boolean;
  alertMessage?: string;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions = [],
  requireAll = true,
  fallback,
  showAlert = true,
  alertMessage = "Você não tem permissão para acessar esta funcionalidade.",
}) => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isLoading } = usePermissions();

  // Se ainda está carregando, não renderiza nada ou mostra loading
  if (isLoading) {
    return null;
  }

  let hasAccess = false;

  // Verificar permissão única
  if (permission) {
    hasAccess = hasPermission(permission);
  }
  // Verificar múltiplas permissões
  else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }
  // Se não especificou permissões, permite acesso
  else {
    hasAccess = true;
  }

  // Se tem acesso, renderiza o conteúdo
  if (hasAccess) {
    return <>{children}</>;
  }

  // Se tem fallback customizado, usa ele
  if (fallback) {
    return <>{fallback}</>;
  }

  // Se deve mostrar alerta, mostra
  if (showAlert) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {alertMessage}
        </AlertDescription>
      </Alert>
    );
  }

  // Caso contrário, não renderiza nada
  return null;
};

// Componente específico para proteger itens de menu
interface MenuItemGuardProps {
  children: React.ReactNode;
  permission: keyof UserPermissions;
}

export const MenuItemGuard: React.FC<MenuItemGuardProps> = ({
  children,
  permission,
}) => {
  const { hasPermission, isLoading } = usePermissions();

  console.log('🔒 [MenuItemGuard] Verificando permissão:', permission, 'isLoading:', isLoading, 'hasPermission:', hasPermission(permission));

  if (isLoading) {
    console.log('⏳ [MenuItemGuard] Ainda carregando, renderizando item com estado de loading');
    // Durante o carregamento, vamos renderizar o item mas desabilitado
    return React.cloneElement(children as React.ReactElement, {
      className: ((children as React.ReactElement).props.className || '') + ' opacity-50 pointer-events-none',
      title: 'Carregando permissões...'
    });
  }

  if (!hasPermission(permission)) {
    console.log('❌ [MenuItemGuard] Sem permissão para:', permission);
    return null;
  }

  console.log('✅ [MenuItemGuard] Renderizando item de menu com permissão:', permission);
  return <>{children}</>;
};

// Componente para proteger botões de ação
interface ActionButtonGuardProps {
  children: React.ReactNode;
  permission: keyof UserPermissions;
  disabled?: boolean;
  disabledMessage?: string;
}

export const ActionButtonGuard: React.FC<ActionButtonGuardProps> = ({
  children,
  permission,
  disabled = false,
  disabledMessage = "Ação não permitida",
}) => {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (!hasPermission(permission)) {
    return null;
  }

  // Se o botão deve ser desabilitado, clona o elemento e adiciona propriedades
  if (disabled && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      disabled: true,
      title: disabledMessage,
    });
  }

  return <>{children}</>;
};

// Hook para usar em componentes funcionais
export const usePermissionGuard = () => {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isLoading } = usePermissions();

  const canAccess = (
    permission?: keyof UserPermissions,
    permissions?: (keyof UserPermissions)[],
    requireAll = true
  ): boolean => {
    if (isLoading) return false;

    if (permission) {
      return hasPermission(permission);
    }

    if (permissions && permissions.length > 0) {
      return requireAll 
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions);
    }

    return true;
  };

  return {
    canAccess,
    isLoading,
  };
};

export default PermissionGuard;