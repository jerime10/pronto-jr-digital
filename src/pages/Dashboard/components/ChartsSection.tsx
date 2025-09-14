
import React from 'react';
import { Loader2 } from 'lucide-react';
import { AttendanceTimelineChart } from './AttendanceTimelineChart';
import { PrescriptionPieChart } from './PrescriptionPieChart';
import { NewPatientsAreaChart } from './NewPatientsAreaChart';
import { PerformanceRadarChart } from './PerformanceRadarChart';

interface ChartsSectionProps {
  attendanceTimeline: Array<{ date: string; atendimentos: number }> | undefined;
  prescriptionData: Array<{ name: string; value: number }> | undefined;
  newPatientsData: Array<{ semana: string; pacientes: number }> | undefined;
  performanceData: Array<{ metric: string; value: number; fullMark: number }> | undefined;
  isLoadingCharts: boolean;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  attendanceTimeline,
  prescriptionData,
  newPatientsData,
  performanceData,
  isLoadingCharts
}) => {
  return (
    <>
      {/* Nova seção de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de linha temporal */}
        {attendanceTimeline && attendanceTimeline.length > 0 && (
          <AttendanceTimelineChart data={attendanceTimeline} />
        )}

        {/* Gráfico de pizza de prescrições */}
        {prescriptionData && prescriptionData.length > 0 && (
          <PrescriptionPieChart data={prescriptionData} />
        )}

        {/* Gráfico de área de novos pacientes */}
        {newPatientsData && newPatientsData.length > 0 && (
          <NewPatientsAreaChart data={newPatientsData} />
        )}

        {/* Gráfico de radar de performance */}
        {performanceData && performanceData.length > 0 && (
          <PerformanceRadarChart data={performanceData} />
        )}
      </div>

      {/* Loading state para gráficos */}
      {isLoadingCharts && (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Carregando gráficos...</span>
        </div>
      )}
    </>
  );
};
