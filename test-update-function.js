// Teste específico da função updateExamResults com dados reais

const mockSelectedTemplate = {
  result_template: `EXAME MÉDICO

IMPRESSÃO DIAGNÓSTICA:
. ___

Peso: ___

DATA DO EXAME: ___

Observações gerais do exame.`
};

const mockSelectedModel = {
  id: 1,
  name: "Exame Geral"
};

// Campos dinâmicos como são criados pela função parseTemplateToFields
const mockDynamicFields = [
  {
    key: "impressao_diagnostica",
    label: "IMPRESSÃO DIAGNÓSTICA",
    type: "textarea",
    placeholder: "Digite a impressão diagnóstica"
  },
  {
    key: "peso",
    label: "Peso",
    type: "input",
    placeholder: "Digite o peso"
  },
  {
    key: "data_do_exame",
    label: "DATA DO EXAME",
    type: "date",
    placeholder: "Selecione a data"
  }
];

// Valores preenchidos pelo usuário
const mockFieldValues = {
  impressao_diagnostica: "Paciente apresenta quadro estável",
  peso: "75kg",
  data_do_exame: "2024-01-15"
};

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

function testRealUpdateExamResults() {
  console.log('🧪 [TEST] ===== INÍCIO updateExamResults =====');
  console.log('🧪 [TEST] Template original:', mockSelectedTemplate.result_template);
  console.log('🧪 [TEST] Campos dinâmicos:', mockDynamicFields);
  console.log('🧪 [TEST] Valores dos campos:', mockFieldValues);

  // Criar newFields como no componente real
  const newFields = mockDynamicFields.map(field => ({
    ...field,
    value: mockFieldValues[field.key] || ''
  }));

  console.log('🧪 [TEST] newFields criado:', newFields);

  // Simular a função updateExamResults
  let result = mockSelectedTemplate.result_template;

  newFields.forEach((field, index) => {
    const value = field.value;
    if (!value) return;

    console.log(`\n🔄 [UPDATE] Processando campo ${index + 1}:`, {
      key: field.key,
      label: field.label,
      type: field.type,
      value: value
    });

    // Escapar caracteres especiais no label para regex
    const escapedLabel = field.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    console.log(`🔄 [UPDATE] Label escapado: "${escapedLabel}"`);

    if (field.type === 'textarea') {
      console.log('🔄 [UPDATE] Processando como textarea...');
      
      // Debug: verificar se o padrão existe no template
      const textareaPattern = new RegExp(`${escapedLabel}:\\s*\\n\\s*\\.\\s+_{2,}`, 'gi');
      console.log('🔄 [UPDATE] Padrão textarea:', textareaPattern);
      console.log('🔄 [UPDATE] Teste do padrão:', textareaPattern.test(result));
      
      // Reset regex
      textareaPattern.lastIndex = 0;
      const match = result.match(textareaPattern);
      console.log('🔄 [UPDATE] Match encontrado:', match);
      
      if (match) {
        result = result.replace(textareaPattern, `${field.label}:\n${value}`);
        console.log('🔄 [UPDATE] Substituição textarea realizada');
      } else {
        console.log('❌ [UPDATE] Nenhum match para textarea encontrado');
      }
      
    } else {
      console.log('🔄 [UPDATE] Processando como input/date...');
      
      const formattedValue = field.type === 'date' ? formatDate(value) : value;
      console.log('🔄 [UPDATE] Valor formatado:', formattedValue);
      
      // Padrão simples: CAMPO: ___
      const simplePattern = new RegExp(`${escapedLabel}:\\s*_{2,}`, 'gi');
      console.log('🔄 [UPDATE] Padrão simples:', simplePattern);
      console.log('🔄 [UPDATE] Teste do padrão:', simplePattern.test(result));
      
      // Reset regex
      simplePattern.lastIndex = 0;
      const match = result.match(simplePattern);
      console.log('🔄 [UPDATE] Match encontrado:', match);
      
      if (match) {
        result = result.replace(simplePattern, `${field.label}: ${formattedValue}`);
        console.log('🔄 [UPDATE] Substituição input/date realizada');
      } else {
        console.log('❌ [UPDATE] Nenhum match para input/date encontrado');
      }
    }

    console.log('🔄 [UPDATE] Template atual após substituição:');
    console.log(result);
  });

  console.log('\n🔄 [UPDATE] Resultado final gerado:', result);
  console.log('🔄 [UPDATE] Ainda contém placeholders?', result.includes('___'));
  
  if (result.includes('___')) {
    console.log('❌ [UPDATE] PROBLEMA: Ainda há placeholders não substituídos!');
    const remainingPlaceholders = result.match(/_{2,}/g);
    console.log('❌ [UPDATE] Placeholders restantes:', remainingPlaceholders);
  } else {
    console.log('✅ [UPDATE] SUCESSO: Todos os placeholders foram substituídos!');
  }
  
  console.log('🔄 [UPDATE] ===== FIM updateExamResults =====');
}

// Executar teste
testRealUpdateExamResults();