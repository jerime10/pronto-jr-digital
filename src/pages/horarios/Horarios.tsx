import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Clock, Users, Calendar, X } from 'lucide-react';
import { useSchedules } from '@/hooks/useSchedules';
import { useActiveAttendants } from '@/hooks/useAttendants';
import { toast } from 'sonner';
import AvailableTimesGrid from '@/components/schedule/AvailableTimesGrid';
import { scheduleAssignmentsService } from '@/services/scheduleAssignmentsService';

interface EditScheduleData {
  id: string;
  start_time: string;
  end_time: string;
  duration: number;
  available: boolean;
  day: string;
}

const dayNames: { [key: number]: string } = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado'
};

// Função para ordenar dias da semana corretamente
const sortDaysInWeekOrder = (dayNamesArray: string[]): string[] => {
  const dayOrder = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return dayNamesArray.sort((a, b) => {
    const indexA = dayOrder.indexOf(a);
    const indexB = dayOrder.indexOf(b);
    return indexA - indexB;
  });
};

// Função para obter o primeiro dia do intervalo
const getFirstDayOfInterval = (dayNamesArray: string[]): string => {
  const sortedDays = sortDaysInWeekOrder([...dayNamesArray]);
  return sortedDays[0];
};

const dayLabels: { [key: number]: string } = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb'
};

const calculateDurationMinutes = (startTime: string, endTime: string): number => {
  if (!startTime || !endTime) {
    return 0;
  }
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  return endMinutes - startMinutes;
};

const groupSchedulesByDayInterval = (schedules: any[]) => {
  const grouped = schedules.reduce((acc: any, schedule: any) => {
    const days = schedule.days || [];
    const daysLabel = formatDaysInterval(days);
    
    if (!acc[daysLabel]) {
      acc[daysLabel] = {
        daysLabel,
        days,
        times: []
      };
    }
    
    // Verifica se já existe esse horário para este intervalo de dias
    const existingTime = acc[daysLabel].times.find((t: any) => t.start_time === schedule.start_time);
    if (!existingTime) {
      acc[daysLabel].times.push({
        id: schedule.id, // Adicionar o ID do schedule
        start_time: schedule.start_time,
        duration: schedule.duration || 0,
        available: schedule.available !== false,
        schedules: [schedule]
      });
    } else {
      existingTime.schedules.push(schedule);
    }
    
    return acc;
  }, {});

  // Ordena os horários dentro de cada grupo
  Object.values(grouped).forEach((group: any) => {
    group.times.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
  });

  return Object.values(grouped);
};

const groupSchedulesByTime = (schedules: any[]) => {
  const grouped = schedules.reduce((acc: any, schedule: any) => {
    const key = `${schedule.start_time}`;
    if (!acc[key]) {
      acc[key] = {
        id: schedule.id, // Preservar o ID do schedule
        start_time: schedule.start_time,
        duration: schedule.duration || 0, // Usa a duração diretamente do banco
        available: schedule.available !== false,
        days: schedule.days || [], // Usa os dias diretamente do banco
        schedules: []
      };
    }
    acc[key].schedules.push(schedule);
    return acc;
  }, {});

  Object.values(grouped).forEach((group: any) => {
    // Formata os dias para exibição
    group.daysLabel = formatDaysInterval(group.days);
  });

  return Object.values(grouped);
};

