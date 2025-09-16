import { Suspense } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from 'react-router-dom';
import { SimpleAuthProvider } from './contexts/SimpleAuthContext';
import SimpleLogin from './pages/auth/SimpleLogin';
import Dashboard from './pages/Dashboard';
import MainLayout from './components/layout/MainLayout';
import ConfiguracoesAdmin from './pages/admin/ConfiguracoesAdmin';
import ProcessarComIA from './pages/admin/ProcessarComIA';
import { Toaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import NotFound from './pages/NotFound';
import ListaPacientes from './pages/pacientes/ListaPacientes';
import FormularioPaciente from './pages/pacientes/FormularioPaciente';
import ModelosPrescricao from './pages/prescricoes/ModelosPrescricao';
import ModelosExames from './pages/exames/ModelosExames';
import NovoAtendimento from './pages/atendimento/NovoAtendimento';
import HistoricoAtendimentos from './pages/atendimentos/HistoricoAtendimentos';
import DiagnosticPage from './pages/DiagnosticPage';
import SimpleAuthGuard from './components/SimpleAuthGuard';
import PublicPatientRegistration from './pages/public/PublicPatientRegistration';
import PublicAppointmentBooking from './pages/public/PublicAppointmentBooking';
import Agendamentos from './pages/agendamentos/Agendamentos';
import Atendentes from './pages/atendentes/Atendentes';
import Horarios from './pages/horarios/Horarios';
import NovoHorario from './pages/horarios/NovoHorario';
import Servicos from './pages/servicos/Servicos';
import NovoServico from './pages/servicos/NovoServico';
import EditarServico from './pages/servicos/EditarServico';
import Financeiro from './pages/financeiro/Financeiro';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center space-y-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <div className="text-lg text-gray-600">Carregando...</div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <SimpleAuthProvider>
            <Toaster position="top-right" />
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  <SimpleAuthGuard requireAuth={false}>
                    <SimpleLogin />
                  </SimpleAuthGuard>
                } 
              />
              
              {/* Diagnostic Route - Accessible without auth for troubleshooting */}
              <Route path="/diagnostic" element={<DiagnosticPage />} />
              
              {/* Public Patient Registration - Accessible without auth */}
              <Route path="/cadastro-paciente" element={<PublicPatientRegistration />} />
              
              {/* Public Appointment Booking - Accessible without auth */}
              <Route path="/public/agendamento" element={<PublicAppointmentBooking />} />
              
              {/* Index redirect */}
              <Route path="/" element={
                <SimpleAuthGuard requireAuth={false}>
                  <SimpleLogin />
                </SimpleAuthGuard>
              } />
              
              {/* Protected Routes - Dashboard */}
              <Route path="/dashboard" element={
                <SimpleAuthGuard requireAuth={true}>
                  <MainLayout />
                </SimpleAuthGuard>
              }>
                <Route index element={<Dashboard />} />
              </Route>

              {/* Protected Routes - Pacientes */}
              <Route path="/pacientes" element={
                <SimpleAuthGuard requireAuth={true}>
                  <MainLayout />
                </SimpleAuthGuard>
              }>
                <Route index element={<ListaPacientes />} />
                <Route path="novo" element={<FormularioPaciente />} />
                <Route path=":id" element={<FormularioPaciente />} />
              </Route>
              
              {/* Protected Routes - Prescrições */}
              <Route path="/prescricoes" element={
                <SimpleAuthGuard requireAuth={true}>
                  <MainLayout />
                </SimpleAuthGuard>
              }>
                <Route index element={<ModelosPrescricao />} />
              </Route>
              
              {/* Protected Routes - Exames */}
              <Route path="/exames" element={
                <SimpleAuthGuard requireAuth={true}>
                  <MainLayout />
                </SimpleAuthGuard>
              }>
                <Route index element={<ModelosExames />} />
              </Route>
              
              {/* Protected Routes - Atendimento */}
              <Route path="/atendimento" element={
                <SimpleAuthGuard requireAuth={true}>
                  <MainLayout />
                </SimpleAuthGuard>
              }>
                <Route path="novo" element={<NovoAtendimento />} />
              </Route>
              
              {/* Protected Routes - Histórico */}
              <Route path="/historico" element={
                <SimpleAuthGuard requireAuth={true}>
                  <MainLayout />
                </SimpleAuthGuard>
              }>
                <Route index element={<HistoricoAtendimentos />} />
              </Route>
              
              {/* Protected Routes - Sistema de Agendamento */}
              <Route path="/agendamentos" element={
                <SimpleAuthGuard requireAuth={true}>
                  <MainLayout />
                </SimpleAuthGuard>
              }>
                <Route index element={<Agendamentos />} />
              </Route>
              
              <Route path="/atendentes" element={
                <SimpleAuthGuard requireAuth={true}>
                  <MainLayout />
                </SimpleAuthGuard>
              }>
                <Route index element={<Atendentes />} />
              </Route>
              
               <Route path="/horarios" element={
                 <SimpleAuthGuard requireAuth={true}>
                   <MainLayout />
                 </SimpleAuthGuard>
               }>
                 <Route index element={<Horarios />} />
                 <Route path="novo" element={<NovoHorario />} />
               </Route>
              
              <Route path="/servicos" element={
                <SimpleAuthGuard requireAuth={true}>
                  <MainLayout />
                </SimpleAuthGuard>
              }>
                <Route index element={<Servicos />} />
              </Route>
              
              <Route path="/servicos/novo" element={
                <SimpleAuthGuard requireAuth={true}>
                  <NovoServico />
                </SimpleAuthGuard>
              } />
              
              <Route path="/servicos/editar/:id" element={
                <SimpleAuthGuard requireAuth={true}>
                  <EditarServico />
                </SimpleAuthGuard>
              } />
              
              <Route path="/financeiro" element={
                <SimpleAuthGuard requireAuth={true}>
                  <MainLayout />
                </SimpleAuthGuard>
              }>
                <Route index element={<Financeiro />} />
              </Route>
              
              {/* Admin Routes */}
              <Route path="/configuracoes" element={
                <SimpleAuthGuard requireAuth={true} requireAdmin={true}>
                  <MainLayout />
                </SimpleAuthGuard>
              }>
                <Route index element={<ConfiguracoesAdmin />} />
              </Route>
              
              <Route path="/admin/pdf-template" element={
                <SimpleAuthGuard requireAuth={true} requireAdmin={true}>
                  <MainLayout />
                </SimpleAuthGuard>
              }>
                <Route index element={<ProcessarComIA />} />
              </Route>
              
              {/* 404 Page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SimpleAuthProvider>
        </Router>
      </QueryClientProvider>
    </Suspense>
  );
}

export default App;