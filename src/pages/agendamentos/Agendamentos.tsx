import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGuard, ActionButtonGuard } from '@/components/PermissionGuard';
import { useIsMobile } from '@/hooks/use-mobile';

import { Calendar, Clock, Search, MoreVertical, Plus, Phone, Trash2, CheckCircle, XCircle, Archive, Loader2, User, MapPin, Baby, MessageCircle, Send } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments } from '@/hooks/useAppointments';
import { AppointmentData } from '@/services/appointmentsService';
import { findPatientByName } from '@/services/patientService';
import { toast } from 'sonner';
import { formatPregnancyDisplay } from '@/utils/pregnancyUtils';
import { isObstetricService } from '@/utils/obstetricUtils';
import { supabase } from '@/integrations/supabase/client';

// Tipos de status de agendamento
type AppointmentStatus = 'aguardando_atendimento' | 'atendimento_iniciado' | 'atendimento_finalizado' | 'agendamento_cancelado' | 'scheduled' | 'completed' | 'canceled' | 'cancelled' | 'archived' | 'finalizado';

// Mapeamento de status para exibição
const statusLabels: Record<AppointmentStatus, string> = {
  aguardando_atendimento: 'Aguardando Atendimento',
  atendimento_iniciado: 'Atendimento Iniciado',
  atendimento_finalizado: 'Atendimento Finalizado',
  agendamento_cancelado: 'Agendamento Cancelado',
  scheduled: 'Agendado',
  completed: 'Finalizado',
  finalizado: 'Finalizado',
  canceled: 'Cancelado',
  cancelled: 'Cancelado',
  archived: 'Arquivado'
};

// Mapeamento de cores para status
const statusColors: Record<AppointmentStatus, string> = {
  aguardando_atendimento: 'bg-yellow-100 text-yellow-800',
  atendimento_iniciado: 'bg-blue-100 text-blue-800',
  atendimento_finalizado: 'bg-green-100 text-green-800',
  agendamento_cancelado: 'bg-red-100 text-red-800',
  scheduled: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  finalizado: 'bg-green-100 text-green-800',
  canceled: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-800'
};
const getStatusBadge = (status: AppointmentStatus) => {
  // Fallback para status desconhecidos evitando tarja preta
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
  const labelText = statusLabels[status] || status || 'Desconhecido';
  
  return (
    <Badge className={`${colorClass} border-0`}>
      {labelText}
    </Badge>
  );
};

const getActionOptions = (status: AppointmentStatus) => {
  switch (status) {
    case 'scheduled':
    case 'aguardando_atendimento':
      return [
        { action: 'atendimento_iniciado', label: 'Iniciar Atendimento', icon: Clock },
        { action: 'cancelled', label: 'Cancelar', icon: Trash2 },
      ];
    case 'atendimento_iniciado':
      return [
        { action: 'completed', label: 'Finalizar Atendimento', icon: CheckCircle },
        { action: 'cancelled', label: 'Cancelar', icon: Trash2 },
      ];
    case 'atendimento_finalizado':
    case 'completed':
    case 'finalizado':
      return [
        { action: 'delete', label: 'Excluir', icon: Trash2 },
      ];
    case 'agendamento_cancelado':
    case 'canceled':
    case 'cancelled':
    case 'archived':
      return [
        { action: 'delete', label: 'Excluir', icon: Trash2 },
      ];
    default:
      return [
        { action: 'delete', label: 'Excluir', icon: Trash2 },
      ];
  }
};

