import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Patient } from '@/types/database';
import { cn } from '@/lib/utils';
import { Search, X, ChevronDown, Users, Loader2 } from 'lucide-react';
import { AttendanceDateTime } from './AttendanceDateTime';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PacienteBuscaProps {
  buscarPaciente: string;
  onBuscarPacienteChange: (input: React.ChangeEvent<HTMLInputElement> | string) => void;
  pacienteSelecionado: Patient | null;
  onSelectPaciente: (paciente: Patient) => void;
  onClearPaciente: () => void;
  filteredPacientes?: Patient[];
  isSearchingPacientes?: boolean;
  mostrarResultadosBusca?: boolean;
  setMostrarResultadosBusca?: (mostrar: boolean) => void;
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
  setMostrarResultadosBusca,
  disabled = false,
  onInputFocus,
  onInputBlur,
  startDateTime,
  endDateTime,
  onStartDateTimeChange,
  onEndDateTimeChange
}) => {
  const isMobile = useIsMobile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSelect = (paciente: Patient) => {
    onSelectPaciente(paciente);
    setIsDialogOpen(false);
    if (setMostrarResultadosBusca) setMostrarResultadosBusca(false);
  };

  const renderPatientList = () => (
    <div className={cn(
      "bg-popover border rounded-lg shadow-lg overflow-y-auto custom-scrollbar",
      isMobile ? "max-h-[60vh] border-none shadow-none" : "absolute top-full left-0 right-0 z-[100] mt-1 max-h-80"
    )}>
      {isSearchingPacientes && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-3 text-sm font-medium text-muted-foreground">Buscando pacientes...</span>
        </div>
      )}
      
      {!isSearchingPacientes && filteredPacientes.length > 0 && (
        <div className="py-2">
          <div className="px-4 py-2 border-b bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
            <div className="flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Users className="h-3.5 w-3.5 mr-2" />
              {buscarPaciente ? `${filteredPacientes.length} encontrados` : `${filteredPacientes.length} pacientes`}
            </div>
          </div>
          
          <div className="divide-y divide-border">
            {filteredPacientes.map(paciente => (
              <div 
                key={paciente.id} 
                className="flex items-center space-x-4 px-4 py-4 hover:bg-accent hover:text-accent-foreground transition-all cursor-pointer active:scale-[0.98] group" 
                onClick={() => handleSelect(paciente)}
              >
                <Avatar className="h-12 w-12 border-2 border-background shadow-sm transition-transform group-hover:scale-105">
                  <AvatarImage src={`https://avatar.vercel.sh/${paciente.name}.png`} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                    {paciente.name ? paciente.name.substring(0, 2).toUpperCase() : 'PA'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{paciente.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-sm text-muted-foreground font-medium">SUS: {paciente.sus}</p>
                    {paciente.phone && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <p className="text-sm text-muted-foreground">{paciente.phone}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!isSearchingPacientes && filteredPacientes.length === 0 && (
        <div className="px-4 py-12 text-center">
          <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            {buscarPaciente.length > 0 ? (
              <Search className="h-8 w-8 text-muted-foreground/40" />
            ) : (
              <Users className="h-8 w-8 text-muted-foreground/40" />
            )}
          </div>
          <p className="text-sm font-bold text-slate-900">
            {buscarPaciente.length > 0 ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          </p>
          <p className="text-xs text-muted-foreground mt-2 max-w-[200px] mx-auto">
            {buscarPaciente.length > 0 
              ? 'Tente buscar por outro nome ou número do SUS' 
              : 'Comece cadastrando novos pacientes no sistema'}
          </p>
        </div>
      )}
    </div>
  );

  if (pacienteSelecionado && isMobile) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
          {/* Efeito de brilho no fundo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl transition-transform group-hover:scale-150 duration-700" />
          
          <div className="flex items-center space-x-4 relative z-10">
            <Avatar className="h-20 w-20 border-4 border-slate-800 shadow-2xl transition-all group-hover:scale-105">
              <AvatarImage src={`https://avatar.vercel.sh/${pacienteSelecionado.name}.png`} />
              <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-800 text-white font-black text-2xl">
                {pacienteSelecionado.name ? pacienteSelecionado.name.substring(0, 2).toUpperCase() : 'PA'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-xl text-white tracking-tight truncate leading-tight">
                {pacienteSelecionado.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <div className="flex items-center bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />
                  <span className="text-slate-500 font-black text-[8px] uppercase tracking-wider mr-1.5">SUS</span>
                  <span className="text-slate-200 text-[10px] font-bold">{pacienteSelecionado.sus}</span>
                </div>
                <div className="flex items-center bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2" />
                  <span className="text-slate-500 font-black text-[8px] uppercase tracking-wider mr-1.5">IDADE</span>
                  <span className="text-slate-200 text-[10px] font-bold">{pacienteSelecionado.age ? `${pacienteSelecionado.age} anos` : 'N/I'}</span>
                </div>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClearPaciente} 
              disabled={disabled} 
              className="rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all h-10 w-10 shrink-0"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {onStartDateTimeChange && onEndDateTimeChange && (
          <div className="bg-white rounded-[2rem] p-2 border border-slate-200/60 shadow-sm overflow-hidden transition-all hover:border-emerald-200/50">
            <AttendanceDateTime 
              startDateTime={startDateTime} 
              endDateTime={endDateTime} 
              onStartDateTimeChange={onStartDateTimeChange} 
              onEndDateTimeChange={onEndDateTimeChange} 
              disabled={disabled} 
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pacienteSelecionado ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row items-center md:space-x-8 border border-slate-200/60 rounded-[2rem] p-6 md:p-10 bg-white shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
            
            <div className="relative mb-4 md:mb-0">
              <Avatar className="h-20 w-20 md:h-24 md:w-24 ring-8 ring-slate-50 transition-all group-hover:ring-emerald-50 shadow-2xl">
                <AvatarImage src={`https://avatar.vercel.sh/${pacienteSelecionado.name}.png`} />
                <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-black text-2xl md:text-3xl">
                  {pacienteSelecionado.name ? pacienteSelecionado.name.substring(0, 2).toUpperCase() : 'PA'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-1 right-1 h-6 w-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0 text-center md:text-left relative z-10">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <h3 className="font-black text-2xl md:text-3xl text-slate-900 tracking-tight truncate leading-tight">
                  {pacienteSelecionado.name}
                </h3>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black uppercase tracking-[0.15em] text-[10px] px-3 py-1 self-center md:self-auto rounded-full shadow-sm">
                  Paciente Ativo
                </Badge>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 md:gap-6 mt-3 text-sm md:text-base font-bold text-slate-500">
                <div className="flex items-center bg-slate-100/50 px-3 py-1.5 rounded-xl border border-slate-200/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2.5" />
                  <span className="text-slate-400 font-black text-[10px] uppercase tracking-wider mr-2">SUS</span>
                  <span className="text-slate-700">{pacienteSelecionado.sus}</span>
                </div>
                <div className="flex items-center bg-slate-100/50 px-3 py-1.5 rounded-xl border border-slate-200/30">
                  <span className="w-2 h-2 rounded-full bg-blue-400 mr-2.5" />
                  <span className="text-slate-400 font-black text-[10px] uppercase tracking-wider mr-2">Idade</span>
                  <span className="text-slate-700">{pacienteSelecionado.age ? `${pacienteSelecionado.age} anos` : 'N/I'}</span>
                </div>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClearPaciente} 
              disabled={disabled} 
              className="absolute top-4 right-4 md:relative md:top-0 md:right-0 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all h-12 w-12 shrink-0 shadow-sm md:shadow-none"
              title="Trocar Paciente"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          {onStartDateTimeChange && onEndDateTimeChange && (
            <div className="bg-white rounded-[2rem] p-2 border border-slate-200/60 shadow-sm overflow-hidden transition-all hover:border-emerald-200/50">
              <AttendanceDateTime 
                startDateTime={startDateTime} 
                endDateTime={endDateTime} 
                onStartDateTimeChange={onStartDateTimeChange} 
                onEndDateTimeChange={onEndDateTimeChange} 
                disabled={disabled} 
              />
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          {isMobile ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <div 
                  className={cn(
                    "flex items-center w-full h-14 px-4 bg-white border-2 border-slate-200 rounded-2xl cursor-pointer transition-all active:scale-[0.98] active:border-primary/50",
                    disabled && "opacity-50 pointer-events-none"
                  )}
                >
                  <Search className="h-5 w-5 text-slate-400 mr-3" />
                  <span className="text-slate-500 font-medium">Buscar paciente...</span>
                  <ChevronDown className="h-5 w-5 text-slate-400 ml-auto" />
                </div>
              </DialogTrigger>
              <DialogContent className="p-0 sm:max-w-[500px] h-[80vh] flex flex-col gap-0 rounded-t-[2rem] sm:rounded-2xl">
                <DialogHeader className="p-6 pb-2">
                  <DialogTitle className="text-xl font-black text-slate-900">Selecionar Paciente</DialogTitle>
                </DialogHeader>
                <div className="px-6 py-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <Input 
                      type="text" 
                      placeholder="Nome ou SUS..." 
                      value={buscarPaciente} 
                      onChange={(e) => onBuscarPacienteChange(e.target.value)} 
                      autoFocus
                      aria-label="Buscar paciente por nome ou número do SUS"
                      className="pl-11 h-14 text-lg bg-slate-50 border-none rounded-2xl focus-visible:ring-primary/20" 
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  {renderPatientList()}
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="relative group">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  type="text" 
                  placeholder="Clique para ver todos os pacientes ou digite para buscar..." 
                  value={buscarPaciente} 
                  onChange={(e) => onBuscarPacienteChange(e.target.value)} 
                  onFocus={onInputFocus} 
                  onBlur={onInputBlur} 
                  disabled={disabled} 
                  aria-label="Buscar paciente por nome ou número do SUS"
                  className="pl-12 pr-12 h-14 text-base bg-white border-2 border-slate-200 rounded-2xl focus:border-primary transition-all shadow-sm" 
                />
                <ChevronDown className={cn(
                  "absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-transform duration-300",
                  mostrarResultadosBusca && "rotate-180 text-primary"
                )} />
              </div>
              
              {mostrarResultadosBusca && (
                <>
                  {/* Backdrop para fechar ao clicar fora e focar no campo */}
                  <div 
                    className="fixed inset-0 z-[90] bg-transparent" 
                    onClick={() => setMostrarResultadosBusca && setMostrarResultadosBusca(false)}
                  />
                  {renderPatientList()}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PacienteBusca;
