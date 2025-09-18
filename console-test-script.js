// Script para executar no console do navegador (F12)
// Copie e cole este código no console para criar dados de teste

async function createTestAppointment() {
  console.log('🚀 Criando agendamento de teste...');
  
  try {
    // Importar o cliente Supabase da aplicação
    const { supabase } = await import('/src/integrations/supabase/client.js');
    
    // 1. Primeiro, verificar se já existe um paciente de teste
    console.log('📝 Verificando paciente de teste...');
    let { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('name', 'João Silva Teste')
      .single();
    
    if (patientError && patientError.code !== 'PGRST116') {
      console.error('Erro ao buscar paciente:', patientError);
      return;
    }
    
    // Se não existe, criar o paciente
    if (!patient) {
      console.log('👤 Criando paciente de teste...');
      const { data: newPatient, error: createPatientError } = await supabase
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
      
      if (createPatientError) {
        console.error('❌ Erro ao criar paciente:', createPatientError);
        return;
      }
      patient = newPatient;
    }
    
    console.log('✅ Paciente:', patient.name, '(ID:', patient.id, ')');
    
    // 2. Criar agendamento de teste com status 'atendimento_iniciado'
    console.log('📅 Criando agendamento de teste...');
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate()); // Hoje
    
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        patient_name: patient.name,
        patient_phone: patient.phone,
        professional_name: 'Dr. Maria Santos',
        service_description: 'Consulta Médica',
        appointment_date: appointmentDate.toISOString().split('T')[0],
        start_time: '14:00:00',
        end_time: '14:30:00',
        appointment_datetime: appointmentDate.toISOString().split('T')[0] + 'T14:00:00',
        status: 'atendimento_iniciado',
        notes: 'Agendamento de teste para debug do UUID'
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
    console.log('- Agendamento:', appointment.id, 'para', appointment.appointment_date, 'às', appointment.start_time);
    console.log('- Status:', appointment.status);
    
    // Recarregar a página para ver os dados
    console.log('🔄 Recarregando página em 3 segundos...');
    setTimeout(() => {
      window.location.reload();
    }, 3000);
    
    return { patient, appointment };
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a função
createTestAppointment();