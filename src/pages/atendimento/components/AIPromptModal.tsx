import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldType: 'queixa' | 'evolucao' | 'exames';
}

const FIELD_LABELS = {
  queixa: 'Queixa Principal e História',
  evolucao: 'Evolução Clínica',
  exames: 'Resultados de Exames'
};

const DEFAULT_PROMPTS = {
  queixa: 'Você é um assistente médico especializado em estruturar a Queixa Principal e História da Moléstia Atual. Organize o texto recebido em um formato profissional, claro e objetivo.',
  evolucao: 'Você é um assistente médico. Organize a evolução clínica do paciente com clareza, destacando estado geral, sinais vitais, e progressão do quadro.',
  exames: 'Você é um assistente médico. Analise e estruture os resultados de exames recebidos, extraindo parâmetros-chave e formatando em um laudo estruturado.'
};

export const AIPromptModal: React.FC<AIPromptModalProps> = ({ isOpen, onClose, fieldType }) => {
  const { settings, saveAIPrompts } = useSiteSettings();
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (isOpen && settings) {
      const currentPrompt = fieldType === 'queixa' ? settings.promptQueixa :
                            fieldType === 'evolucao' ? settings.promptEvolucao :
                            settings.promptExames;
                            
      setPrompt(currentPrompt || DEFAULT_PROMPTS[fieldType]);
    }
  }, [isOpen, settings, fieldType]);

  const handleSave = async () => {
    if (!settings) return;
    
    saveAIPrompts.mutate({
      openrouterApiKey: settings.openrouterApiKey || null,
      promptQueixa: fieldType === 'queixa' ? prompt : (settings.promptQueixa || null),
      promptEvolucao: fieldType === 'evolucao' ? prompt : (settings.promptEvolucao || null),
      promptExames: fieldType === 'exames' ? prompt : (settings.promptExames || null),
      settingsId: settings.id
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  const isSaving = saveAIPrompts.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Instruções da IA - {FIELD_LABELS[fieldType]}
          </DialogTitle>
          <DialogDescription>
            Defina o comportamento e as regras que a Inteligência Artificial deve seguir ao processar este campo.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Insira as instruções (prompt) para a IA..."
            className="min-h-[200px]"
          />
          <p className="text-xs text-muted-foreground">
            Dica: Seja específico sobre o formato de saída desejado, termos médicos a serem utilizados e o tom da resposta. A IA retornará a resposta no formato JSON adequado para a interface automaticamente.
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !prompt.trim()}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Instruções'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
