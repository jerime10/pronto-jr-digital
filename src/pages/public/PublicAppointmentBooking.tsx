import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Search, CheckCircle, AlertCircle, Sparkles, Shield, Clock, User, Phone, ChevronLeft, ChevronRight, ArrowRight, FileText, Save, Copy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatPhoneNumber, isValidPhoneNumber, cleanPhoneNumber } from '@/utils/phoneUtils';
import { formatCpfOrSus, isValidCpfOrSus, cleanCpfOrSus, validateSevenDigitInput } from '@/utils/cpfSusUtils';
import { formatDateForDB } from '@/utils/dateUtils';
import { isObstetricService, calculateGestationalAge, calculateDPP, formatDateInput, isValidDateFormat, convertDateToDBFormat } from '@/utils/obstetricUtils';
import { appointmentService } from '@/services/scheduleService';
import { serviceAssignmentService } from '@/services/serviceAssignmentService';
import { debugLogger, startTimer, endTimer } from '@/utils/debugLogger';
import { useDocumentAssets } from '@/hooks/useDocumentAssets';
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
  photo_url?: string;
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

type BookingStep = 'cpf_input' | 'welcome_update' | 'attendant_selection' | 'service_selection' | 'obstetric_data' | 'datetime_selection' | 'confirmation';

