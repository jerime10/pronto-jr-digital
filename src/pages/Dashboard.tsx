
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DataLoadingMonitor } from '@/components/debug/DataLoadingMonitor';

// Hooks
import { useDashboardStats } from './Dashboard/hooks/useDashboardStats';
import { useDashboardAppointments } from './Dashboard/hooks/useDashboardAppointments';
import { useDashboardCharts } from './Dashboard/hooks/useDashboardCharts';

// Components
import { PeriodSelector } from './Dashboard/components/PeriodSelector';
import { StatisticsCards } from './Dashboard/components/StatisticsCards';
import { ChartsSection } from './Dashboard/components/ChartsSection';
import { AppointmentsList } from './Dashboard/components/AppointmentsList';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  // Custom hooks for data fetching
  const { 
    patientCount, 
    newPatientsCount, 
    todayAppointments, 
    weeklyPrescriptions, 
    pendingExams, 
    isLoading: isLoadingStats 
  } = useDashboardStats();

  const { 
    recentAppointments, 
    upcomingAppointments, 
    isLoading: isLoadingAppointments 
  } = useDashboardAppointments();

  const {
    attendanceTimeline,
    prescriptionData,
    newPatientsData,
    performanceData,
    isLoading: isLoadingCharts
  } = useDashboardCharts(selectedPeriod);

  const isLoading = isLoadingStats || isLoadingAppointments;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Bem-vindo ao Prontuário Eletrônico JRS</p>
        </div>
        <PeriodSelector 
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Monitor de Debug */}
          <DataLoadingMonitor />
          
          {/* Statistics Cards */}
          <StatisticsCards
            patientCount={patientCount || 0}
            newPatientsCount={newPatientsCount || 0}
            todayAppointments={todayAppointments || 0}
            weeklyPrescriptions={weeklyPrescriptions || 0}
            pendingExams={pendingExams || 0}
          />

          {/* Charts Section */}
          <ChartsSection
            attendanceTimeline={attendanceTimeline}
            prescriptionData={prescriptionData}
            newPatientsData={newPatientsData}
            performanceData={performanceData}
            isLoadingCharts={isLoadingCharts}
          />
          
          {/* Appointments Lists */}
          <AppointmentsList
            recentAppointments={recentAppointments || []}
            upcomingAppointments={upcomingAppointments || []}
          />
        </>
      )}
    </div>
  );
};

export default Dashboard;
