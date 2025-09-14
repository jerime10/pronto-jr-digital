import React from 'react';
import { Input } from './input';
import { Label } from './label';

interface DurationFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
}

export const DurationField: React.FC<DurationFieldProps> = ({
  label = 'Duração (minutos)',
  value,
  onChange,
  disabled = false,
  required = false,
  placeholder = 'Ex: 30',
  min = '1',
  max = '480',
  className = 'mt-1'
}) => {
  return (
    <div>
      <Label htmlFor="duration" className="text-sm font-medium">{label}</Label>
      <Input
        id="duration"
        type="number"
        min={min}
        max={max}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={className}
      />
    </div>
  );
};

export default DurationField;