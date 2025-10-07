import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { Loader2 } from 'lucide-react';

type SimpleAuthGuardProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
};

const SimpleAuthGuard = ({ 
  children, 
  requireAuth = true, 
  requireAdmin = false 
}: SimpleAuthGuardProps) => {
  const { user, isLoading } = useSimpleAuth();

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-lg text-gray-600">Carregando...</div>
        </div>
      </div>
    );
  }

  // Se requer autenticação mas não há usuário logado
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // Se requer admin mas usuário não é admin
  if (requireAdmin && (!user || !user.isAdmin)) {
    return <Navigate to="/login" replace />;
  }

  // Se não requer autenticação mas há usuário logado (página de login)
  if (!requireAuth && user) {
    if (user.isAdmin) {
      return <Navigate to="/configuracoes" replace />;
    } else if (user.isPartner) {
      return <Navigate to="/partner/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default SimpleAuthGuard;