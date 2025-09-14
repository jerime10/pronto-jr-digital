
import React from 'react';
import { Label } from '@/components/ui/label';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';

interface AttendanceDateTimeProps {
  startDateTime?: Date;
  endDateTime?: Date;
  onStartDateTimeChange: (date: Date | undefined) => void;
  onEndDateTimeChange: (date: Date | undefined) => void;
  disabled?: boolean;
}

export const AttendanceDateTime: React.FC<AttendanceDateTimeProps> = ({
  startDateTime,
  endDateTime,
  onStartDateTimeChange,
  onEndDateTimeChange,
  disabled = false
}) => {
  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium">Horários do Atendimento</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-datetime">
              Data/Hora de Início <span className="text-red-500">*</span>
            </Label>
            <DateTimePicker
              value={startDateTime}
              onChange={onStartDateTimeChange}
              placeholder="Selecione data e hora de início"
              disabled={disabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="end-datetime">
              Data/Hora de Finalização
            </Label>
            <DateTimePicker
              value={endDateTime}
              onChange={onEndDateTimeChange}
              placeholder="Selecione data e hora de fim"
              disabled={disabled}
            />
          </div>
        </div>
        
        {startDateTime && endDateTime && endDateTime <= startDateTime && (
          <div className="mt-2 text-sm text-red-600">
            A data/hora de finalização deve ser posterior à data/hora de início.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
