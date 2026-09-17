import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2, Volume2, AlertCircle, Check } from 'lucide-react';
import { useVoiceToText } from '../../hooks/useVoiceToText';

interface VoiceDictationButtonProps {
  onAppendText: (text: string) => void;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  onAppendText,
  label = 'Dictate Field Report',
  className = '',
  size = 'md',
}) => {
  const [lastEmittedText, setLastEmittedText] = useState('');
  const [showErrorToast, setShowErrorToast] = useState(false);

  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceToText({
    continuous: true,
    interimResults: true,
    lang: 'en-US',
  });

  // When new final transcript chunk arrives, append to parent form field
  useEffect(() => {
    if (transcript && transcript !== lastEmittedText) {
      const newChunk = transcript.slice(lastEmittedText.length).trim();
      if (newChunk) {
        onAppendText(newChunk);
        setLastEmittedText(transcript);
      }
    }
  }, [transcript, lastEmittedText, onAppendText]);

  useEffect(() => {
    if (error) {
      setShowErrorToast(true);
      const timer = setTimeout(() => setShowErrorToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      setLastEmittedText('');
      startListening();
    }
  };

  const isSmall = size === 'sm';

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        className={`relative flex items-center space-x-1.5 rounded-xl font-bold transition cursor-pointer shadow-xs ${
          isListening
            ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-500/30'
            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
        } ${isSmall ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'}`}
        title={
          isListening
            ? 'Dictating... Tap to finish voice input'
            : 'Dictate using your device microphone'
        }
      >
        {isListening ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <Mic className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} animate-bounce`} />
            <span>Listening...</span>
          </>
        ) : (
          <>
            <Mic className={`${isSmall ? 'w-3 h-3 text-emerald-600' : 'w-3.5 h-3.5 text-emerald-600'}`} />
            <span>{label}</span>
          </>
        )}
      </button>

      {/* Floating Audio Feedback when recording */}
      {isListening && (
        <div className="absolute top-full left-0 mt-2 z-30 flex items-center space-x-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-xl border border-slate-800 text-[11px] whitespace-nowrap animate-in fade-in slide-in-from-top-1">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>
            {interimTranscript ? (
              <span className="italic text-emerald-300">"{interimTranscript}"</span>
            ) : (
              'Speak clearly into mic...'
            )}
          </span>
          <button
            type="button"
            onClick={toggleListening}
            className="ml-2 px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
          >
            Done
          </button>
        </div>
      )}

      {/* Error notification */}
      {showErrorToast && error && (
        <div className="absolute top-full left-0 mt-2 z-30 flex items-start space-x-2 bg-rose-900 text-rose-100 p-2.5 rounded-xl shadow-xl border border-rose-700 text-xs w-64 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-[11px]">Microphone Notice</p>
            <p className="text-[10px] text-rose-200 mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowErrorToast(false)}
            className="text-rose-300 hover:text-white text-xs font-bold"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
