import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useWhisperTranscription } from '@/hooks/useWhisperTranscription';
import { cn } from '@/lib/utils';

interface AudioRecorderButtonProps {
  onTranscription: (text: string) => void;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export const AudioRecorderButton: React.FC<AudioRecorderButtonProps> = ({
  onTranscription,
  className,
  size = 'sm',
  variant = 'outline'
}) => {
  const { isRecording, isProcessing, toggleRecording, interimTranscript } = useWhisperTranscription({
    onTranscriptionComplete: onTranscription
  });

  return (
    <div className="relative inline-flex items-center">
      {(isRecording || isProcessing) && interimTranscript && (
        <div className="absolute right-full mr-3 whitespace-nowrap bg-muted px-3 py-1.5 rounded-md text-xs text-muted-foreground animate-pulse max-w-[200px] overflow-hidden text-ellipsis">
          {interimTranscript}
        </div>
      )}
      <Button
        type="button"
        variant={isRecording ? 'destructive' : variant}
        size={size}
        onClick={toggleRecording}
        disabled={isProcessing}
        className={cn(
          "transition-all duration-200",
          isRecording && "animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]",
          className
        )}
        title={isRecording ? "Parar gravação" : "Ditar texto"}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <>
            <Square className="h-4 w-4 mr-1 fill-current" />
            Parar
          </>
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
