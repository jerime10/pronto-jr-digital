
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, FileText, Clipboard, Calendar, Settings, CalendarDays, UserCheck, Clock, Wrench, DollarSign, UsersRound } from 'lucide-react';
import { MenuItemGuard } from '@/components/PermissionGuard';

interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  to,
  icon: Icon,
  label,
  isActive,
  isCollapsed = false,
  onClick
}) => {
  return <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}`}
    title={isCollapsed ? label : undefined}
  >
    <Icon size={20} />
    {!isCollapsed && <span className="font-medium">{label}</span>}
  </Link>;
};

interface SidebarContentProps {
  isCollapsed?: boolean;
  onLinkClick?: () => void;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({ 
  isCollapsed = false,
  onLinkClick
}) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`flex-1 py-6 ${isCollapsed ? 'px-1' : 'px-3'} space-y-1 overflow-y-auto bg-[#c669b0]/[0.81] transition-all duration-300`}>
      <MenuItemGuard permission="dashboard">
        <SidebarLink to="/dashboard" icon={Home} label="Dashboard" isActive={isActive('/dashboard')} isCollapsed={isCollapsed} onClick={onLinkClick} />
      </MenuItemGuard>
      
      <MenuItemGuard permission="pacientes">
        <SidebarLink to="/pacientes" icon={Users} label="Pacientes" isActive={isActive('/pacientes')} isCollapsed={isCollapsed} onClick={onLinkClick} />
      </MenuItemGuard>
      
      <MenuItemGuard permission="prescricoes">
        <SidebarLink to="/prescricoes" icon={FileText} label="Prescrições" isActive={isActive('/prescricoes')} isCollapsed={isCollapsed} onClick={onLinkClick} />
      </MenuItemGuard>
      
      <MenuItemGuard permission="exames">
        <SidebarLink to="/exames" icon={Clipboard} label="Exames" isActive={isActive('/exames')} isCollapsed={isCollapsed} onClick={onLinkClick} />
      </MenuItemGuard>
      
      <MenuItemGuard permission="atendimento">
        <SidebarLink to="/atendimento/novo" icon={Calendar} label="Atendimento" isActive={isActive('/atendimento/novo')} isCollapsed={isCollapsed} onClick={onLinkClick} />
      </MenuItemGuard>
      
      <MenuItemGuard permission="historico_atendimentos">
        <SidebarLink to="/historico" icon={FileText} label="Histórico Atendimentos" isActive={isActive('/historico')} isCollapsed={isCollapsed} onClick={onLinkClick} />
      </MenuItemGuard>
      
      <MenuItemGuard permission="agendamentos">
        <SidebarLink to="/agendamentos" icon={CalendarDays} label="Agendamentos" isActive={isActive('/agendamentos')} isCollapsed={isCollapsed} onClick={onLinkClick} />
      </MenuItemGuard>
      
      <MenuItemGuard permission="atendentes">
        <SidebarLink to="/atendentes" icon={UserCheck} label="Atendentes" isActive={isActive('/atendentes')} isCollapsed={isCollapsed} onClick={onLinkClick} />
      </MenuItemGuard>
      
      <MenuItemGuard permission="horarios">
        <SidebarLink to="/horarios" icon={Clock} label="Horários" isActive={isActive('/horarios')} isCollapsed={isCollapsed} onClick={onLinkClick} />
      </MenuItemGuard>
      
      <MenuItemGuard permission="servicos">
        <SidebarLink to="/servicos" icon={Wrench} label="Serviços" isActive={isActive('/servicos')} isCollapsed={isCollapsed} onClick={onLinkClick} />
      </MenuItemGuard>
      
      <MenuItemGuard permission="financeiro">
        <SidebarLink to="/financeiro" icon={DollarSign} label="Financeiro" isActive={isActive('/financeiro')} isCollapsed={isCollapsed} onClick={onLinkClick} />
      </MenuItemGuard>
    </div>
  );
};

export const SidebarFooter: React.FC<SidebarContentProps> = ({ 
  isCollapsed = false,
  onLinkClick
}) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-t border-sidebar-border bg-rose-400 transition-all duration-300`}>
      <MenuItemGuard permission="configuracoes">
        <SidebarLink to="/configuracoes" icon={Settings} label="Configurações" isActive={isActive('/configuracoes')} isCollapsed={isCollapsed} onClick={onLinkClick} />
      </MenuItemGuard>
      
      <MenuItemGuard permission="usuarios">
        <SidebarLink to="/admin/usuarios" icon={UsersRound} label="Gerenciar Usuários" isActive={isActive('/admin/usuarios')} isCollapsed={isCollapsed} onClick={onLinkClick} />
      </MenuItemGuard>
    </div>
  );
};
