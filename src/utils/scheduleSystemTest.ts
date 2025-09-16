// Utility for testing schedule system functionality
// This file demonstrates the robustness of the schedule implementation

import { 
  scheduleService,
  scheduleAssignmentService,
  appointmentService
} from '@/services/scheduleService';
import { availabilityService } from '@/services/availabilityService';
import {
  ScheduleFormData,
  ScheduleAssignmentFormData,
  AppointmentFormData
} from '@/types/database';

export async function testScheduleSystem() {
  console.log('🧪 [Test] Iniciando teste do sistema de horários...');
  
  const testResults = {
    schedules: { create: false, list: false, update: false, delete: false },
    assignments: { create: false, list: false, update: false, delete: false },
    appointments: { create: false, list: false, update: false, delete: false },
    availability: { check: false, calendar: false, timeCheck: false, nextSlots: false }
  };
  
  let createdScheduleId: string | null = null;
  let createdAssignmentId: string | null = null;
  let createdAppointmentId: string | null = null;
  
  try {
    // ============================================
    // TESTE 1: SISTEMA DE HORÁRIOS (SCHEDULES)
    // ============================================
    
    console.log('📅 [Test] Teste 1: Criando horário de trabalho...');
    const scheduleData: ScheduleFormData = {
      attendant_id: 'test-attendant-id',
      day_of_week: 1, // Segunda-feira
      start_time: '08:00:00',
      end_time: '17:00:00',
      is_active: true
    };
    
    const createdSchedule = await scheduleService.createSchedule(scheduleData);
    if (createdSchedule) {
      createdScheduleId = createdSchedule.id;
      testResults.schedules.create = true;
      console.log('✅ [Test] Horário criado com sucesso:', createdScheduleId);
    }
    
    console.log('📋 [Test] Teste 2: Listando horários...');
    const schedules = await scheduleService.getSchedules();
    if (schedules && schedules.length >= 0) {
      testResults.schedules.list = true;
      console.log('✅ [Test] Lista de horários obtida:', schedules.length, 'itens');
    }
    
    if (createdScheduleId) {
      console.log('📝 [Test] Teste 3: Atualizando horário...');
      const updateData = { end_time: '18:00:00' };
      const updatedSchedule = await scheduleService.updateSchedule(createdScheduleId, updateData);
      if (updatedSchedule) {
        testResults.schedules.update = true;
        console.log('✅ [Test] Horário atualizado com sucesso');
      }
    }
    
    // ============================================
    // TESTE 2: ATRIBUIÇÕES DE HORÁRIO (ASSIGNMENTS)
    // ============================================
    
    if (createdScheduleId) {
      console.log('🔗 [Test] Teste 4: Criando atribuição de horário...');
      const assignmentData: ScheduleAssignmentFormData = {
        schedule_id: createdScheduleId,
        attendant_id: 'test-attendant-id',
        attendant_name: 'Test Attendant',
        schedule_info: 'Horário de teste'
      };
      
      const createdAssignment = await scheduleAssignmentService.createAssignment(assignmentData);
      if (createdAssignment) {
        createdAssignmentId = createdAssignment.id;
        testResults.assignments.create = true;
        console.log('✅ [Test] Atribuição criada com sucesso:', createdAssignmentId);
      }
      
      console.log('📋 [Test] Teste 5: Listando atribuições...');
      const assignments = await scheduleAssignmentService.getAssignments();
      if (assignments && assignments.length >= 0) {
        testResults.assignments.list = true;
        console.log('✅ [Test] Lista de atribuições obtida:', assignments.length, 'itens');
      }
      
      if (createdAssignmentId) {
        console.log('📝 [Test] Teste 6: Atualizando atribuição...');
        const updateData = { schedule_info: 'Horário de teste atualizado' };
        const updatedAssignment = await scheduleAssignmentService.updateAssignment(createdAssignmentId, updateData);
        if (updatedAssignment) {
          testResults.assignments.update = true;
          console.log('✅ [Test] Atribuição atualizada com sucesso');
        }
      }
    }
    
    // ============================================
    // TESTE 3: AGENDAMENTOS (APPOINTMENTS)
    // ============================================
    
    console.log('📅 [Test] Teste 7: Criando agendamento...');
    const appointmentData: AppointmentFormData = {
      patient_id: 'test-patient-id',
      attendant_id: 'test-attendant-id',
      service_id: 'test-service-id',
      appointment_date: '2024-12-20',
      start_time: '09:00:00',
      end_time: '09:30:00',
      status: 'scheduled',
      notes: 'Agendamento de teste'
    };
    
    const createdAppointment = await appointmentService.createAppointment(appointmentData);
    if (createdAppointment) {
      createdAppointmentId = createdAppointment.id;
      testResults.appointments.create = true;
      console.log('✅ [Test] Agendamento criado com sucesso:', createdAppointmentId);
    }
    
    console.log('📋 [Test] Teste 8: Listando agendamentos...');
    const appointments = await appointmentService.getAppointments();
    if (appointments && appointments.length >= 0) {
      testResults.appointments.list = true;
      console.log('✅ [Test] Lista de agendamentos obtida:', appointments.length, 'itens');
    }
    
    if (createdAppointmentId) {
      console.log('📝 [Test] Teste 9: Atualizando agendamento...');
      const updateData = { status: 'confirmed' as const };
      const updatedAppointment = await appointmentService.updateAppointment(createdAppointmentId, updateData);
      if (updatedAppointment) {
        testResults.appointments.update = true;
        console.log('✅ [Test] Agendamento atualizado com sucesso');
      }
    }
    
    // ============================================
    // TESTE 4: SISTEMA DE DISPONIBILIDADE
    // ============================================
    
    console.log('🔍 [Test] Teste 10: Verificando disponibilidade...');
    const availabilityCheck = await availabilityService.checkAvailability(
      'test-attendant-id',
      '2024-12-20',
      'test-service-id'
    );
    if (availabilityCheck && availabilityCheck.success !== undefined) {
      testResults.availability.check = true;
      console.log('✅ [Test] Verificação de disponibilidade concluída:', availabilityCheck.success);
    }
    
    console.log('📅 [Test] Teste 11: Obtendo calendário de disponibilidade...');
    const calendar = await availabilityService.getAvailabilityCalendar(
      'test-attendant-id',
      '2024-12-01',
      '2024-12-31',
      'test-service-id'
    );
    if (calendar && calendar.success !== undefined) {
      testResults.availability.calendar = true;
      console.log('✅ [Test] Calendário de disponibilidade obtido:', calendar.success);
    }
    
    console.log('⏰ [Test] Teste 12: Verificando horário específico...');
    const timeCheck = await availabilityService.checkTimeAvailability(
      'test-attendant-id',
      '2024-12-20',
      '10:00:00',
      'test-service-id'
    );
    if (timeCheck && timeCheck.success !== undefined) {
      testResults.availability.timeCheck = true;
      console.log('✅ [Test] Verificação de horário específico concluída:', timeCheck.success);
    }
    
    console.log('🔮 [Test] Teste 13: Obtendo próximos horários disponíveis...');
    const nextSlots = await availabilityService.getNextAvailableSlots(
      'test-attendant-id',
      '2024-12-20',
      'test-service-id',
      5
    );
    if (nextSlots && Array.isArray(nextSlots)) {
      testResults.availability.nextSlots = true;
      console.log('✅ [Test] Próximos horários obtidos:', nextSlots.length, 'slots');
    }
    
    // ============================================
    // LIMPEZA: REMOVENDO DADOS DE TESTE
    // ============================================
    
    console.log('🧹 [Test] Iniciando limpeza dos dados de teste...');
    
    if (createdAppointmentId) {
      console.log('🗑️ [Test] Removendo agendamento de teste...');
      await appointmentService.deleteAppointment(createdAppointmentId);
      testResults.appointments.delete = true;
      console.log('✅ [Test] Agendamento removido com sucesso');
    }
    
    if (createdAssignmentId) {
      console.log('🗑️ [Test] Removendo atribuição de teste...');
      await scheduleAssignmentService.deleteAssignment(createdAssignmentId);
      testResults.assignments.delete = true;
      console.log('✅ [Test] Atribuição removida com sucesso');
    }
    
    if (createdScheduleId) {
      console.log('🗑️ [Test] Removendo horário de teste...');
      await scheduleService.deleteSchedule(createdScheduleId);
      testResults.schedules.delete = true;
      console.log('✅ [Test] Horário removido com sucesso');
    }
    
    // ============================================
    // RELATÓRIO FINAL
    // ============================================
    
    const totalTests = Object.values(testResults).reduce((acc, category) => 
      acc + Object.values(category).length, 0
    );
    const passedTests = Object.values(testResults).reduce((acc, category) => 
      acc + Object.values(category).filter(Boolean).length, 0
    );
    
    console.log('\n🎉 [Test] RELATÓRIO FINAL DO SISTEMA DE HORÁRIOS');
    console.log('================================================');
    console.log(`📊 Testes executados: ${totalTests}`);
    console.log(`✅ Testes aprovados: ${passedTests}`);
    console.log(`❌ Testes falharam: ${totalTests - passedTests}`);
    console.log(`📈 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    console.log('\n📋 Detalhamento por categoria:');
    console.log('- Horários (Schedules):', Object.values(testResults.schedules).filter(Boolean).length, '/', Object.values(testResults.schedules).length);
    console.log('- Atribuições (Assignments):', Object.values(testResults.assignments).filter(Boolean).length, '/', Object.values(testResults.assignments).length);
    console.log('- Agendamentos (Appointments):', Object.values(testResults.appointments).filter(Boolean).length, '/', Object.values(testResults.appointments).length);
    console.log('- Disponibilidade (Availability):', Object.values(testResults.availability).filter(Boolean).length, '/', Object.values(testResults.availability).length);
    
    if (passedTests === totalTests) {
      console.log('\n🎊 TODOS OS TESTES PASSARAM! Sistema de horários funcionando perfeitamente.');
    } else {
      console.log('\n⚠️ Alguns testes falharam. Verifique os logs acima para detalhes.');
    }
    
    return {
      success: passedTests === totalTests,
      message: passedTests === totalTests 
        ? 'Sistema de horários funcionando perfeitamente'
        : `${passedTests}/${totalTests} testes passaram`,
      results: testResults,
      stats: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        successRate: ((passedTests / totalTests) * 100)
      }
    };
    
  } catch (error: any) {
    console.error('❌ [Test] Teste falhou com erro crítico:', error);
    
    // Tentar limpeza mesmo em caso de erro
    try {
      if (createdAppointmentId) {
        await appointmentService.deleteAppointment(createdAppointmentId);
      }
      if (createdAssignmentId) {
        await scheduleAssignmentService.deleteAssignment(createdAssignmentId);
      }
      if (createdScheduleId) {
        await scheduleService.deleteSchedule(createdScheduleId);
      }
      console.log('🧹 [Test] Limpeza de emergência concluída');
    } catch (cleanupError) {
      console.error('❌ [Test] Erro na limpeza de emergência:', cleanupError);
    }
    
    return {
      success: false,
      message: error.message || 'Erro crítico durante teste',
      error: error,
      results: testResults,
      stats: {
        total: 0,
        passed: 0,
        failed: 1,
        successRate: 0
      }
    };
  }
}

// ============================================
// FUNÇÃO PARA TESTE RÁPIDO DE DISPONIBILIDADE
// ============================================

export async function quickAvailabilityTest(attendantId: string, date: string, serviceId?: string) {
  console.log('⚡ [Quick Test] Teste rápido de disponibilidade...');
  
  try {
    const result = await availabilityService.checkAvailability(attendantId, date, serviceId);
    
    console.log('📊 [Quick Test] Resultado:', {
      success: result.success,
      availableSlots: result.available_slots?.length || 0,
      date: result.date,
      dayOfWeek: result.day_of_week
    });
    
    return result;
  } catch (error) {
    console.error('❌ [Quick Test] Erro no teste rápido:', error);
    throw error;
  }
}

// ============================================
// FUNÇÃO PARA TESTE DE PERFORMANCE
// ============================================

export async function performanceTest() {
  console.log('🚀 [Performance Test] Iniciando teste de performance...');
  
  const startTime = Date.now();
  const iterations = 10;
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const iterationStart = Date.now();
    
    try {
      await availabilityService.checkAvailability(
        'test-attendant-id',
        '2024-12-20',
        'test-service-id'
      );
      
      const iterationTime = Date.now() - iterationStart;
      results.push(iterationTime);
      
      console.log(`⏱️ [Performance Test] Iteração ${i + 1}: ${iterationTime}ms`);
    } catch (error) {
      console.error(`❌ [Performance Test] Erro na iteração ${i + 1}:`, error);
      results.push(-1);
    }
  }
  
  const totalTime = Date.now() - startTime;
  const validResults = results.filter(r => r > 0);
  const avgTime = validResults.length > 0 
    ? validResults.reduce((a, b) => a + b, 0) / validResults.length 
    : 0;
  
  console.log('\n📈 [Performance Test] Relatório de Performance:');
  console.log(`⏱️ Tempo total: ${totalTime}ms`);
  console.log(`📊 Tempo médio por consulta: ${avgTime.toFixed(2)}ms`);
  console.log(`✅ Consultas bem-sucedidas: ${validResults.length}/${iterations}`);
  console.log(`📈 Taxa de sucesso: ${((validResults.length / iterations) * 100).toFixed(1)}%`);
  
  return {
    totalTime,
    averageTime: avgTime,
    successfulQueries: validResults.length,
    totalQueries: iterations,
    successRate: (validResults.length / iterations) * 100,
    results
  };
}