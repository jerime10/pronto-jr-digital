import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Patient, Professional } from '@/types/database';

interface WebhookResponse {
  success: boolean;
  documentId?: string;
  fileUrl?: string;
  documentType?: string;
  error?: string;
  message?: string; // Added the missing message property
  metadata?: {
    requestId: string;
    generatedAt: string;
  };
}

interface GenerateDocumentParams {
  documentType: string;
  medicalRecordId: string;
  patientId: string;
  professionalId: string;
  title: string;
  data: {
    patient: Partial<Patient>;
    professional: Partial<Professional>;
    record: Record<string, any>;
  };
}

// Production URL hardcoded temporarily for testing
const PRODUCTION_WEBHOOK_URL = "https://n8n.mentoriajrs.com/webhook/bde8ccb3-9c2f-434a-b1b7-ac2d86f08b9d";

export async function fetchWebhookUrl(): Promise<string> {
  try {
    // Mock: Return a default webhook URL for the pharmacy system
    console.log('Mocking webhook URL fetch for pharmacy system');
    const mockWebhookUrl = PRODUCTION_WEBHOOK_URL || 'https://example.com/webhook/pharmacy';
    return mockWebhookUrl;
  } catch (error) {
    console.error('Error fetching webhook URL:', error);
    throw new Error('Não foi possível obter a URL do webhook');
  }
}

export async function generateDocumentViaWebhook(params: GenerateDocumentParams): Promise<WebhookResponse> {
  try {
    // Try to fetch the webhook URL with improved error handling
    let webhookUrl;
    try {
      // Use hardcoded production URL (temporarily), otherwise fall back to DB URL
      webhookUrl = PRODUCTION_WEBHOOK_URL || await fetchWebhookUrl();
      console.log('Using webhook URL:', webhookUrl);
    } catch (error) {
      console.error('Failed to get webhook URL:', error);
      toast.error('URL do webhook n8n não configurada. Configure em Administração > Configurações.');
      throw new Error('URL do webhook não configurada');
    }
    
    if (!webhookUrl) {
      toast.error('URL do webhook n8n não configurada. Configure em Administração > Configurações.');
      throw new Error('URL do webhook não configurada');
    }

    const requestId = crypto.randomUUID();
    
    const payload = {
      action: "generate_pdf",
      documentType: params.documentType,
      medicalRecordId: params.medicalRecordId,
      patientId: params.patientId,
      professionalId: params.professionalId,
      title: params.title,
      data: params.data,
      metadata: {
        requestId,
        timestamp: new Date().toISOString()
      }
    };

    console.log('Sending payload to webhook:', JSON.stringify(payload, null, 2));
    console.log('Request headers:', {
      'Content-Type': 'application/json',
      'Origin': window.location.origin
    });

    // Call the n8n webhook with no-cors mode
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin, // Add Origin header to mimic test behavior
      },
      mode: 'no-cors', // Add no-cors mode to better handle CORS issues
      body: JSON.stringify(payload),
    });
    
    console.log('Raw webhook response status:', response.status);
    console.log('Raw webhook response type:', response.type);
    
    // When using no-cors mode, we can't actually read the response body
    // The response type will be 'opaque', so we assume success
    if (response.type === 'opaque') {
      console.log('Received opaque response due to no-cors mode - assuming success');
      
      // Create a simulated response for now
      const simulatedResponse: WebhookResponse = {
        success: true,
        error: undefined,
        documentType: params.documentType,
        documentId: requestId,
        fileUrl: `https://n8n.mentoriajrs.com/files/prontuario_${params.medicalRecordId}.pdf`,
      };
      
      // Store the generated document in our database
      try {
        await storeGeneratedDocument({
          fileUrl: simulatedResponse.fileUrl!,
          documentType: simulatedResponse.documentType || 'prontuario',
          title: params.title,
          patientId: params.patientId,
          professionalId: params.professionalId,
          medicalRecordId: params.medicalRecordId
        });
      } catch (storeError) {
        console.error('Error storing generated document:', storeError);
        // Continue even if storage fails, as the document might still be generated
      }
      
      return simulatedResponse;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Webhook response error (${response.status}):`, errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    let result: WebhookResponse;
    try {
      result = await response.json();
      console.log('Webhook response:', result);
    } catch (jsonError) {
      console.error('Error parsing JSON response:', jsonError);
      throw new Error('Falha ao analisar resposta do servidor');
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Falha ao gerar documento');
    }
    
    // If successful and we have a file URL, store the document
    if (result.fileUrl) {
      try {
        await storeGeneratedDocument({
          fileUrl: result.fileUrl,
          documentType: result.documentType || params.documentType,
          title: params.title,
          patientId: params.patientId,
          professionalId: params.professionalId,
          medicalRecordId: params.medicalRecordId
        });
      } catch (storeError) {
        console.error('Error storing generated document:', storeError);
        // Continue even if storage fails
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error generating document via webhook:', error);
    throw error;
  }
}

// New function to store generated documents in the database (same as in medicalRecordSubmissionService)
async function storeGeneratedDocument({
  fileUrl,
  documentType,
  title,
  patientId,
  professionalId,
  medicalRecordId
}: {
  fileUrl: string;
  documentType: string;
  title: string;
  patientId: string;
  professionalId: string;
  medicalRecordId: string;
}) {
  try {
    console.log('Mocking document storage for pharmacy system:', {
      fileUrl,
      documentType,
      title,
      patientId,
      professionalId,
      medicalRecordId
    });
    
    // Mock: Return a fake success response for the pharmacy system
    const mockData = {
      id: crypto.randomUUID(),
      file_url: fileUrl,
      document_type: documentType,
      title,
      patient_id: patientId,
      professional_id: professionalId,
      medical_record_id: medicalRecordId,
      created_at: new Date().toISOString()
    };
    
    console.log('Successfully mocked document storage:', mockData);
    return mockData;
  } catch (error) {
    console.error('Failed to store generated document:', error);
    throw error;
  }
}

export async function checkDocumentStatus(documentId: string): Promise<boolean> {
  try {
    console.log('Mocking document status check for pharmacy system:', documentId);
    // Mock: Always return true for the pharmacy system
    return true;
  } catch (error) {
    console.error('Error checking document status:', error);
    return false;
  }
}
