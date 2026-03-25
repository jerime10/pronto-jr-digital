import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseAudioTranscriptionProps {
  onTranscriptionComplete: (text: string) => void;
  language?: string;
}

export const useAudioTranscription = ({ 
  onTranscriptionComplete, 
  language = 'pt-BR' 
}: UseAudioTranscriptionProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  
  // Usar ref para manter a instância do recognition e não recriar a cada render
  const recognitionRef = useRef<any>(null);
  // Ref para acumular o texto final da sessão atual
  const finalTranscriptRef = useRef('');
  // Ref para controlar se o usuário pediu explicitamente para parar
  const isIntentionalStopRef = useRef(false);

  useEffect(() => {
    // Verificar suporte do navegador (Chrome, Edge, Safari mais recentes suportam)
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      console.warn('Web Speech API não é suportada neste navegador.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Continua ouvindo mesmo se houver pausas
    recognition.interimResults = true; // Retorna resultados parciais enquanto fala
    recognition.lang = language;

    recognition.onstart = () => {
      setIsRecording(true);
      // Não limpa o transcript aqui, pois pode ser um restart automático
      setInterimTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interimText = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += event.results[i][0].transcript + ' ';
        } else {
          interimText += event.results[i][0].transcript;
        }
      }
      
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: any) => {
      console.error('Erro de reconhecimento de voz:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Permissão para usar o microfone foi negada.');
        setIsRecording(false);
        isIntentionalStopRef.current = true;
      } else if (event.error === 'no-speech') {
        // Ignora erros de silêncio para manter a gravação ativa
      } else if (event.error === 'network') {
        toast.error('Erro de conexão. A transcrição pode falhar.');
      } else {
        toast.error(`Erro ao gravar áudio: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Se não foi um stop intencional (ex: o Chrome cortou por silêncio), reinicia
      if (!isIntentionalStopRef.current) {
        try {
          recognition.start();
          return; // Sai sem processar o final ainda
        } catch (e) {
          console.error("Falha ao tentar reiniciar gravação:", e);
        }
      }

      // Fluxo normal de finalização
      setIsRecording(false);
      const finalText = finalTranscriptRef.current.trim();
      
      // Se tivermos texto gravado, disparamos o callback
      if (finalText) {
        onTranscriptionComplete(finalText);
      } else if (interimTranscript.trim()) {
        // Fallback caso termine abruptamente com texto interino
        onTranscriptionComplete(interimTranscript.trim());
      }
      
      setInterimTranscript('');
      finalTranscriptRef.current = '';
    };

    recognitionRef.current = recognition;

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, onTranscriptionComplete, interimTranscript]);

  const startRecording = useCallback(() => {
    if (!isSupported) {
      toast.error('Seu navegador não suporta gravação de áudio nativa. Use o Google Chrome ou Edge.');
      return;
    }

    try {
      if (recognitionRef.current && !isRecording) {
        isIntentionalStopRef.current = false;
        finalTranscriptRef.current = '';
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      setIsRecording(false);
    }
  }, [isSupported, isRecording]);

  const stopRecording = useCallback(() => {
    try {
      if (recognitionRef.current && isRecording) {
        isIntentionalStopRef.current = true;
        recognitionRef.current.stop();
      }
    } catch (error) {
      console.error('Erro ao parar gravação:', error);
    }
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isSupported,
    interimTranscript,
    startRecording,
    stopRecording,
    toggleRecording
  };
};