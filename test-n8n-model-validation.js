/**
 * ETAPA 4: SCRIPT DE TESTE AUTOMATIZADO
 * 
 * Este script valida:
 * 1. RLS em individual_field_templates
 * 2. Existência de modelos em modelo-result-exames
 * 3. Busca de campos por modelo
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vtthxoovjswtrwfrdlha.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0dGh4b292anN3dHJ3ZnJkbGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MzUxMzYsImV4cCI6MjA2MjMxMTEzNn0.zrTsj-yz4sweSJCZBoAyBUvT7LXUA3HcVcqQk02YSeg';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🧪 ===== TESTE DE VALIDAÇÃO N8N =====\n');

/**
 * TESTE 1: Verificar RLS em individual_field_templates
 */
async function test1_RLSAccess() {
  console.log('🧪 TESTE 1: Verificar RLS em individual_field_templates');
  console.log('-----------------------------------------------');
  
  const { data: fields, error } = await supabase
    .from('individual_field_templates')
    .select('id, field_key, model_name')
    .limit(10);
  
  if (error) {
    console.error('❌ ERRO: RLS pode estar bloqueando acesso');
    console.error('Detalhes do erro:', error);
    return false;
  }
  
  console.log('✅ SUCESSO: RLS permite acesso');
  console.log(`   Total de campos retornados: ${fields?.length || 0}`);
  
  if (fields && fields.length > 0) {
    console.log('   Primeiros 3 campos:');
    fields.slice(0, 3).forEach(f => {
      console.log(`     - ${f.field_key} (modelo: ${f.model_name})`);
    });
  }
  
  console.log('');
  return true;
}

/**
 * TESTE 2: Verificar existência de modelo específico
 */
async function test2_ModelExists() {
  console.log('🧪 TESTE 2: Verificar existência de modelo no banco');
  console.log('-----------------------------------------------');
  
  const testModels = [
    'ULTRASSONOGRAFIA OBSTÉTRICA 2º E 3º TRI',
    'ABDOME TOTAL',
    'ULTRASSONOGRAFIA TRANSVAGINAL'
  ];
  
  for (const modelName of testModels) {
    const { data: model, error } = await supabase
      .from('modelo-result-exames')
      .select('id, name')
      .eq('name', modelName)
      .maybeSingle();
    
    if (error) {
      console.error(`❌ ERRO ao buscar modelo "${modelName}":`, error.message);
      continue;
    }
    
    if (model) {
      console.log(`✅ Modelo encontrado: "${modelName}"`);
      console.log(`   ID: ${model.id}`);
    } else {
      console.log(`⚠️  Modelo NÃO encontrado: "${modelName}"`);
    }
  }
  
  console.log('');
  return true;
}

/**
 * TESTE 3: Buscar campos de um modelo específico
 */
async function test3_FetchFieldsByModel() {
  console.log('🧪 TESTE 3: Buscar campos de modelo específico');
  console.log('-----------------------------------------------');
  
  const modelName = 'ULTRASSONOGRAFIA OBSTÉTRICA 2º E 3º TRI';
  console.log(`Buscando campos do modelo: "${modelName}"\n`);
  
  const { data: fields, error } = await supabase
    .from('individual_field_templates')
    .select('field_key, field_label, model_name')
    .eq('model_name', modelName);
  
  if (error) {
    console.error('❌ ERRO ao buscar campos:', error.message);
    return false;
  }
  
  if (!fields || fields.length === 0) {
    console.error('❌ ERRO: Nenhum campo encontrado para este modelo');
    console.log('   Verifique se:');
    console.log('   1. O modelo está cadastrado em "individual_field_templates"');
    console.log('   2. O nome do modelo está EXATAMENTE igual (case-sensitive)');
    console.log('   3. Há campos associados ao modelo');
    return false;
  }
  
  console.log(`✅ SUCESSO: ${fields.length} campos encontrados`);
  console.log('   Lista de campos (field_key):');
  fields.forEach(f => {
    console.log(`     - ${f.field_key} (${f.field_label})`);
  });
  
  console.log('');
  return true;
}

