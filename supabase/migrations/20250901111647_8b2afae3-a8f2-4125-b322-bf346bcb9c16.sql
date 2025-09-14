-- Criar usuário admin padrão se não existir
DO $$
BEGIN
  -- Verificar se já existe um usuário admin
  IF NOT EXISTS (SELECT 1 FROM custom_users WHERE email = 'admin@sistema.com') THEN
    INSERT INTO custom_users (email, password_hash, name, role, is_active)
    VALUES (
      'admin@sistema.com',
      hash_password('admin123'),
      'Administrador',
      'admin',
      true
    );
    
    RAISE NOTICE 'Usuário admin criado com email: admin@sistema.com e senha: admin123';
  ELSE
    RAISE NOTICE 'Usuário admin já existe';
  END IF;
END
$$;