export const PublicAppointmentBooking: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('cpf_input');
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

  // Novos estados para as etapas melhoradas
  const [cpfSusInput, setCpfSusInput] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [validationAttempts, setValidationAttempts] = useState(0);

  // Estado para dados obstétricos
  const [obstetricData, setObstetricData] = useState({
    dum: '',
    gestationalAge: '',
    dpp: '',
    isValid: false
  });

  // Hook para acessar os assets de documentos
  const { attendantLogoData } = useDocumentAssets();

  useEffect(() => {
    loadInitialData();
  }, []);

  // Atualizar saudação automaticamente a cada minuto
  useEffect(() => {
    if (patient && currentStep === 'welcome_update') {
      const updateGreeting = () => {
        const firstName = patient.name.split(' ')[0];
        const timeGreeting = getTimeGreeting();
        setGreeting(`${timeGreeting}, ${firstName}!`);
      };

      // Atualizar imediatamente
      updateGreeting();

      // Atualizar a cada minuto
      const interval = setInterval(updateGreeting, 60000);

      return () => clearInterval(interval);
    }
  }, [patient, currentStep]);

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

  // Monitor para mudanças no serviço selecionado - limpar dados obstétricos se não for obstétrico
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect service_name mudou:', formData.service_name);
    if (formData.service_name && !isObstetricService(formData.service_name)) {
      console.log('🔍 [DEBUG] Serviço não é obstétrico, limpando dados');
      setObstetricData({ 
        dum: '',
        gestationalAge: '',
        dpp: '',
        isValid: false
      });
    } else if (formData.service_name) {
      console.log('🔍 [DEBUG] Serviço É obstétrico!');
    }
  }, [formData.service_name]);

  // Monitor para mudanças na DUM - calcular IG e DPP automaticamente
  useEffect(() => {
    console.log('🔍 [DEBUG] useEffect DUM mudou:', obstetricData.dum);
    
    if (obstetricData.dum && obstetricData.dum.length === 10) {
      if (isValidDateFormat(obstetricData.dum)) {
        try {
          // Calcular idade gestacional
          const gestAge = calculateGestationalAge(obstetricData.dum);
          // Calcular DPP
          const calculatedDpp = calculateDPP(obstetricData.dum);
          
          console.log('🔍 [DEBUG] Informações calculadas:', { gestAge, calculatedDpp });
          
          if (gestAge && calculatedDpp) {
            // Atualizar estado com os valores calculados
            setObstetricData(prev => ({
              ...prev,
              gestationalAge: gestAge.formatted,
              dpp: calculatedDpp,
              isValid: true
            }));
            
            console.log('🔍 [DEBUG] Estado obstétrico atualizado com cálculos');
          } else {
            setObstetricData(prev => ({
              ...prev,
              gestationalAge: '',
              dpp: '',
              isValid: false
            }));
          }
        } catch (error) {
          console.error('🔍 [DEBUG] Erro ao calcular informações obstétricas:', error);
          setObstetricData(prev => ({
            ...prev,
            gestationalAge: '',
            dpp: '',
            isValid: false
          }));
        }
      } else {
        setObstetricData(prev => ({
          ...prev,
          gestationalAge: '',
          dpp: '',
          isValid: false
        }));
      }
    } else {
      // Limpar campos calculados se DUM estiver vazia
      setObstetricData(prev => ({
        ...prev,
        gestationalAge: '',
        dpp: '',
        isValid: false
      }));
    }
  }, [obstetricData.dum]);

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

  const loadAttendantServices = async (attendantId: string, retryCount = 0) => {
    const maxRetries = 2;
    const timerName = `loadAttendantServices_${Date.now()}`;
    startTimer(timerName);

    debugLogger.info('Frontend', 'loadAttendantServices_start', {
      attendantId,
      retryCount,
      timestamp: new Date().toISOString()
    });

    try {
      // Validação de entrada
      if (!attendantId || typeof attendantId !== 'string') {
        throw new Error('ID do atendente é obrigatório e deve ser uma string válida');
      }

      debugLogger.debug('Frontend', 'using_service_layer', {
        attendantId,
        retryCount,
        service: 'serviceAssignmentService.getAssignmentsByAttendant'
      });

      // Usar a camada de serviço para buscar as atribuições
      const serviceAssignments = await serviceAssignmentService.getAssignmentsByAttendant(attendantId);

      debugLogger.info('Frontend', 'service_assignments_response', {
        attendantId,
        retryCount,
        success: true,
        dataCount: serviceAssignments?.length || 0,
        rawData: serviceAssignments
      });
      
      const servicesData = serviceAssignments?.map(item => ({
        id: item.service_id,
        name: item.service_name,
        price: item.service_price,
        duration: item.service_duration
      })) || [];

      debugLogger.info('Frontend', 'services_data_processed', {
        attendantId,
        retryCount,
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
        retryCount,
        servicesCount: servicesData.length
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      debugLogger.error('Frontend', 'loadAttendantServices_error', {
        attendantId,
        retryCount,
        error: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString()
      });

      // Implementar retry para erros de rede/temporários
      if (retryCount < maxRetries && !errorMessage.includes('ID do atendente')) {
        debugLogger.info('Frontend', 'loadAttendantServices_retry', {
          attendantId,
          retryCount: retryCount + 1,
          maxRetries,
          error: errorMessage
        });
        
        // Aguardar um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        
        return loadAttendantServices(attendantId, retryCount + 1);
      }

      // Fallback: definir array vazio para evitar quebra da UI
      setServices([]);
      
      // Mensagem de erro mais específica
      const userMessage = errorMessage.includes('ID do atendente') 
        ? 'Erro: Atendente não selecionado corretamente.'
        : retryCount >= maxRetries 
          ? 'Erro ao carregar serviços do profissional após várias tentativas. Verifique sua conexão.'
          : 'Erro ao carregar serviços do profissional. Tente novamente.';
      
      toast.error(userMessage);
      
      endTimer('Frontend', 'loadAttendantServices_error', timerName, {
        attendantId,
        retryCount,
        error: errorMessage,
        finalAttempt: true
      });
    }
  };

  const loadAttendants = async () => {
    try {
      const { data, error } = await supabase
        .from('attendants')
        .select('id, name, services, photo_url')
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

  const copyPixKey = async () => {
    const pixKey = 'ca1df7fb-4db4-4db9-b2e9-304849e2f257';
    try {
      await navigator.clipboard.writeText(pixKey);
      toast.success('Chave PIX copiada com sucesso!');
    } catch (error) {
      console.error('Erro ao copiar chave PIX:', error);
      toast.error('Erro ao copiar chave PIX. Tente novamente.');
    }
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

  // Novas funções para as etapas melhoradas

  const validateCpfSus = async () => {
    if (!cpfSusInput.trim()) {
      toast.error('Por favor, insira o CPF ou SUS.');
      return;
    }

    // Verificar se o usuário digitou 7 números (validação especial para CPF)
    const sevenDigitValidation = validateSevenDigitInput(cpfSusInput.trim());
    
    if (sevenDigitValidation.isSevenDigits) {
      if (sevenDigitValidation.shouldRedirectToRegistration) {
        // Incrementar tentativas mesmo para 7 dígitos especiais
        const newAttempts = validationAttempts + 1;
        setValidationAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          toast.error('Muitas tentativas incorretas. Redirecionando para cadastro de novo paciente.');
          setTimeout(() => {
            window.location.href = 'http://localhost:8080/cadastro-paciente';
          }, 2000);
          return;
        }
        
        const remainingAttempts = 3 - newAttempts;
        toast.error(`${sevenDigitValidation.message} Tentativas restantes: ${remainingAttempts}`);
        return;
      } else {
        toast.info(sevenDigitValidation.message);
        return;
      }
    }

    const cleanNumber = cleanCpfOrSus(cpfSusInput.trim());
    
    // Verificar se tem o número mínimo de dígitos para CPF ou SUS
    if (cleanNumber.length < 11) {
      const newAttempts = validationAttempts + 1;
      setValidationAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        toast.error('Muitas tentativas incorretas. Redirecionando para cadastro de novo paciente.');
        setTimeout(() => {
          window.location.href = 'http://localhost:8080/cadastro-paciente';
        }, 2000);
        return;
      }
      
      const remainingAttempts = 3 - newAttempts;
      toast.error(`CPF deve ter 11 dígitos ou SUS deve ter 15 dígitos. Tentativas restantes: ${remainingAttempts}`);
      return;
    }

    // Se tem 11 dígitos, tratar como CPF
    if (cleanNumber.length === 11) {
      if (!isValidCpfOrSus(cpfSusInput.trim())) {
        const newAttempts = validationAttempts + 1;
        setValidationAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          toast.error('Muitas tentativas incorretas. Redirecionando para cadastro de novo paciente.');
          setTimeout(() => {
            window.location.href = 'http://localhost:8080/cadastro-paciente';
          }, 2000);
          return;
        }
        
        const remainingAttempts = 3 - newAttempts;
        toast.error(`CPF inválido. Verifique os dígitos digitados. Tentativas restantes: ${remainingAttempts}`);
        return;
      }
    }
    
    // Se tem 15 dígitos, tratar como SUS
    if (cleanNumber.length === 15) {
      if (!isValidCpfOrSus(cpfSusInput.trim())) {
        const newAttempts = validationAttempts + 1;
        setValidationAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          toast.error('Muitas tentativas incorretas. Redirecionando para cadastro de novo paciente.');
          setTimeout(() => {
            window.location.href = 'http://localhost:8080/cadastro-paciente';
          }, 2000);
          return;
        }
        
        const remainingAttempts = 3 - newAttempts;
        toast.error(`SUS inválido. Verifique os dígitos digitados. Tentativas restantes: ${remainingAttempts}`);
        return;
      }
    }
    
    // Se não tem 11 nem 15 dígitos, mas tem mais de 11
    if (cleanNumber.length > 11 && cleanNumber.length < 15) {
      const newAttempts = validationAttempts + 1;
      setValidationAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        toast.error('Muitas tentativas incorretas. Redirecionando para cadastro de novo paciente.');
        setTimeout(() => {
          window.location.href = 'http://localhost:8080/cadastro-paciente';
        }, 2000);
        return;
      }
      
      const remainingAttempts = 3 - newAttempts;
      toast.error(`SUS deve ter 15 dígitos. Tentativas restantes: ${remainingAttempts}`);
      return;
    }
    
    if (cleanNumber.length > 15) {
      const newAttempts = validationAttempts + 1;
      setValidationAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        toast.error('Muitas tentativas incorretas. Redirecionando para cadastro de novo paciente.');
        setTimeout(() => {
          window.location.href = 'http://localhost:8080/cadastro-paciente';
        }, 2000);
        return;
      }
      
      const remainingAttempts = 3 - newAttempts;
      toast.error(`Número muito longo. CPF deve ter 11 dígitos ou SUS deve ter 15 dígitos. Tentativas restantes: ${remainingAttempts}`);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('patients')
        .select('id, name, phone, sus')
        .eq('sus', cleanNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Paciente encontrado - resetar tentativas e prosseguir
        setValidationAttempts(0);
        setPatient(data);
        setTempPhone(data.phone || '');
        setFormData(prev => ({
          ...prev,
          client_name: data.name,
          client_phone: data.phone || ''
        }));
        
        const firstName = data.name.split(' ')[0];
        const timeGreeting = getTimeGreeting();
        
        setCurrentStep('welcome_update');
        toast.success(`${timeGreeting}, ${firstName}! Vamos agendar sua consulta.`);
      } else {
        // Paciente não encontrado - incrementar tentativas
        const newAttempts = validationAttempts + 1;
        setValidationAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          toast.error('Muitas tentativas incorretas. Redirecionando para cadastro de novo paciente.');
          setTimeout(() => {
            window.location.href = 'http://localhost:8080/cadastro-paciente';
          }, 2000);
          return;
        }
        
        const documentType = cleanNumber.length === 11 ? 'CPF' : 'SUS';
        const remainingAttempts = 3 - newAttempts;
        toast.error(`${documentType} não encontrado. Verifique os dados ou tente novamente. Tentativas restantes: ${remainingAttempts}`);
      }
      
    } catch (error) {
      console.error('Erro ao validar paciente:', error);
      toast.error('Erro ao validar documento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePatientPhone = async () => {
    if (!patient || !tempPhone.trim()) {
      toast.error('Telefone é obrigatório.');
      return;
    }

    try {
      setIsUpdatingPhone(true);
      
      const { error } = await supabase
        .from('patients')
        .update({ phone: tempPhone.trim() })
        .eq('id', patient.id);

      if (error) throw error;

      setPatient(prev => prev ? { ...prev, phone: tempPhone.trim() } : null);
      setFormData(prev => ({ ...prev, client_phone: tempPhone.trim() }));
      
      toast.success('Telefone atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar telefone:', error);
      toast.error('Erro ao atualizar telefone. Tente novamente.');
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const proceedToAttendantSelection = () => {
    setAvailableAttendants(attendants);
    setCurrentStep('attendant_selection');
  };

  const handleServiceSelection = (serviceId: string) => {
    const selectedService = services.find(s => s.id === serviceId);
    if (selectedService) {
      console.log('🔍 [DEBUG] Serviço selecionado:', selectedService.name);
      setFormData(prev => ({
        ...prev,
        service_id: serviceId,
        service_name: selectedService.name,
        service_price: selectedService.price,
        service_duration: selectedService.duration
      }));
      
      // Se for serviço obstétrico, vai para dados obstétricos, senão vai direto para data/hora
      if (isObstetricService(selectedService.name)) {
        setCurrentStep('obstetric_data');
      } else {
        setCurrentStep('datetime_selection');
      }
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
      // Formatar data no padrão ISO (YYYY-MM-DD) para o banco
      const appointmentDate = selectedDate.toISOString().split('T')[0];
      const appointmentDateTime = `${appointmentDate} ${selectedTime}:00`;
      
      // Atualizar formData com os valores corretos
      setFormData(prev => ({
        ...prev,
        appointment_date: appointmentDate,
        appointment_datetime: appointmentDateTime
      }));
      
      setCurrentStep('confirmation');
    }
  };

  // Função para criar o agendamento
  const createAppointment = async () => {
    if (!patient || !selectedDate || !selectedTime) {
      toast.error('Dados incompletos para criar o agendamento');
      return;
    }

    // Validar DUM para serviços obstétricos
    if (isObstetricService(formData.service_name) && !obstetricData.dum) {
      toast.error('Para serviços obstétricos, é obrigatório informar a Data da Última Menstruação (DUM)');
      return;
    }

    setIsLoading(true);
    
    try {
      // Formatar data e horário
      const appointmentDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const appointmentDateTime = `${appointmentDate} ${selectedTime}:00`; // YYYY-MM-DD HH:MM:SS
      
      // Dados do agendamento - mapeando corretamente para a interface AppointmentFormData do database.ts
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
        appointment_time: selectedTime, // Hora escolhida pelo usuário
        appointment_datetime: appointmentDateTime,
        notes: formData.notes || null,
        status: 'scheduled' as const,
        // Incluir dados obstétricos apenas para serviços obstétricos
        ...(isObstetricService(formData.service_name) && obstetricData.dum && {
          dum: convertDateToDBFormat(obstetricData.dum),
          gestational_age: obstetricData.gestationalAge,
          estimated_due_date: obstetricData.dpp
        })
      };

      // Usar o appointmentService que já inclui validação de conflitos
      const appointment = await appointmentService.createAppointment(appointmentData);

      if (!appointment) {
        toast.error('Erro ao criar agendamento. Tente novamente.');
        return;
      }

      // Sucesso
      toast.success('Agendamento criado com sucesso!');
      
      // Resetar formulário e redirecionar para a primeira etapa após sucesso
      setTimeout(() => {
        resetForm();
        setCurrentStep('cpf_input');
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
      case 'welcome_update':
        setCurrentStep('cpf_input');
        break;
      case 'attendant_selection':
        setCurrentStep('welcome_update');
        break;
      case 'service_selection':
        setCurrentStep('attendant_selection');
        break;
      case 'obstetric_data':
        setCurrentStep('service_selection');
        break;
      case 'datetime_selection':
        // Se for serviço obstétrico, volta para dados obstétricos, senão volta para seleção de serviço
        if (isObstetricService(formData.service_name)) {
          setCurrentStep('obstetric_data');
        } else {
          setCurrentStep('service_selection');
        }
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
        .select('id, name, services, photo_url')
        .eq('is_active', true)
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
          <CardHeader className="text-center pb-4 pt-4">
            <div className="flex justify-center mb-2">
              <div className="relative animate-float">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur-lg opacity-75 animate-pulse-glow"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-cyan-500 p-3 rounded-full gradient-button">
                  {attendantLogoData ? (
                    <img 
                      src={attendantLogoData} 
                      alt="Logo do Atendente" 
                      className="h-8 w-8 object-contain rounded-full"
                    />
                  ) : (
                    <Calendar className="h-8 w-8 text-white" />
                  )}
                </div>
              </div>
            </div>
            {/* Logo AGENDA ABERTA */}
            <div className="flex justify-center mb -40 mt -25 px -15">
              <img 
                src="/LOGO_AGENDA_ABERTA-removebg-preview.png" 
                alt="Agenda Aberta" 
                className="h-56 sm:h-64 md:h-72 lg:h-80 xl:h-88 2xl:h-96 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl object-contain animate-fade-in"
              />
            </div>
          </CardHeader>
          
          <CardContent className="p-6 sm:p-8">
            {/* Etapa 1: Entrada CPF/SUS */}
            {currentStep === 'cpf_input' && (
              <div className="space-y-6">
                {/* Seção PIX */}
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
                  <div className="text-center">
                    <h3 className="text-green-400 font-bold text-lg mb-2">💰 PIX para Pagamento</h3>
                    <p className="text-slate-300 text-sm mb-3">
                      <strong>Favorecido:</strong> JERIME R SOARES
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-slate-700/50 rounded-lg p-3">
                    <div className="flex-1">
                      <p className="text-slate-400 text-xs mb-1">Chave PIX:</p>
                      <p className="text-white font-mono text-sm break-all">
                        ca1df7fb-4db4-4db9-b2e9-304849e2f257
                      </p>
                    </div>
                    <Button
                      onClick={copyPixKey}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 transition-all duration-300 transform hover:scale-105"
                      aria-label="Copiar chave PIX"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                
                <div className="space-y-3">
                  <Label htmlFor="cpf-sus" className="text-slate-200 font-semibold text-sm sm:text-base tracking-wide">
                    CPF OU SUS <span className="text-pink-400">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="cpf-sus"
                      value={cpfSusInput}
                      onChange={(e) => setCpfSusInput(formatCpfOrSus(e.target.value))}
                      placeholder="CPF (XXX.XXX.XXX-XX) OU SUS (XXX XXXX XXXX XXXX)"
                      required
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20 h-12 sm:h-14 text-base sm:text-lg backdrop-blur-sm transition-all duration-300 hover:bg-slate-700/70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-md pointer-events-none opacity-0 transition-opacity duration-300 hover:opacity-100"></div>
                  </div>
                  
                  {/* Feedback de tentativas */}
                  {validationAttempts > 0 && (
                    <Alert className="bg-yellow-500/10 border-yellow-500/30 text-yellow-300">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {validationAttempts === 1 && "Primeira tentativa incorreta. Você tem mais 2 tentativas."}
                        {validationAttempts === 2 && "Segunda tentativa incorreta. Você tem mais 1 tentativa."}
                        {validationAttempts >= 3 && "Muitas tentativas incorretas. Redirecionando para cadastro..."}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <Button 
                  onClick={validateCpfSus} 
                  disabled={isLoading}
                  className="w-full h-12 sm:h-14 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold text-sm sm:text-base tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/25 futuristic-hover focus-glow smooth-transition"
                  aria-label="Próximo"
                >
                  {isLoading && <div className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-r-transparent" />}
                  <ArrowRight className="mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                  PRÓXIMO
                  <Sparkles className="ml-3 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            )}

            {/* Etapa 2: Boas-vindas e atualização de dados */}
            {currentStep === 'welcome_update' && patient && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative animate-float">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full blur-lg opacity-75 animate-pulse-glow"></div>
                      <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-full gradient-button">
                        <User className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    {greeting}
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base">
                    Vamos confirmar seus dados antes de prosseguir
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="patient-name" className="text-slate-200 font-semibold text-sm sm:text-base tracking-wide">
                      Nome Completo
                    </Label>
                    <Input
                      id="patient-name"
                      value={patient.name}
                      disabled
                      className="bg-slate-700/30 border-slate-600/50 text-slate-300 h-12 sm:h-14 text-base sm:text-lg backdrop-blur-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patient-phone" className="text-slate-200 font-semibold text-sm sm:text-base tracking-wide">
                      Telefone <span className="text-pink-400">*</span>
                    </Label>
                    <Input
                      id="patient-phone"
                      value={tempPhone}
                      onChange={(e) => setTempPhone(e.target.value)}
                      placeholder="(XX) XXXXX-XXXX"
                      className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20 h-12 sm:h-14 text-base sm:text-lg backdrop-blur-sm transition-all duration-300 hover:bg-slate-700/70"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={updatePatientPhone} 
                    disabled={isUpdatingPhone || !tempPhone.trim() || tempPhone === patient.phone}
                    className="flex-1 h-12 sm:h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-sm sm:text-base tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/25"
                  >
                    {isUpdatingPhone && <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-r-transparent" />}
                    <Save className="mr-2 h-4 w-4" />
                    ATUALIZAR
                  </Button>
                  
                  <Button 
                    onClick={proceedToAttendantSelection}
                    className="flex-1 h-12 sm:h-14 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-bold text-sm sm:text-base tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/25"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    PRÓXIMO
                  </Button>
                </div>
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
                    className="w-full h-12 sm:h-14 bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50 hover:text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 focus-glow smooth-transition"
                  >
                    VOLTAR
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
                            <Avatar className="h-12 w-12 border-2 border-blue-500/30">
                              {attendant.photo_url && (
                                <AvatarImage 
                                  src={attendant.photo_url} 
                                  alt={attendant.name}
                                  className="object-cover"
                                />
                              )}
                              <AvatarFallback className="bg-blue-500/20 text-blue-400 font-semibold">
                                {attendant.name ? attendant.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AT'}
                              </AvatarFallback>
                            </Avatar>
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
                    className="w-full h-12 sm:h-14 bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50 hover:text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 focus-glow smooth-transition"
                  >
                    VOLTAR
                  </Button>
                </div>
              </div>
            )}

            {/* Etapa 3.5: Dados Obstétricos */}
            {currentStep === 'obstetric_data' && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="relative animate-float">
                      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full blur-lg opacity-75 animate-pulse-glow"></div>
                      <div className="relative bg-gradient-to-r from-pink-500 to-rose-500 p-3 rounded-full gradient-button">
                        <User className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Informações Obstétricas
                  </h3>
                  
                  <p className="text-slate-300 text-sm sm:text-base mb-2">
                    SERVIÇO SELECIONADO: <span className="text-pink-400 font-semibold">{formData.service_name}</span>
                  </p>
                  
                  <p className="text-slate-300 text-sm sm:text-base mb-6">
                    INFORME A DATA DA ÚLTIMA MENSTRUAÇÃO
                  </p>
                </div>

                <Alert className="bg-gradient-to-r from-pink-900/50 to-rose-900/50 border-pink-500/30 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-pink-500/20 p-2 rounded-full">
                      <User className="h-5 w-5 text-pink-400" />
                    </div>
                    <AlertDescription className="text-pink-100 text-sm sm:text-base leading-relaxed">
                      ESTA INFORMAÇÃO É NECESSÁRIA PARA CALCULAR A IDADE GESTACIONAL E DATA PROVÁVEL DO PARTO.
                    </AlertDescription>
                  </div>
                </Alert>

                <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dum" className="text-slate-200 font-semibold text-base">
                      Data da Última Menstruação (DUM) <span className="text-pink-400">*</span>
                    </Label>
                    <Input
                      id="dum"
                      type="text"
                      value={obstetricData.dum}
                      onChange={(e) => {
                        const formatted = formatDateInput(e.target.value);
                        setObstetricData(prev => ({ ...prev, dum: formatted }));
                      }}
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                      required
                      className="bg-slate-700/50 border-slate-600/50 text-white focus:border-pink-500 focus:ring-pink-500/20 h-12 backdrop-blur-sm transition-all duration-300 hover:bg-slate-700/70 text-lg"
                    />
                  </div>

                  {/* Campos calculados - IG e DPP */}
                  {obstetricData.dum && obstetricData.isValid && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-pink-500/20">
                      <div className="space-y-2">
                        <Label className="text-slate-200 font-semibold text-sm">
                          Idade Gestacional (IG)
                        </Label>
                        <div className="bg-slate-800/50 border border-slate-600/50 rounded-md p-4 text-white">
                          <span className="text-pink-400 font-bold text-xl">
                            {obstetricData.gestationalAge}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-slate-200 font-semibold text-sm">
                          Data Provável do Parto (DPP)
                        </Label>
                        <div className="bg-slate-800/50 border border-slate-600/50 rounded-md p-4 text-white">
                          <span className="text-pink-400 font-bold text-xl">
                            {obstetricData.dpp}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-slate-400 text-sm mt-4 text-center">
                    Esta informação é importante para o acompanhamento obstétrico adequado
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    onClick={goBack}
                    variant="outline"
                    className="w-full h-12 sm:h-14 bg-slate-700/50 border-slate-600/50 text-slate-200 hover:bg-slate-600/50 hover:text-white font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 focus-glow smooth-transition"
                  >
                    VOLTAR
                  </Button>
                  <Button
                    onClick={() => {
                      if (!obstetricData.dum || !obstetricData.isValid) {
                        toast.error('Por favor, informe uma data válida para a DUM');
                        return;
                      }
                      setCurrentStep('datetime_selection');
                    }}
                    className="w-full h-12 sm:h-14 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm sm:text-base tracking-wide transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-pink-500/25 focus-glow smooth-transition"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    CONTINUAR
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

                {/* Exibir dados obstétricos se disponíveis (apenas visualização) */}
                {isObstetricService(formData.service_name) && obstetricData.dum && (
                  <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4 space-y-3">
                    <div className="text-center">
                      <h4 className="text-pink-400 font-bold text-lg mb-2">🤱 Informações Obstétricas</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-200 font-semibold text-sm">
                          DUM
                        </Label>
                        <div className="bg-slate-800/50 border border-slate-600/50 rounded-md p-3 text-white">
                          <span className="text-pink-400 font-bold">
                            {obstetricData.dum}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-slate-200 font-semibold text-sm">
                          Idade Gestacional (IG)
                        </Label>
                        <div className="bg-slate-800/50 border border-slate-600/50 rounded-md p-3 text-white">
                          <span className="text-pink-400 font-bold">
                            {obstetricData.gestationalAge}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-slate-200 font-semibold text-sm">
                          Data Provável do Parto (DPP)
                        </Label>
                        <div className="bg-slate-800/50 border border-slate-600/50 rounded-md p-3 text-white">
                          <span className="text-pink-400 font-bold">
                            {obstetricData.dpp}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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