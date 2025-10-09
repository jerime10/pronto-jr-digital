-- Criar função para deletar appointment com privilégios elevados
CREATE OR REPLACE FUNCTION public.delete_appointment_by_id(appointment_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do dono da função
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Executar DELETE
  DELETE FROM public.appointments
  WHERE id = appointment_id;
  
  -- Verificar quantas linhas foram afetadas
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Retornar true se deletou ao menos 1 linha
  RETURN deleted_count > 0;
END;
$$;

-- Permitir que usuários autenticados chamem a função
GRANT EXECUTE ON FUNCTION public.delete_appointment_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_appointment_by_id(UUID) TO anon;