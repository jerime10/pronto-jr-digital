
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  created_at: string;
  main_complaint: string | null;
  patients: { name: string } | null;
}

interface AppointmentsListProps {
  recentAppointments: Appointment[];
  upcomingAppointments: Appointment[];
}

export const AppointmentsList: React.FC<AppointmentsListProps> = ({
  recentAppointments,
  upcomingAppointments
}) => {
  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    const isYesterday = format(date, 'yyyy-MM-dd') === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    
    if (isToday) {
      return `Hoje, ${format(date, 'HH:mm')}`;
    } else if (isYesterday) {
      return `Ontem, ${format(date, 'HH:mm')}`;
    } else {
      return format(date, "dd/MM, HH:mm", { locale: ptBR });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Atendimentos Recentes</CardTitle>
          <CardDescription>
            Lista dos últimos atendimentos registrados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {recentAppointments && recentAppointments.length > 0 ? (
              recentAppointments.map((appointment) => (
                <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium">{appointment.patients?.name || 'Paciente'}</p>
                    <p className="text-sm text-gray-500">{appointment.main_complaint || 'Consulta'}</p>
                  </div>
                  <span className="text-sm text-gray-500 mt-2 sm:mt-0">
                    {formatAppointmentDate(appointment.created_at)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                Nenhum atendimento recente
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle>Próximos Atendimentos</CardTitle>
          <CardDescription>
            Agendamentos para os próximos dias
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {upcomingAppointments && upcomingAppointments.length > 0 ? (
              upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium">{appointment.patients?.name || 'Paciente'}</p>
                    <p className="text-sm text-gray-500">{appointment.main_complaint || 'Consulta'}</p>
                  </div>
                  <span className="text-sm text-gray-500 mt-2 sm:mt-0">
                    {formatAppointmentDate(appointment.created_at)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                Nenhum agendamento próximo
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
