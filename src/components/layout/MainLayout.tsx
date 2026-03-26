import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Home, Users, FileText, Clipboard, Calendar, Settings, Menu, X, LogOut, User, CalendarDays, UserCheck, Clock, Wrench, DollarSign, ChevronLeft, ChevronRight, UsersRound } from 'lucide-react';
import Logo from '../Logo';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePermissions } from '@/hooks/usePermissions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SidebarContent, SidebarFooter } from './SidebarContent';

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
          
          <SidebarContent isCollapsed={isSidebarCollapsed} onLinkClick={() => setIsSidebarOpen(false)} />
          <SidebarFooter isCollapsed={isSidebarCollapsed} onLinkClick={() => setIsSidebarOpen(false)} />
        </div>
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navigation */}
        <header className="bg-background border-b border-border shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <button className="p-2 rounded-md text-muted-foreground md:hidden" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            
            <div className="font-semibold text-lg hidden md:block text-foreground">
              Prontuário Eletrônico
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              <button className="relative p-1 text-muted-foreground hover:text-foreground focus:outline-none">
                <span className="sr-only">Notificações</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-destructive"></span>
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
        <main className={`flex-1 bg-muted/30 ${location.pathname.includes('/atendimento') ? 'p-0 overflow-hidden' : 'p-6 overflow-y-auto'}`}>
          <Outlet />
        </main>
      </div>
      
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-10 md:hidden" onClick={toggleSidebar}></div>}
    </div>;
};
export default MainLayout;