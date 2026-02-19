import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, User } from 'lucide-react';
import PublicProfessionalsList from './components/PublicProfessionalsList';
import { useAvailableAttendantServices } from '@/hooks/useAttendantServices';
import { usePublicAvailability } from '@/hooks/usePublicAvailability';
import { toast } from 'sonner';

const PublicConsultarAgendaPage: React.FC = () => {
  const [attendantId, setAttendantId] = useState<string>('');
  const [attendantName, setAttendantName] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [serviceName, setServiceName] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectOpen, setSelectOpen] = useState(false);

  const { data: assignments } = useAvailableAttendantServices(attendantId);
  const dateStr = useMemo(() => selectedDate ? selectedDate.toISOString().split('T')[0] : undefined, [selectedDate]);
  const { data: availability, isFetching } = usePublicAvailability({
    attendantId,
    date: dateStr,
    serviceId,
  });

  // Filter out past time slots when selected date is today
  const filteredAvailableSlots = useMemo(() => {
    if (!availability?.available_slots || !selectedDate) return [];
    
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    
    if (!isToday) {
      return availability.available_slots;
    }
    
    // For today, filter out past slots (with 15 min buffer)
    const currentTime = new Date();
    currentTime.setMinutes(currentTime.getMinutes() + 15);
    
    return availability.available_slots.filter(slot => {
      const [hours, minutes] = slot.start_time.split(':').map(Number);
      const slotTime = new Date(selectedDate);
      slotTime.setHours(hours, minutes, 0, 0);
      return slotTime > currentTime;
    });
  }, [availability?.available_slots, selectedDate]);

  const servicesOptions = useMemo(() => {
    return (assignments || []).map(a => ({
      id: a.service_id,
      name: a.service_name,
      duration: a.service_duration,
      price: a.service_price,
    }));
  }, [assignments]);

  const handleSelectAttendant = (id: string, name: string) => {
    setAttendantId(id);
    setAttendantName(name);
    setServiceId('');
    setServiceName('');
    setSelectedDate(null);
    setSelectedTime('');
    toast.success(`Profissional selecionado: ${name}`);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') newMonth.setMonth(prev.getMonth() - 1);
      else newMonth.setMonth(prev.getMonth() + 1);
      return newMonth;
    });
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    const days: { date: Date; isCurrentMonth: boolean; isPast: boolean; isSelected: boolean; day: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const isCurrentMonth = date.getMonth() === month;
      const isPast = date < today;
      const isSelected = selectedDate ? date.toDateString() === selectedDate.toDateString() : false;
      days.push({ date, isCurrentMonth, isPast, isSelected, day: date.getDate() });
    }
    return days;
  };

  const handleDateSelection = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleAgendar = () => {
    if (!attendantId || !serviceId || !selectedDate || !selectedTime) return;
    const date = selectedDate.toISOString().split('T')[0];
    const url = `${window.location.origin}/public/agendamento?professionalId=${encodeURIComponent(attendantId)}&serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(selectedTime)}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {selectOpen && <div className="fixed inset-0 bg-black/50 z-[900]" />}
      <div className="w-full max-w-4xl relative z-10">
        <Card className="bg-slate-800/90 backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-purple-500/10">
          <CardHeader className="text-center pb-4 pt-6">
            <div className="flex justify-center mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur-lg opacity-75"></div>
                <div className="relative bg-gradient-to-r from-purple-500 to-cyan-500 p-4 rounded-full">
                  <CalendarIcon className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-white text-2xl sm:text-3xl font-bold">ESCOLHA DATA E HORÁRIO</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            {!attendantId && (
              <>
                <div className="text-center space-y-2">
                  <div className="flex justify-center mb-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-lg opacity-75"></div>
                      <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-full">
                        <User className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">ESCOLHA O PROFISSIONAL</h3>
                  <p className="text-slate-300 text-xs sm:text-sm">SELECIONE O PROFISSIONAL DE SUA PREFERÊNCIA</p>
                </div>
                <PublicProfessionalsList onSelect={handleSelectAttendant} />
              </>
            )}

            {attendantId && (
              <>
                <div className="text-center space-y-2">
                  <p className="text-slate-300 text-sm">
                    SERVIÇO:{' '}
                    <span className="text-purple-400 font-semibold">{serviceName || 'Selecione'}</span>
                  </p>
                  <p className="text-slate-300 text-sm">
                    PROFISSIONAL:{' '}
                    <span className="text-blue-400 font-semibold">{attendantName}</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Select
                      open={selectOpen}
                      onOpenChange={setSelectOpen}
                      value={serviceId}
                      onValueChange={(v) => {
                        setServiceId(v);
                        const svc = servicesOptions.find(s => s.id === v);
                        setServiceName(svc?.name || '');
                        setSelectedDate(null);
                        setSelectedTime('');
                      }}
                    >
                      <SelectTrigger className="bg-slate-700/70 border-slate-600/70 text-white placeholder:text-slate-300 h-12 rounded-lg">
                        <SelectValue placeholder="Selecione um serviço" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 text-slate-100 border-slate-700 shadow-2xl z-[1000]">
                        {servicesOptions.map(svc => (
                          <SelectItem key={svc.id} value={svc.id}>
                            {svc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Button
                      onClick={() => navigateMonth('prev')}
                      variant="ghost"
                      size="sm"
                      className="text-slate-300 hover:text-white hover:bg-slate-600/50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h4 className="text-white font-semibold text-lg">
                      {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                    </h4>
                    <Button
                      onClick={() => navigateMonth('next')}
                      variant="ghost"
                      size="sm"
                      className="text-slate-300 hover:text-white hover:bg-slate-600/50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
                      <div key={day} className="text-center text-slate-400 text-xs font-semibold py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {generateCalendarDays().map((dayInfo, index) => (
                      <button
                        key={index}
                        onClick={() => !dayInfo.isPast && dayInfo.isCurrentMonth && serviceId && handleDateSelection(dayInfo.date)}
                        disabled={dayInfo.isPast || !dayInfo.isCurrentMonth || !serviceId}
                        className={`
                          h-10 w-full text-sm rounded transition-all duration-200
                          ${dayInfo.isCurrentMonth 
                            ? dayInfo.isPast 
                              ? 'text-slate-500 cursor-not-allowed'
                              : dayInfo.isSelected
                                ? 'bg-purple-500 text-white font-semibold shadow-lg'
                                : 'text-slate-200 hover:bg-slate-600/50 hover:text-white'
                            : 'text-slate-600 cursor-not-allowed'
                          }
                        `}
                      >
                        {dayInfo.day}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedDate && (
                  <div className="space-y-4">
                    <h4 className="text-white font-semibold text-center">
                      HORÁRIOS DISPONÍVEIS - {selectedDate.toLocaleDateString('pt-BR')}
                    </h4>
                    {isFetching ? (
                      <div className="text-center py-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-r-transparent mx-auto mb-4" />
                        <p className="text-slate-300">Carregando horários disponíveis...</p>
                      </div>
                    ) : filteredAvailableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {filteredAvailableSlots.map((slot, index) => (
                          <button
                            key={`${slot.start_time}-${index}`}
                            onClick={() => setSelectedTime(slot.start_time)}
                            className={`
                              p-3 rounded-lg text-sm font-semibold transition-all duration-200
                              ${selectedTime === slot.start_time
                                ? 'bg-purple-500 text-white shadow-lg'
                                : 'bg-slate-600/50 text-slate-200 hover:bg-purple-500/50 hover:text-white'
                              }
                            `}
                          >
                            {slot.start_time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-400">Nenhum horário disponível para esta data.</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="sticky bottom-0 z-20 bg-slate-800/80 backdrop-blur-sm p-2 rounded-b-lg">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={handleAgendar}
                      disabled={!attendantId || !serviceId || !selectedDate || !selectedTime}
                      className="flex-1 h-14 rounded-xl text-base font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      AGENDAR
                      <Sparkles className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicConsultarAgendaPage;
