import React from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Home, Users, FileText, Clipboard, Calendar, Settings, Menu, X, LogOut, User, CalendarDays, UserCheck, Clock, Wrench, DollarSign, ChevronLeft, ChevronRight, UsersRound } from 'lucide-react';
import Logo from '../Logo';
import { useSimpleAuth } from '@/contexts/SimpleAuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { usePermissions } from '@/hooks/usePermissions';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SidebarContent, SidebarFooter } from './SidebarContent';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetClose } from "@/components/ui/sheet";
import { MenuItemGuard } from '@/components/PermissionGuard';
import { cn } from '@/lib/utils';

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

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { user, logout } = useSimpleAuth();
  const { isAdmin, isPartner } = usePermissions();

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

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleSignOut = async () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex">
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

      {/* Sidebar for desktop - hidden on mobile */}
      <aside className={`hidden md:flex bg-sidebar flex-col h-screen sticky top-0 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className={`${isSidebarCollapsed ? 'p-2' : 'p-4'} border-b border-sidebar-border bg-rose-300 transition-all duration-300`}>
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && <Logo className="text-white" />}
            <button 
              className="flex p-1 rounded-md text-white hover:bg-white/20 transition-colors" 
              onClick={toggleSidebarCollapse}
            >
              {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        </div>
        <SidebarContent isCollapsed={isSidebarCollapsed} />
        <SidebarFooter isCollapsed={isSidebarCollapsed} />
      </aside>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Top navigation */}
        <header className="bg-background border-b border-border shadow-sm shrink-0">
          <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Mobile Circular Menu Button */}
              <div className="md:hidden">
                <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full h-10 w-10 transition-all active:scale-90 animate-pulse-glow border border-slate-200"
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
                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <Logo showText={false} className="scale-150 md:scale-[2]" />
                          </div>
                        </div>

                        {menuItems.map((item, index) => {
                          const angle = (index * (360 / menuItems.length)) - 90;
                          const radius = window.innerWidth < 768 ? 120 : 160;
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

                    <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-12 z-[10001]">
                      <MenuItemGuard permission="configuracoes">
                        <Link to="/configuracoes" onClick={() => setIsMenuOpen(false)} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors">
                          <Settings size={24} />
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
              </div>
              
              <div className="font-semibold text-lg hidden md:block text-foreground">
                Prontuário Eletrônico
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <ThemeToggle />
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
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-muted/30 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default MainLayout;