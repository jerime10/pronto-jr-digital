import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type SimpleUser = {
  id: string;
  username: string;
  isAdmin: boolean;
  userType: 'admin' | 'partner';
  isPartner: boolean;
};

type SimpleAuthContextType = {
  user: SimpleUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
};

const SimpleAuthContext = createContext<SimpleAuthContextType>({
  user: null,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: () => {},
});

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};

export const SimpleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se já existe usuário logado
  useEffect(() => {
    const checkStoredAuth = () => {
      try {
        const storedUser = localStorage.getItem('simple_auth_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          console.log('Usuário logado encontrado:', userData.username);
        }
      } catch (error) {
        console.error('Erro ao verificar auth armazenado:', error);
        localStorage.removeItem('simple_auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredAuth();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Tentando login com:', username);
      
      // Chamar função do banco para validar credenciais
      const { data, error } = await supabase
        .rpc('validate_simple_user', {
          input_username: username,
          input_password: password
        });

      if (error) {
        console.error('Erro na validação:', error);
        return { success: false, error: 'Erro interno do servidor' };
      }

      if (!data || data.length === 0) {
        console.log('Credenciais inválidas para:', username);
        return { success: false, error: 'Usuário ou senha inválidos' };
      }

      const userData = data[0];
      
      // Determinar tipo de usuário baseado nos dados do banco
      const isAdmin = userData.user_type === 'admin' || userData.username === 'admin';
      const isPartner = userData.user_type === 'partner';
      
      // Criar objeto de usuário simples
      const simpleUser: SimpleUser = {
        id: userData.id,
        username: userData.username,
        isAdmin,
        userType: isAdmin ? 'admin' : 'partner',
        isPartner
      };

      // Armazenar no estado e localStorage
      setUser(simpleUser);
      localStorage.setItem('simple_auth_user', JSON.stringify(simpleUser));

      console.log('Login realizado com sucesso:', simpleUser.username);
      toast.success(`Bem-vindo, ${simpleUser.username}!`);
      
      return { success: true };

    } catch (error: any) {
      console.error('Erro crítico no login:', error);
      return { success: false, error: 'Erro de conexão com servidor' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('simple_auth_user');
    console.log('Logout realizado');
    toast.success('Logout realizado com sucesso!');
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
};