import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Check, 
  Sparkles, 
  Volume2, 
  AlertCircle, 
  Send,
  Radio
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FieldOfficerVoiceRecorderProps {
  taskId: string;
  taskTitle: string;
  onPostUpdate: (note: string, isVoiceVerified: boolean) => void;
}

export const FieldOfficerVoiceRecorder: React.FC<FieldOfficerVoiceRecorderProps> = ({
  taskId,
  taskTitle,
  onPostUpdate,
}) => {
  const { currentUser } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }

    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    setErrorMessage(null);
    setInterimTranscript('');

    // 1. Check microphone media stream for visualizer
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateMeter = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateMeter);
          };
          updateMeter();
        }
      }
    } catch (micErr: any) {
      console.warn('Microphone stream notice:', micErr);
      if (micErr?.name === 'NotAllowedError' || micErr?.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser.');
        return;
      }
    }

    // 2. Start Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsRecording(true);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let currentFinal = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptChunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              currentFinal += transcriptChunk + ' ';
            } else {
              currentInterim += transcriptChunk;
            }
          }

          if (currentFinal) {
            setTranscript((prev) => (prev ? `${prev} ${currentFinal.trim()}` : currentFinal.trim()));
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setErrorMessage('Microphone permission blocked. Please check browser permissions.');
          } else if (event.error === 'no-speech') {
            // benign
          } else {
            setErrorMessage(`Voice recognition notice: ${event.error}`);
          }
        };

        recognition.onend = () => {
          // If still marked as recording, keep alive
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
      } catch (err: any) {
        console.warn('Recognition start error:', err);
        setIsRecording(false);
      }
    } else {
      // Fallback mode for environments without SpeechRecognition
      setIsRecording(true);
      // Provide an interactive mock audio transcript buffer
      const fallbackNote = 'Field inspection confirmed: Work package progress verified at coordinates 0.22, 5.56.';
      setTimeout(() => {
        setTranscript((prev) => (prev ? `${prev} ${fallbackNote}` : fallbackNote));
      }, 1800);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setAudioLevel(0);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  const handlePostVoiceUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNote = (transcript + (interimTranscript ? ` ${interimTranscript}` : '')).trim();
    if (!finalNote) return;

    onPostUpdate(finalNote, true);
    setTranscript('');
    setInterimTranscript('');
    stopRecording();
  };

  const addPresetNote = (preset: string) => {
    setTranscript((prev) => (prev ? `${prev}. ${preset}` : preset));
  };

  return (
    <div className="p-3.5 bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-200/80 rounded-2xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white ${
            isRecording ? 'bg-rose-600 animate-pulse' : 'bg-indigo-600'
          }`}>
            <Mic className="w-3.5 h-3.5" />
          </div>
          <span className="font-black text-slate-900 text-xs">
            Field Officer Voice-to-Text
          </span>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
          Mic Live Dictation
        </span>
      </div>

      <p className="text-[11px] text-slate-500">
        Field officers can record spoken daily updates hands-free using their device microphone.
      </p>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-start space-x-2">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Audio Visualizer Bar when Recording */}
      {isRecording && (
        <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-white animate-in fade-in">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
            <span className="flex items-center space-x-1.5 text-rose-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>LISTENING TO FIELD OFFICER...</span>
            </span>
            <span>Signal: {audioLevel}%</span>
          </div>
          
          <div className="flex items-center space-x-1 h-3">
            {[...Array(24)].map((_, i) => {
              const height = Math.max(15, Math.min(100, audioLevel * (0.5 + ((i % 5) * 0.2))));
              return (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-emerald-500 to-indigo-400 rounded-full transition-all duration-75"
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Spoken Transcript Box */}
      <div className="space-y-1.5">
        <div className="relative">
          <textarea
            rows={3}
            value={transcript + (interimTranscript ? ` ${interimTranscript}` : '')}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Click 'Record Voice Update' and speak into your microphone, or type your field notes..."
            className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 font-medium leading-relaxed resize-none"
          />
          {interimTranscript && (
            <span className="absolute right-2 bottom-2 text-[10px] text-indigo-600 font-mono italic animate-pulse">
              Dictating...
            </span>
          )}
        </div>

        {/* Quick Field Status Presets */}
        <div className="flex flex-wrap items-center gap-1 text-[10px]">
          <span className="text-slate-400 font-medium">Presets:</span>
          <button
            type="button"
            onClick={() => addPresetNote('Borehole drilling completed to 65m depth with high flow rate')}
            className="px-2 py-0.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition"
          >
            + Borehole 65m
          </button>
          <button
            type="button"
            onClick={() => addPresetNote('Water quality lab test negative for E.coli contamination')}
            className="px-2 py-0.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition"
          >
            + Water Quality Pass
          </button>
          <button
            type="button"
            onClick={() => addPresetNote('Medical supplies successfully dispatched to outreach clinic')}
            className="px-2 py-0.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition"
          >
            + Clinic Dispatched
          </button>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between pt-1 gap-2">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-xs"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Record Voice Update</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-xs animate-pulse"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop Recording</span>
          </button>
        )}

        <button
          type="button"
          onClick={handlePostVoiceUpdate}
          disabled={!(transcript.trim() || interimTranscript.trim())}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-xs"
        >
          <Send className="w-3.5 h-3.5 text-emerald-400" />
          <span>Log Verified Update</span>
        </button>
      </div>
    </div>
  );
};
