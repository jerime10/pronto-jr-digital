import { useQuery, useQueryClient } from '@tanstack/react-query';
import { availabilityService } from '@/services/availabilityService';
import {
  AvailabilityResponse,
  AvailabilityCalendar,
  TimeAvailabilityCheck,
  AvailableTimeSlot
} from '@/types/database';

// ============================================
// HOOK PARA VERIFICAÇÃO DE DISPONIBILIDADE
// ============================================

export function useAvailability(
  attendantId?: string,
  date?: string,
  serviceId?: string
) {
  return useQuery({
    queryKey: ['availability', attendantId, date, serviceId],
    queryFn: () => 
      attendantId && date
        ? availabilityService.checkAvailability(attendantId, date, serviceId)
        : Promise.resolve({
            success: false,
            available_slots: [],
            date: date || '',
            day_of_week: 0,
            error: 'Parâmetros obrigatórios não fornecidos'
          } as AvailabilityResponse),
    enabled: !!attendantId && !!date,
    staleTime: 1000 * 60 * 2, // 2 minutos - dados de disponibilidade mudam frequentemente
    refetchOnWindowFocus: true, // Atualizar quando a janela ganhar foco
  });
}

// ============================================
// HOOK PARA CALENDÁRIO DE DISPONIBILIDADE
// ============================================

export function useAvailabilityCalendar(
  attendantId?: string,
  startDate?: string,
  endDate?: string,
  serviceId?: string
) {
  return useQuery({
    queryKey: ['availability-calendar', attendantId, startDate, endDate, serviceId],
    queryFn: () => 
      attendantId && startDate && endDate
        ? availabilityService.getAvailabilityCalendar(attendantId, startDate, endDate, serviceId)
        : Promise.resolve({
            success: false,
            calendar: {},
            period: {
              start_date: startDate || '',
              end_date: endDate || ''
            },
            error: 'Parâmetros obrigatórios não fornecidos'
          } as AvailabilityCalendar),
    enabled: !!attendantId && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutos - calendário pode ser cached por mais tempo
    refetchOnWindowFocus: false, // Não atualizar automaticamente no foco
  });
}

// ============================================
// HOOK PARA VERIFICAÇÃO DE HORÁRIO ESPECÍFICO
// ============================================

export function useTimeAvailabilityCheck(
  attendantId?: string,
  date?: string,
  startTime?: string,
  serviceId?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['time-availability-check', attendantId, date, startTime, serviceId],
    queryFn: () => 
      attendantId && date && startTime
        ? availabilityService.checkTimeAvailability(attendantId, date, startTime, serviceId)
        : Promise.resolve({
            success: false,
            is_available: false,
            requested_time: startTime || '',
            service_duration: 30,
            alternative_slots: [],
            error: 'Parâmetros obrigatórios não fornecidos'
          } as TimeAvailabilityCheck),
    enabled: enabled && !!attendantId && !!date && !!startTime,
    staleTime: 1000 * 30, // 30 segundos - verificação específica deve ser muito atual
    refetchOnWindowFocus: true,
  });
}

// ============================================
// HOOK PARA PRÓXIMOS HORÁRIOS DISPONÍVEIS
// ============================================

export function useNextAvailableSlots(
  attendantId?: string,
  fromDate?: string,
  serviceId?: string,
  limit: number = 10
) {
  return useQuery({
    queryKey: ['next-available-slots', attendantId, fromDate, serviceId, limit],
    queryFn: () => 
      attendantId && fromDate
        ? availabilityService.getNextAvailableSlots(attendantId, fromDate, serviceId, limit)
        : Promise.resolve([]),
    enabled: !!attendantId && !!fromDate,
    staleTime: 1000 * 60 * 3, // 3 minutos
    refetchOnWindowFocus: false,
  });
}

// ============================================
// HOOK COMPOSTO PARA GESTÃO COMPLETA DE DISPONIBILIDADE
// ============================================

