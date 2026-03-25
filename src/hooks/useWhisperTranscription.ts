import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface UseWhisperTranscriptionProps {
  onTranscriptionComplete: (text: string) => void;
}

export const useWhisperTranscription = ({ 
  onTranscriptionComplete 
}: UseWhisperTranscriptionProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        setIsRecording(false);

        try {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');

          const { data, error } = await supabase.functions.invoke('audio-transcription', {
            body: formData,
          });

          if (error) {
            console.error('Erro detalhado do Supabase:', error);
            let errorMessage = error.message;
            
            // Tentar extrair o erro customizado da Edge Function
            try {
              if (error.context && error.context.json) {
                const errorJson = await error.context.json();
                if (errorJson && errorJson.error) {
                  errorMessage = errorJson.error;
                }
              }
            } catch (e) {
              console.error('Erro ao extrair contexto:', e);
            }
            
            if (errorMessage.includes('non-2xx')) {
              errorMessage = "Verifique se a Chave da Groq está configurada corretamente no painel.";
            }
            
            throw new Error(errorMessage);
          }
          
          if (data?.text) {
            onTranscriptionComplete(data.text);
          } else if (data?.error) {
            throw new Error(data.error);
          }
        } catch (error: any) {
          console.error('Erro na transcrição Whisper:', error);
          toast.error(`Falha ao transcrever áudio: ${error.message || 'Erro desconhecido'}`);
        } finally {
          setIsProcessing(false);
          // Parar as faixas do microfone
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      toast.error('Não foi possível acessar o microfone. Verifique as permissões.');
      setIsRecording(false);
    }
  }, [onTranscriptionComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
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
    isProcessing,
    isSupported: true, // MediaRecorder é amplamente suportado
    interimTranscript: isProcessing ? 'Processando áudio na nuvem...' : '',
    startRecording,
    stopRecording,
    toggleRecording
  };
};