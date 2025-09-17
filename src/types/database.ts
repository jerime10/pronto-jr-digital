
export type Patient = {
  id: string;
  sus: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
  date_of_birth: string | null;
  created_at: string;
  updated_at: string;
};

export type Professional = {
  id: string;
  user_id: string;
  name: string;
  specialty: string;
  license_type: string;
  license_number: string;
  contact: string;
  signature?: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
};

export type PrescriptionModel = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type ExamModel = {
  id: string;
  name: string;
  instructions: string | null;
  created_at: string;
  updated_at: string;
};

export type CompletedExam = {
  id: string;
  name: string;
  result: string | null;
  result_template: string | null;
  created_at: string;
  updated_at: string;
};

export type MedicalRecord = {
  id: string;
  patient_id: string;
  professional_id: string;
  appointment_id: string | null;
  main_complaint: string | null;
  history: string | null;
  allergies: string | null;
  evolution: string | null;
  prescription_model_id: string | null;
  custom_prescription: string | null;
  exam_requests: string[] | null;
  exam_observations: string | null;
  exam_results: string | null;
  attendance_start_at: string | null;
  attendance_end_at: string | null;
  created_at: string;
  updated_at: string;
};

export type GeneratedDocument = {
  id: string;
  patient_id: string;
  professional_id: string;
  medical_record_id: string | null;
  title: string;
  file_url: string;
  document_type: string;
  attendance_start_at: string | null;
  attendance_end_at: string | null;
  shared_at: string | null;
  shared_via: string | null;
  created_at: string;
};

export type Attendant = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  photo_url: string | null;
  working_days: number[] | null; // 0=Domingo, 1=Segunda, ..., 6=Sábado
  share_link: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AttendantWorkingHours = {
  id: string;
  attendant_id: string;
  day_of_week: number; // 0=Domingo, 1=Segunda, ..., 6=Sábado
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AttendantService = {
  id: string;
  attendant_id: string;
  service_id: string;
  created_at: string;
};

export type Service = {
  id: string;
  name: string;
  price: number;
  duration: number;
  available: boolean;
  created_at: string;
  updated_at: string;
};

export type ServiceFormData = {
  name: string;
  price: number;
  duration: number;
  available?: boolean;
};

export type AttendantFormData = {
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  photo_url?: string;
  working_days?: number[];
  share_link?: string;
  is_active?: boolean;
  working_hours?: Omit<AttendantWorkingHours, 'id' | 'attendant_id' | 'created_at' | 'updated_at'>[];
  service_ids?: string[];
};

// ============================================
// TIPOS PARA SISTEMA DE HORÁRIOS
// ============================================

export type Schedule = {
  id: string;
  day: string; // Campo day conforme tabela
  days: string[] | null; // Array de dias conforme tabela
  start_time: string;
  duration: number; // Campo duration conforme tabela
  available: boolean | null; // Campo available conforme tabela
  created_at: string;
  updated_at: string;
};

export type ScheduleAssignment = {
  id: string;
  attendant_id: string;
  service_id: string;
  schedule_id: string;
  specific_date: string | null; // Data específica para horários excepcionais
  start_time: string;
  end_time: string;
  is_available: boolean;
  schedule_info: string | null;
  created_at: string;
  updated_at: string;
};

export type Appointment = {
  id: string;
  patient_id: string | null;
  patient_name: string | null;
  patient_phone: string | null;
  attendant_id: string;
  attendant_name: string | null;
  service_id: string;
  service_name: string | null;
  service_price: number | null;
  service_duration: number | null;
  appointment_date: string; // Data do agendamento
  appointment_time: string; // Hora do agendamento
  appointment_datetime: string; // Tratamento de fuso horário
  end_time: string | null;
  notes: string | null;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'finalizado' | 'atendimento_finalizado';
  created_at: string;
  updated_at: string;
};

// ============================================
// TIPOS PARA FORMULÁRIOS E REQUESTS
// ============================================

export type ScheduleFormData = {
  day: string;
  days?: string[] | null;
  start_time: string;
  duration: number;
  available?: boolean | null;
};

export type ScheduleAssignmentFormData = {
  attendant_id: string;
  service_id: string;
  schedule_id: string;
  specific_date?: string;
  start_time: string;
  end_time: string;
  is_available?: boolean;
  schedule_info?: string;
};

export type AppointmentFormData = {
  patient_id?: string;
  patient_name?: string;
  patient_phone?: string;
  attendant_id: string;
  attendant_name?: string;
  service_id: string;
  service_name?: string;
  service_price?: number;
  service_duration?: number;
  appointment_date: string;
  appointment_time: string;
  appointment_datetime?: string;
  end_time?: string;
  notes?: string;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'finalizado' | 'atendimento_finalizado';
  dum?: string; // For obstetric services
  obstetric_data?: any; // For obstetric data
};

// ============================================
// TIPOS PARA RESPOSTAS DE API
// ============================================

export type AvailableTimeSlot = {
  start_time: string;
  end_time: string;
  duration_minutes: number;
};

export type AvailabilityResponse = {
  success: boolean;
  available_slots: AvailableTimeSlot[];
  attendant?: string;
  service?: string;
  date: string;
  day_of_week: number;
  error?: string;
};

export type CalendarDay = {
  date: string;
  day_of_week: number;
  is_available: boolean;
  total_slots: number;
  slots: AvailableTimeSlot[];
};

export type AvailabilityCalendar = {
  success: boolean;
  calendar: Record<string, CalendarDay>;
  period: {
    start_date: string;
    end_date: string;
  };
  error?: string;
};

export type TimeAvailabilityCheck = {
  success: boolean;
  is_available: boolean;
  requested_time: string;
  service_duration: number;
  alternative_slots: AvailableTimeSlot[];
  error?: string;
};

// ============================================
// TIPOS ESTENDIDOS COM RELACIONAMENTOS
// ============================================

export type AppointmentWithDetails = Appointment & {
  patient?: Patient;
  attendant?: Attendant;
  service?: Service;
};

export type ScheduleWithAssignments = Schedule & {
  assignments?: ScheduleAssignment[];
  attendant?: Attendant;
};

export type ScheduleAssignmentWithDetails = ScheduleAssignment & {
  attendant?: Attendant;
  service?: Service;
  schedule?: Schedule;
};

// Tipo para a nova tabela schedule_assignments
export type ScheduleAssignments = {
  id: string;
  schedule_id: string;
  schedule_info: string;
  attendant_id: string;
  attendant_name: string;
  created_at: string;
  updated_at: string;
};

export type ScheduleAssignmentsFormData = {
  schedule_id: string;
  schedule_info: string;
  attendant_id: string;
  attendant_name: string;
};

export type SiteSettings = {
  id: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  font_family: string;
  clinic_name?: string;
  clinic_address?: string;
  clinic_phone?: string;
  n8n_webhook_url: string | null;
  pdf_header_template?: string;
  pdf_footer_template?: string;
  pdf_patient_info_template?: string;
  pdf_prescription_template?: string;
  pdf_exams_template?: string;
  pdf_custom_styles?: string;
  updated_at: string;
  updated_by: string | null;
};
