import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar, Clock, Search, MoreVertical, Plus, Phone, Eye, Edit, Trash2, CheckCircle, XCircle, Archive, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppointments } from '@/hooks/useSchedules';
import { AppointmentWithDetails } from '@/types/database';
import { toast } from 'sonner';

// Tipos de status de agendamento
type AppointmentStatus = 'aguardando' | 'em_atendimento' | 'finalizado' | 'cancelado' | 'arquivado';

// Mapeamento de status para exibição
const statusLabels: Record<AppointmentStatus, string> = {
  aguardando: 'Aguardando',
  em_atendimento: 'Em Atendimento',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  arquivado: 'Arquivado'
};

// Mapeamento de cores para status
const statusColors: Record<AppointmentStatus, string> = {
  aguardando: 'bg-yellow-100 text-yellow-800',
  em_atendimento: 'bg-blue-100 text-blue-800',
  finalizado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
  arquivado: 'bg-gray-100 text-gray-800'
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
    case 'aguardando':
    case 'em_atendimento':
      return [
        { label: 'Finalizar', icon: CheckCircle, action: 'finalizar' },
        { label: 'Cancelar', icon: XCircle, action: 'cancelar' },
        { label: 'Arquivar', icon: Archive, action: 'arquivar' }
      ];
    case 'finalizado':
      return [
        { label: 'Cancelar', icon: XCircle, action: 'cancelar' },
        { label: 'Arquivar', icon: Archive, action: 'arquivar' }
      ];
    case 'cancelado':
      return [
        { label: 'Finalizar', icon: CheckCircle, action: 'finalizar' },
        { label: 'Arquivar', icon: Archive, action: 'arquivar' }
      ];
    case 'arquivado':
      return [
        { label: 'Finalizar', icon: CheckCircle, action: 'finalizar' },
        { label: 'Cancelar', icon: XCircle, action: 'cancelar' }
      ];
    default:
      return [];
  }
};

interface AppointmentCardProps {
  appointment: AppointmentWithDetails;
  onStatusChange: (appointmentId: string, newStatus: AppointmentStatus) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, onStatusChange }) => {
  const handleAction = (action: string) => {
    const statusMap: Record<string, AppointmentStatus> = {
      finalizar: 'finalizado',
      cancelar: 'cancelado',
      arquivar: 'arquivado'
    };
    
    const newStatus = statusMap[action];
    if (newStatus) {
      onStatusChange(appointment.id, newStatus);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {appointment.patient?.name ? 
                  appointment.patient.name.split(' ').map(n => n[0]).join('').substring(0, 2) : 
                  'PA'
                }
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium text-sm">{appointment.patient?.name || 'Paciente não informado'}</h3>
                {getStatusBadge(appointment.status as AppointmentStatus)}
              </div>
              
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <Phone className="h-3 w-3" />
                    <span>{appointment.patient?.phone || 'Não informado'}</span>
                  </span>
                  <span>{appointment.service?.name || 'Serviço não informado'}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(appointment.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{appointment.time}</span>
                  </span>
                  <span>{appointment.professional?.name || 'Profissional não informado'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {getActionOptions(appointment.status as AppointmentStatus).map((option) => (
                  <DropdownMenuItem
                    key={option.action}
                    onClick={() => handleAction(option.action)}
                    className="flex items-center space-x-2"
                  >
                    <option.icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Agendamentos: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('todos');
  
  // Hooks para gerenciar agendamentos
  const { 
    data: appointments = [], 
    isLoading, 
    error,
    refetch,
    updateAppointmentStatus 
  } = useAppointments();

  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      await updateAppointmentStatus.mutateAsync({
        appointmentId,
        status: newStatus
      });
      toast.success('Status do agendamento atualizado com sucesso!');
      refetch();
    } catch (error) {
      toast.error('Erro ao atualizar status do agendamento');
      console.error('Erro ao atualizar status:', error);
    }
  };

  const filterAppointmentsByStatus = (status?: string) => {
    let filtered = appointments;
    
    if (status && status !== 'todos') {
      filtered = filtered.filter(app => app.status === status);
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
        <Button onClick={() => refetch()}>Tentar novamente</Button>
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
        
        <Button>
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="todos" className="text-xs">
                Todos ({getTabCount()})
              </TabsTrigger>
              <TabsTrigger value="aguardando" className="text-xs">
                Aguardando ({getTabCount('aguardando')})
              </TabsTrigger>
              <TabsTrigger value="em_atendimento" className="text-xs">
                Em Atendimento ({getTabCount('em_atendimento')})
              </TabsTrigger>
              <TabsTrigger value="finalizado" className="text-xs">
                Finalizados ({getTabCount('finalizado')})
              </TabsTrigger>
              <TabsTrigger value="cancelado" className="text-xs">
                Cancelados ({getTabCount('cancelado')})
              </TabsTrigger>
              <TabsTrigger value="arquivado" className="text-xs">
                Arquivados ({getTabCount('arquivado')})
              </TabsTrigger>
            </TabsList>
            
            {['todos', 'aguardando', 'em_atendimento', 'finalizado', 'cancelado', 'arquivado'].map((status) => (
              <TabsContent key={status} value={status} className="mt-6">
                <div className="space-y-4">
                  {filterAppointmentsByStatus(status === 'todos' ? undefined : status).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum agendamento encontrado</p>
                    </div>
                  ) : (
                    filterAppointmentsByStatus(status === 'todos' ? undefined : status).map((appointment) => (
                      <AppointmentCard 
                        key={appointment.id} 
                        appointment={appointment} 
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Agendamentos;