interface AppointmentCardProps {
  appointment: AppointmentData;
  onAction: (appointmentId: string, action: string) => void;
  onSendReminder: (appointmentId: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onAction, onSendReminder }) => {
  const isMobile = useIsMobile();
  
  const getInitials = (name: string | null | undefined) => {
    if (!name || typeof name !== 'string') {
      return 'PA';
    }
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDateTime = (dateTime: string) => {
    try {
      const appointmentDate = new Date(dateTime);
      
      return {
        date: format(appointmentDate, 'dd/MM/yyyy', { locale: ptBR }),
        time: format(appointmentDate, 'HH:mm', { locale: ptBR }),
        dayOfWeek: format(appointmentDate, 'EEEE', { locale: ptBR })
      };
    } catch (error) {
      return {
        date: 'Data inválida',
        time: 'Hora inválida',
        dayOfWeek: ''
      };
    }
  };

  const { date, time, dayOfWeek } = formatDateTime(appointment.appointment_datetime);
  const actionOptions = getActionOptions(appointment.status as AppointmentStatus);

  if (isMobile) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Header com Avatar e Status */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                  {getInitials(appointment.patient_name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{appointment.patient_name}</h3>
                <p className="text-xs text-blue-600 font-medium truncate">{appointment.service_name}</p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actionOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <DropdownMenuItem
                      key={option.action}
                      onClick={() => onAction(appointment.id, option.action)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {option.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Data e Hora */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center text-xs text-gray-600">
              <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              <span className="truncate">{date} - {dayOfWeek}</span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <Clock className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              <span>{time}</span>
            </div>
          </div>

          {/* Info Obstétrica */}
          {appointment.dum && isObstetricService(appointment.service_name) && (
            <div className="flex items-center text-xs text-pink-600 mb-3 bg-pink-50 px-2 py-1.5 rounded-md">
              <Baby className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              <span className="font-medium truncate">{formatPregnancyDisplay(appointment.dum)}</span>
            </div>
          )}

          {/* Footer com Badges e Ações */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <div className="flex items-center gap-1.5 flex-wrap">
              {appointment.partner_username ? (
                <span className="text-[10px] text-purple-800 font-semibold bg-yellow-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  via {appointment.partner_code || appointment.partner_username}
                </span>
              ) : appointment.attendant_name && !appointment.partner_username ? (
                <span className="text-[10px] text-purple-800 font-semibold bg-yellow-100 px-1.5 py-0.5 rounded-full">
                  via ADM
                </span>
              ) : null}
              <div className="text-[10px]">
                {getStatusBadge(appointment.status as AppointmentStatus)}
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onSendReminder(appointment.id)}
              className="text-green-600 hover:text-green-700 h-8 w-8 p-0 flex-shrink-0"
              title="WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Desktop Layout
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {getInitials(appointment.patient_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{appointment.patient_name}</h3>
              <p className="text-sm text-blue-600 font-medium mt-1">{appointment.service_name}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{date} - {dayOfWeek}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{time}</span>
                </div>
              </div>
              {appointment.dum && isObstetricService(appointment.service_name) && (
                <div className="flex items-center text-sm text-pink-600 mt-2 bg-pink-50 px-2 py-1 rounded-md">
                  <Baby className="w-4 h-4 mr-1" />
                  <span className="font-medium">{formatPregnancyDisplay(appointment.dum)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {appointment.partner_username ? (
              <span className="text-xs text-purple-800 font-semibold bg-yellow-100 px-2.5 py-0.5 rounded-full">
                via {appointment.partner_code || appointment.partner_username}
              </span>
            ) : appointment.attendant_name && !appointment.partner_username ? (
              <span className="text-xs text-purple-800 font-semibold bg-yellow-100 px-2.5 py-0.5 rounded-full">
                via ADM
              </span>
            ) : null}
            {getStatusBadge(appointment.status as AppointmentStatus)}
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onSendReminder(appointment.id)}
              className="text-green-600 hover:text-green-700"
              title="Enviar Lembrete WhatsApp"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actionOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <DropdownMenuItem
                      key={option.action}
                      onClick={() => onAction(appointment.id, option.action)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {option.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Agendamentos: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { permissions, isPartner, isAdmin, hasPermission } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | 'todos'>('todos');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [sendingBatch, setSendingBatch] = useState(false);
  
  // Mapear status da interface para status do banco para o hook
  const getDbStatusForHook = (status: AppointmentStatus | 'todos') => {
    if (status === 'todos') return undefined;
    
    const statusMapping: Record<string, string> = {
      'aguardando_atendimento': 'scheduled',
      'atendimento_iniciado': 'atendimento_iniciado',
      'atendimento_finalizado': 'completed',
      'agendamento_cancelado': 'cancelled',
      'canceled': 'cancelled',
      'cancelled': 'cancelled'
    };
    
    return statusMapping[status] || status;
  };

  const { 
    data: appointments, 
    isLoading, 
    error, 
    updateAppointmentStatus,
    deleteAppointment,
    refetch: refreshAppointments,
    counts
  } = useAppointments({
    searchTerm,
    status: getDbStatusForHook(selectedStatus)
  });

  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      // Mapear status da interface para status do banco
      const statusMapping: Record<string, string> = {
        'aguardando_atendimento': 'scheduled',
        'atendimento_iniciado': 'atendimento_iniciado',
        'atendimento_finalizado': 'completed',
        'agendamento_cancelado': 'cancelled',
        'canceled': 'cancelled',
        'cancelled': 'cancelled'
      };
      
      const dbStatus = statusMapping[newStatus] || newStatus;
      await updateAppointmentStatus({ id: appointmentId, status: dbStatus });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status do agendamento');
    }
  };

  const handleAction = async (appointmentId: string, action: string) => {
    if (action === 'atendimento_iniciado') {
      // Encontrar o agendamento para obter os dados do paciente
      const appointment = appointments.find(app => app.id === appointmentId);
      if (appointment) {
        // Verificar se temos dados mínimos do paciente
        if (!appointment.patient_name) {
          return;
        }
        
        // Se não temos patient_id, vamos criar um UUID válido
        // Isso permite que o fluxo continue funcionando mesmo com dados legados
        const patientId = appointment.patient_id || crypto.randomUUID();
        
        const patientDataToSend = {
          id: patientId,
          name: appointment.patient_name,
          sus: appointment.patient?.sus || '',
          phone: appointment.patient?.phone || appointment.patient_phone || '',
          address: appointment.patient?.address || '',
          date_of_birth: appointment.patient?.date_of_birth || null,
          age: appointment.patient?.age || 0,
          gender: appointment.patient?.gender || '',
          created_at: appointment.patient?.created_at || new Date().toISOString(),
          updated_at: appointment.patient?.updated_at || new Date().toISOString()
        };
        
        try {
          // Primeiro atualizar o status no banco
          console.log('🔄 Atualizando status para atendimento_iniciado...');
          await handleStatusChange(appointmentId, 'atendimento_iniciado' as AppointmentStatus);
          console.log('✅ Status atualizado com sucesso');
          
          // Depois enviar notificação ao N8N (sem bloquear a navegação)
        const payload = {
          appointment_id: appointment.id,
          patient_name: appointment.patient_name || 'Paciente',
          patient_phone: appointment.patient_phone,
          appointment_date: appointment.appointment_date || '',
          appointment_time: appointment.appointment_time || '',
          service_name: appointment.service_name || 'Consulta',
          attendant_name: appointment.attendant_name || 'Profissional',
          status: 'atendimento_iniciado',
          reminder_type: 'attendance_started',
          partner_username: appointment.partner_username || null
        };

          supabase.functions.invoke('whatsapp-reminder', {
            body: payload
          }).then(() => {
            console.log('✅ Notificação enviada ao N8N');
          }).catch((n8nError) => {
            console.error('❌ Erro ao enviar notificação ao N8N:', n8nError);
          });
          
          // Navegar para o atendimento
          navigate('/atendimento/novo', {
            state: {
              rawPatientDataFromNavigation: patientDataToSend,
              appointmentIdFromNavigation: appointmentId
            }
          });
        } catch (error) {
          console.error('❌ Erro ao iniciar atendimento:', error);
          toast.error('Erro ao iniciar atendimento. Tente novamente.');
          return;
        }
        

      }
    } else if (action === 'completed') {
      // Para finalizar atendimento - buscar paciente no banco e iniciar novo atendimento
      try {
        const appointment = appointments.find(app => app.id === appointmentId);
        if (!appointment || !appointment.patient_name) {
          toast.error('Dados do paciente não encontrados no agendamento');
          return;
        }

        // Buscar o paciente no banco de dados
        const patientFromDb = await findPatientByName(appointment.patient_name);
        
        if (!patientFromDb) {
          toast.error(`Paciente "${appointment.patient_name}" não encontrado no banco de dados. Verifique se o paciente está cadastrado.`);
          return;
        }

        // Atualizar status do agendamento para completed (padronizado)
        console.log('🔄 Atualizando status para completed...');
        await handleStatusChange(appointmentId, 'completed' as AppointmentStatus);
        console.log('✅ Status atualizado com sucesso');
        
        // Enviar notificação ao N8N (sem bloquear a navegação)
        const payload = {
          appointment_id: appointment.id,
          patient_name: appointment.patient_name || 'Paciente',
          patient_phone: appointment.patient_phone,
          appointment_date: appointment.appointment_date || '',
          appointment_time: appointment.appointment_time || '',
          service_name: appointment.service_name || 'Consulta',
          attendant_name: appointment.attendant_name || 'Profissional',
          status: 'completed',
          reminder_type: 'attendance_finished',
          partner_username: appointment.partner_username || null
        };

        supabase.functions.invoke('whatsapp-reminder', {
          body: payload
        }).then(() => {
          console.log('✅ Notificação de finalização enviada ao N8N');
        }).catch((n8nError) => {
          console.error('❌ Erro ao enviar notificação ao N8N:', n8nError);
        });
        
        // Navegar para novo atendimento com dados reais do paciente
        navigate('/atendimento/novo', {
          state: {
            rawPatientDataFromNavigation: patientFromDb,
            appointmentIdFromNavigation: appointmentId
          }
        });
        
        toast.success('Paciente encontrado! Iniciando novo atendimento...');
      } catch (error) {
        console.error('Erro ao finalizar atendimento:', error);
        toast.error('Erro ao finalizar atendimento');
      }
    } else if (action === 'cancelled') {
      // Buscar dados do agendamento antes de cancelar
      const appointment = appointments.find(app => app.id === appointmentId);
      
      try {
        // Atualizar status para cancelled (padronizado)
        await handleStatusChange(appointmentId, 'cancelled' as AppointmentStatus);
        
        // Enviar notificação ao n8n (não bloqueia o fluxo)
        if (appointment) {
          const payload = {
            appointment_id: appointment.id,
            patient_name: appointment.patient_name || 'Paciente',
            patient_phone: appointment.patient_phone,
            appointment_date: appointment.appointment_date || '',
            appointment_time: appointment.appointment_time || '',
            service_name: appointment.service_name || 'Consulta',
            attendant_name: appointment.attendant_name || 'Profissional',
            status: 'cancelled',
            reminder_type: 'cancelled',
            partner_username: appointment.partner_username || null
          };

          supabase.functions.invoke('whatsapp-reminder', {
            body: payload
          }).then(() => {
            console.log('✅ Notificação de cancelamento enviada ao N8N');
          }).catch((error) => {
            console.error('❌ Erro ao enviar notificação de cancelamento ao N8N:', error);
          });
        }
        
        toast.success('Agendamento cancelado com sucesso');
      } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        toast.error('Erro ao cancelar agendamento');
      }
    } else if (action === 'delete') {
      // Para excluir, PRIMEIRO remover do banco e DEPOIS notificar o N8N
      try {
        const appointment = appointments.find(app => app.id === appointmentId);
        
        // PASSO 1: Excluir do banco PRIMEIRO
        console.log('🗑️ [PASSO 1] Excluindo agendamento do banco...');
        await deleteAppointment(appointmentId);
        console.log('✅ [PASSO 1] Agendamento excluído do banco com sucesso');
        
        // PASSO 2: Enviar notificação ao N8N DEPOIS (em background)
        if (appointment) {
          const payload = {
            appointment_id: appointment.id,
            patient_name: appointment.patient_name || 'Paciente',
            patient_phone: appointment.patient_phone,
            appointment_date: appointment.appointment_date || '',
            appointment_time: appointment.appointment_time || '',
            service_name: appointment.service_name || 'Consulta',
            attendant_name: appointment.attendant_name || 'Profissional',
            status: 'deleted',
            reminder_type: 'deleted',
            partner_username: appointment.partner_username || null
          };

          // Não bloquear o fluxo - enviar em background
          supabase.functions.invoke('whatsapp-reminder', { body: payload })
            .then(() => console.log('✅ [PASSO 2] Notificação enviada ao N8N'))
            .catch((n8nError) => console.error('⚠️ [PASSO 2] Erro ao enviar ao N8N:', n8nError));
        }
        
        // Toast de sucesso
        toast.success('Agendamento excluído com sucesso');
      } catch (error) {
        console.error('❌ Erro ao excluir agendamento:', error);
        toast.error(`Erro ao excluir: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    } else {
      // Para outras ações, apenas atualizar o status
      await handleStatusChange(appointmentId, action as AppointmentStatus);
    }
  };

  // Contar agendamentos por status usando os dados do hook
  const getStatusCount = (status: AppointmentStatus | 'todos') => {
    if (status === 'todos') return counts?.todos || 0;
    
    // Mapear status da interface para status do banco
    const statusMapping: Record<string, string> = {
      'aguardando_atendimento': 'scheduled', // Agendamentos aguardando = scheduled no banco
      'atendimento_iniciado': 'atendimento_iniciado',   // Em atendimento = atendimento_iniciado no banco
      'atendimento_finalizado': 'completed', // Finalizados = completed no banco
      'agendamento_cancelado': 'cancelled'   // Cancelados = cancelled no banco
    };
    
    const dbStatus = statusMapping[status] || status;
    return counts?.[dbStatus] || 0;
  };

  const filterAppointmentsByStatus = (status?: string) => {
    let filtered = appointments;
    
    if (status && status !== 'todos') {
      // Mapear status da interface para status do banco
      const statusMapping: Record<string, string> = {
        'aguardando_atendimento': 'scheduled', // Agendamentos aguardando = scheduled no banco
        'atendimento_iniciado': 'atendimento_iniciado',   // Em atendimento = atendimento_iniciado no banco
        'atendimento_finalizado': 'completed', // Finalizados = completed no banco
        'agendamento_cancelado': 'cancelled'   // Cancelados = cancelled no banco
      };
      
      const dbStatus = statusMapping[status] || status;
      filtered = filtered.filter(app => app.status === dbStatus);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.service_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.attendant_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getTabCount = (status?: string) => {
    return filterAppointmentsByStatus(status).length;
  };

  // Função para enviar lembrete WhatsApp individual
  const handleSendReminder = async (appointmentId: string) => {
    try {
      setSendingReminder(true);
      
      const appointment = appointments.find(app => app.id === appointmentId);
      if (!appointment) {
        throw new Error('Agendamento não encontrado');
      }

      if (!appointment.patient_phone) {
        toast.error('Paciente não possui telefone cadastrado');
        return;
      }

      // Normaliza o status: se for 'completed', envia como 'atendimento_finalizado'
      const normalizedStatus = appointment.status === 'completed' ? 'atendimento_finalizado' : (appointment.status || 'scheduled');

      const payload = {
        appointment_id: appointment.id,
        patient_name: appointment.patient_name || 'Paciente',
        patient_phone: appointment.patient_phone,
        appointment_date: appointment.appointment_date || '',
        appointment_time: appointment.appointment_time || '',
        service_name: appointment.service_name || 'Consulta',
        attendant_name: appointment.attendant_name || 'Profissional',
        status: normalizedStatus,
        reminder_type: '15s',
        partner_username: appointment.partner_username || null
      };

      const { data, error } = await supabase.functions.invoke('whatsapp-reminder', {
        body: payload
      });

      if (error) throw error;

      toast.success('Lembrete WhatsApp enviado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao enviar lembrete:', error);
      toast.error(`Erro ao enviar lembrete: ${error.message}`);
    } finally {
      setSendingReminder(false);
    }
  };

  // Função para enviar lembretes em lote
  const handleSendBatchReminders = async () => {
    try {
      setSendingBatch(true);
      
      const appointmentsToSend = filterAppointmentsByStatus(selectedStatus);
      
      if (appointmentsToSend.length === 0) {
        toast.error('Nenhum agendamento para enviar lembretes');
        return;
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const appointment of appointmentsToSend) {
        if (!appointment.patient_phone) {
          failedCount++;
          continue;
        }

        try {
          // Normaliza o status: se for 'completed', envia como 'atendimento_finalizado'
          const normalizedStatus = appointment.status === 'completed' ? 'atendimento_finalizado' : (appointment.status || 'scheduled');

          const payload = {
            appointment_id: appointment.id,
            patient_name: appointment.patient_name || 'Paciente',
            patient_phone: appointment.patient_phone,
            appointment_date: appointment.appointment_date || '',
            appointment_time: appointment.appointment_time || '',
            service_name: appointment.service_name || 'Consulta',
            attendant_name: appointment.attendant_name || 'Profissional',
            status: normalizedStatus,
            reminder_type: '15s',
            partner_username: appointment.partner_username || null
          };

          await supabase.functions.invoke('whatsapp-reminder', {
            body: payload
          });

          sentCount++;
        } catch (error) {
          console.error(`Erro ao enviar lembrete para ${appointment.patient_name}:`, error);
          failedCount++;
        }

        // Pequeno delay entre envios para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (sentCount > 0) {
        toast.success(`${sentCount} lembrete(s) enviado(s) com sucesso!`);
      }
      if (failedCount > 0) {
        toast.error(`${failedCount} lembrete(s) falharam`);
      }
    } catch (error: any) {
      console.error('Erro ao enviar lembretes em lote:', error);
      toast.error(`Erro ao enviar lembretes: ${error.message}`);
    } finally {
      setSendingBatch(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando agendamentos...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Erro ao carregar agendamentos</p>
        <Button onClick={() => refreshAppointments()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header */}
      <div className={isMobile ? "space-y-3" : "flex items-center justify-between"}>
        <div>
          <h1 className={isMobile ? "text-xl font-bold text-gray-900" : "text-2xl font-bold text-gray-900"}>
            Agendamentos
          </h1>
          <p className={isMobile ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
            Gerencie os agendamentos da clínica
          </p>
        </div>
        
        <div className={isMobile ? "flex gap-2 overflow-x-auto pb-2" : "flex gap-2"}>
          <Button 
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="bg-green-50 text-green-700 hover:bg-green-100 border-green-300 whitespace-nowrap"
            onClick={handleSendBatchReminders}
            disabled={sendingBatch || filterAppointmentsByStatus(selectedStatus).length === 0}
          >
            {sendingBatch ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isMobile ? 'Lote' : (sendingBatch ? 'Enviando...' : 'Enviar Lembretes em Lote')}
          </Button>
          
          <ActionButtonGuard permission="agendamentos_criar">
            <Button 
              size={isMobile ? "sm" : "default"}
              className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
              onClick={() => window.open('/agendamento', '_blank')}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isMobile ? 'Novo' : 'Novo Agendamento'}
            </Button>
          </ActionButtonGuard>
        </div>
      </div>

      <Card>
        <CardHeader className={isMobile ? "pb-3 px-4 pt-4" : "pb-4"}>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={isMobile ? "pl-9 h-9 text-sm" : "pl-9"}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className={isMobile ? "px-2" : ""}>
          <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as AppointmentStatus | 'todos')} className="w-full">
            <TabsList className={isMobile ? "w-full flex overflow-x-auto scrollbar-hide h-auto p-1" : "grid w-full grid-cols-4"}>
              <TabsTrigger 
                value="todos"
                className={isMobile ? "flex-shrink-0 text-xs px-3 whitespace-nowrap" : ""}
              >
                {isMobile ? `Todos (${getStatusCount('todos')})` : `Todos (${getStatusCount('todos')})`}
              </TabsTrigger>
              <TabsTrigger 
                value="aguardando_atendimento"
                className={isMobile ? "flex-shrink-0 text-xs px-3 whitespace-nowrap" : ""}
              >
                {isMobile ? `Aguard. (${getStatusCount('aguardando_atendimento')})` : `Aguardando (${getStatusCount('aguardando_atendimento')})`}
              </TabsTrigger>
              <TabsTrigger 
                value="atendimento_iniciado"
                className={isMobile ? "flex-shrink-0 text-xs px-3 whitespace-nowrap" : ""}
              >
                {isMobile ? `Atend. (${getStatusCount('atendimento_iniciado')})` : `Em Atendimento (${getStatusCount('atendimento_iniciado')})`}
              </TabsTrigger>
              <TabsTrigger 
                value="atendimento_finalizado"
                className={isMobile ? "flex-shrink-0 text-xs px-3 whitespace-nowrap" : ""}
              >
                {isMobile ? `Final. (${getStatusCount('atendimento_finalizado')})` : `Finalizados (${getStatusCount('atendimento_finalizado')})`}
              </TabsTrigger>
            </TabsList>
            
            {['todos', 'aguardando_atendimento', 'atendimento_iniciado', 'atendimento_finalizado'].map((status) => (
              <TabsContent key={status} value={status} className={isMobile ? "mt-3 px-2" : "mt-6"}>
                {isLoading ? (
                  <div className={isMobile ? "flex items-center justify-center py-6" : "flex items-center justify-center py-8"}>
                    <Loader2 className={isMobile ? "w-5 h-5 animate-spin" : "w-6 h-6 animate-spin"} />
                    <span className={isMobile ? "ml-2 text-sm" : "ml-2"}>Carregando...</span>
                  </div>
                ) : error ? (
                  <div className={isMobile ? "text-center py-6 text-red-600 text-sm" : "text-center py-8 text-red-600"}>
                    Erro ao carregar agendamentos
                  </div>
                ) : appointments.length === 0 ? (
                  <div className={isMobile ? "text-center py-6" : "text-center py-8"}>
                    <Calendar className={isMobile ? "w-10 h-10 mx-auto text-gray-400 mb-3" : "w-12 h-12 mx-auto text-gray-400 mb-4"} />
                    <p className={isMobile ? "text-gray-500 text-sm" : "text-gray-500"}>Nenhum agendamento encontrado</p>
                  </div>
                ) : (
                  <div className={isMobile ? "space-y-3" : "space-y-4"}>
                    {appointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onAction={handleAction}
                        onSendReminder={handleSendReminder}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>


    </div>
  );
};

export default Agendamentos;