
export interface SiteSettings {
  id?: string;
  
  // Theme settings
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string | null;
  
  // Document assets (new)
  logoData: string | null;
  signatureData: string | null;
  
  // Professional signature info (new)
  signatureProfessionalName: string | null;
  signatureProfessionalTitle: string | null;
  signatureProfessionalRegistry: string | null;
  
  // Responsible Technician info (RT) (new)
  rtSignatureData: string | null;
  rtName: string | null;
  rtTitle: string | null;
  rtRegistry: string | null;
  
  // Clinic settings
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  
  // Webhook settings (for PDF generation)
  n8nWebhookUrl: string;

  // Medical record webhook settings
  medicalRecordWebhookUrl: string;
  
  // Medical record site URL (for QR code)
  medicalRecordUrlSiteJrs?: string | null;
  
  // Public registration URL (new)
  public_registration_url?: string | null;
  
  // WhatsApp reminder webhook URL (new)
  whatsapp_reminder_webhook_url?: string | null;
  
  // WhatsApp recurring reminder webhook URL (new)
  whatsapp_recurring_reminder_webhook_url?: string | null;
  
  // PIX key (new)
  pixKey?: string | null;

  // AI Configuration (new)
  openrouterApiKey?: string | null;
  openrouterModel?: string | null;
  openaiApiKey?: string | null;
  groqApiKey?: string | null;
  promptQueixa?: string | null;
  promptEvolucao?: string | null;
  promptExames?: string | null;
}

// Theme settings input (used when updating theme)
export interface ThemeSettingsInput {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoFile?: File | null;
}

// Clinic info input (used when updating clinic info)
export interface ClinicInfoInput {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
}

// Medical record webhook input (used when updating medical record webhook)
export interface MedicalRecordWebhookInput {
  medicalRecordWebhookUrl: string;
}

// Document assets input (updated)
export interface DocumentAssetsInput {
  logoData: string | null;
  signatureData: string | null;
  signatureProfessionalName?: string | null;
  signatureProfessionalTitle?: string | null;
  signatureProfessionalRegistry?: string | null;
  
  // RT fields
  rtSignatureData?: string | null;
  rtName?: string | null;
  rtTitle?: string | null;
  rtRegistry?: string | null;
}

// Professional signature info (new)
export interface ProfessionalSignatureInfo {
  name: string;
  title: string;
  registry: string;
}
