import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

import { Calendar, Clock, Search, MoreVertical, Plus, Phone, Trash2, CheckCircle, XCircle, Archive, Loader2, User, MapPin } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments } from '@/hooks/useAppointments';
import { AppointmentData } from '@/services/appointmentsService';
import { toast } from 'sonner';

// Tipos de status de agendamento
type AppointmentStatus = 'aguardando_atendimento' | 'atendimento_iniciado' | 'atendimento_finalizado' | 'agendamento_cancelado' | 'scheduled' | 'completed' | 'canceled' | 'archived';

// Mapeamento de status para exibição
const statusLabels: Record<AppointmentStatus, string> = {
  aguardando_atendimento: 'Aguardando Atendimento',
  atendimento_iniciado: 'Atendimento Iniciado',
  atendimento_finalizado: 'Atendimento Finalizado',
  agendamento_cancelado: 'Agendamento Cancelado',
  scheduled: 'Agendado',
  completed: 'Finalizado',
  canceled: 'Cancelado',
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
  canceled: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-800'
};
const getStatusBadge = (status: AppointmentStatus) => {
  return (
    <Badge className={`${statusColors[status]} border-0`}>
      {statusLabels[status]}
    </Badge>
  );
};

const getActionOptions = (status: AppointmentStatus) => {
  switch (status) {
    case 'scheduled':
    case 'aguardando_atendimento':
      return [
        { action: 'atendimento_iniciado', label: 'Iniciar Atendimento', icon: Clock },
        { action: 'agendamento_cancelado', label: 'Cancelar', icon: Trash2 },
      ];
    case 'atendimento_iniciado':
      return [
        { action: 'atendimento_finalizado', label: 'Finalizar Atendimento', icon: CheckCircle },
        { action: 'agendamento_cancelado', label: 'Cancelar', icon: Trash2 },
      ];
    case 'atendimento_finalizado':
    case 'completed':
      return [
        { action: 'delete', label: 'Excluir', icon: Trash2 },
      ];
    case 'agendamento_cancelado':
    case 'canceled':
    case 'archived':
      return [
        { action: 'delete', label: 'Excluir', icon: Trash2 },
      ];
    default:
      return [];
  }
};

interface AppointmentCardProps {
  appointment: AppointmentData;
  onAction: (appointmentId: string, action: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onAction }) => {
  
  const getInitials = (name: string) => {
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
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {getStatusBadge(appointment.status as AppointmentStatus)}
            
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | 'todos'>('todos');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
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
    status: selectedStatus === 'todos' ? undefined : selectedStatus,
    date: selectedDate
  });

  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      // Mapear status da interface para status do banco
      const statusMapping: Record<string, string> = {
        'aguardando_atendimento': 'scheduled',
        'atendimento_iniciado': 'atendimento_iniciado',
        'atendimento_finalizado': 'completed',
        'agendamento_cancelado': 'cancelled'
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
        console.log('🔍 Agendamentos - Iniciando atendimento para:', appointment.patient);
        console.log('🔍 Agendamentos - Dados completos do appointment:', appointment);
        
        // Primeiro atualizar o status para 'confirmed' (que corresponde a atendimento iniciado)
        await handleStatusChange(appointmentId, 'atendimento_iniciado' as AppointmentStatus);
        // Depois navegar para a seção de atendimento com os dados do paciente e appointment_id
        navigate('/atendimento/novo', { 
          state: { 
            appointmentId: appointmentId,
            patientData: {
              id: appointment.patient_id,
              name: appointment.patient_name,
              sus: appointment.patient?.sus || '',
              phone: appointment.patient?.phone || '',
              address: appointment.patient?.address || '',
              date_of_birth: appointment.patient?.date_of_birth || null,
              age: appointment.patient?.age || 0,
              gender: appointment.patient?.gender || '',
              created_at: appointment.patient?.created_at || '',
              updated_at: appointment.patient?.updated_at || ''
            }
          }
        });
      }
    } else if (action === 'atendimento_finalizado') {
      // Para finalizar atendimento
      try {
        await handleStatusChange(appointmentId, 'atendimento_finalizado' as AppointmentStatus);
        toast.success('Atendimento finalizado com sucesso');
      } catch (error) {
        console.error('Erro ao finalizar atendimento:', error);
        toast.error('Erro ao finalizar atendimento');
      }
    } else if (action === 'agendamento_cancelado') {
      // Para cancelar, atualizar status para cancelado
      try {
        await handleStatusChange(appointmentId, 'agendamento_cancelado' as AppointmentStatus);
        toast.success('Agendamento cancelado com sucesso');
      } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        toast.error('Erro ao cancelar agendamento');
      }
    } else if (action === 'delete') {
      // Para excluir, remover permanentemente do banco de dados
      try {
        await deleteAppointment(appointmentId);
        toast.success('Agendamento excluído com sucesso');
      } catch (error) {
        console.error('Erro ao excluir agendamento:', error);
        toast.error('Erro ao excluir agendamento');
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
        app.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.professional?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getTabCount = (status?: string) => {
    return filterAppointmentsByStatus(status).length;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie os agendamentos da clínica</p>
        </div>
        
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => window.open('/public/agendamento', '_blank')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar agendamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as AppointmentStatus | 'todos')} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="todos">
                Todos ({getStatusCount('todos')})
              </TabsTrigger>
              <TabsTrigger value="aguardando_atendimento">
                Aguardando ({getStatusCount('aguardando_atendimento')})
              </TabsTrigger>
              <TabsTrigger value="atendimento_iniciado">
                Em Atendimento ({getStatusCount('atendimento_iniciado')})
              </TabsTrigger>
              <TabsTrigger value="atendimento_finalizado">
                Finalizados ({getStatusCount('atendimento_finalizado')})
              </TabsTrigger>
            </TabsList>
            
            {['todos', 'aguardando_atendimento', 'atendimento_iniciado', 'atendimento_finalizado'].map((status) => (
              <TabsContent key={status} value={status} className="mt-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="ml-2">Carregando agendamentos...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-600">
                    Erro ao carregar agendamentos: {error}
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Nenhum agendamento encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((appointment) => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onAction={handleAction}
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