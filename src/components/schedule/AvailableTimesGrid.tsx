import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, Calendar } from 'lucide-react';

interface TimeSlot {
  id: string;
  time: string;
  duration: number;
  isSelected: boolean;
}

interface AvailableTimesGridProps {
  onTimesSelected?: (selectedTimes: TimeSlot[]) => void;
}

const AvailableTimesGrid: React.FC<AvailableTimesGridProps> = ({ onTimesSelected }) => {
  const [selectedAttendant, setSelectedAttendant] = useState<string>('');
  const [selectedTimes, setSelectedTimes] = useState<TimeSlot[]>([]);

  // Dados mockados baseados na imagem 2
  const availableTimes: TimeSlot[] = [
    { id: '1', time: '08:00:00', duration: 30, isSelected: false },
    { id: '2', time: '08:30:00', duration: 30, isSelected: false },
    { id: '3', time: '09:00:00', duration: 30, isSelected: false },
    { id: '4', time: '09:15:00', duration: 30, isSelected: false },
    { id: '5', time: '09:45:00', duration: 30, isSelected: false },
    { id: '6', time: '10:30:00', duration: 30, isSelected: false },
    { id: '7', time: '10:55:00', duration: 30, isSelected: false },
    { id: '8', time: '11:20:00', duration: 30, isSelected: false },
    { id: '9', time: '11:45:00', duration: 30, isSelected: false },
  ];

  const attendants = [
    { id: 'jerime', name: 'Jerime' },
    { id: 'ana', name: 'Ana Silva' },
    { id: 'carlos', name: 'Carlos Santos' },
  ];

  const handleTimeToggle = (timeSlot: TimeSlot) => {
    const updatedTimes = selectedTimes.some(t => t.id === timeSlot.id)
      ? selectedTimes.filter(t => t.id !== timeSlot.id)
      : [...selectedTimes, timeSlot];
    
    setSelectedTimes(updatedTimes);
    onTimesSelected?.(updatedTimes);
  };

  const isTimeSelected = (timeId: string) => {
    return selectedTimes.some(t => t.id === timeId);
  };

  const handleAttendantChange = (attendantId: string) => {
    setSelectedAttendant(attendantId);
    setSelectedTimes([]);
    onTimesSelected?.([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Gerenciamento de Horários</h2>
        
        {/* Tabs simuladas */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            Horários Disponíveis
          </button>
          <button className="px-4 py-2 text-sm font-medium bg-white text-blue-600 rounded-md shadow-sm">
            Atribuir Horários
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            Horários Atribuídos
          </button>
        </div>
      </div>

      {/* Seleção de Atendente */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Selecionar Atendente:</label>
        <Select value={selectedAttendant} onValueChange={handleAttendantChange}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="Selecione um atendente" />
          </SelectTrigger>
          <SelectContent>
            {attendants.map((attendant) => (
              <SelectItem key={attendant.id} value={attendant.id}>
                {attendant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid de Horários Disponíveis */}
      {selectedAttendant && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-gray-900">
              Horários Disponíveis
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">Segunda a Sexta</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-3 gap-3">
              {availableTimes.map((timeSlot) => (
                <div
                  key={timeSlot.id}
                  className={`
                    relative p-3 border rounded-md cursor-pointer transition-all duration-150
                    ${
                      isTimeSelected(timeSlot.id)
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handleTimeToggle(timeSlot)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className={`text-sm font-medium ${
                        isTimeSelected(timeSlot.id) ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {timeSlot.time}
                      </div>
                      <div className={`text-xs ${
                        isTimeSelected(timeSlot.id) ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {timeSlot.duration} minutos
                      </div>
                    </div>
                    <Checkbox
                      checked={isTimeSelected(timeSlot.id)}
                      onChange={() => handleTimeToggle(timeSlot)}
                      className="pointer-events-none h-4 w-4"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Contador de selecionados */}
            {selectedTimes.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedTimes.length} horário(s) selecionado(s)
                  </span>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 text-sm"
                    onClick={() => {
                      // Aqui seria a lógica para atribuir os horários
                      console.log('Atribuindo horários:', selectedTimes);
                    }}
                  >
                    Atribuir Horários
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando nenhum atendente está selecionado */}
      {!selectedAttendant && (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-base font-medium mb-1 text-gray-700">Selecione um atendente</p>
              <p className="text-sm text-gray-500">Escolha um atendente para visualizar os horários disponíveis</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AvailableTimesGrid;