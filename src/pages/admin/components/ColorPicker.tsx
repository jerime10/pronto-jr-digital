
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ 
  id, 
  name, 
  label, 
  value, 
  onChange 
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          name={name}
          type="color"
          value={value}
          onChange={onChange}
          className="w-12 h-10 p-1 cursor-pointer"
        />
        <Input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          className="flex-1"
        />
      </div>
    </div>
  );
};

export default ColorPicker;
