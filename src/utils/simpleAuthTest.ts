import { supabase } from '@/integrations/supabase/client';

/**
 * Utilitário para testar o novo sistema de autenticação ultra-simples
 */
export const testSimpleAuth = async () => {
  console.log('🧪 Testando Sistema de Autenticação Ultra-Simples...');
  
  const results = {
    usuariosTableExists: false,
    adminUserExists: false,
    validateFunctionWorks: false,
    tablesAccessible: false
  };

  try {
    // 1. Verificar se a tabela usuarios existe
    console.log('1. Verificando tabela usuarios...');
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);
    
    results.usuariosTableExists = !usuariosError;
    console.log('   ✅ Tabela usuarios:', results.usuariosTableExists ? 'OK' : 'ERRO');

    // 2. Verificar se o usuário admin existe
    console.log('2. Verificando usuário admin...');
    const { data: adminUser, error: adminError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    results.adminUserExists = !adminError && !!adminUser;
    console.log('   ✅ Usuário admin:', results.adminUserExists ? 'OK' : 'ERRO');
    
    if (adminUser) {
      console.log('      Admin details:', {
        id: adminUser.id,
        username: adminUser.username,
        is_active: adminUser.is_active
      });
    }

    // 3. Testar função de validação
    console.log('3. Testando função validate_simple_user...');
    const { data: validateResult, error: validateError } = await supabase
      .rpc('validate_simple_user', {
        input_username: 'admin',
        input_password: 'admin'
      });
    
    results.validateFunctionWorks = !validateError && validateResult && validateResult.length > 0;
    console.log('   ✅ Função validate_simple_user:', results.validateFunctionWorks ? 'OK' : 'ERRO');
    
    if (validateResult && validateResult.length > 0) {
      console.log('      Validation result:', validateResult[0]);
    }

    // 4. Testar acesso às tabelas principais
    console.log('4. Testando acesso às tabelas principais...');
    const tableTests = await Promise.allSettled([
      supabase.from('patients').select('id').limit(1),
      supabase.from('prescription_models').select('id').limit(1),
      supabase.from('exam_models').select('id').limit(1),
      supabase.from('professionals').select('id').limit(1)
    ]);
    
    const tablesOk = tableTests.every(test => 
      test.status === 'fulfilled' && !test.value.error
    );
    
    results.tablesAccessible = tablesOk;
    console.log('   ✅ Acesso às tabelas:', results.tablesAccessible ? 'OK' : 'ERRO');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }

  // Resultado final
  const allOk = Object.values(results).every(Boolean);
  
  console.log('\n📊 RESULTADO DO TESTE:');
  console.log('======================');
  Object.entries(results).forEach(([key, value]) => {
    console.log(`${value ? '✅' : '❌'} ${key}: ${value ? 'OK' : 'FALHOU'}`);
  });
  
  console.log(`\n🎯 Status Geral: ${allOk ? '✅ SISTEMA FUNCIONANDO' : '❌ SISTEMA COM PROBLEMAS'}`);
  
  return {
    success: allOk,
    details: results
  };
};

/**
 * Demonstração de login completo
 */
export const demoLogin = async () => {
  console.log('\n🚀 Demonstração de Login Completo...');
  
  try {
    // Simular o processo de login
    const { data: validateResult, error } = await supabase
      .rpc('validate_simple_user', {
        input_username: 'admin',
        input_password: 'admin'
      });

    if (error || !validateResult || validateResult.length === 0) {
      console.log('❌ Login falhou');
      return { success: false, error: 'Credenciais inválidas' };
    }

    const userData = validateResult[0];
    const simpleUser = {
      id: userData.id,
      username: userData.username,
      isAdmin: userData.username === 'admin'
    };

    // Simular armazenamento local
    console.log('✅ Login bem-sucedido!');
    console.log('   Dados do usuário:', simpleUser);
    
    // Testar acesso aos dados após login
    const { data: patients } = await supabase
      .from('patients')
      .select('name')
      .limit(3);
    
    console.log('✅ Acesso aos dados pós-login:');
    console.log('   Pacientes encontrados:', patients?.length || 0);

    return { 
      success: true, 
      user: simpleUser,
      dataAccess: !!patients
    };

  } catch (error) {
    console.error('❌ Erro na demonstração:', error);
    return { success: false, error: 'Erro interno' };
  }
};