import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PixKeyPopupProps {
  isOpen: boolean;
  onClose: () => void;
  pixKey: string;
}

export const PixKeyPopup: React.FC<PixKeyPopupProps> = ({ isOpen, onClose, pixKey }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      toast.success('Chave PIX copiada!');
      
      // Fechar o popup após 1 segundo
      setTimeout(() => {
        onClose();
        // Resetar estado de copiado após fechar
        setTimeout(() => setCopied(false), 300);
      }, 1000);
    } catch (error) {
      console.error('Erro ao copiar chave PIX:', error);
      toast.error('Erro ao copiar chave PIX');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            💰 Chave PIX para Pagamento
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Copie a chave e cole na área de PIX do seu banco
          </DialogDescription>
        </DialogHeader>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-md">
          <CardContent className="pt-6 space-y-4">
            {/* Chave PIX */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-green-800">Chave PIX:</p>
              <div className="bg-white border-2 border-green-300 rounded-lg p-4">
                <p className="text-green-900 font-mono text-sm break-all text-center">
                  {pixKey}
                </p>
              </div>
            </div>

            {/* Botão de Copiar */}
            <Button
              onClick={handleCopy}
              className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md transition-all"
              size="lg"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-5 w-5" />
                  Copiar Chave PIX
                </>
              )}
            </Button>

            {/* Instruções */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 text-center">
                📱 <strong>Como pagar:</strong> Abra o app do seu banco, acesse a área PIX, 
                cole esta chave e finalize o pagamento
              </p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