// Função para formatar intervalos de dias da semana
const formatDaysInterval = (days: string[] | number[]): string => {
  if (!days || days.length === 0) return '';
  
  console.log('🔍 DEBUG formatDaysInterval - Dias recebidos:', days);
  
  // Se os dias vêm como strings (nomes dos dias), converte para números
  let dayNumbers: number[];
  if (typeof days[0] === 'string') {
    const dayNameToNumber: { [key: string]: number } = {
      'domingo': 0, 'segunda': 1, 'terça': 2, 'quarta': 3, 
      'quinta': 4, 'sexta': 5, 'sábado': 6,
      // Variações com maiúscula
      'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 
      'Quinta': 4, 'Sexta': 5, 'Sábado': 6
    };
    dayNumbers = days.map(day => {
      const dayStr = String(day).trim();
      const dayNum = dayNameToNumber[dayStr] ?? dayNameToNumber[dayStr.toLowerCase()];
      console.log(`🔍 DEBUG - Convertendo '${dayStr}' para número:`, dayNum);
      return dayNum ?? 0;
    }).filter(num => num !== undefined);
  } else {
    dayNumbers = days as number[];
  }
  
  console.log('🔍 DEBUG formatDaysInterval - Números dos dias:', dayNumbers);
  
  const sortedDays = [...dayNumbers].sort((a, b) => a - b);
  
  if (sortedDays.length === 1) {
    return dayLabels[sortedDays[0]];
  }
  
  if (sortedDays.length === 7) {
    return 'Todos os dias';
  }
  
  // Verifica se é um intervalo contínuo
  let isConsecutive = true;
  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i] !== sortedDays[i-1] + 1) {
      isConsecutive = false;
      break;
    }
  }
  
  if (isConsecutive && sortedDays.length > 2) {
    const result = `${dayLabels[sortedDays[0]]} à ${dayLabels[sortedDays[sortedDays.length - 1]]}`;
    console.log('🔍 DEBUG formatDaysInterval - Resultado intervalo:', result);
    return result;
  }
  
  // Caso contrário, lista todos os dias
  const result = sortedDays.map(day => dayLabels[day]).join(', ');
  console.log('🔍 DEBUG formatDaysInterval - Resultado lista:', result);
  return result;
};

const toggleDayInArray = (days: number[], day: number): number[] => {
  return days.includes(day) 
    ? days.filter(d => d !== day)
    : [...days, day];
};

