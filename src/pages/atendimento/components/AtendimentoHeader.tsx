
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, FileText, Send, Menu, X, Home, Users, Clipboard, Calendar, CalendarDays, UserCheck, Clock, Wrench, DollarSign, Settings as SettingsIcon, UsersRound } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { DraftManager } from './DraftManager';
import { FormState } from '../hooks/useFormData';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import Logo from '@/components/Logo';
import { MenuItemGuard } from '@/components/PermissionGuard';

interface CircleMenuItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  angle: number;
  radius: number;
  onClick?: () => void;
}

const CircleMenuItem: React.FC<CircleMenuItemProps> = ({ to, icon: Icon, label, isActive, angle, radius, onClick }) => {
  const x = Math.cos(angle * Math.PI / 180) * radius;
  const y = Math.sin(angle * Math.PI / 180) * radius;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "absolute flex flex-col items-center justify-center w-20 h-20 rounded-full transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2 group z-20",
        isActive ? "bg-white text-slate-900 shadow-xl scale-110" : "bg-white/10 text-white hover:bg-white/20"
      )}
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
      }}
    >
      <Icon size={24} className={cn(isActive ? "text-emerald-500" : "text-white")} />
      <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter text-center px-1 leading-none truncate w-full">
        {label.split(' ')[0]}
      </span>
    </Link>
  );
};

export const AtendimentoHeader: React.FC<AtendimentoHeaderProps> = ({
  isEditing,
  isSaving,
  isSubmittingRecord,
  pacienteSelecionado,
  profissionalAtual,
  form,
  setFormData,
  handleSelectPaciente,
  handleSubmitMedicalRecord,
  dynamicFields = {},
  onDynamicFieldsChange
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const menuItems = [
    { to: "/dashboard", icon: Home, label: "Dashboard", permission: "dashboard" },
    { to: "/pacientes", icon: Users, label: "Pacientes", permission: "pacientes" },
    { to: "/prescricoes", icon: FileText, label: "Prescrições", permission: "prescricoes" },
    { to: "/exames", icon: Clipboard, label: "Exames", permission: "exames" },
    { to: "/atendimento/novo", icon: Calendar, label: "Atendimento", permission: "atendimento" },
    { to: "/historico", icon: FileText, label: "Histórico", permission: "historico_atendimentos" },
    { to: "/agendamentos", icon: CalendarDays, label: "Agenda", permission: "agendamentos" },
    { to: "/financeiro", icon: DollarSign, label: "Financeiro", permission: "financeiro" },
  ];

  if (isMobile) {
    return (
      <div className="bg-slate-950 px-4 py-4 z-[100] shadow-xl shrink-0">
        <style>
          {`
            @keyframes pulse-glow {
              0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
              70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
              100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
            }
            .animate-pulse-glow {
              animation: pulse-glow 2s infinite;
            }
          `}
        </style>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 transition-all active:scale-90 animate-pulse-glow backdrop-blur-sm border border-white/5"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="top" 
                className="h-[100dvh] w-full p-0 border-none bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center overflow-y-auto overflow-x-hidden select-none"
              >
                <SheetHeader className="absolute top-8 left-0 right-0 px-8 flex-row items-center justify-between z-[10001]">
                  <Logo className="text-white scale-110 md:scale-125 origin-left" />
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-12 w-12 active:scale-90 transition-transform">
                      <X className="w-8 h-8" />
                    </Button>
                  </SheetClose>
                </SheetHeader>

                <div className="relative w-full h-full flex items-center justify-center scale-[0.85] sm:scale-100 transition-transform duration-500 ease-out">
                  <div className="relative w-[320px] h-[320px] md:w-[450px] md:h-[450px]">
                    {/* Central Circle Content */}
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                        <Logo showText={false} className="scale-150 md:scale-[2]" />
                      </div>
                    </div>

                    {/* Circle Menu Items */}
                    {menuItems.map((item, index) => {
                      const angle = (index * (360 / menuItems.length)) - 90;
                      const radius = isMobile ? 120 : 160;
                      return (
                        <MenuItemGuard key={item.to} permission={item.permission}>
                          <CircleMenuItem
                            to={item.to}
                            icon={item.icon}
                            label={item.label}
                            isActive={location.pathname === item.to}
                            angle={angle}
                            radius={radius}
                            onClick={() => setIsMenuOpen(false)}
                          />
                        </MenuItemGuard>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Footer Actions inside Circle Menu */}
                <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-12 z-[10001]">
                  <MenuItemGuard permission="configuracoes">
                    <Link to="/configuracoes" onClick={() => setIsMenuOpen(false)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
                      <SettingsIcon size={24} />
                      <span className="text-[10px] font-bold uppercase">Config</span>
                    </Link>
                  </MenuItemGuard>
                  <MenuItemGuard permission="usuarios">
                    <Link to="/admin/usuarios" onClick={() => setIsMenuOpen(false)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
                      <UsersRound size={24} />
                      <span className="text-[10px] font-bold uppercase">Usuários</span>
                    </Link>
                  </MenuItemGuard>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/historico')}
              className="text-white hover:bg-white/10 rounded-full h-10 w-10 transition-all active:scale-90"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </div>

          <div className="flex flex-col items-center">
            <h1 className="text-lg font-bold text-white tracking-tight leading-none uppercase">
              Consulta
            </h1>
            {pacienteSelecionado && (
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.1em] mt-1">
                {pacienteSelecionado.name}
              </span>
            )}
          </div>

          <div className="w-10 h-10" /> {/* Spacer para centralizar o título */}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 z-[100] shadow-sm shrink-0 transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1800px] mx-auto">
        <div className="flex items-center space-x-4 md:space-x-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/historico')}
            className="flex items-center space-x-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all active:scale-95 shrink-0 px-3 h-10"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold hidden sm:inline">Voltar</span>
          </Button>
          
          <div className="border-l-2 border-slate-100 pl-4 md:pl-8 py-1">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">
              {isEditing ? 'Editar Atendimento' : 'Novo Atendimento'}
            </h1>
            {pacienteSelecionado && (
              <div className="flex items-center space-x-3 mt-1.5 animate-in fade-in slide-in-from-left-4 duration-500">
                <span className="text-sm md:text-base font-bold text-emerald-600 tracking-tight">
                  {pacienteSelecionado.name}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                  SUS: {pacienteSelecionado.sus}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Ações Desktop */}
        <div className="hidden md:flex items-center space-x-2">
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
            <DraftManager
              pacienteSelecionado={pacienteSelecionado}
              profissionalAtual={profissionalAtual}
              form={form}
              setFormData={setFormData}
              handleSelectPaciente={handleSelectPaciente}
              dynamicFields={dynamicFields}
              onDynamicFieldsChange={onDynamicFieldsChange}
            />
          </div>

          <div className="h-8 w-px bg-slate-200 mx-1" />

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={handleSubmitMedicalRecord}
              disabled={isSubmittingRecord || !pacienteSelecionado}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-5 h-9 shadow-md shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50 font-black tracking-tight text-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden xl:inline">{isSubmittingRecord ? 'Processando...' : 'Finalizar Atendimento'}</span>
              <span className="xl:hidden">{isSubmittingRecord ? '...' : 'Finalizar'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
