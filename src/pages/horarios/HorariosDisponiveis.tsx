import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActiveAttendants } from '../../hooks/useAttendants';
import { useAvailabilityService } from '../../services/availabilityService';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Button } from '../../components/ui/button';
import { toast } from '../../hooks/use-toast';

interface HorariosDisponiveisProps {
  onHorariosSelecionadosChange: (count: number) => void;
  onAtribuirHorarios: (selectedTimes: any[], attendantId: string) => void;
}

export const HorariosDisponiveis: React.FC<HorariosDisponiveisProps> = ({ onHorariosSelecionadosChange, onAtribuirHorarios }) => {
  const availabilityService = useAvailabilityService();

  // Usar o hook para buscar apenas atendentes ativos
  const { data: attendants, isLoading: isLoadingAttendants, error, refetch: refetchAttendants } = useActiveAttendants();

  // Função para forçar recarregamento dos atendentes
  const handleRefreshAttendants = () => {
    console.log('🔄 Forçando refresh dos atendentes...');
    refetchAttendants();
  };

  // Teste direto da função fetchActiveAttendants
  const testDirectFetch = async () => {
    try {
      const { fetchActiveAttendants } = await import('../../services/attendantService');
      const result = await fetchActiveAttendants();
      console.log('🧪 Teste direto - Resultado:', result);
    } catch (error) {
      console.error('🧪 Teste direto - Erro:', error);
    }
  };

  // Executar teste na montagem do componente
  useEffect(() => {
    testDirectFetch();
  }, []);

  const [selectedAttendant, setSelectedAttendant] = useState<string | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<any[]>([]);

  const { data: availableTimes, isLoading: isLoadingAvailableTimes, refetch: refetchAvailableTimes } = useQuery({
    queryKey: ['availableTimes', selectedAttendant],
    queryFn: () => availabilityService.getAvailableTimes(selectedAttendant!),
    enabled: !!selectedAttendant,
  });

  useEffect(() => {
    onHorariosSelecionadosChange(selectedTimes.length);
  }, [selectedTimes, onHorariosSelecionadosChange]);

  const handleSelectAttendant = (attendantId: string) => {
    setSelectedAttendant(attendantId);
    setSelectedTimes([]);
  };

  const handleToggleTime = (time: any) => {
    setSelectedTimes((prevSelectedTimes) =>
      prevSelectedTimes.some((t) => t.id === time.id)
        ? prevSelectedTimes.filter((t) => t.id !== time.id)
        : [...prevSelectedTimes, time]
    );
  };

  const handleAtribuirHorarios = async () => {
    if (!selectedAttendant) {
      toast({
        title: 'Erro',
        description: 'Selecione um atendente para atribuir os horários.',
        variant: 'destructive',
      });
      return;
    }
    if (selectedTimes.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos um horário para atribuir.',
        variant: 'destructive',
      });
      return;
    }

    onAtribuirHorarios(selectedTimes, selectedAttendant);
    setSelectedTimes([]);
    refetchAvailableTimes();
  };

  if (isLoadingAttendants) {
    return <div>Carregando atendentes...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <span className="font-medium">Selecionar Atendente:</span>
        <Select onValueChange={handleSelectAttendant} value={selectedAttendant || ''}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecione um atendente" />
          </SelectTrigger>
          <SelectContent>
            {attendants?.map((attendant) => (
              <SelectItem key={attendant.id} value={attendant.id}>
                {attendant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleRefreshAttendants} variant="outline" size="sm">
          🔄 Refresh
        </Button>
      </div>

      {selectedAttendant && (
        <Card>
          <CardHeader>
            <CardTitle>Horários Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAvailableTimes ? (
              <div>Carregando horários disponíveis...</div>
            ) : availableTimes && availableTimes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {availableTimes.map((time: any) => (
                  <div
                    key={time.id}
                    className={`flex items-center justify-between p-4 border rounded-md ${selectedTimes.some((t) => t.id === time.id) ? 'bg-blue-100 border-blue-500' : ''}`}
                  >
                    <div>
                      <p className="font-semibold">{time.time}</p>
                      <p className="text-sm text-gray-500">{time.duration} minutos</p>
                    </div>
                    <Checkbox
                      checked={selectedTimes.some((t) => t.id === time.id)}
                      onCheckedChange={() => handleToggleTime(time)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>Nenhum horário disponível para este atendente.</div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm font-medium">{selectedTimes.length} horário(s) selecionado(s)</p>
        <Button onClick={handleAtribuirHorarios} disabled={selectedTimes.length === 0 || !selectedAttendant}>
          Atribuir Horários
        </Button>
      </div>
    </div>
  );
};