
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface PeriodSelectorProps {
  selectedPeriod: number;
  onPeriodChange: (period: number) => void;
}

const periods = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
];

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ 
  selectedPeriod, 
  onPeriodChange 
}) => {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium text-gray-700">Período:</span>
      <div className="flex gap-1">
        {periods.map(({ label, value }) => (
          <Button
            key={value}
            variant={selectedPeriod === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPeriodChange(value)}
            className="h-8"
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
};
