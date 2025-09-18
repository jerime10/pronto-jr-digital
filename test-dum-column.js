import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vtthxoovjswtrwfrdlha.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGh4b292anN3dHJ3ZnJkbGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzUxMzYsImV4cCI6MjA2MjMxMTEzNn0.zrTsj-yz4sweSJCZBoAyBUvT7LXUA3HcVcqQk02YSeg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDumColumn() {
  console.log('🔍 Testando conexão com Supabase...');
  
  try {
    // Primeiro, vamos verificar se conseguimos conectar
    const { data: testData, error: testError } = await supabase
      .from('appointments')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erro de conexão:', testError);
      return;
    }
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Agora vamos tentar selecionar a coluna dum
    console.log('🔍 Verificando se a coluna "dum" existe...');
    
    const { data: dumData, error: dumError } = await supabase
      .from('appointments')
      .select('id, dum')
      .limit(1);
    
    if (dumError) {
      console.error('❌ Erro ao acessar coluna dum:', dumError);
      
      if (dumError.message.includes('dum')) {
        console.log('🚨 A coluna "dum" não existe na tabela appointments!');
        
        // Vamos tentar criar a coluna usando uma função RPC
        console.log('🔧 Tentando adicionar a coluna dum...');
        
        const { data: rpcData, error: rpcError } = await supabase.rpc('exec', {
          sql: `
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'appointments' 
                    AND column_name = 'dum'
                    AND table_schema = 'public'
                ) THEN
                    ALTER TABLE public.appointments ADD COLUMN dum DATE;
                    COMMENT ON COLUMN public.appointments.dum IS 'Data da Última Menstruação';
                    CREATE INDEX IF NOT EXISTS idx_appointments_dum ON public.appointments(dum) WHERE dum IS NOT NULL;
                    RAISE NOTICE 'Coluna dum adicionada com sucesso';
                ELSE
                    RAISE NOTICE 'Coluna dum já existe';
                END IF;
            END $$;
          `
        });
        
        if (rpcError) {
          console.error('❌ Erro ao executar RPC:', rpcError);
        } else {
          console.log('✅ RPC executado com sucesso:', rpcData);
        }
      }
    } else {
      console.log('✅ Coluna "dum" existe e está acessível!');
      console.log('📊 Dados de teste:', dumData);
    }
    
    // Vamos também verificar a estrutura da tabela
    console.log('🔍 Verificando estrutura da tabela appointments...');
    
    const { data: structureData, error: structureError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (structureError) {
      console.error('❌ Erro ao verificar estrutura:', structureError);
    } else {
      console.log('📋 Estrutura da tabela (primeira linha):');
      if (structureData && structureData.length > 0) {
        console.log('Colunas disponíveis:', Object.keys(structureData[0]));
      } else {
        console.log('Tabela vazia, não é possível verificar estrutura');
      }
    }
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testDumColumn();