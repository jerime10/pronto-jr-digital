import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Home, Users, FileText, Clipboard, Calendar, Settings, Menu, X, LogOut, User, CalendarDays, UserCheck, Clock, Wrench, DollarSign, ChevronLeft, ChevronRight, UsersRound } from 'lucide-react';
import Logo from '../Logo';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MenuItemGuard } from '@/components/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';
interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  isCollapsed?: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({
  to,
  icon: Icon,
  label,
  isActive,
  isCollapsed = false
}) => {
  return <Link 
    to={to} 
    className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}`}
    title={isCollapsed ? label : undefined}
  >
    <Icon size={20} />
    {!isCollapsed && <span className="font-medium">{label}</span>}
  </Link>;
};
const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const { user, logout } = useSimpleAuth();
  const { isAdmin, isPartner } = usePermissions();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };
  const handleSignOut = async () => {
    logout();
    navigate('/login');
  };
  return <div className="min-h-screen flex">
      {/* Sidebar for desktop */}
      <aside className={`bg-sidebar fixed inset-y-0 left-0 z-20 transform transition-all duration-300 md:relative md:translate-x-0 ${isSidebarCollapsed ? 'w-16' : 'w-64'} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className={`${isSidebarCollapsed ? 'p-2' : 'p-4'} border-b border-sidebar-border bg-rose-300 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              {!isSidebarCollapsed && <Logo className="text-white" />}
              <div className="flex items-center space-x-1">
                {/* Botão de recolher/expandir - apenas no desktop */}
                <button 
                  className="hidden md:flex p-1 rounded-md text-white hover:bg-white/20 transition-colors" 
                  onClick={toggleSidebarCollapse}
                  title={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
                >
                  {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
                {/* Botão de fechar - apenas no mobile */}
                <button className="p-1 rounded-md text-white md:hidden" onClick={toggleSidebar}>
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
          
          <div className={`flex-1 py-6 ${isSidebarCollapsed ? 'px-1' : 'px-3'} space-y-1 overflow-y-auto bg-[#c669b0]/[0.81] transition-all duration-300`}>
            <MenuItemGuard permission="dashboard">
              <SidebarLink to="/dashboard" icon={Home} label="Dashboard" isActive={isActive('/dashboard')} isCollapsed={isSidebarCollapsed} />
            </MenuItemGuard>
            
            <MenuItemGuard permission="pacientes">
              <SidebarLink to="/pacientes" icon={Users} label="Pacientes" isActive={isActive('/pacientes')} isCollapsed={isSidebarCollapsed} />
            </MenuItemGuard>
            
            <MenuItemGuard permission="prescricoes">
              <SidebarLink to="/prescricoes" icon={FileText} label="Prescrições" isActive={isActive('/prescricoes')} isCollapsed={isSidebarCollapsed} />
            </MenuItemGuard>
            
            <MenuItemGuard permission="exames">
              <SidebarLink to="/exames" icon={Clipboard} label="Exames" isActive={isActive('/exames')} isCollapsed={isSidebarCollapsed} />
            </MenuItemGuard>
            
            <MenuItemGuard permission="atendimento">
              <SidebarLink to="/atendimento/novo" icon={Calendar} label="Atendimento" isActive={isActive('/atendimento/novo')} isCollapsed={isSidebarCollapsed} />
            </MenuItemGuard>
            
            <MenuItemGuard permission="historico_atendimentos">
              <SidebarLink to="/historico" icon={FileText} label="Histórico Atendimentos" isActive={isActive('/historico')} isCollapsed={isSidebarCollapsed} />
            </MenuItemGuard>
            
            {/* Sistema de Agendamento */}
            <MenuItemGuard permission="agendamentos">
              <SidebarLink to="/agendamentos" icon={CalendarDays} label="Agendamentos" isActive={isActive('/agendamentos')} isCollapsed={isSidebarCollapsed} />
            </MenuItemGuard>
            
            <MenuItemGuard permission="atendentes">
              <SidebarLink to="/atendentes" icon={UserCheck} label="Atendentes" isActive={isActive('/atendentes')} isCollapsed={isSidebarCollapsed} />
            </MenuItemGuard>
            
            <MenuItemGuard permission="horarios">
              <SidebarLink to="/horarios" icon={Clock} label="Horários" isActive={isActive('/horarios')} isCollapsed={isSidebarCollapsed} />
            </MenuItemGuard>
            
            <MenuItemGuard permission="servicos">
              <SidebarLink to="/servicos" icon={Wrench} label="Serviços" isActive={isActive('/servicos')} isCollapsed={isSidebarCollapsed} />
            </MenuItemGuard>
            
            <MenuItemGuard permission="financeiro">
              <SidebarLink to="/financeiro" icon={DollarSign} label="Financeiro" isActive={isActive('/financeiro')} isCollapsed={isSidebarCollapsed} />
            </MenuItemGuard>
          </div>
          
          <div className={`${isSidebarCollapsed ? 'p-2' : 'p-4'} border-t border-sidebar-border bg-rose-400 transition-all duration-300`}>
            <MenuItemGuard permission="configuracoes">
              <SidebarLink to="/configuracoes" icon={Settings} label="Configurações" isActive={isActive('/configuracoes')} isCollapsed={isSidebarCollapsed} />
            </MenuItemGuard>
            
            <MenuItemGuard permission="usuarios">
              <SidebarLink to="/admin/usuarios" icon={UsersRound} label="Gerenciar Usuários" isActive={isActive('/admin/usuarios')} isCollapsed={isSidebarCollapsed} />
            </MenuItemGuard>
          </div>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navigation */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <button className="p-2 rounded-md text-gray-500 md:hidden" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            
            <div className="font-semibold text-lg hidden md:block">
              Prontuário Eletrônico
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-1 text-gray-500 hover:text-gray-700 focus:outline-none">
                <span className="sr-only">Notificações</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <div className="w-8 h-8 rounded-full bg-medical-primary text-white flex items-center justify-center">
                      <span className="font-medium text-sm">
                        {user?.username ? user.username.substring(0, 2).toUpperCase() : 'US'}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" /> Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-10 md:hidden" onClick={toggleSidebar}></div>}
    </div>;
};
export default MainLayout;