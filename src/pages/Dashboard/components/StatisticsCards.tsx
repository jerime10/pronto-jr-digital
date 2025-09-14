
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, FileText, Users, ClipboardCheck } from 'lucide-react';

interface StatisticsCardsProps {
  patientCount: number;
  newPatientsCount: number;
  todayAppointments: number;
  weeklyPrescriptions: number;
  pendingExams: number;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  patientCount,
  newPatientsCount,
  todayAppointments,
  weeklyPrescriptions,
  pendingExams
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
          <Users className="w-4 h-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{patientCount || 0}</div>
          <p className="text-xs text-gray-500">+{newPatientsCount || 0} novos esta semana</p>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
          <CalendarCheck className="w-4 h-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{todayAppointments || 0}</div>
          <p className="text-xs text-gray-500">Hoje</p>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Prescrições</CardTitle>
          <FileText className="w-4 h-4 text-purple-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{weeklyPrescriptions || 0}</div>
          <p className="text-xs text-gray-500">Esta semana</p>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Exames</CardTitle>
          <ClipboardCheck className="w-4 h-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{pendingExams || 0}</div>
          <p className="text-xs text-gray-500">Pendentes</p>
        </CardContent>
      </Card>
    </div>
  );
};
