import React from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceControlProps {
  isListening: boolean;
  transcript: string;
  supported: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({
  isListening,
  transcript,
  supported,
  onStart,
  onStop
}) => {
  if (!supported) {
    return (
      <div className="glass-card p-4 text-center text-muted-foreground">
        Voice commands not supported in this browser
      </div>
    );
  }

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-primary" />
          <h3 className="font-mono font-semibold">Voice Commands</h3>
        </div>
        <Button
          variant="voice"
          size="icon"
          onClick={isListening ? onStop : onStart}
          className={cn(
            "w-14 h-14 transition-all duration-300",
            isListening && "voice-pulse bg-primary text-primary-foreground"
          )}
        >
          {isListening ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </Button>
      </div>

      {transcript && (
        <div className="p-3 bg-secondary/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Heard:</p>
          <p className="font-medium">{transcript}</p>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground mb-2">Try saying:</p>
        <p>"Buy 10 shares of AAPL"</p>
        <p>"Sell 5 TSLA"</p>
        <p>"Search MSFT" or "Price of GOOGL"</p>
        <p>"Show portfolio" or "Show watchlist"</p>
      </div>
    </div>
  );
};
