
export interface WhatsAppTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  is_active: boolean;
  template_type: string;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariables {
  saudacao?: string;
  nome?: string;
  data?: string;
  data_consulta?: string;
  link?: string;
  [key: string]: string | undefined;
}
