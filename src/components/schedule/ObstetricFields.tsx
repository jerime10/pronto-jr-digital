import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ObstetricData {
  dum?: string;
  gestationalAge?: string; // Changed to string to match usage
  dpp?: string;
  isValid?: boolean;
}

export interface ObstetricFieldsProps {
  data?: ObstetricData; // Made optional
  onChange?: (data: ObstetricData) => void;
  onDataChange?: (data: ObstetricData) => void;
  className?: string;
}

export const ObstetricFields: React.FC<ObstetricFieldsProps> = ({ 
  data = {}, // Provide default empty object
  onChange, 
  onDataChange,
  className = ''
}) => {
  const handleChange = (newData: ObstetricData) => {
    if (onChange) onChange(newData);
    if (onDataChange) onDataChange(newData);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <Label htmlFor="dum">DUM (Data da Última Menstruação)</Label>
        <Input
          id="dum"
          type="date"
          value={data.dum || ''}
          onChange={(e) => handleChange({ ...data, dum: e.target.value, isValid: true })}
          placeholder="Selecione a data"
        />
      </div>
      {data.gestationalAge && (
        <div>
          <Label>Idade Gestacional: {data.gestationalAge} semanas</Label>
        </div>
      )}
      {data.dpp && (
        <div>
          <Label>Data Provável do Parto: {data.dpp}</Label>
        </div>
      )}
    </div>
  );
};