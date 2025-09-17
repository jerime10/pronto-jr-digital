import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Baby, Calendar, Clock } from 'lucide-react';
import { 
  calculateGestationalAge, 
  calculateDPP, 
  isValidDateFormat, 
  formatDateInput 
} from '@/utils/obstetricUtils';

interface ObstetricFieldsProps {
  onDataChange: (data: ObstetricData) => void;
  className?: string;
}

export interface ObstetricData {
  dum: string;
  gestationalAge: string;
  dpp: string;
  isValid: boolean;
}

export const ObstetricFields: React.FC<ObstetricFieldsProps> = ({ 
  onDataChange, 
  className = "" 
}) => {
  const [dum, setDum] = useState('');
  const [gestationalAge, setGestationalAge] = useState('');
  const [dpp, setDpp] = useState('');
  const [error, setError] = useState('');

  // Atualiza os cálculos quando DUM muda
  useEffect(() => {
    if (dum.length === 10) {
      if (isValidDateFormat(dum)) {
        const gestAge = calculateGestationalAge(dum);
        const calculatedDpp = calculateDPP(dum);

        if (gestAge && calculatedDpp) {
          setGestationalAge(gestAge.formatted);
          setDpp(calculatedDpp);
          setError('');
          
          // Notifica o componente pai
          onDataChange({
            dum,
            gestationalAge: gestAge.formatted,
            dpp: calculatedDpp,
            isValid: true
          });
        } else {
          setError('Data inválida ou fora do período gestacional válido (0-42 semanas)');
          setGestationalAge('');
          setDpp('');
          
          onDataChange({
            dum,
            gestationalAge: '',
            dpp: '',
            isValid: false
          });
        }
      } else {
        setError('Formato de data inválido. Use DD/MM/AAAA');
        setGestationalAge('');
        setDpp('');
        
        onDataChange({
          dum,
          gestationalAge: '',
          dpp: '',
          isValid: false
        });
      }
    } else {
      setGestationalAge('');
      setDpp('');
      setError('');
      
      onDataChange({
        dum,
        gestationalAge: '',
        dpp: '',
        isValid: false
      });
    }
  }, [dum]); // Removido onDataChange das dependências para evitar loop infinito

  const handleDumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatDateInput(e.target.value);
    setDum(formatted);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Alert className="bg-gradient-to-r from-pink-900/50 to-purple-900/50 border-pink-500/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="bg-pink-500/20 p-2 rounded-full">
            <Baby className="h-5 w-5 text-pink-400" />
          </div>
          <AlertDescription className="text-pink-100 text-sm sm:text-base leading-relaxed">
            CONSULTA OBSTÉTRICA - Preencha os dados gestacionais
          </AlertDescription>
        </div>
      </Alert>

      <Card className="bg-slate-700/50 border-slate-600/50">
        <CardContent className="p-4 space-y-4">
          {/* Campo DUM */}
          <div className="space-y-2">
            <Label htmlFor="dum" className="text-slate-200 font-semibold text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-pink-400" />
              DUM - Data da Última Menstruação <span className="text-pink-400">*</span>
            </Label>
            <Input
              id="dum"
              type="text"
              value={dum}
              onChange={handleDumChange}
              placeholder="DD/MM/AAAA"
              maxLength={10}
              className="bg-slate-600/50 border-slate-500/50 text-white placeholder-slate-400 focus:border-pink-500/50 focus:ring-pink-500/20"
            />
            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}
          </div>

          {/* Campo Idade Gestacional (calculado automaticamente) */}
          <div className="space-y-2">
            <Label htmlFor="gestational-age" className="text-slate-200 font-semibold text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-400" />
              Idade Gestacional
            </Label>
            <Input
              id="gestational-age"
              type="text"
              value={gestationalAge}
              readOnly
              placeholder="Calculado automaticamente"
              className="bg-slate-600/30 border-slate-500/30 text-purple-300 placeholder-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400">
              Calculado automaticamente com base na DUM
            </p>
          </div>

          {/* Campo DPP (calculado automaticamente) */}
          <div className="space-y-2">
            <Label htmlFor="dpp" className="text-slate-200 font-semibold text-sm flex items-center gap-2">
              <Baby className="h-4 w-4 text-green-400" />
              DPP - Data Provável do Parto
            </Label>
            <Input
              id="dpp"
              type="text"
              value={dpp}
              readOnly
              placeholder="Calculado automaticamente"
              className="bg-slate-600/30 border-slate-500/30 text-green-300 placeholder-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-400">
              Calculado automaticamente (DUM + 280 dias)
            </p>
          </div>

          {gestationalAge && dpp && (
            <Alert className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500/30">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded-full">
                  <Baby className="h-5 w-5 text-green-400" />
                </div>
                <AlertDescription className="text-green-100 text-sm">
                  <strong>Dados calculados:</strong> Idade gestacional de {gestationalAge} • DPP: {dpp}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};