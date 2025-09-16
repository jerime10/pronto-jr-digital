import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Search, CheckCircle, AlertCircle, Sparkles, Shield, Clock, User, Phone, ChevronLeft, ChevronRight, ArrowRight, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneNumber, isValidPhoneNumber, cleanPhoneNumber } from '@/utils/phoneUtils';
import { formatCpfOrSus, isValidCpfOrSus, cleanCpfOrSus } from '@/utils/cpfSusUtils';
import { appointmentService } from '@/services/scheduleService';
import { debugLogger, startTimer, endTimer } from '@/utils/debugLogger';
import '../../styles/animations.css';

interface Patient {
  id: string;
  name: string;
  phone: string;
  sus: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface Attendant {
  id: string;
  name: string;
  services: string[];
}

interface AppointmentFormData {
  client_name: string;
  client_phone: string;
  attendant_id: string;
  attendant_name: string;
  service_id: string;
  service_name: string;
  service_price: number;
  service_duration: number;
  appointment_date: string;
  appointment_datetime: string;
  notes: string;
}

type BookingStep = 'patient_validation' | 'attendant_selection' | 'service_selection' | 'datetime_selection' | 'confirmation';

export const PublicAppointmentBooking: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('patient_validation');
  const [susNumber, setSusNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [attendants, setAttendants] = useState<Attendant[]>([]);
  const [availableAttendants, setAvailableAttendants] = useState<Attendant[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [publicLinks, setPublicLinks] = useState({
    exit_url: ''
  });
  const [formData, setFormData] = useState<AppointmentFormData>({
    client_name: '',
    client_phone: '',
    attendant_id: '',
    attendant_name: '',
    service_id: '',
    service_name: '',
    service_price: 0,
    service_duration: 0,
    appointment_date: '',
    appointment_datetime: '',
    notes: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  // Monitor para mudanças em availableTimeSlots
  useEffect(() => {
    debugLogger.info('Frontend', 'available_time_slots_changed', {
      newAvailableSlots: availableTimeSlots,
      slotsCount: availableTimeSlots.length,
      selectedTime,
      selectedDate: selectedDate?.toISOString(),
      isSelectedTimeStillAvailable: selectedTime ? availableTimeSlots.includes(selectedTime) : null,
      timestamp: new Date().toISOString()
    });

    // Se o horário selecionado não está mais disponível, alertar
    if (selectedTime && !availableTimeSlots.includes(selectedTime)) {
      debugLogger.warn('Frontend', 'selected_time_became_unavailable', {
        selectedTime,
        availableTimeSlots,
        selectedDate: selectedDate?.toISOString()
      });
    }
  }, [availableTimeSlots, selectedTime, selectedDate]);

  const loadInitialData = async () => {
    await Promise.all([
      loadPublicLinks(),
      loadServices(),
      loadAttendants()
    ]);
  };

  const loadPublicLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        console.error('Erro ao carregar links públicos:', error);
        return;
      }

      if (data) {
        setPublicLinks({
          exit_url: (data as any).post_registration_redirect_url || 'https://preview--cjrs-landing-craft.lovable.app'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de links:', error);
      setPublicLinks({
        exit_url: 'https://preview--cjrs-landing-craft.lovable.app'
      });
    }
  };

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, price, duration')
        .eq('available', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
      toast.error('Erro ao carregar serviços disponíveis.');
    }
  };

  const loadAttendantServices = async (attendantId: string) => {
    const timerName = `loadAttendantServices_${Date.now()}`;
    startTimer(timerName);

    debugLogger.info('Frontend', 'loadAttendantServices_start', {
      attendantId,
      timestamp: new Date().toISOString()
    });

    try {
      debugLogger.debug('Frontend', 'querying_service_assignments', {
        attendantId,
        table: 'service_assignments',
        fields: 'service_id, service_name, service_price, service_duration'
      });

      const { data: serviceAssignments, error } = await supabase
        .from('service_assignments')
        .select<'service_assignments', {
          service_id: string,
          service_name: string, 
          service_price: number,
          service_duration: number
        }>('service_id, service_name, service_price, service_duration')
        .eq('attendant_id', attendantId)
        .order('service_name');

      debugLogger.info('Frontend', 'service_assignments_response', {
        attendantId,
        success: !error,
        error: error?.message,
        dataCount: data?.length || 0,
        rawData: data
      });

      if (error) throw error;
      
      const servicesData = data?.map(item => ({
        id: item.service_id,
        name: item.service_name,
        price: item.service_price,
        duration: item.service_duration
      })) || [];

      debugLogger.info('Frontend', 'services_data_processed', {
        attendantId,
        servicesCount: servicesData.length,
        services: servicesData.map(s => ({
          id: s.id,
          name: s.name,
          price: s.price,
          duration: s.duration
        }))
      });
      
      setServices(servicesData);
      
      endTimer('Frontend', 'loadAttendantServices_success', timerName, {
        attendantId,
        servicesCount: servicesData.length
      });

    } catch (error) {
      debugLogger.error('Frontend', 'loadAttendantServices_error', {
        attendantId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });

      toast.error('Erro ao carregar serviços do profissional.');
      
      endTimer('Frontend', 'loadAttendantServices_error', timerName, {
        attendantId,
        error: String(error)
      });
    }
  };

  const loadAttendants = async () => {
    try {
      const { data, error } = await supabase
        .from('attendants')
        .select('id, name, services')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setAttendants(data || []);
    } catch (error) {
      console.error('Erro ao carregar atendentes:', error);
      toast.error('Erro ao carregar profissionais disponíveis.');
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const validatePatient = async () => {
    if (!susNumber.trim()) {
      toast.error('Por favor, insira o CPF ou SUS.');
      return;
    }

    if (!isValidCpfOrSus(susNumber.trim())) {
      toast.error('CPF deve ter 11 dígitos ou SUS deve ter 15 dígitos.');
      return;
    }

    try {
      setIsLoading(true);
      
      const cleanNumber = cleanCpfOrSus(susNumber.trim());
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, phone, sus')
        .eq('sus', cleanNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPatient(data);
        setFormData(prev => ({
          ...prev,
          client_name: data.name,
          client_phone: data.phone || ''
        }));
        // Carregar todos os profissionais disponíveis
        setAvailableAttendants(attendants);
        setCurrentStep('attendant_selection');
        const firstName = data.name.split(' ')[0];
        toast.success(`${getTimeGreeting()}, ${firstName}! Vamos agendar sua consulta.`);
      } else {
        toast.error('Paciente não encontrado. É necessário realizar o cadastro primeiro.');
        // Redirecionar para cadastro público
        setTimeout(() => {
          window.location.href = '/public/patient-registration';
        }, 2000);
      }
      
    } catch (error) {
      console.error('Erro ao validar paciente:', error);
      toast.error('Erro ao validar documento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceSelection = (serviceId: string) => {
    const selectedService = services.find(s => s.id === serviceId);
    if (selectedService) {
      setFormData(prev => ({
        ...prev,
        service_id: serviceId,
        service_name: selectedService.name,
        service_price: selectedService.price,
        service_duration: selectedService.duration
      }));
      
      setCurrentStep('datetime_selection');
    }
  };

  const handleAttendantSelection = async (attendantId: string) => {
    debugLogger.info('Frontend', 'attendant_selection_start', {
      attendantId,
      availableAttendantsCount: availableAttendants.length,
      currentStep: currentStep
    });

    const selectedAttendant = availableAttendants.find(a => a.id === attendantId);
    
    debugLogger.debug('Frontend', 'attendant_lookup', {
      attendantId,
      found: !!selectedAttendant,
      attendantName: selectedAttendant?.name,
      attendantData: selectedAttendant
    });

    if (selectedAttendant) {
      setFormData(prev => ({
        ...prev,
        attendant_id: attendantId,
        attendant_name: selectedAttendant.name
      }));

      debugLogger.info('Frontend', 'loading_attendant_services', {
        attendantId,
        attendantName: selectedAttendant.name
      });

      await loadAttendantServices(attendantId);
      setCurrentStep('service_selection');

      debugLogger.info('Frontend', 'attendant_selection_completed', {
        attendantId,
        attendantName: selectedAttendant.name,
        nextStep: 'service_selection'
      });
    } else {
      debugLogger.warn('Frontend', 'attendant_not_found', {
        attendantId,
        availableAttendants: availableAttendants.map(a => ({ id: a.id, name: a.name }))
      });
    }
  };

  // Função para obter o nome do dia da semana em português (compatível com banco de dados)
  const getDayOfWeekName = (date: Date): string => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[date.getDay()];
  };

  // Função para verificar se um horário já passou (apenas impede agendamentos no passado)
  const isTimeSlotExpired = (date: Date, timeSlot: string): boolean => {
    const now = new Date();
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotDateTime = new Date(date);
    slotDateTime.setHours(hours, minutes, 0, 0);
    
    // Apenas impede agendamentos para horários que já passaram
    // Não adiciona margem de tempo para permitir agendamentos em horários futuros
    return now > slotDateTime;
  };

  // Função para buscar horários disponíveis usando o availabilityService
  const checkAvailableTimeSlots = async (date: Date) => {
    const timerName = `checkAvailableTimeSlots_${Date.now()}`;
    startTimer(timerName);

    debugLogger.info('Frontend', 'checkAvailableTimeSlots_start', {
      date: date.toISOString(),
      dateString: date.toISOString().split('T')[0],
      attendantId: formData.attendant_id,
      serviceId: formData.service_id,
      timestamp: new Date().toISOString()
    });

    try {
      const dateString = date.toISOString().split('T')[0];
      
      debugLogger.debug('Frontend', 'importing_availability_service', {
        dateString,
        formData: {
          attendant_id: formData.attendant_id,
          service_id: formData.service_id,
          service_name: formData.service_name
        }
      });
      
      // Importar o availabilityService
      const { availabilityService } = await import('@/services/availabilityService');
      
      debugLogger.info('Frontend', 'calling_availability_service', {
        attendantId: formData.attendant_id,
        dateString,
        serviceId: formData.service_id
      });
      
      // Usar o serviço de disponibilidade para obter horários reais
      const availability = await availabilityService.checkAvailability(
        formData.attendant_id,
        dateString,
        formData.service_id
      );

      debugLogger.info('Frontend', 'availability_service_response', {
        success: availability.success,
        availableSlotsCount: availability.available_slots?.length || 0,
        error: availability.error,
        dayOfWeek: availability.day_of_week,
        availableSlots: availability.available_slots?.map(slot => ({
          start_time: slot.start_time,
          end_time: slot.end_time,
          duration: slot.duration_minutes
        })) || []
      });

      if (!availability.success) {
        debugLogger.warn('Frontend', 'availability_check_failed', {
          error: availability.error,
          attendantId: formData.attendant_id,
          dateString,
          serviceId: formData.service_id
        });
        
        setAvailableTimeSlots([]);
        endTimer('Frontend', 'checkAvailableTimeSlots_failed', timerName, { error: availability.error });
        return;
      }

      debugLogger.debug('Frontend', 'filtering_expired_slots', {
        totalSlots: availability.available_slots.length,
        currentTime: new Date().toISOString()
      });

      // Filtrar horários que não expiraram
      const validSlots = availability.available_slots
        .filter(slot => {
          const isExpired = isTimeSlotExpired(date, slot.start_time);
          if (isExpired) {
            debugLogger.debug('Frontend', 'slot_expired', {
              slotStartTime: slot.start_time,
              date: date.toISOString()
            });
          }
          return !isExpired;
        })
        .map(slot => slot.start_time)
        .sort(); // Ordenar horários

      debugLogger.info('Frontend', 'time_slots_processed', {
        totalSlotsReceived: availability.available_slots.length,
        validSlotsAfterFilter: validSlots.length,
        validSlots,
        expiredSlotsCount: availability.available_slots.length - validSlots.length
      });

      setAvailableTimeSlots(validSlots);
      
      endTimer('Frontend', 'checkAvailableTimeSlots_success', timerName, {
        validSlotsCount: validSlots.length,
        validSlots
      });
      
    } catch (error) {
      debugLogger.error('Frontend', 'checkAvailableTimeSlots_error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        attendantId: formData.attendant_id,
        date: date.toISOString(),
        serviceId: formData.service_id
      });
      
      setAvailableTimeSlots([]);
      endTimer('Frontend', 'checkAvailableTimeSlots_error', timerName, { error: String(error) });
    }
  };

  // Função para selecionar data
  const handleDateSelection = async (date: Date) => {
    debugLogger.info('Frontend', 'date_selection_start', {
      previousAvailableSlots: availableTimeSlots,
      previousSelectedTime: selectedTime,
      selectedDate: date.toISOString(),
      dateString: date.toISOString().split('T')[0],
      attendantId: formData.attendant_id,
      serviceId: formData.service_id
    });

    setSelectedDate(date);
    setSelectedTime('');
    
    debugLogger.debug('Frontend', 'calling_checkAvailableTimeSlots', {
      date: date.toISOString()
    });
    
    await checkAvailableTimeSlots(date);
    
    const dateString = date.toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      appointment_date: dateString
    }));

    debugLogger.info('Frontend', 'date_selection_completed', {
      dateString,
      formDataUpdated: true
    });
  };

  // Função para selecionar horário
  const handleTimeSelection = (time: string) => {
    debugLogger.info('Frontend', 'time_selection_start', {
      selectedTime: time,
      currentAvailableSlots: availableTimeSlots,
      selectedDate: selectedDate?.toISOString(),
      isTimeStillAvailable: availableTimeSlots.includes(time)
    });

    setSelectedTime(time);
    
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      const datetime = `${dateString} ${time}:00`;
      
      debugLogger.debug('Frontend', 'updating_form_data_with_datetime', {
        datetime,
        dateString,
        time
      });
      
      setFormData(prev => ({
        ...prev,
        appointment_datetime: datetime
      }));
    }
  };

  // Função para navegar no calendário
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  // Função para gerar dias do calendário
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isPast = date < today;
      const isSelected = selectedDate && 
        date.toDateString() === selectedDate.toDateString();
      
      days.push({
        date,
        isCurrentMonth,
        isPast,
        isSelected,
        day: date.getDate()
      });
    }
    
