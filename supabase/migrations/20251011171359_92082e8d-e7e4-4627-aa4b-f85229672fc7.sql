-- Adicionar telefone para o administrador na tabela usuarios
-- O usuário deve atualizar este telefone nas configurações de usuários

UPDATE public.usuarios
SET
  phone = '00000000000', -- Telefone placeholder que deve ser atualizado
  updated_at = NOW()
WHERE user_type = 'admin' 
  AND is_active = true 
  AND (phone IS NULL OR phone = '');

-- Garantir que todos os admins ativos tenham um telefone configurado
-- (mesmo que seja placeholder)
UPDATE public.usuarios
SET phone = '00000000000'
WHERE user_type = 'admin' 
  AND is_active = true 
  AND phone IS NULL;