// Script para executar no console do navegador para criar dados de teste
// Copie e cole este código no console do navegador (F12)

async function createTestData() {
  console.log('🚀 Iniciando criação de dados de teste...');
  
  try {
    // Importar o cliente Supabase da aplicação
    const { supabase } = await import('/src/integrations/supabase/client.js');
    
    console.log('✅ Cliente Supabase importado');
    
    // 1. Criar paciente de teste
    console.log('📝 Criando paciente de teste...');
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert({
        name: 'João Silva Teste',
        sus: '123456789012345',
        phone: '(11) 99999-9999',
        address: 'Rua das Flores, 123 - São Paulo, SP',
        gender: 'masculino',
        date_of_birth: '1985-05-15',
        age: 39
      })
      .select()
      .single();
    
    if (patientError) {
      console.error('❌ Erro ao criar paciente:', patientError);
      return;
    }
    
    console.log('✅ Paciente criado:', patient);
    
    // 2. Buscar um profissional existente ou criar um
    console.log('👨‍⚕️ Buscando profissional...');
    let { data: professionals } = await supabase
      .from('professionals')
      .select('*')
      .limit(1);
    
    let professional;
    if (!professionals || professionals.length === 0) {
      console.log('📝 Criando profissional de teste...');
      const { data: newProfessional, error: profError } = await supabase
        .from('professionals')
        .insert({
          name: 'Dr. Maria Santos',
          specialty: 'Clínico Geral',
          crm: 'CRM-SP 123456',
          email: 'maria.santos@clinica.com',
          phone: '(11) 88888-8888'
        })
        .select()
        .single();
      
      if (profError) {
        console.error('❌ Erro ao criar profissional:', profError);
        return;
      }
      professional = newProfessional;
    } else {
      professional = professionals[0];
    }
    
    console.log('✅ Profissional:', professional);
    
    // 3. Criar agendamento de teste
    console.log('📅 Criando agendamento de teste...');
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 1); // Amanhã
    
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        patient_id: patient.id,
        patient_name: patient.name,
        patient_phone: patient.phone,
        professional_id: professional.id,
        service_description: 'Consulta Médica',
        appointment_date: appointmentDate.toISOString().split('T')[0],
        appointment_time: '14:00:00',
        appointment_datetime: appointmentDate.toISOString().split('T')[0] + 'T14:00:00',
        status: 'scheduled',
        notes: 'Agendamento de teste para debug'
      })
      .select()
      .single();
    
    if (appointmentError) {
      console.error('❌ Erro ao criar agendamento:', appointmentError);
      return;
    }
    
    console.log('✅ Agendamento criado:', appointment);
    console.log('🎉 Dados de teste criados com sucesso!');
    console.log('📋 Resumo:');
    console.log('- Paciente:', patient.name, '(ID:', patient.id, ')');
    console.log('- Profissional:', professional.name, '(ID:', professional.id, ')');
    console.log('- Agendamento:', appointment.id, 'para', appointment.appointment_date, 'às', appointment.appointment_time);
    
    // Recarregar a página para ver os dados
    console.log('🔄 Recarregando página em 3 segundos...');
    setTimeout(() => {
      window.location.reload();
    }, 3000);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a função
createTestData();