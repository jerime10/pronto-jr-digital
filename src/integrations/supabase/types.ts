export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string | null
          appointment_datetime: string | null
          appointment_time: string | null
          attendant_id: string
          attendant_name: string | null
          created_at: string | null
          end_time: string | null
          id: string
          notes: string | null
          patient_id: string | null
          patient_name: string | null
          patient_phone: string | null
          service_duration: number | null
          service_id: string
          service_name: string | null
          service_price: number | null
          start_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_datetime?: string | null
          appointment_time?: string | null
          attendant_id: string
          attendant_name?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          service_duration?: number | null
          service_id: string
          service_name?: string | null
          service_price?: number | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_datetime?: string | null
          appointment_time?: string | null
          attendant_id?: string
          attendant_name?: string | null
          created_at?: string | null
          end_time?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          service_duration?: number | null
          service_id?: string
          service_name?: string | null
          service_price?: number | null
          start_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "attendants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      attendants: {
        Row: {
          available: boolean | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          photo_url: string | null
          position: string | null
          services: string[] | null
          share_link: string | null
          specialties: string[] | null
          updated_at: string | null
          working_days: number[] | null
        }
        Insert: {
          available?: boolean | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          services?: string[] | null
          share_link?: string | null
          specialties?: string[] | null
          updated_at?: string | null
          working_days?: number[] | null
        }
        Update: {
          available?: boolean | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          services?: string[] | null
          share_link?: string | null
          specialties?: string[] | null
          updated_at?: string | null
          working_days?: number[] | null
        }
        Relationships: []
      }
      exam_models: {
        Row: {
          created_at: string | null
          id: string
          instructions: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instructions?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instructions?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          attendance_end_at: string | null
          attendance_start_at: string | null
          created_at: string
          document_type: string
          file_url: string
          id: string
          medical_record_id: string | null
          patient_id: string
          professional_id: string
          shared_at: string | null
          shared_via: string | null
          title: string
        }
        Insert: {
          attendance_end_at?: string | null
          attendance_start_at?: string | null
          created_at?: string
          document_type: string
          file_url: string
          id?: string
          medical_record_id?: string | null
          patient_id: string
          professional_id: string
          shared_at?: string | null
          shared_via?: string | null
          title: string
        }
        Update: {
          attendance_end_at?: string | null
          attendance_start_at?: string | null
          created_at?: string
          document_type?: string
          file_url?: string
          id?: string
          medical_record_id?: string | null
          patient_id?: string
          professional_id?: string
          shared_at?: string | null
          shared_via?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_drafts: {
        Row: {
          created_at: string
          form_data: Json
          id: string
          patient_id: string
          professional_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          form_data: Json
          id?: string
          patient_id: string
          professional_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          form_data?: Json
          id?: string
          patient_id?: string
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_drafts_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          allergies: string | null
          attendance_end_at: string | null
          attendance_start_at: string | null
          created_at: string | null
          custom_prescription: string | null
          evolution: string | null
          exam_observations: string | null
          exam_requests: Json | null
          exam_results: string | null
          file_url_storage: string | null
          history: string | null
          id: string
          images_data: Json | null
          main_complaint: string | null
          patient_id: string
          prescription_model_id: string | null
          professional_id: string
          updated_at: string | null
        }
        Insert: {
          allergies?: string | null
          attendance_end_at?: string | null
          attendance_start_at?: string | null
          created_at?: string | null
          custom_prescription?: string | null
          evolution?: string | null
          exam_observations?: string | null
          exam_requests?: Json | null
          exam_results?: string | null
          file_url_storage?: string | null
          history?: string | null
          id?: string
          images_data?: Json | null
          main_complaint?: string | null
          patient_id: string
          prescription_model_id?: string | null
          professional_id: string
          updated_at?: string | null
        }
        Update: {
          allergies?: string | null
          attendance_end_at?: string | null
          attendance_start_at?: string | null
          created_at?: string | null
          custom_prescription?: string | null
          evolution?: string | null
          exam_observations?: string | null
          exam_requests?: Json | null
          exam_results?: string | null
          file_url_storage?: string | null
          history?: string | null
          id?: string
          images_data?: Json | null
          main_complaint?: string | null
          patient_id?: string
          prescription_model_id?: string | null
          professional_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_medical_records_professional"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_prescription_model_id_fkey"
            columns: ["prescription_model_id"]
            isOneToOne: false
            referencedRelation: "prescription_models"
            referencedColumns: ["id"]
          },
        ]
      }
      "modelo-result-exames": {
        Row: {
          created_at: string | null
          id: string
          name: string
          result: string | null
          result_template: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          result?: string | null
          result_template?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          result?: string | null
          result_template?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string
          age: number | null
          bairro: string | null
          created_at: string | null
          date_of_birth: string | null
          gender: string | null
          id: string
          name: string
          phone: string
          sus: string
          updated_at: string | null
        }
        Insert: {
          address: string
          age?: number | null
          bairro?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          gender?: string | null
          id?: string
          name: string
          phone: string
          sus: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          age?: number | null
          bairro?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          gender?: string | null
          id?: string
          name?: string
          phone?: string
          sus?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      prescription_models: {
        Row: {
          created_at: string | null
          description: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      professionals: {
        Row: {
          contact: string | null
          created_at: string
          custom_user_id: string | null
          id: string
          license_number: string | null
          license_type: string | null
          name: string
          profile_image: string | null
          signature: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          custom_user_id?: string | null
          id?: string
          license_number?: string | null
          license_type?: string | null
          name: string
          profile_image?: string | null
          signature?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          custom_user_id?: string | null
          id?: string
          license_number?: string | null
          license_type?: string | null
          name?: string
          profile_image?: string | null
          signature?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_custom_user_id_fkey"
            columns: ["custom_user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_assignments: {
        Row: {
          attendant_id: string
          attendant_name: string
          created_at: string | null
          end_time: string | null
          id: string
          is_available: boolean | null
          schedule_id: string
          schedule_info: string
          service_id: string | null
          specific_date: string | null
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          attendant_id: string
          attendant_name: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          schedule_id: string
          schedule_info: string
          service_id?: string | null
          specific_date?: string | null
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          attendant_id?: string
          attendant_name?: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          is_available?: boolean | null
          schedule_id?: string
          schedule_info?: string
          service_id?: string | null
          specific_date?: string | null
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_assignments_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "attendants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_assignments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_assignments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          attendant_id: string | null
          available: boolean | null
          created_at: string | null
          day: string
          day_of_week: number | null
          days: string[] | null
          duration: number
          end_time: string | null
          id: string
          is_active: boolean | null
          start_time: string
          updated_at: string | null
        }
        Insert: {
          attendant_id?: string | null
          available?: boolean | null
          created_at?: string | null
          day: string
          day_of_week?: number | null
          days?: string[] | null
          duration: number
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          start_time: string
          updated_at?: string | null
        }
        Update: {
          attendant_id?: string | null
          available?: boolean | null
          created_at?: string | null
          day?: string
          day_of_week?: number | null
          days?: string[] | null
          duration?: number
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "attendants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_assignments: {
        Row: {
          attendant_id: string
          attendant_name: string
          attendant_position: string
          created_at: string | null
          id: string
          service_duration: number
          service_id: string
          service_name: string
          service_price: number
          updated_at: string | null
        }
        Insert: {
          attendant_id: string
          attendant_name: string
          attendant_position: string
          created_at?: string | null
          id?: string
          service_duration: number
          service_id: string
          service_name: string
          service_price: number
          updated_at?: string | null
        }
        Update: {
          attendant_id?: string
          attendant_name?: string
          attendant_position?: string
          created_at?: string | null
          id?: string
          service_duration?: number
          service_id?: string
          service_name?: string
          service_price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          available: boolean | null
          created_at: string | null
          duration: number
          id: string
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          created_at?: string | null
          duration: number
          id?: string
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          created_at?: string | null
          duration?: number
          id?: string
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          accent_color: string | null
          clinic_address: string | null
          clinic_name: string | null
          clinic_phone: string | null
          font_family: string | null
          id: string
          logo_data: string | null
          logo_url: string | null
          medical_record_webhook_url: string | null
          n8n_webhook_url: string | null
          pdf_custom_styles: string | null
          pdf_exams_template: string | null
          pdf_footer_template: string | null
          pdf_header_template: string | null
          pdf_patient_info_template: string | null
          pdf_prescription_template: string | null
          primary_color: string | null
          setting_key: string | null
          setting_value: string | null
          signature_data: string | null
          signature_professional_name: string | null
          signature_professional_registry: string | null
          signature_professional_title: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          accent_color?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          font_family?: string | null
          id?: string
          logo_data?: string | null
          logo_url?: string | null
          medical_record_webhook_url?: string | null
          n8n_webhook_url?: string | null
          pdf_custom_styles?: string | null
          pdf_exams_template?: string | null
          pdf_footer_template?: string | null
          pdf_header_template?: string | null
          pdf_patient_info_template?: string | null
          pdf_prescription_template?: string | null
          primary_color?: string | null
          setting_key?: string | null
          setting_value?: string | null
          signature_data?: string | null
          signature_professional_name?: string | null
          signature_professional_registry?: string | null
          signature_professional_title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          accent_color?: string | null
          clinic_address?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          font_family?: string | null
          id?: string
          logo_data?: string | null
          logo_url?: string | null
          medical_record_webhook_url?: string | null
          n8n_webhook_url?: string | null
          pdf_custom_styles?: string | null
          pdf_exams_template?: string | null
          pdf_footer_template?: string | null
          pdf_header_template?: string | null
          pdf_patient_info_template?: string | null
          pdf_prescription_template?: string | null
          primary_color?: string | null
          setting_key?: string | null
          setting_value?: string | null
          signature_data?: string | null
          signature_professional_name?: string | null
          signature_professional_registry?: string | null
          signature_professional_title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          password: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          password: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          password?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      whatsapp_message_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          template: string
          template_type: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          template: string
          template_type?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          template?: string
          template_type?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_auth_policy: {
        Args: {
          check_expression: string
          operation: string
          policy_name: string
          table_name: string
        }
        Returns: undefined
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_modelo_result_exames: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          name: string
          result_template: string
          updated_at: string
        }[]
      }
      get_patients_for_search: {
        Args: { search_term?: string }
        Returns: {
          address: string
          age: number
          created_at: string
          date_of_birth: string
          gender: string
          id: string
          name: string
          phone: string
          sus: string
          updated_at: string
        }[]
      }
      hash_password: {
        Args: { password: string }
        Returns: string
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      pg_enable_row_level_security: {
        Args: { table_name: string }
        Returns: undefined
      }
      validate_session: {
        Args: { session_token: string }
        Returns: {
          email: string
          name: string
          role: string
          user_id: string
        }[]
      }
      validate_simple_user: {
        Args: { input_password: string; input_username: string }
        Returns: {
          id: string
          is_active: boolean
          username: string
        }[]
      }
      verify_password: {
        Args: { hash: string; password: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