    return days;
  };

  // Função para confirmar data e horário
  const confirmDateTime = () => {
    if (selectedDate && selectedTime) {
      setCurrentStep('confirmation');
    }
  };

  // Função para criar o agendamento
  const createAppointment = async () => {
    if (!patient || !selectedDate || !selectedTime) {
      toast.error('Dados incompletos para criar o agendamento');
      return;
    }

    setIsLoading(true);
    
    try {
      // Formatar data e horário
      const appointmentDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const appointmentDateTime = `${appointmentDate} ${selectedTime}:00`; // YYYY-MM-DD HH:MM:SS
      
      // Dados do agendamento
      const appointmentData = {
        patient_name: patient.name,
        patient_phone: patient.phone,
        attendant_id: formData.attendant_id,
        attendant_name: formData.attendant_name,
        service_id: formData.service_id,
        service_name: formData.service_name,
        service_price: formData.service_price,
        service_duration: formData.service_duration,
        appointment_date: appointmentDate,
        appointment_datetime: appointmentDateTime,
        appointment_time: selectedTime, // Hora escolhida pelo usuário
        notes: formData.notes || null,
        status: 'scheduled'
      };

      // Usar o appointmentService que já inclui validação de conflitos
      const appointment = await appointmentService.createAppointment(appointmentData);

      if (!appointment) {
        toast.error('Erro ao criar agendamento. Tente novamente.');
        return;
      }

      // Sucesso
      toast.success('Agendamento criado com sucesso!');
      
      // Resetar formulário após sucesso
      setTimeout(() => {
        resetForm();
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      
      // Tratamento específico para conflitos de horário
      if (error instanceof Error && error.message.includes('Horário não disponível')) {
        toast.error(error.message);
      } else {
        toast.error('Erro inesperado. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateTimeSelection = (date: string, time: string) => {
    const datetime = `${date} ${time}`;
    setFormData(prev => ({
      ...prev,
      appointment_date: date,
      appointment_datetime: datetime
    }));
    setCurrentStep('confirmation');
  };

  const handleConfirmAppointment = async () => {
    try {
      setIsLoading(true);
      
      // Usar o appointmentService que inclui validação de conflitos
      const result = await appointmentService.createAppointment({
        patient_name: formData.client_name,
        patient_phone: cleanPhoneNumber(formData.client_phone),
        attendant_id: formData.attendant_id,
        attendant_name: formData.attendant_name,
        service_id: formData.service_id,
        service_name: formData.service_name,
        service_price: formData.service_price,
        service_duration: formData.service_duration,
        appointment_date: formData.appointment_date,
        appointment_datetime: formData.appointment_datetime,
        notes: formData.notes,
        status: 'scheduled'
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar agendamento');
      }

      toast.success('Agendamento realizado com sucesso!');
      
      setTimeout(() => {
        if (publicLinks.exit_url) {
          window.location.href = publicLinks.exit_url;
        }
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      
      // Tratamento específico para conflitos de horário
      if (error instanceof Error && error.message.includes('Horário não disponível')) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao realizar agendamento. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSusNumber('');
    setPatient(null);
    setFormData({
      client_name: '',
      client_phone: '',
      attendant_id: '',
      attendant_name: '',
      service_id: '',
      service_name: '',
      service_price: 0,
      service_duration: 0,
      appointment_date: '',
      appointment_datetime: '',
      notes: ''
    });
    setCurrentStep('patient_validation');
  };

  const goBack = () => {
    switch (currentStep) {
      case 'service_selection':
        setCurrentStep('patient_validation');
        break;
      case 'attendant_selection':
        setCurrentStep('service_selection');
        break;
      case 'datetime_selection':
        setCurrentStep('attendant_selection');
        break;
      case 'confirmation':
        setCurrentStep('datetime_selection');
        break;
    }
  };

  const loadAttendantsForService = async (serviceId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('attendants')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      // Filtrar atendentes que oferecem este serviço
      const filteredAttendants = (data || []).filter(attendant => 
        attendant.services && attendant.services.includes(serviceId)
      );
      
      setAvailableAttendants(filteredAttendants);
    } catch (error) {
      console.error('Erro ao carregar atendentes:', error);
      setAvailableAttendants([]);
      toast.error('Erro ao carregar profissionais disponíveis.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden">
      {/* Scan line effect */}
      <div className="scan-line"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 sm:w-80 h-60 sm:h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-60 sm:w-80 h-60 sm:h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 sm:w-80 h-60 sm:h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
        
        {/* Additional floating elements */}
        <div className="absolute top-20 left-20 w-4 h-4 bg-purple-400 rounded-full opacity-30 animate-float"></div>
        <div className="absolute top-40 right-32 w-3 h-3 bg-cyan-400 rounded-full opacity-40 animate-float animation-delay-1000"></div>
        <div className="absolute bottom-32 left-1/3 w-2 h-2 bg-pink-400 rounded-full opacity-50 animate-float animation-delay-3000"></div>
      </div>
      
      <div className="w-full max-w-2xl relative z-10 animate-fade-in-up">
        <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-purple-500/10 card-glow glass-effect">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="relative animate-float">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur-lg opacity-75 animate-pulse-glow"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-cyan-500 p-3 rounded-full gradient-button">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2 animate-gradient">
              AGENDAMENTO ONLINE
            </CardTitle>
            <p className="text-slate-300 text-xs sm:text-sm lg:text-base leading-relaxed px-2">
              AGENDE SUA CONSULTA DE FORMA RÁPIDA E SEGURA
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium tracking-wide">SEGURO E CONFIDENCIAL</span>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 sm:p-8">
            {/* Etapa 1: Validação do Paciente */}
            {currentStep === 'patient_validation' && (
              <div className="space-y-6">
                <Alert className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500/30 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-full">
                      <AlertCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <AlertDescription className="text-blue-100 text-sm sm:text-base leading-relaxed">
                      PARA AGENDAR SUA CONSULTA, INFORME SEU CPF OU NÚMERO DO SUS.
                    </AlertDescription>
                  </div>
                </Alert>
                
                <div className="space-y-3">
                  <Label htmlFor="sus" className="text-slate-200 font-semibold text-sm sm:text-base tracking-wide">
                    CPF OU SUS <span className="text-pink-400">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="sus"
                      value={susNumber}
                      onChange={(e) => setSusNumber(formatCpfOrSus(e.target.value))}
                      placeholder="CPF (XXX.XXX.XXX-XX) OU SUS (XXX XXXX XXXX XXXX)"
                      required
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20 h-12 sm:h-14 text-base sm:text-lg backdrop-blur-sm transition-all duration-300 hover:bg-slate-700/70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-md pointer-events-none opacity-0 transition-opacity duration-300 hover:opacity-100"></div>
                  </div>
                </div>
                
                <Button 
                  onClick={validatePatient} 
                  disabled={isLoading}
                  className="w-full h-12 sm:h-14 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold text-sm sm:text-base tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/25 futuristic-hover focus-glow smooth-transition"
                  aria-label="Verificar paciente"
                >
                  {isLoading && <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-r-transparent" />}
                  <Search className="mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                  VERIFICAR PACIENTE
                  <Sparkles className="ml-3 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            )}

            {/* Etapa 2: Seleção de Serviços */}
            {currentStep === 'service_selection' && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative animate-float">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-75 animate-pulse-glow"></div>
                      <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-full gradient-button">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    {getTimeGreeting()}, {patient?.name.split(' ')[0]}!
                  </h3>
                  
                  <p className="text-slate-300 text-sm sm:text-base mb-2">
                    PROFISSIONAL SELECIONADO: <span className="text-blue-400 font-semibold">{formData.attendant_name}</span>
                  </p>
                  
                  <p className="text-slate-300 text-sm sm:text-base mb-6">
                    ESCOLHA O SERVIÇO DESEJADO
                  </p>
                </div>

                <Alert className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500/30 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-2 rounded-full">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <AlertDescription className="text-green-100 text-sm sm:text-base leading-relaxed">
                      SELECIONE O TIPO DE CONSULTA OU PROCEDIMENTO.
                    </AlertDescription>
                  </div>
                </Alert>

                <div className="space-y-4">
                  {services.length > 0 ? (
                    services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => handleServiceSelection(service.id)}
                        className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:bg-slate-600/50 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h4 className="text-white font-semibold text-lg mb-1">{service.name}</h4>
                            <div className="flex items-center gap-4 text-slate-300 text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{service.duration} min</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-green-400 font-semibold">
                                  R$ {service.price.toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-purple-400">
                            <Sparkles className="h-6 w-6" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400">Nenhum serviço disponível no momento.</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={goBack}
                    variant="outline"
                    className="flex-1 h-12 sm:h-14 bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50 hover:text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 focus-glow smooth-transition"
                  >
                    VOLTAR
                  </Button>
                  
                  <Button 
                    onClick={resetForm}
                    variant="outline"
                    className="flex-1 h-12 sm:h-14 bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50 hover:text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 focus-glow smooth-transition"
                  >
                    RECOMEÇAR
                  </Button>
                </div>
              </div>
            )}

            {/* Etapa 3: Seleção de Profissional */}
            {currentStep === 'attendant_selection' && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative animate-float">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-lg opacity-75 animate-pulse-glow"></div>
                      <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-full gradient-button">
                        <User className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    ESCOLHA O PROFISSIONAL
                  </h3>
                  
                  <p className="text-slate-300 text-xs sm:text-sm mb-6">
                    SELECIONE O PROFISSIONAL DE SUA PREFERÊNCIA
                  </p>
                </div>

                <div className="space-y-4">
                  {availableAttendants.length > 0 ? (
                    availableAttendants.map((attendant) => (
                      <div
                        key={attendant.id}
                        onClick={() => handleAttendantSelection(attendant.id)}
                        className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:bg-slate-600/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20 transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 p-2 rounded-full">
                              <User className="h-6 w-6 text-blue-400" />
                            </div>
                            <div>
                              <h4 className="text-white font-semibold text-lg">{attendant.name}</h4>
                              <p className="text-slate-300 text-sm">Profissional Especializado</p>
                            </div>
                          </div>
                          <div className="text-blue-400">
                            <Sparkles className="h-6 w-6" />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-400">Nenhum profissional disponível no momento.</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={goBack}
                    variant="outline"
                    className="flex-1 h-12 sm:h-14 bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50 hover:text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 focus-glow smooth-transition"
                  >
                    VOLTAR
                  </Button>
                  
                  <Button 
                    onClick={resetForm}
                    variant="outline"
                    className="flex-1 h-12 sm:h-14 bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50 hover:text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 focus-glow smooth-transition"
                  >
                    RECOMEÇAR
                  </Button>
                </div>
              </div>
            )}

            {/* Etapa 4: Seleção de Data e Horário */}
            {currentStep === 'datetime_selection' && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative animate-float">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-75 animate-pulse-glow"></div>
                      <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full gradient-button">
                        <Calendar className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    ESCOLHA DATA E HORÁRIO
                  </h3>
                  
                  <div className="text-slate-300 text-sm space-y-1">
                    <p>SERVIÇO: <span className="text-purple-400 font-semibold">{formData.service_name}</span></p>
                    <p>PROFISSIONAL: <span className="text-blue-400 font-semibold">{formData.attendant_name}</span></p>
                  </div>
                </div>

                {/* Calendário */}
                <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4">
                  {/* Header do Calendário */}
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      onClick={() => navigateMonth('prev')}
                      variant="ghost"
                      size="sm"
                      className="text-slate-300 hover:text-white hover:bg-slate-600/50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    
                    <h4 className="text-white font-semibold text-lg">
                      {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                    </h4>
                    
                    <Button
                      onClick={() => navigateMonth('next')}
                      variant="ghost"
                      size="sm"
                      className="text-slate-300 hover:text-white hover:bg-slate-600/50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Dias da Semana */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
                      <div key={day} className="text-center text-slate-400 text-xs font-semibold py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Dias do Calendário */}
                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays().map((dayInfo, index) => (
                      <button
                        key={index}
                        onClick={() => !dayInfo.isPast && dayInfo.isCurrentMonth && handleDateSelection(dayInfo.date)}
                        disabled={dayInfo.isPast || !dayInfo.isCurrentMonth}
                        className={`
                          h-10 w-full text-sm rounded transition-all duration-200
                          ${dayInfo.isCurrentMonth 
                            ? dayInfo.isPast 
                              ? 'text-slate-500 cursor-not-allowed'
                              : dayInfo.isSelected
                                ? 'bg-purple-500 text-white font-semibold shadow-lg'
                                : 'text-slate-200 hover:bg-slate-600/50 hover:text-white'
                            : 'text-slate-600 cursor-not-allowed'
                          }
                        `}
                      >
                        {dayInfo.day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horários Disponíveis */}
                {selectedDate && (
                  <div className="space-y-4">
                    <h4 className="text-white font-semibold text-center">
                      HORÁRIOS DISPONÍVEIS - {selectedDate.toLocaleDateString('pt-BR')}
                    </h4>
                    
                    {availableTimeSlots.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {availableTimeSlots.map((time, index) => (
                          <button
                            key={`${time}-${index}`}
                            onClick={() => handleTimeSelection(time)}
                            className={`
                              p-3 rounded-lg text-sm font-semibold transition-all duration-200
                              ${selectedTime === time
                                ? 'bg-purple-500 text-white shadow-lg'
                                : 'bg-slate-600/50 text-slate-200 hover:bg-purple-500/50 hover:text-white'
                              }
                            `}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-400">Nenhum horário disponível para esta data.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Botões de Ação */}
                <div className="flex gap-4">
                  <Button 
                    onClick={goBack}
                    variant="outline"
                    className="flex-1 h-12 sm:h-14 bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50 hover:text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 focus-glow smooth-transition"
                  >
                    VOLTAR
                  </Button>
                  
                  <Button 
                    onClick={confirmDateTime}
                    disabled={!selectedDate || !selectedTime}
                    className="flex-1 h-12 sm:h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 focus-glow smooth-transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    CONFIRMAR
                  </Button>
                </div>
              </div>
            )}

            {/* Etapa 5: Confirmação do Agendamento */}
            {currentStep === 'confirmation' && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative animate-float">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-75 animate-pulse-glow"></div>
                      <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-full gradient-button">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    CONFIRMAÇÃO DO AGENDAMENTO
                  </h3>
                  
                  <p className="text-slate-300 text-sm sm:text-base mb-6">
                    REVISE OS DADOS E CONFIRME SEU AGENDAMENTO
                  </p>
                </div>

                {/* Resumo do Agendamento */}
                <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-6 space-y-4">
                  <h4 className="text-white font-semibold text-lg mb-4 text-center">
                    RESUMO DO AGENDAMENTO
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Dados do Paciente */}
                    <div className="flex items-center gap-3 p-3 bg-slate-600/30 rounded-lg">
                      <div className="bg-blue-500/20 p-2 rounded-full">
                        <User className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-300 text-sm">PACIENTE</p>
                        <p className="text-white font-semibold">{patient?.name}</p>
                        <p className="text-slate-400 text-sm">{patient?.phone}</p>
                      </div>
                    </div>

                    {/* Serviço */}
                    <div className="flex items-center gap-3 p-3 bg-slate-600/30 rounded-lg">
                      <div className="bg-purple-500/20 p-2 rounded-full">
                        <Sparkles className="h-5 w-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-300 text-sm">SERVIÇO</p>
                        <p className="text-white font-semibold">{formData.service_name}</p>
                        <div className="flex items-center gap-4 text-slate-400 text-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formData.service_duration} min
                          </span>
                          <span className="text-green-400 font-semibold">
                            R$ {formData.service_price.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Profissional */}
                    <div className="flex items-center gap-3 p-3 bg-slate-600/30 rounded-lg">
                      <div className="bg-blue-500/20 p-2 rounded-full">
                        <User className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-300 text-sm">PROFISSIONAL</p>
                        <p className="text-white font-semibold">{formData.attendant_name}</p>
                      </div>
                    </div>

                    {/* Data e Horário */}
                    <div className="flex items-center gap-3 p-3 bg-slate-600/30 rounded-lg">
                      <div className="bg-purple-500/20 p-2 rounded-full">
                        <Calendar className="h-5 w-5 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-300 text-sm">DATA E HORÁRIO</p>
                        <p className="text-white font-semibold">
                          {selectedDate?.toLocaleDateString('pt-BR', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        <p className="text-purple-400 font-semibold text-lg">{selectedTime}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campo de Observações */}
                <div className="space-y-2">
                  <label className="text-slate-300 text-sm font-semibold">
                    OBSERVAÇÕES (OPCIONAL)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Digite aqui alguma observação ou informação adicional..."
                    className="w-full h-24 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 resize-none"
                  />
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-4">
                  <Button 
                    onClick={goBack}
                    variant="outline"
                    className="flex-1 h-12 sm:h-14 bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50 hover:text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 focus-glow smooth-transition"
                  >
                    VOLTAR
                  </Button>
                  
                  <Button 
                    onClick={createAppointment}
                    disabled={isLoading}
                    className="flex-1 h-12 sm:h-14 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 focus-glow smooth-transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'AGENDANDO...' : 'CONFIRMAR AGENDAMENTO'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicAppointmentBooking;