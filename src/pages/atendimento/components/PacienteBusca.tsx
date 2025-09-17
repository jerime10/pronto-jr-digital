
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Patient } from '@/types/database';
import { cn } from '@/lib/utils';
import { Search, X, ChevronDown, Users } from 'lucide-react';
import { AttendanceDateTime } from './AttendanceDateTime';

interface PacienteBuscaProps {
  buscarPaciente: string;
  onBuscarPacienteChange: (input: React.ChangeEvent<HTMLInputElement> | string) => void;
  pacienteSelecionado: Patient | null;
  onSelectPaciente: (paciente: Patient) => void;
  onClearPaciente: () => void;
  filteredPacientes?: Patient[];
  isSearchingPacientes?: boolean;
  mostrarResultadosBusca?: boolean;
  disabled?: boolean;
  onInputFocus?: () => void;
  onInputBlur?: () => void;
  // Props para data/hora
  startDateTime?: Date;
  endDateTime?: Date;
  onStartDateTimeChange?: (date: Date | undefined) => void;
  onEndDateTimeChange?: (date: Date | undefined) => void;
}

const PacienteBusca: React.FC<PacienteBuscaProps> = ({
  buscarPaciente,
  onBuscarPacienteChange,
  pacienteSelecionado,
  onSelectPaciente,
  onClearPaciente,
  filteredPacientes = [],
  isSearchingPacientes = false,
  mostrarResultadosBusca = false,
  disabled = false,
  onInputFocus,
  onInputBlur,
  startDateTime,
  endDateTime,
  onStartDateTimeChange,
  onEndDateTimeChange
}) => {
  return (
    <div className="space-y-4">
      {/* Campo de busca ou paciente selecionado */}
      {pacienteSelecionado ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-4 border rounded-lg p-4 bg-card">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`https://avatar.vercel.sh/${pacienteSelecionado.name}.png`} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {pacienteSelecionado.name ? pacienteSelecionado.name.substring(0, 2).toUpperCase() : 'PA'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{pacienteSelecionado.name}</h3>
              <p className="text-sm text-muted-foreground">SUS: {pacienteSelecionado.sus}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClearPaciente} 
              disabled={disabled}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4"/>
            </Button>
          </div>
          
          {/* Componente de Data/Hora do Atendimento */}
          {onStartDateTimeChange && onEndDateTimeChange && (
            <AttendanceDateTime
              startDateTime={startDateTime}
              endDateTime={endDateTime}
              onStartDateTimeChange={onStartDateTimeChange}
              onEndDateTimeChange={onEndDateTimeChange}
              disabled={disabled}
            />
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Clique para ver todos os pacientes ou digite para buscar..."
              value={buscarPaciente}
              onChange={(e) => onBuscarPacienteChange(e)}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
              disabled={disabled}
              className="pl-10 pr-10 h-12"
            />
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          
          {/* Lista suspensa de resultados */}
          {mostrarResultadosBusca && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {isSearchingPacientes && (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Carregando pacientes...</span>
                </div>
              )}
              
              {!isSearchingPacientes && filteredPacientes.length > 0 && (
                <div className="py-2">
                  {/* Header da lista */}
                  <div className="px-4 py-2 border-b bg-muted/50">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      {buscarPaciente ? 
                        `${filteredPacientes.length} paciente(s) encontrado(s)` : 
                        `${filteredPacientes.length} paciente(s) cadastrado(s)`
                      }
                    </div>
                  </div>
                  
                  {/* Lista de pacientes */}
                  {filteredPacientes.map(paciente => (
                    <div
                      key={paciente.id}
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer border-b last:border-b-0"
                      onClick={() => onSelectPaciente(paciente)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://avatar.vercel.sh/${paciente.name}.png`} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {paciente.name ? paciente.name.substring(0, 2).toUpperCase() : 'PA'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{paciente.name}</p>
                        <p className="text-sm text-muted-foreground">SUS: {paciente.sus}</p>
                        {paciente.phone && (
                          <p className="text-xs text-muted-foreground">Tel: {paciente.phone}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!isSearchingPacientes && filteredPacientes.length === 0 && buscarPaciente.length > 0 && (
                <div className="px-4 py-8 text-center">
                  <Search className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum paciente encontrado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tente buscar por nome ou número do SUS
                  </p>
                </div>
              )}

              {!isSearchingPacientes && filteredPacientes.length === 0 && buscarPaciente.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <Users className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum paciente cadastrado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cadastre pacientes para começar
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PacienteBusca;