export function useAvailabilityManager(
  attendantId?: string,
  serviceId?: string
) {
  const queryClient = useQueryClient();
  
  // Data atual como padrão
  const today = new Date().toISOString().split('T')[0];
  
  // Período de 30 dias para o calendário
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30);
  const thirtyDaysLater = endDate.toISOString().split('T')[0];

  // Hooks de disponibilidade
  const todayAvailability = useAvailability(attendantId, today, serviceId);
  const calendar = useAvailabilityCalendar(attendantId, today, thirtyDaysLater, serviceId);
  const nextSlots = useNextAvailableSlots(attendantId, today, serviceId, 20);

  // Função para invalidar todas as queries de disponibilidade
  const refreshAvailability = () => {
    queryClient.invalidateQueries({ queryKey: ['availability'] });
    queryClient.invalidateQueries({ queryKey: ['availability-calendar'] });
    queryClient.invalidateQueries({ queryKey: ['time-availability-check'] });
    queryClient.invalidateQueries({ queryKey: ['next-available-slots'] });
  };

  // Função para verificar disponibilidade de uma data específica
  const checkDateAvailability = (date: string) => {
    return queryClient.fetchQuery({
      queryKey: ['availability', attendantId, date, serviceId],
      queryFn: () => 
        attendantId
          ? availabilityService.checkAvailability(attendantId, date, serviceId)
          : Promise.resolve({
              success: false,
              available_slots: [],
              date,
              day_of_week: 0,
              error: 'Atendente não especificado'
            } as AvailabilityResponse),
      staleTime: 1000 * 60 * 2,
    });
  };

  // Função para verificar horário específico
  const checkSpecificTime = (date: string, startTime: string) => {
    return queryClient.fetchQuery({
      queryKey: ['time-availability-check', attendantId, date, startTime, serviceId],
      queryFn: () => 
        attendantId
          ? availabilityService.checkTimeAvailability(attendantId, date, startTime, serviceId)
          : Promise.resolve({
              success: false,
              is_available: false,
              requested_time: startTime,
              service_duration: 30,
              alternative_slots: [],
              error: 'Atendente não especificado'
            } as TimeAvailabilityCheck),
      staleTime: 1000 * 30,
    });
  };

  return {
    // Dados de disponibilidade
    todayAvailability: todayAvailability.data,
    calendar: calendar.data,
    nextSlots: nextSlots.data || [],
    
    // Estados de loading
    isLoadingToday: todayAvailability.isLoading,
    isLoadingCalendar: calendar.isLoading,
    isLoadingNextSlots: nextSlots.isLoading,
    
    // Estados de erro
    todayError: todayAvailability.error,
    calendarError: calendar.error,
    nextSlotsError: nextSlots.error,
    
    // Funções utilitárias
    refreshAvailability,
    checkDateAvailability,
    checkSpecificTime,
    
    // Estado geral
    isLoading: todayAvailability.isLoading || calendar.isLoading || nextSlots.isLoading,
    hasError: !!todayAvailability.error || !!calendar.error || !!nextSlots.error,
  };
}

// ============================================
// HOOK PARA DISPONIBILIDADE EM TEMPO REAL
// ============================================

export function useRealTimeAvailability(
  attendantId?: string,
  date?: string,
  serviceId?: string,
  refreshInterval: number = 30000 // 30 segundos
) {
  return useQuery({
    queryKey: ['real-time-availability', attendantId, date, serviceId],
    queryFn: () => 
      attendantId && date
        ? availabilityService.checkAvailability(attendantId, date, serviceId)
        : Promise.resolve({
            success: false,
            available_slots: [],
            date: date || '',
            day_of_week: 0,
            error: 'Parâmetros obrigatórios não fornecidos'
          } as AvailabilityResponse),
    enabled: !!attendantId && !!date,
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 0, // Sempre considerar dados como stale para tempo real
  });
}