
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { formatDate, parseDate } from '@/utils/dateUtils';
import { formatPhoneNumber, isValidPhoneNumber } from '@/utils/phoneUtils';
import { formatCpfOrSus, isValidCpfOrSus } from '@/utils/cpfSusUtils';
import { ptBR } from 'date-fns/locale';
import { isValid } from 'date-fns';

interface PatientFormData {
  name: string;
  sus: string;
  gender: string;
  date_of_birth: Date | null;
  age: number;
  phone: string;
  address: string;
  bairro: string;
}

interface PatientFormFieldsProps {
  formData: PatientFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDateChange: (date: Date | null) => void;
  handleGenderChange: (value: string) => void;
  readOnlyFields?: string[];
}

// Função para lidar com mudança de telefone
const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => {
  const formatted = formatPhoneNumber(e.target.value);
  
  // Criar um evento sintético com o valor formatado
  const syntheticEvent = {
    ...e,
    target: {
      ...e.target,
      name: 'phone',
      value: formatted
    }
  };
  
  handleChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
};

// Função para lidar com mudança de CPF/SUS
const handleCpfSusChange = (e: React.ChangeEvent<HTMLInputElement>, handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => {
  const formatted = formatCpfOrSus(e.target.value);
  
  // Criar um evento sintético com o valor formatado
  const syntheticEvent = {
    ...e,
    target: {
      ...e.target,
      name: 'sus',
      value: formatted
    }
  };
  
  handleChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
};

// Função para lidar com mudança de bairro
const handleBairroChange = (e: React.ChangeEvent<HTMLInputElement>, handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => {
  const value = e.target.value;
  
  // Permitir apenas letras, espaços e acentos, convertendo para maiúsculas
  const cleanValue = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').toUpperCase();
  
  // Criar evento sintético com valor formatado
  const syntheticEvent = {
    ...e,
    target: {
      ...e.target,
      name: 'bairro',
      value: cleanValue
    }
  };
  
  handleChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
};

export const PatientFormFields: React.FC<PatientFormFieldsProps> = ({
  formData,
  handleChange,
  handleDateChange,
  handleGenderChange,
  readOnlyFields = []
}) => {
  const [dateInputValue, setDateInputValue] = useState('');
  const [dateInputError, setDateInputError] = useState('');
  
  // Initialize dateInputValue from formData.date_of_birth
  useEffect(() => {
    if (formData.date_of_birth) {
      setDateInputValue(formatDate(formData.date_of_birth));
    }
  }, [formData.date_of_birth]);
  
  const formatDateInput = (input: string): string => {
    // Remove caracteres não numéricos
    const numbers = input.replace(/\D/g, '');
    
    // Aplica máscara DD/MM/AAAA
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatDateInput(rawValue);
    
    setDateInputValue(formattedValue);
    setDateInputError('');
    
    // Verifica se temos uma data completa para validar (DD/MM/AAAA)
    if (formattedValue.length === 10) {
      // Tenta analisar a data
      const parsedDate = parseDate(formattedValue);
      
      if (parsedDate && isValid(parsedDate)) {
        handleDateChange(parsedDate);
      } else {
        setDateInputError('Data inválida. Use o formato DD/MM/AAAA');
      }
    } else if (rawValue.length > 10) {
      setDateInputError('Use o formato DD/MM/AAAA');
    } else if (formattedValue.length > 0) {
      // Se temos valor parcial, limpe a data atual até que tenhamos uma data válida completa
      handleDateChange(null);
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <div className="space-y-3">
        <Label htmlFor="name" className="text-slate-200 font-semibold text-sm tracking-wide">
          NOME COMPLETO <span className="text-pink-400">*</span>
        </Label>
        <div className="relative">
          <Input
            id="name"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            placeholder="NOME COMPLETO DO PACIENTE"
            required
            readOnly={readOnlyFields.includes('name')}
            className={`h-11 sm:h-12 text-base font-medium transition-all duration-200 ${
              readOnlyFields.includes('name') 
                ? 'bg-slate-600/30 cursor-not-allowed opacity-70 text-slate-400 border-slate-600/50' 
                : 'bg-white text-slate-900 border-slate-300 hover:border-purple-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-500'
            }`}
          />
        </div>
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="sus" className="text-slate-200 font-semibold text-sm tracking-wide">
          CPF OU SUS <span className="text-pink-400">*</span>
        </Label>
        <div className="relative">
          <Input
            id="sus"
            name="sus"
            value={formData.sus || ''}
            onChange={(e) => readOnlyFields.includes('sus') ? null : handleCpfSusChange(e, handleChange)}
            placeholder="CPF (XXX.XXX.XXX-XX) OU SUS (XXX XXXX XXXX XXXX)"
            required
            readOnly={readOnlyFields.includes('sus')}
            className={`h-11 sm:h-12 text-base font-medium transition-all duration-200 ${
              readOnlyFields.includes('sus') 
                ? 'bg-slate-600/30 cursor-not-allowed opacity-70 text-slate-400 border-slate-600/50' 
                : formData.sus && !isValidCpfOrSus(formData.sus)
                  ? 'bg-white text-slate-900 border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 placeholder:text-slate-500'
                  : 'bg-white text-slate-900 border-slate-300 hover:border-purple-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-500'
            }`}
          />
        </div>
        {formData.sus && !isValidCpfOrSus(formData.sus) && !readOnlyFields.includes('sus') && (
          <p className="text-red-400 text-xs">
            CPF deve ter 11 dígitos ou SUS deve ter 15 dígitos
          </p>
        )}
        {formData.sus && isValidCpfOrSus(formData.sus) && !readOnlyFields.includes('sus') && (
          <p className="text-green-400 text-xs">
            ✓ Documento válido
          </p>
        )}
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="gender" className="text-slate-200 font-semibold text-sm tracking-wide">
          SEXO
        </Label>
        <Select value={formData.gender || ''} onValueChange={handleGenderChange} disabled={readOnlyFields.includes('gender')}>
          <SelectTrigger id="gender" className={`h-11 sm:h-12 text-base font-medium transition-all duration-200 ${
            readOnlyFields.includes('gender') 
              ? 'bg-slate-600/30 cursor-not-allowed opacity-70 text-slate-400 border-slate-600/50' 
              : 'bg-white text-slate-900 border-slate-300 hover:border-purple-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
          }`}>
            <SelectValue placeholder="SELECIONE O SEXO" className="text-slate-500" />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-300">
            <SelectItem value="Masculino" className="text-slate-900 hover:bg-slate-100 focus:bg-slate-100">MASCULINO</SelectItem>
            <SelectItem value="Feminino" className="text-slate-900 hover:bg-slate-100 focus:bg-slate-100">FEMININO</SelectItem>
            <SelectItem value="Outro" className="text-slate-900 hover:bg-slate-100 focus:bg-slate-100">OUTRO</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="date_of_birth" className="text-slate-200 font-semibold text-sm tracking-wide">
          DATA DE NASCIMENTO <span className="text-xs text-slate-400 font-normal">(DIGITE APENAS NÚMEROS)</span>
        </Label>
        <div className="flex flex-col space-y-3">
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <div className="relative flex-1">
              <Input
                id="date_input"
                value={dateInputValue}
                onChange={handleDateInputChange}
                placeholder="DD/MM/AAAA (DIGITE APENAS NÚMEROS)"
                readOnly={readOnlyFields.includes('date_of_birth')}
                className={`h-11 sm:h-12 text-base font-medium transition-all duration-200 ${
                  readOnlyFields.includes('date_of_birth') 
                    ? 'bg-slate-600/30 cursor-not-allowed opacity-70 text-slate-400 border-slate-600/50' 
                    : dateInputError
                      ? 'bg-white text-slate-900 border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 placeholder:text-slate-500'
                      : 'bg-white text-slate-900 border-slate-300 hover:border-purple-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-500'
                }`}
                maxLength={10}
              />
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={readOnlyFields.includes('date_of_birth')}
                  className={`w-full sm:w-auto h-11 sm:h-12 font-semibold tracking-wide transition-all duration-200 ${
                    readOnlyFields.includes('date_of_birth') 
                      ? 'bg-slate-600/30 cursor-not-allowed opacity-70 text-slate-400 border-slate-600/50' 
                      : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50 hover:border-purple-500'
                  }`}
                  id="date_of_birth"
                  type="button"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  CALENDÁRIO
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                <Calendar
                  mode="single"
                  selected={formData.date_of_birth || undefined}
                  onSelect={(date) => {
                    handleDateChange(date);
                    if (date) {
                      setDateInputValue(formatDate(date));
                    }
                  }}
                  initialFocus
                  locale={ptBR}
                  className="p-3 pointer-events-auto bg-slate-800 text-white"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {dateInputError && (
            <span className="text-red-400 text-sm font-medium">{dateInputError}</span>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="age" className="text-slate-200 font-semibold text-sm tracking-wide">
          IDADE
        </Label>
        <div className="relative">
          <Input
            id="age"
            name="age"
            type="number"
            value={formData.age || ''}
            onChange={handleChange}
            placeholder="IDADE (CALCULADA AUTOMATICAMENTE)"
            readOnly
            className="bg-slate-600/30 border-slate-600/30 text-slate-300 placeholder:text-slate-500 h-11 sm:h-12 backdrop-blur-sm cursor-not-allowed"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 to-slate-400/5 rounded-md pointer-events-none"></div>
        </div>
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="phone" className="text-slate-200 font-semibold text-sm tracking-wide">
          TELEFONE
        </Label>
        <div className="relative">
          <Input
            id="phone"
            name="phone"
            value={formData.phone || ''}
            onChange={(e) => !readOnlyFields.includes('phone') && handlePhoneChange(e, handleChange)}
            placeholder="(XX)XXXXX-XXXX"
            readOnly={readOnlyFields.includes('phone')}
            maxLength={14}
            className={`h-11 sm:h-12 text-base font-medium transition-all duration-200 ${
              readOnlyFields.includes('phone') 
                ? 'bg-slate-600/30 cursor-not-allowed opacity-70 text-slate-400 border-slate-600/50' 
                : formData.phone && !isValidPhoneNumber(formData.phone)
                  ? 'bg-white text-slate-900 border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 placeholder:text-slate-500'
                  : 'bg-white text-slate-900 border-slate-300 hover:border-purple-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-500'
            }`}
          />
        </div>
        {formData.phone && !isValidPhoneNumber(formData.phone) && !readOnlyFields.includes('phone') && (
          <p className="text-red-400 text-xs">
            Formato de telefone inválido. Use o formato: (XX)XXXXX-XXXX
          </p>
        )}
        {formData.phone && isValidPhoneNumber(formData.phone) && !readOnlyFields.includes('phone') && (
          <p className="text-green-400 text-xs">
            ✓ Telefone válido
          </p>
        )}
      </div>
      
      <div className="space-y-3 md:col-span-2">
        <Label htmlFor="address" className="text-slate-200 font-semibold text-sm tracking-wide">
          ENDEREÇO
        </Label>
        <div className="relative">
          <Input
            id="address"
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            placeholder="ENDEREÇO COMPLETO"
            readOnly={readOnlyFields.includes('address')}
            className={`h-11 sm:h-12 text-base font-medium transition-all duration-200 ${
              readOnlyFields.includes('address') 
                ? 'bg-slate-600/30 cursor-not-allowed opacity-70 text-slate-400 border-slate-600/50' 
                : 'bg-white text-slate-900 border-slate-300 hover:border-purple-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-500'
            }`}
          />
        </div>
      </div>
      
      <div className="space-y-3">
        <Label htmlFor="bairro" className="text-slate-200 font-semibold text-sm tracking-wide">
          BAIRRO
        </Label>
        <div className="relative">
          <Input
            id="bairro"
            name="bairro"
            value={formData.bairro || ''}
            onChange={(e) => !readOnlyFields.includes('bairro') && handleBairroChange(e, handleChange)}
            placeholder="BAIRRO"
            readOnly={readOnlyFields.includes('bairro')}
            className={`h-11 sm:h-12 text-base font-medium transition-all duration-200 ${
              readOnlyFields.includes('bairro') 
                ? 'bg-slate-600/30 cursor-not-allowed opacity-70 text-slate-400 border-slate-600/50' 
                : 'bg-white text-slate-900 border-slate-300 hover:border-purple-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 placeholder:text-slate-500'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