const Horarios: React.FC = () => {
  const navigate = useNavigate();
  const { schedules, isLoading, createSchedule, updateSchedule, deleteSchedule, toggleScheduleStatus } = useSchedules();
  const { data: attendants, isLoading: isLoadingAttendants } = useActiveAttendants();
  
  const [selectedAttendant, setSelectedAttendant] = useState<string>('');
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<any | null>(null);
  const [selectedDaysEdit, setSelectedDaysEdit] = useState<number[]>([]);
  const [editFormData, setEditFormData] = useState({
    start_time: '',
    duration: 50,
    available: true
  });
  const [availableSchedulesForAttendant, setAvailableSchedulesForAttendant] = useState<any[]>([]);
  const [selectedTimesForAssignment, setSelectedTimesForAssignment] = useState<{
    id: string;
    scheduleId: string;
    time: string;
    duration: number;
    days: string;
  }[]>([]);
  const [assignedSchedules, setAssignedSchedules] = useState<{[key: string]: any[]}>({});
  const [isAssigning, setIsAssigning] = useState(false);

  // Carregar horários atribuídos do banco de dados na inicialização
  useEffect(() => {
    const loadAssignedSchedules = async () => {
      try {
        const allAssignments = await scheduleAssignmentsService.getAllAssignments();
        
        // Agrupar atribuições por atendente
        const groupedByAttendant: {[key: string]: any[]} = {};
        
        allAssignments.forEach(assignment => {
          if (!groupedByAttendant[assignment.attendant_id]) {
            groupedByAttendant[assignment.attendant_id] = [];
          }
          
          groupedByAttendant[assignment.attendant_id].push({
            id: assignment.id,
            scheduleId: assignment.schedule_id,
            time: assignment.schedule_info?.split(' - ')[1]?.split(' (')[0] || 'Horário não definido',
            duration: parseInt(assignment.schedule_info?.match(/\((\d+) minutos\)/)?.[1] || '30'),
            days: assignment.schedule_info?.split(' - ')[0] || 'Dias não definidos'
          });
        });
        
        setAssignedSchedules(groupedByAttendant);
      } catch (error) {
        console.error('Erro ao carregar horários atribuídos:', error);
        toast.error('Erro ao carregar horários atribuídos');
      }
    };

    loadAssignedSchedules();
  }, []);

  const handleAssignSchedules = async () => {
    if (!selectedAttendant || selectedTimesForAssignment.length === 0) {
      toast.error('Selecione um atendente e pelo menos um horário');
      return;
    }

    setIsAssigning(true);
    try {
      // Buscar o nome do atendente selecionado
      const selectedAttendantData = attendants?.find(att => att.id === selectedAttendant);
      const attendantName = selectedAttendantData?.name || 'Atendente não encontrado';

      // Preparar dados para salvar na tabela schedule_assignments
      const assignmentsData = selectedTimesForAssignment.map(timeSlot => ({
        schedule_id: timeSlot.scheduleId,
        schedule_info: `${timeSlot.days} - ${timeSlot.time} (${timeSlot.duration} minutos)`,
        attendant_id: selectedAttendant,
        attendant_name: attendantName
      }));

      // Salvar múltiplas atribuições na tabela schedule_assignments
      await scheduleAssignmentsService.createMultipleAssignments(assignmentsData);

      // Adicionar horários à seção de horários atribuídos
      setAssignedSchedules(prev => {
        const updated = { ...prev };
        if (!updated[selectedAttendant]) {
          updated[selectedAttendant] = [];
        }
        
        // Adicionar os novos horários selecionados
        const newAssignments = selectedTimesForAssignment.map(selected => ({
          id: selected.id,
          scheduleId: selected.scheduleId,
          time: selected.time,
          duration: selected.duration,
          days: selected.days
        }));
        
        updated[selectedAttendant] = [...updated[selectedAttendant], ...newAssignments];
        return updated;
      });

      toast.success(`${selectedTimesForAssignment.length} horário(s) atribuído(s) com sucesso!`);
      
      // Limpar seleções
      setSelectedTimesForAssignment([]);
      
      // Atualizar horários disponíveis (remover os que foram atribuídos)
      setAvailableSchedulesForAttendant(prev => 
        prev.filter(schedule => 
          !selectedTimesForAssignment.some(selected => 
            selected.scheduleId === schedule.id
          )
        )
      );
      
    } catch (error) {
      console.error('Erro ao atribuir horários:', error);
      toast.error('Erro ao atribuir horários. Tente novamente.');
    } finally {
      setIsAssigning(false);
    }
  };

  // Agrupar os horários sem filtros
  const groupedSchedules = schedules ? groupSchedulesByTime(schedules) : [];



  const handleAttendantChange = async (attendantId: string) => {
    setSelectedAttendant(attendantId);
    setSelectedTimesForAssignment([]);
    
    try {
      // Buscar horários já atribuídos ao atendente
      const assignedSchedules = await scheduleAssignmentsService.getAssignmentsByAttendant(attendantId);
      const assignedScheduleIds = assignedSchedules.map(assignment => assignment.schedule_id);
      
      // Filtrar horários disponíveis (schedules que estão marcados como available)
      // e que não estão já atribuídos ao atendente
      const availableSchedules = schedules?.filter(schedule => 
        schedule.available === true && !assignedScheduleIds.includes(schedule.id)
      ) || [];
      
      setAvailableSchedulesForAttendant(availableSchedules);
    } catch (error) {
      console.error('Erro ao filtrar horários disponíveis:', error);
      toast.error('Erro ao carregar horários disponíveis');
      
      // Em caso de erro, mostrar apenas horários disponíveis sem filtro de atribuição
      const availableSchedules = schedules?.filter(schedule => 
        schedule.available === true
      ) || [];
      
      setAvailableSchedulesForAttendant(availableSchedules);
    }
  };

  const handleNewSchedule = () => {
    navigate('/horarios/novo');
  };

  const handleEditSchedule = (schedule: any) => {
    setEditingSchedule(schedule);
    
    // Converter nomes dos dias para números para o estado de edição
    const dayNameToNumber: { [key: string]: number } = {
      'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 
      'Quinta': 4, 'Sexta': 5, 'Sábado': 6
    };
    
    const normalizedDays = schedule.days
      .map((day: any) => {
        // Se for string (nome do dia), converte para número
        if (typeof day === 'string') {
          return dayNameToNumber[day] ?? null;
        }
        // Se for número, mantém
        if (typeof day === 'number' || !isNaN(Number(day))) {
          return Number(day);
        }
        return null;
      })
      .filter((day: number | null) => day !== null && day >= 0 && day <= 6)
      .filter((day: number, index: number, arr: number[]) => arr.indexOf(day) === index); // Remove duplicatas
    
    console.log('🔍 DEBUG - Dias originais:', schedule.days);
    console.log('🔍 DEBUG - Dias normalizados:', normalizedDays);
    
    setSelectedDaysEdit(normalizedDays);
    
    // Garantir que o start_time esteja no formato HH:MM para o input time
    let formattedStartTime = schedule.start_time;
    if (formattedStartTime && formattedStartTime.length === 5) {
      // Já está no formato correto HH:MM
    } else if (formattedStartTime && formattedStartTime.includes(':')) {
      // Pode estar no formato HH:MM:SS, extrair apenas HH:MM
      formattedStartTime = formattedStartTime.substring(0, 5);
    }
    
    // Garantir que duration seja um número válido
    const durationValue = schedule.duration || 50;
    
    setEditFormData({
      start_time: formattedStartTime,
      duration: Number(durationValue),
      available: schedule.available !== false
    });
    setShowEditDialog(true);
  };

  const handleDeleteSchedule = (schedule: any) => {
    setScheduleToDelete(schedule);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;
    
    try {
      // Deletar todos os horários do grupo
      for (const scheduleItem of scheduleToDelete.schedules) {
        await deleteSchedule.mutateAsync(scheduleItem.id);
      }
      setShowDeleteDialog(false);
      setScheduleToDelete(null);
      toast.success('Horário excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir horário:', error);
      toast.error('Erro ao excluir horário. Tente novamente.');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule || selectedDaysEdit.length === 0) {
      toast.error('Selecione pelo menos um dia da semana');
      return;
    }

    // Validações
    if (!editFormData.start_time) {
      toast.error('Horário de início é obrigatório');
      return;
    }

    if (!editFormData.duration || editFormData.duration <= 0) {
      toast.error('Duração deve ser maior que zero');
      return;
    }

    try {
      // DEBUG: Log dos dados antes da atualização
      console.log('🔍 DEBUG - Dados para atualização:', {
        selectedDaysEdit,
        editFormData,
        editingSchedule: editingSchedule.schedules.map(s => ({ id: s.id, current_days: s.days }))
      });
      
      // Converter números dos dias para nomes dos dias
      const dayNamesArray = selectedDaysEdit.map(dayNum => dayNames[dayNum]);
      
      // Ordenar os dias corretamente
      const sortedDaysArray = sortDaysInWeekOrder(dayNamesArray);
      
      // Obter o primeiro dia do intervalo
      const firstDay = getFirstDayOfInterval(dayNamesArray);
      
      // Atualizar todos os horários do grupo com os novos dados
      for (const scheduleItem of editingSchedule.schedules) {
        const updateData = {
          day: firstDay, // Primeiro dia do intervalo
          days: sortedDaysArray, // Array de nomes dos dias ordenados
          start_time: editFormData.start_time,
          duration: Number(editFormData.duration), // Garantir que seja número
          available: editFormData.available
        };
        
        console.log('🔍 DEBUG - Atualizando schedule:', scheduleItem.id, 'com dados:', updateData);
        
        await updateSchedule.mutateAsync({
          id: scheduleItem.id,
          data: updateData
        });
      }

      setShowEditDialog(false);
      toast.success('Horário atualizado com sucesso!');
      setEditingSchedule(null);
      setSelectedDaysEdit([]);
    } catch (error) {
      console.error('Erro detalhado ao atualizar horário:', error);
      
      // Verificar se é um erro específico do Supabase (seguindo o padrão da criação)
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          toast.error('Já existe um horário para este dia e horário');
        } else if (error.message.includes('invalid input')) {
          toast.error('Dados inválidos fornecidos');
        } else {
          toast.error(`Erro ao atualizar horário: ${error.message}`);
        }
      } else {
        toast.error('Erro desconhecido ao atualizar horário');
      }
    }
  };

  const handleToggleStatus = async (schedule: any) => {
    try {
      // Alternar status de todos os horários do grupo
      for (const scheduleItem of schedule.schedules) {
        await toggleScheduleStatus.mutateAsync({
          id: scheduleItem.id,
          available: !schedule.available
        });
      }
      toast.success('Status alterado com sucesso!');
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do horário');
    }
  };

  const toggleDayEdit = (day: number) => {
    setSelectedDaysEdit(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Horarios</h1>
        </div>
        <Button onClick={handleNewSchedule}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Horário
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="horarios" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="horarios">Horários Cadastrados</TabsTrigger>
              <TabsTrigger value="atribuir">Atribuir Horários</TabsTrigger>
              <TabsTrigger value="atribuidos">Horários Atribuídos</TabsTrigger>
            </TabsList>

            <TabsContent value="horarios" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Horários</h3>
                </div>
                
                {groupedSchedules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum horário cadastrado</p>
                    <p className="text-sm">Clique em "Novo Horário" para começar</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border overflow-hidden">
                    {/* Cabeçalho da tabela */}
                    <div className="grid grid-cols-5 gap-6 px-6 py-4 bg-gray-50 border-b font-medium text-sm text-gray-700">
                      <div>Horário</div>
                      <div>Dias</div>
                      <div>Duração</div>
                      <div>Status</div>
                      <div>Ações</div>
                    </div>
                    
                    {/* Linhas da tabela */}
                    {groupedSchedules.map((schedule: any, index: number) => (
                      <div key={`${schedule.start_time}-${index}`} className="grid grid-cols-5 gap-6 px-6 py-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                        {/* Horário */}
                        <div className="font-medium text-gray-900 text-sm">
                          {schedule.start_time}
                        </div>
                        
                        {/* Dias */}
                        <div className="text-gray-600 text-sm">
                          {schedule.daysLabel || 'Não definido'}
                        </div>
                        
                        {/* Duração */}
                        <div className="text-gray-600 text-sm">
                          {schedule.duration} minutos
                        </div>
                        
                        {/* Status */}
                        <div>
                          <span 
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors hover:opacity-80 ${
                              schedule.available 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                            onClick={() => handleToggleStatus(schedule)}
                            title="Clique para alterar o status"
                          >
                            {schedule.available ? 'Disponível' : 'Indisponível'}
                          </span>
                        </div>
                        
                        {/* Ações */}
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSchedule(schedule)}
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSchedule(schedule)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="atribuir" className="space-y-4">
              <div className="space-y-6">
                {/* Seleção de Atendente */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Selecionar Atendente</Label>
                  <Select value={selectedAttendant} onValueChange={handleAttendantChange}>
                    <SelectTrigger className="w-full max-w-md">
                      <SelectValue placeholder="Selecione um atendente" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingAttendants ? (
                        <SelectItem value="loading" disabled>
                          Carregando atendentes...
                        </SelectItem>
                      ) : attendants && attendants.length > 0 ? (
                        attendants.map((attendant) => (
                          <SelectItem key={attendant.id} value={attendant.id}>
                            {attendant.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-attendants" disabled>
                          Nenhum atendente ativo encontrado
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Horários Disponíveis */}
                {selectedAttendant && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Horários Disponíveis</h3>
                    
                    {availableSchedulesForAttendant.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-base font-medium mb-1 text-gray-700">Nenhum horário disponível</p>
                        <p className="text-sm text-gray-500">Todos os horários já foram atribuídos ou não há horários cadastrados</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {groupSchedulesByDayInterval(availableSchedulesForAttendant).map((dayGroup: any, groupIndex) => (
                          <div key={`${dayGroup.daysLabel}-${groupIndex}`} className="space-y-3">
                            {/* Cabeçalho do grupo de dias */}
                            <div className="bg-gray-50 px-4 py-3 rounded-lg border">
                              <h4 className="text-base font-semibold text-gray-900">
                                {dayGroup.daysLabel}
                              </h4>
                            </div>
                            
                            {/* Horários do grupo */}
                            <div className="bg-white border rounded-lg p-4 space-y-3">
                              {dayGroup.times.map((schedule: any, timeIndex: number) => {
                                const uniqueScheduleId = `${schedule.id}-${groupIndex}-${timeIndex}`;
                                const isSelected = selectedTimesForAssignment.some(t => t.id === uniqueScheduleId);
                                
                                return (
                                  <div key={uniqueScheduleId} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                                    <div>
                                      <p className="font-semibold text-gray-900">{schedule.start_time}</p>
                                      <p className="text-sm text-gray-500">{schedule.duration} minutos</p>
                                    </div>
                                    <Checkbox 
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedTimesForAssignment(prev => [...prev, {
                                            id: uniqueScheduleId,
                                            scheduleId: schedule.id,
                                            time: schedule.start_time,
                                            duration: schedule.duration,
                                            days: dayGroup.daysLabel
                                          }]);
                                        } else {
                                          setSelectedTimesForAssignment(prev => prev.filter(t => t.id !== uniqueScheduleId));
                                        }
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Botão Atribuir Horários */}
                    <div className="flex justify-end pt-4">
                      <Button 
                        onClick={handleAssignSchedules}
                        disabled={selectedTimesForAssignment.length === 0 || isAssigning}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isAssigning ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Atribuindo...
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            Atribuir Horários ({selectedTimesForAssignment.length})
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Mensagem quando nenhum atendente está selecionado */}
                {!selectedAttendant && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-base font-medium mb-1 text-gray-700">Selecione um atendente</p>
                    <p className="text-sm text-gray-500">Escolha um atendente para visualizar os horários disponíveis</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="atribuidos" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Horários Atribuídos</h3>
                </div>
                
                {Object.keys(assignedSchedules).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-base font-medium mb-1 text-gray-700">Nenhum horário atribuído</p>
                    <p className="text-sm text-gray-500">Use a aba "Atribuir Horários" para atribuir horários aos atendentes</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(assignedSchedules).map(([attendantId, schedules]) => {
                      const attendant = attendants?.find(a => a.id === attendantId);
                      return (
                        <div key={attendantId} className="space-y-3">
                          <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                            <h4 className="text-base font-semibold text-blue-900">
                              {attendant?.name || 'Atendente não encontrado'}
                            </h4>
                          </div>
                          
                          <div className="bg-white rounded-lg border overflow-hidden">
                            <div className="grid grid-cols-4 gap-6 px-6 py-4 bg-gray-50 border-b font-medium text-sm text-gray-700">
                              <div>Dia</div>
                              <div>Horário</div>
                              <div>Duração</div>
                              <div>Ações</div>
                            </div>
                            
                            {schedules.map((schedule, index) => (
                              <div key={`${schedule.id}-${index}`} className="grid grid-cols-4 gap-6 px-6 py-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                                <div className="text-gray-600 text-sm">
                                  {schedule.days}
                                </div>
                                <div className="font-medium text-gray-900 text-sm">
                                  {schedule.time}
                                </div>
                                <div className="text-gray-600 text-sm">
                                  {schedule.duration} minutos
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        // Remover do banco de dados
                                        await scheduleAssignmentsService.deleteAssignment(schedule.id);
                                        
                                        // Remover do estado local
                                        setAssignedSchedules(prev => {
                                          const updated = { ...prev };
                                          updated[attendantId] = updated[attendantId].filter((_, i) => i !== index);
                                          if (updated[attendantId].length === 0) {
                                            delete updated[attendantId];
                                          }
                                          return updated;
                                        });
                                        
                                        toast.success('Horário removido da atribuição');
                                      } catch (error) {
                                        console.error('Erro ao remover horário atribuído:', error);
                                        toast.error('Erro ao remover horário atribuído');
                                      }
                                    }}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                    title="Remover atribuição"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Editar Horário
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Dias da Semana */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Dias da Semana</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(dayLabels).map(([dayNum, dayLabel]) => {
                  const day = Number(dayNum);
                  const isSelected = selectedDaysEdit.includes(day);
                  return (
                    <Button
                      key={day}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`min-w-[50px] ${
                        isSelected 
                          ? 'bg-slate-900 text-white hover:bg-slate-800' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleDayEdit(day)}
                    >
                      {dayLabel}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Horário de Início */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time" className="text-sm font-medium">Horário de Início</Label>
                <Input
                  id="start_time"
                  type="time"
                  step="60"
                  data-format="24"
                  data-time-format="24"
                  pattern="[0-9]{2}:[0-9]{2}"
                  value={editFormData.start_time}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="mt-1"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              
              {/* Duração */}
              <div>
                <Label htmlFor="duration" className="text-sm font-medium">Duração (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="480"
                  value={editFormData.duration}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                  placeholder="Ex: 30"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Status Disponível */}
            <div className="flex items-center space-x-3">
              <Switch
                id="available"
                checked={editFormData.available}
                onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, available: checked }))}
              />
              <Label htmlFor="available" className="text-sm font-medium text-green-600">
                Disponível
              </Label>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-slate-900 hover:bg-slate-800"
            >
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este horário? Esta ação não pode ser desfeita.
              {scheduleToDelete && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md">
                  <p><strong>Horário:</strong> {scheduleToDelete.start_time}</p>
                  <p><strong>Dias:</strong> {scheduleToDelete.daysLabel}</p>
                  <p><strong>Duração:</strong> {scheduleToDelete.duration} minutos</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSchedule}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Horarios;