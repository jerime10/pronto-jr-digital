-- Criar tabela de usuários customizados
CREATE TABLE public.custom_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Criar índice único para email
CREATE UNIQUE INDEX idx_custom_users_email ON public.custom_users (email);

-- Criar tabela de sessões de usuários
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.custom_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_address INET,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Criar índices para otimização
CREATE INDEX idx_user_sessions_token ON public.user_sessions (token);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions (user_id);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions (expires_at);

-- Atualizar tabela professionals para referenciar custom_users
ALTER TABLE public.professionals 
ADD COLUMN custom_user_id UUID REFERENCES public.custom_users(id) ON DELETE SET NULL;

-- Função para hash de senhas usando crypt
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar senhas
CREATE OR REPLACE FUNCTION public.verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter ID do usuário atual baseado no token
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
DECLARE
  current_token TEXT;
  user_id UUID;
BEGIN
  -- Pega o token do header da requisição
  current_token := current_setting('request.jwt.claims', true)::json->>'token';
  
  IF current_token IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Busca usuário pela sessão ativa
  SELECT us.user_id INTO user_id
  FROM public.user_sessions us
  WHERE us.token = current_token
    AND us.expires_at > now()
    AND us.is_active = true;
    
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Função para validar sessão
CREATE OR REPLACE FUNCTION public.validate_session(session_token TEXT)
RETURNS TABLE(user_id UUID, email VARCHAR, name VARCHAR, role VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT cu.id, cu.email, cu.name, cu.role
  FROM public.user_sessions us
  JOIN public.custom_users cu ON cu.id = us.user_id
  WHERE us.token = session_token
    AND us.expires_at > now()
    AND us.is_active = true
    AND cu.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_sessions
  WHERE expires_at < now() OR is_active = false;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar updated_at na tabela custom_users
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_users_updated_at
  BEFORE UPDATE ON public.custom_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.custom_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para custom_users (apenas admins podem ver todos os usuários)
CREATE POLICY "Users can view their own profile" ON public.custom_users
  FOR SELECT USING (id = get_current_user_id());

CREATE POLICY "Admins can view all users" ON public.custom_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.custom_users 
      WHERE id = get_current_user_id() AND role = 'admin'
    )
  );

-- Políticas RLS para user_sessions (usuários só veem suas próprias sessões)
CREATE POLICY "Users can view their own sessions" ON public.user_sessions
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can update their own sessions" ON public.user_sessions
  FOR UPDATE USING (user_id = get_current_user_id());

-- Inserir usuário admin padrão
INSERT INTO public.custom_users (email, password_hash, name, role)
VALUES (
  'admin@sistema.com',
  public.hash_password('admin123'),
  'Administrator',
  'admin'
);