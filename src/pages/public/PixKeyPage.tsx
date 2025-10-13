import React, { useEffect, useState } from 'react';
import { PixKeyPopup } from '@/components/ui/PixKeyPopup';
import { usePixKey } from '@/hooks/usePixKey';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const PixKeyPage: React.FC = () => {
  const { pixKey, isLoading } = usePixKey();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Abrir popup automaticamente quando carregar se houver chave PIX
    if (!isLoading && pixKey) {
      setIsOpen(true);
    }
  }, [pixKey, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-green-700 font-medium">Carregando chave PIX...</p>
        </div>
      </div>
    );
  }

  if (!pixKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              Nenhuma chave PIX configurada no sistema. Entre em contato com o administrador.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <PixKeyPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        pixKey={pixKey}
      />
    </div>
  );
};

export default PixKeyPage;
