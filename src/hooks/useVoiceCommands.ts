import { useState, useCallback, useRef, useEffect } from 'react';

interface VoiceCommandResult {
  command: string;
  action: 'search' | 'buy' | 'sell' | 'portfolio' | 'watchlist' | 'history' | 'unknown';
  symbol?: string;
  quantity?: number;
}

export const useVoiceCommands = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SpeechRecognitionAPI);
    
    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
    }
  }, []);

  const parseCommand = useCallback((text: string): VoiceCommandResult => {
    const lowerText = text.toLowerCase().trim();
    
    const buyMatch = lowerText.match(/buy\s+(\d+)\s+(?:shares?\s+of\s+)?([a-z]+)/i);
    if (buyMatch) {
      return {
        command: text,
        action: 'buy',
        quantity: parseInt(buyMatch[1]),
        symbol: buyMatch[2].toUpperCase()
      };
    }

    const sellMatch = lowerText.match(/sell\s+(\d+)\s+(?:shares?\s+of\s+)?([a-z]+)/i);
    if (sellMatch) {
      return {
        command: text,
        action: 'sell',
        quantity: parseInt(sellMatch[1]),
        symbol: sellMatch[2].toUpperCase()
      };
    }

    const searchMatch = lowerText.match(/(?:search|quote|get\s+price\s+(?:of|for)?|price\s+of)\s+([a-z]+)/i);
    if (searchMatch) {
      return {
        command: text,
        action: 'search',
        symbol: searchMatch[1].toUpperCase()
      };
    }

    if (lowerText.includes('portfolio') || lowerText.includes('my holdings')) {
      return { command: text, action: 'portfolio' };
    }
    if (lowerText.includes('watchlist') || lowerText.includes('watch list')) {
      return { command: text, action: 'watchlist' };
    }
    if (lowerText.includes('history') || lowerText.includes('trades')) {
      return { command: text, action: 'history' };
    }

    return { command: text, action: 'unknown' };
  }, []);

  const startListening = useCallback((onResult: (result: VoiceCommandResult) => void) => {
    if (!recognitionRef.current) return;

    recognitionRef.current.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const text = result[0].transcript;
      
      setTranscript(text);
      
      if (result.isFinal) {
        const parsed = parseCommand(text);
        onResult(parsed);
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
    setIsListening(true);
    setTranscript('');
  }, [parseCommand]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  }, []);

  return {
    isListening,
    transcript,
    supported,
    startListening,
    stopListening,
    speak,
    parseCommand
  };
};
