
import { MedicalRecord } from '@/types/database';
import { ImageData } from '@/types/imageTypes';

export interface SubmitMedicalRecordParams {
  medicalRecord: MedicalRecord & {
    patient: {
      name: string;
      sus: string;
      phone: string;
      address?: string;
      gender?: string;
      date_of_birth?: string;
    };
    professional?: {
      name: string;
      specialty?: string;
      license_type?: string;
      license_number?: string;
    };
  };
  images?: ImageData[];
  selectedModelTitle?: string | null;
}

export interface MedicalRecordResponse {
  success: boolean;
  message?: string;
  document?: {
    fileUrl: string;
    documentType: string;
    documentId?: string;
  };
  error?: string;
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  document?: {
    fileUrl: string;
    documentType: string;
    documentId?: string;
  };
  error?: string;
}

export interface MedicalRecordSubmissionData {
  medicalRecord: MedicalRecord & {
    patient: {
      id: string;
      name: string;
      sus: string;
      phone: string;
      address?: string;
      gender?: string;
      date_of_birth?: string;
    };
  };
  patient: {
    id: string;
    name: string;
    sus: string;
    phone: string;
    address?: string;
    gender?: string;
    date_of_birth?: string;
  };
  professional: {
    id: string;
    name: string;
    specialty?: string;
    license_type?: string;
    license_number?: string;
  };
  images?: ImageData[];
  webhookUrl: string;
}

export interface DocumentStorageParams {
  fileUrl: string;
  documentType: string;
  title: string;
  patientId: string;
  professionalId: string;
  medicalRecordId: string;
  attendanceStartAt?: string | null;
  attendanceEndAt?: string | null;
}

export interface FormDataBuilderParams {
  medicalRecord: MedicalRecord & {
    patient: {
      name: string;
      sus: string;
      phone: string;
      address?: string;
      gender?: string;
      date_of_birth?: string;
    };
  };
  attendanceId: string;
  additionalTimestamp: number;
  images?: ImageData[];
  assets: {
    logoData?: string;
    signatureData?: string;
    signatureProfessionalName?: string;
    signatureProfessionalTitle?: string;
    signatureProfessionalRegistry?: string;
  };
  selectedModelTitle?: string | null;
}
