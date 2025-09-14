import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DurationField } from '@/components/ui/duration-field';
import { ArrowLeft, Clock } from 'lucide-react';
import { useSchedules } from '@/hooks/useSchedules';
import { toast } from 'sonner';

const NovoHorario: React.FC = () => {
  const navigate = useNavigate();
  const { createSchedule } = useSchedules();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [formData, setFormData] = useState({
    startTime: '08:00:00',
    duration: '30'
  });


  const daysOfWeek = [
    { id: 'segunda', label: 'Segunda', dayNumber: 1 },
    { id: 'terca', label: 'Terça', dayNumber: 2 },
    { id: 'quarta', label: 'Quarta', dayNumber: 3 },
    { id: 'quinta', label: 'Quinta', dayNumber: 4 },
    { id: 'sexta', label: 'Sexta', dayNumber: 5 },
    { id: 'sabado', label: 'Sábado', dayNumber: 6 },
    { id: 'domingo', label: 'Domingo', dayNumber: 0 },
  ];

  // Inicializar com Segunda, Terça e Quarta selecionadas (conforme imagem)
  React.useEffect(() => {
    setSelectedDays(['segunda', 'terca', 'quarta']);
  }, []);

  const toggleDay = (dayId: string) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  // Função para agrupar dias consecutivos
  const groupConsecutiveDays = (days: string[]): { days: number[], label: string }[] => {
    const dayMapping: { [key: string]: number } = {
      'domingo': 0, 'segunda': 1, 'terca': 2, 'quarta': 3,
      'quinta': 4, 'sexta': 5, 'sabado': 6
    };
    
    const dayLabels: { [key: number]: string } = {
      0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua',
      4: 'qui', 5: 'sex', 6: 'sáb'
    };
    
    // Converter para números e ordenar
    const dayNumbers = days.map(day => dayMapping[day]).sort((a, b) => a - b);
    
    const groups: { days: number[], label: string }[] = [];
    let currentGroup: number[] = [];
    
    for (let i = 0; i < dayNumbers.length; i++) {
      const currentDay = dayNumbers[i];
      
      if (currentGroup.length === 0) {
        currentGroup = [currentDay];
      } else {
        const lastDay = currentGroup[currentGroup.length - 1];
        
        // Verificar se é consecutivo (considerando domingo = 0 e sábado = 6)
        if (currentDay === lastDay + 1 || (lastDay === 6 && currentDay === 0)) {
          currentGroup.push(currentDay);
        } else {
          // Finalizar grupo atual e começar novo
          const label = currentGroup.length === 1 
            ? dayLabels[currentGroup[0]]
            : `${dayLabels[currentGroup[0]]} a ${dayLabels[currentGroup[currentGroup.length - 1]]}`;
          
          groups.push({ days: [...currentGroup], label });
          currentGroup = [currentDay];
        }
      }
    }
    
    // Adicionar último grupo
    if (currentGroup.length > 0) {
      const label = currentGroup.length === 1 
        ? dayLabels[currentGroup[0]]
        : `${dayLabels[currentGroup[0]]} a ${dayLabels[currentGroup[currentGroup.length - 1]]}`;
      
      groups.push({ days: [...currentGroup], label });
    }
    
    return groups;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedDays.length === 0) {
      toast.error('Selecione pelo menos um dia da semana');
      return;
    }

    // Validações adicionais
    if (!formData.startTime) {
      toast.error('Horário de início é obrigatório');
      return;
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      toast.error('Duração deve ser maior que zero');
      return;
    }

    try {
      console.log('Criando horários para os dias:', selectedDays);
      console.log('Dados do formulário:', formData);
      
      // Mapear dias selecionados para nomes completos
      const dayMapping: { [key: string]: string } = {
        'domingo': 'Domingo', 'segunda': 'Segunda', 'terca': 'Terça', 'quarta': 'Quarta',
        'quinta': 'Quinta', 'sexta': 'Sexta', 'sabado': 'Sábado'
      };
      
      // Converter dias selecionados para array de nomes completos
      const daysArray = selectedDays.map(day => dayMapping[day]);
      
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
      
      // Ordenar os dias corretamente
      const sortedDaysArray = sortDaysInWeekOrder(daysArray);
      
      // Primeiro dia do intervalo (para a coluna 'day')
      const firstDay = getFirstDayOfInterval(daysArray);
      
      // Validar duração
      const durationMinutes = parseInt(formData.duration);
      if (isNaN(durationMinutes) || durationMinutes <= 0) {
        throw new Error(`Duração inválida: ${formData.duration}`);
      }
      
      // Preparar dados para o novo esquema
      const scheduleData = {
        day: firstDay, // Primeiro dia da semana do intervalo
        days: sortedDaysArray, // Array com todos os dias selecionados e ordenados
        start_time: formData.startTime, // Horário de início
        duration: durationMinutes, // Duração em minutos
        available: isAvailable // Status de disponibilidade
      };
      
      console.log('🔍 DEBUG - Dados ordenados:', {
        daysArray: daysArray,
        sortedDaysArray: sortedDaysArray,
        firstDay: firstDay,
        scheduleData: scheduleData
      });

      console.log('Dados do horário para novo esquema:', scheduleData);
      
      await createSchedule.mutateAsync(scheduleData);
      
      const statusMessage = isAvailable 
        ? 'Horário criado com sucesso!' 
        : 'Horário criado como indisponível!';
      
      toast.success(statusMessage);
      navigate('/horarios');
    } catch (error) {
      console.error('Erro detalhado ao criar horário:', error);
      
      // Verificar se é um erro específico do Supabase
      if (error instanceof Error) {
        if (error.message.includes('duplicate key')) {
          toast.error('Já existe um horário para este dia e horário');
        } else if (error.message.includes('invalid input')) {
          toast.error('Dados inválidos fornecidos');
        } else {
          toast.error(`Erro ao criar horário: ${error.message}`);
        }
      } else {
        toast.error('Erro desconhecido ao criar horário');
      }
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/horarios')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Horário</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo Horário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dias da Semana */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Dias da Semana</Label>
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day) => (
                  <Button
                    key={day.id}
                    type="button"
                    variant="outline"
                    className={`h-10 text-sm font-medium transition-all ${
                      selectedDays.includes(day.id) 
                        ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-700' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => toggleDay(day.id)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Horário */}
            <div className="space-y-3">
              <Label htmlFor="time" className="text-sm font-medium text-gray-700">Horário</Label>
              <div className="relative">
                <Input
                  id="time"
                  type="time"
                  step="3600"
                  data-format="24"
                  data-time-format="24"
                  pattern="[0-9]{2}:[0-9]{2}"
                  value={formData.startTime ? formData.startTime.substring(0, 5) : ''}
                  onChange={(e) => {
                    const timeValue = e.target.value ? `${e.target.value}:00` : '';
                    setFormData({ ...formData, startTime: timeValue });
                  }}
                  className="w-full h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  style={{ colorScheme: 'dark' }}
                />
                <Clock className="absolute right-3 top-3 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Duração */}
            <DurationField
              label="Duração (minutos)"
              value={formData.duration}
              onChange={(value) => setFormData({ ...formData, duration: value })}
              className="w-full h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              required
            />

            {/* Status Switch */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Switch
                  checked={isAvailable}
                  onCheckedChange={setIsAvailable}
                  className="data-[state=checked]:bg-emerald-500"
                />
                <Label className="text-sm font-medium text-gray-700">
                  {isAvailable ? 'Disponível' : 'Indisponível'}
                </Label>
              </div>
              <span className={`text-sm font-medium ${
                isAvailable ? 'text-emerald-600' : 'text-gray-500'
              }`}>
                {isAvailable ? '✓ Ativo' : '○ Inativo'}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/horarios')}
                className="px-6 py-2 text-sm font-medium"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                className="px-6 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white"
              >
                Adicionar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NovoHorario;