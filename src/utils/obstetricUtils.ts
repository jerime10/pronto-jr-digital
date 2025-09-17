// Utility functions for obstetric services

export const isObstetricService = (serviceName?: string): boolean => {
  if (!serviceName) return false;
  
  const obstetricKeywords = [
    'obstetric',
    'obstétric', 
    'pre-natal',
    'pré-natal',
    'gravidez',
    'gestante',
    'pregnancy'
  ];
  
  return obstetricKeywords.some(keyword => 
    serviceName.toLowerCase().includes(keyword.toLowerCase())
  );
};

export const obstetricUtils = {
  isObstetricService
};