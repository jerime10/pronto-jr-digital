import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Trash2 } from 'lucide-react';

interface HorariosAtribuidosProps {
  assignedTimes: any[];
  onRemoveTime: (timeId: string) => void;
}

export const HorariosAtribuidos: React.FC<HorariosAtribuidosProps> = ({ assignedTimes, onRemoveTime }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Horários Atribuídos</CardTitle>
      </CardHeader>
      <CardContent>
        {assignedTimes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {assignedTimes.map((time: any) => (
              <div key={time.id} className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <p className="font-semibold">{time.dayOfWeek}</p>
                  <p className="text-sm text-gray-500">{time.time} - {time.duration} minutos</p>
                </div>
                <Button variant="destructive" size="icon" onClick={() => onRemoveTime(time.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div>Nenhum horário atribuído ainda.</div>
        )}
      </CardContent>
    </Card>
  );
};