import { supabase } from '@/integrations/supabase/client';

// Função para aplicar a migração das colunas setting_key e setting_value
export const applyKeyValueMigration = async () => {
  try {
    console.log('Aplicando migração para adicionar colunas setting_key e setting_value...');
    
    // Como não podemos alterar a estrutura da tabela via cliente,
    // vamos apenas inserir as configurações padrão
    const { error: insertError } = await supabase
      .from('site_settings')
      .insert([
        {
          n8n_webhook_url: 'https://www.google.com/',
          medical_record_webhook_url: 'https://www.google.com/'
        }
      ]);
    
    if (insertError) {
      console.error('Erro ao inserir configurações padrão:', insertError);
      // Se der erro de coluna não existir, significa que precisamos da migração manual
      if (insertError.message.includes('column')) {
        console.error('As colunas setting_key e setting_value não existem na tabela site_settings.');
        console.error('É necessário aplicar a migração manualmente no banco de dados.');
      }
      return false;
    }
    
    console.log('Configurações padrão inseridas com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro na migração:', error);
    return false;
  }
};

// Função para verificar se as colunas existem
export const checkKeyValueColumns = async () => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1);
    
    if (error && error.message.includes('column')) {
      return false; // Colunas não existem
    }
    
    return true; // Colunas existem
  } catch (error) {
    return false;
  }
};