import { supabase } from '@/integrations/supabase/client';

// Re-export the main Supabase client
export { supabase as enhancedSupabase };

// Simple function to execute queries with logging
export async function executeQueryWithAuth<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  debugInfo: string = 'query'
): Promise<{ data: T | null; error: any }> {
  console.log(`[Enhanced Query] Executando ${debugInfo}...`);
  
  try {
    // Execute the query
    const result = await queryFn();
    
    if (result.error) {
      console.error(`[Enhanced Query] Erro em ${debugInfo}:`, result.error);
      
      // If RLS error, log it but don't fail
      if (result.error.code === 'PGRST116') {
        console.warn(`[Enhanced Query] Erro RLS em ${debugInfo}, dados podem estar protegidos`);
      }
      
      throw result.error;
    }
    
    console.log(`[Enhanced Query] ✅ ${debugInfo} executado com sucesso`, result.data ? `(${Array.isArray(result.data) ? result.data.length : 'single'} registros)` : '(sem dados)');
    return result;
    
  } catch (error) {
    console.error(`[Enhanced Query] ❌ Erro em ${debugInfo}:`, error);
    throw error;
  }
}

// Function to diagnose connection
export const diagnoseConnection = async () => {
  const results = {
    supabaseClient: false,
    patientsAccess: false,
    prescriptionsAccess: false,
    examsAccess: false,
    usuariosAccess: false
  };

  try {
    // Test basic Supabase connection
    const { data } = await supabase.from('patients').select('count').limit(1);
    results.supabaseClient = true;
    results.patientsAccess = !!data;
  } catch (e) {
    console.warn('Supabase client test failed:', e);
  }

  try {
    // Test prescriptions access
    const { data } = await supabase.from('prescription_models').select('count').limit(1);
    results.prescriptionsAccess = !!data;
  } catch (e) {
    console.warn('Prescriptions access test failed:', e);
  }

  try {
    // Test exams access
    const { data } = await supabase.from('exam_models').select('count').limit(1);
    results.examsAccess = !!data;
  } catch (e) {
    console.warn('Exams access test failed:', e);
  }

  try {
    // Test usuarios access
    const { data } = await supabase.from('usuarios').select('count').limit(1);
    results.usuariosAccess = !!data;
  } catch (e) {
    console.warn('Usuarios access test failed:', e);
  }

  console.log('🔍 Diagnóstico de Conectividade:', results);
  return results;
};