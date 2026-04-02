import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Key, Bot } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { toast } from 'sonner';

const POPULAR_MODELS = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini (OpenAI) - Rápido e barato', type: 'chat' },
  { id: 'openai/gpt-4o', name: 'GPT-4o (OpenAI) - Alta capacidade', type: 'chat' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Anthropic) - Excelente para análise', type: 'chat' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku (Anthropic) - Rápido e eficiente', type: 'chat' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (Google) - Boa relação custo/benefício', type: 'chat' },
  { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B (Meta) - Código aberto, custo baixo', type: 'chat' }
];

const AIConfig: React.FC = () => {
  const { settings, saveAIPrompts, isLoading } = useSiteSettings();
  const [apiKey, setApiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [model, setModel] = useState('openai/gpt-4o-mini');
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [isTestingGroq, setIsTestingGroq] = useState(false);

  useEffect(() => {
    if (settings) {
      setApiKey(settings.openrouterApiKey || '');
      setOpenaiKey(settings.openaiApiKey || '');
      setGroqKey(settings.groqApiKey || '');
      
      // Só atualiza o modelo se não tivermos começado a digitar um customizado
      // ou se for a primeira montagem com os dados do banco
      if (!isCustomModel || (isCustomModel && model === '')) {
        const savedModel = settings.openrouterModel || 'openai/gpt-4o-mini';
        setModel(savedModel);
        setIsCustomModel(!POPULAR_MODELS.some(m => m.id === savedModel));
      }
    }
  }, [settings]);

  const handleSave = () => {
    // Validação básica
    if (groqKey && !groqKey.startsWith('gsk_')) {
      toast.error('A chave da Groq deve começar com "gsk_". Verifique o valor inserido.');
      return;
    }

    saveAIPrompts.mutate({
      openrouterApiKey: apiKey,
      openrouterModel: model,
      openaiApiKey: openaiKey,
      groqApiKey: groqKey,
      promptQueixa: settings?.promptQueixa || null,
      promptEvolucao: settings?.promptEvolucao || null,
      promptExames: settings?.promptExames || null,
      settingsId: settings?.id
    });
  };

  const handleTestGroq = async () => {
    if (!groqKey) {
      toast.error('Insira a chave da Groq antes de testar.');
      return;
    }

    setIsTestingGroq(true);
    try {
      // Testar a chave via Groq API (apenas uma chamada simples de modelos)
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${groqKey}`
        }
      });

      if (response.ok) {
        toast.success('Chave da Groq validada com sucesso!');
      } else {
        const errorData = await response.json();
        toast.error(`Chave inválida: ${errorData.error?.message || 'Erro desconhecido'}`);
      }
    } catch (err) {
      toast.error('Erro ao conectar com a API da Groq.');
    } finally {
      setIsTestingGroq(false);
    }
  };

  const handleModelSelect = (value: string) => {
    if (value === 'custom') {
      setIsCustomModel(true);
      // Mantém o valor atual de 'model' ou limpa se for um dos populares
      if (POPULAR_MODELS.some(m => m.id === model)) {
        setModel('');
      }
    } else {
      setIsCustomModel(false);
      setModel(value);
    }
  };

  const isSaving = saveAIPrompts.isPending;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Configuração da Inteligência Artificial
        </CardTitle>
        <CardDescription>
          Configure a chave de API do OpenRouter para ativar as melhorias de IA nativas no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTitle className="text-blue-800">OpenRouter API</AlertTitle>
          <AlertDescription className="text-blue-700">
            A IA agora roda nativamente no sistema, sem depender do n8n para a formatação e extração de dados. Insira sua chave para habilitar a funcionalidade.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="api_key">Chave de API (OpenRouter)</Label>
          <Input
            id="api_key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
          />
          <p className="text-xs text-gray-500">
            Deixe em branco para desativar o uso de IA no sistema.
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <Label htmlFor="model_select" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Modelo de Inteligência Artificial
            </Label>
            <Select 
              value={isCustomModel ? 'custom' : model} 
              onValueChange={handleModelSelect}
            >
              <SelectTrigger id="model_select">
                <SelectValue placeholder="Selecione um modelo..." />
              </SelectTrigger>
              <SelectContent>
                {POPULAR_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Outro (Informar código manualmente)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCustomModel && (
            <div className="space-y-2 pl-6 border-l-2 border-slate-200">
              <Label htmlFor="custom_model">Código do Modelo Customizado</Label>
              <Input
                id="custom_model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="ex: anthropic/claude-3-opus"
              />
              <p className="text-xs text-gray-500">
                Consulte a lista completa de códigos de modelos na documentação da OpenRouter.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="groq_key" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Chave de API Groq (Transcrição de Áudio/Whisper Grátis)
              </Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleTestGroq}
                disabled={isTestingGroq || !groqKey}
                className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              >
                {isTestingGroq ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Testar Chave
              </Button>
            </div>
            <Input
              id="groq_key"
              type="password"
              value={groqKey}
              onChange={(e) => setGroqKey(e.target.value)}
              placeholder="gsk_..."
            />
            <p className="text-xs text-gray-500">
              Necessária exclusivamente para o recurso de gravação de voz (microfone). A Groq fornece o modelo Whisper de forma mais rápida e gratuita.
            </p>
          </div>
        </div>

        <Button 
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="w-full sm:w-auto mt-6"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Configuração de IA'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AIConfig;
