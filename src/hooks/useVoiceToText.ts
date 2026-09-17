import { useState, useEffect, useRef, useCallback } from 'react';

// SpeechRecognition type declarations for Web Speech API
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export interface UseVoiceToTextOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onResult?: (transcript: string) => void;
}

export function useVoiceToText(options: UseVoiceToTextOptions = {}) {
  const {
    continuous = true,
    interimResults = true,
    lang = 'en-US',
    onResult,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const win = typeof window !== 'undefined' ? (window as unknown as IWindow) : null;
    const SpeechRecognition = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let finalStr = '';
        let interimStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalStr += res[0].transcript + ' ';
          } else {
            interimStr += res[0].transcript;
          }
        }

        if (finalStr) {
          setTranscript((prev) => {
            const updated = (prev ? prev + ' ' : '') + finalStr.trim();
            if (onResult) onResult(updated);
            return updated;
          });
        }
        setInterimTranscript(interimStr);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access was denied. Please allow microphone permissions in your browser.');
        } else if (event.error === 'network') {
          setError('Network error during voice recognition.');
        } else if (event.error !== 'no-speech') {
          setError(`Speech recognition notice: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore cleanup errors
        }
      }
    };
  }, [continuous, interimResults, lang, onResult]);

  const startListening = useCallback(async () => {
    setError(null);
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    try {
      // Request mic permission proactively
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      recognitionRef.current.start();
    } catch (err: any) {
      console.warn('Failed to start speech recognition', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setError('Microphone permission denied. Please grant microphone access in browser settings.');
      } else {
        // Recognition might already be running
        try {
          recognitionRef.current.stop();
          setTimeout(() => recognitionRef.current.start(), 200);
        } catch (e) {
          setError('Could not access microphone.');
        }
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
