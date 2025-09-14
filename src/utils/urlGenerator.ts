
/**
 * Generates a unique attendance ID
 */
export function generateAttendanceId(recordId: string): string {
  const timestamp = Date.now();
  return `${recordId}_${timestamp}`;
}

/**
 * Generates additional timestamp for file naming
 * Simplified to avoid discrepancies with n8n
 */
export function generateAdditionalTimestamp(): number {
  return Math.floor(Date.now() / 1000); // Unix timestamp in seconds
}

/**
 * Generates a simple placeholder URL - the real URL will come from n8n
 */
export function generatePlaceholderUrl(
  patientName: string, 
  patientSus: string
): string {
  const patientNameFormatted = encodeURIComponent(patientName);
  return `https://vtthxoovjswtrwfrdlha.supabase.co/storage/v1/object/public/documents/prontuarios/${patientNameFormatted}-${patientSus}-placeholder.pdf`;
}