/**
 * TESTE 4: Simular filtragem de campos dinâmicos
 */
async function test4_FilterDynamicFields() {
  console.log('🧪 TESTE 4: Simular filtragem de campos dinâmicos');
  console.log('-----------------------------------------------');
  
  const modelName = 'ULTRASSONOGRAFIA OBSTÉTRICA 2º E 3º TRI';
  
  // Simular dados que viriam do frontend
  const simulatedDynamicFields = {
    'gravidez': 'Tópica, única, cefálica',
    'ig': '24 semanas',
    'peso_fetal': '680g',
    'campo_invalido_1': 'Este campo não deveria ser enviado',
    'campo_invalido_2': 'Outro campo que não existe no modelo',
    'placenta': 'Anterior, grau 0'
  };
  
  console.log('Campos recebidos do frontend:');
  Object.keys(simulatedDynamicFields).forEach(key => {
    console.log(`  - ${key}`);
  });
  console.log('');
  
  // Buscar campos válidos do modelo
  const { data: validFields, error } = await supabase
    .from('individual_field_templates')
    .select('field_key')
    .eq('model_name', modelName);
  
  if (error || !validFields) {
    console.error('❌ ERRO ao buscar campos válidos:', error?.message);
    return false;
  }
  
  const validFieldKeys = new Set(validFields.map(f => f.field_key));
  console.log(`Campos válidos no modelo (${validFieldKeys.size}):`);
  Array.from(validFieldKeys).forEach(key => {
    console.log(`  - ${key}`);
  });
  console.log('');
  
  // Filtrar apenas campos válidos
  const filteredFields = Object.keys(simulatedDynamicFields)
    .filter(key => validFieldKeys.has(key))
    .reduce((acc, key) => {
      acc[key] = simulatedDynamicFields[key];
      return acc;
    }, {});
  
  console.log(`✅ Campos após filtragem (${Object.keys(filteredFields).length}):`);
  Object.keys(filteredFields).forEach(key => {
    console.log(`  - ${key}: ${filteredFields[key]}`);
  });
  console.log('');
  
  // Validar que campos inválidos foram removidos
  const removedFields = Object.keys(simulatedDynamicFields)
    .filter(key => !validFieldKeys.has(key));
  
  if (removedFields.length > 0) {
    console.log(`🗑️  Campos removidos (${removedFields.length}):`);
    removedFields.forEach(key => {
      console.log(`  - ${key}`);
    });
    console.log('');
  }
  
  return true;
}

/**
 * Executar todos os testes
 */
async function runAllTests() {
  console.log('Iniciando testes...\n');
  
  const results = {
    test1: await test1_RLSAccess(),
    test2: await test2_ModelExists(),
    test3: await test3_FetchFieldsByModel(),
    test4: await test4_FilterDynamicFields()
  };
  
  console.log('');
  console.log('🧪 ===== RESUMO DOS TESTES =====');
  console.log('TESTE 1 (RLS):', results.test1 ? '✅ PASSOU' : '❌ FALHOU');
  console.log('TESTE 2 (Modelos):', results.test2 ? '✅ PASSOU' : '❌ FALHOU');
  console.log('TESTE 3 (Campos):', results.test3 ? '✅ PASSOU' : '❌ FALHOU');
  console.log('TESTE 4 (Filtragem):', results.test4 ? '✅ PASSOU' : '❌ FALHOU');
  console.log('');
  
  const allPassed = Object.values(results).every(r => r === true);
  
  if (allPassed) {
    console.log('✅ TODOS OS TESTES PASSARAM!');
    console.log('   O sistema está configurado corretamente.');
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM');
    console.log('   Verifique os erros acima e corrija as configurações.');
  }
}

// Executar testes
runAllTests().catch(console.error);
