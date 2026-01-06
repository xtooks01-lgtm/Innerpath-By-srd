
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ICONS } from '../constants';
import { getAudioContext, createBlob, decodeAudioData, decode, isVoiceOutputEnabled, setVoiceOutputEnabled } from '../services/audioService';
import { UserProfile } from '../types';

interface LiveSessionProps {
  onBack: () => void;
  user: UserProfile;
}

// Humanized granular states
type ConnectionStatus = 
  | 'preparing' 
  | 'listening_denied' 
  | 'centering' 
  | 'listening'    // Waiting for user to speak
  | 'reflecting'   // Model is thinking/processing
  | 'sharing'      // Model is speaking
  | 'clouded' 
  | 'rested';

const LiveSession: React.FC<LiveSessionProps> = ({ onBack, user }) => {
  const [status, setStatus] = useState<ConnectionStatus>('preparing');
  const [statusText, setStatusText] = useState('Centering our focus...');
  const [transcription, setTranscription] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(isVoiceOutputEnabled());
  
  const sessionRef = useRef<any>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  const voiceEnabledRef = useRef(voiceEnabled);
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  const initPresence = async () => {
    let active = true;
    try {
      setStatus('preparing');
      setStatusText('Preparing to listen...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!active) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      streamRef.current = stream;

      setStatus('centering');
      setStatusText('Reaching out to Rudh-h...');

      // Rule: Always create a fresh GoogleGenAI instance right before making an API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = getAudioContext(24000);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            if (!active) return;
            setStatus('listening');
            setStatusText('I am listening, friend');
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Check for model turn activity
            if (message.serverContent?.modelTurn) {
              setStatus('sharing');
              setStatusText('Sharing wisdom...');
            }

            // Handle audio chunks
            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                const base64 = part.inlineData.data;
                
                if (voiceEnabledRef.current) {
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                  const buffer = await decodeAudioData(decode(base64), outputCtx, 24000, 1);
                  const source = outputCtx.createBufferSource();
                  source.buffer = buffer;
                  source.connect(outputCtx.destination);
                  
                  source.addEventListener('ended', () => {
                    audioSourcesRef.current.delete(source);
                  });
                  
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += buffer.duration;
                  audioSourcesRef.current.add(source);
                }
              }
            }

            // Update status based on server signals
            if (message.serverContent?.inputTranscription) {
              setStatus('reflecting');
              setStatusText('Reflecting on your words...');
            }

            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => {
                const newText = (prev + ' ' + message.serverContent?.outputTranscription?.text).trim();
                return newText.length > 120 ? newText.slice(-120) : newText;
              });
            }

            if (message.serverContent?.turnComplete) {
              setStatus('listening');
              setStatusText('I am listening, friend');
            }

            if (message.serverContent?.interrupted) {
              audioSourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
              setStatusText('I am here, listening');
            }
          },
          onerror: async (e: any) => {
            console.error('Presence error:', e);
            const errMsg = e?.message || '';
            
            // Handle common API errors as per guidelines
            if (errMsg.includes('Permission denied') || errMsg.includes('Requested entity was not found')) {
              setStatus('listening_denied');
              setStatusText('The path is momentarily blocked');
              
              const aistudio = (window as any).aistudio;
              if (aistudio && typeof aistudio.openSelectKey === 'function') {
                await aistudio.openSelectKey();
                initPresence(); // Retry automatically after key selection
              }
            } else {
              setStatus('clouded');
              setStatusText('The air is unclear');
            }
          },
          onclose: () => {
            setStatus('rested');
            setStatusText('Our time has rested');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: `You are Rudh-h, the user's friend and mentor. You are sharing presence with ${user.name}. Keep your heart open, your tone warm, and your words concise. Avoid all technical or robotic language. Focus only on the human journey and emotional growth.`
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error('Presence failure:', err);
      const errMsg = err.message || '';
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || errMsg.toLowerCase().includes('permission denied')) {
        setStatus('listening_denied');
        setStatusText('I cannot hear you, friend');
      } else {
        setStatus('clouded');
        setStatusText('The path is momentarily hidden');
      }
    }

    return () => { active = false; };
  };

  useEffect(() => {
    initPresence();

    return () => {
      if (sessionRef.current && sessionRef.current.close) {
        sessionRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      audioSourcesRef.current.forEach(s => {
        try { s.stop(); } catch(e) {}
      });
      audioSourcesRef.current.clear();
    };
  }, [user.name]);

  const toggleVoice = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    setVoiceOutputEnabled(newState);
    
    if (!newState) {
      audioSourcesRef.current.forEach(s => {
        try { s.stop(); } catch(e) {}
      });
      audioSourcesRef.current.clear();
      nextStartTimeRef.current = 0;
    }
  };

  const isPreparing = status === 'preparing' || status === 'centering';
  const isListening = status === 'listening';
  const isReflecting = status === 'reflecting';
  const isSharing = status === 'sharing';
  const isDenied = status === 'listening_denied';

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12 animate-in zoom-in duration-700 max-w-md mx-auto w-full relative px-6">
      
      {/* Presence Indicator Layer */}
      <div className="flex justify-between w-full absolute top-8 left-0 right-0 z-20 px-10">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Presence</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              isListening ? 'bg-primary' : 
              isReflecting ? 'bg-amber-400 animate-pulse' : 
              isSharing ? 'bg-indigo-400 animate-bounce' : 
              isDenied ? 'bg-rose-500' : 'bg-slate-700 animate-pulse'
            }`} />
            <span className={`text-[11px] font-black uppercase tracking-widest transition-colors duration-500 ${
              (isListening || isSharing || isReflecting) ? 'text-white' : 'text-slate-600'
            }`}>
              {statusText}
            </span>
          </div>
        </div>

        <button 
          onClick={toggleVoice}
          className={`relative group flex items-center justify-center w-14 h-14 rounded-[1.5rem] border transition-all duration-500 ${
            voiceEnabled 
            ? 'bg-primary/20 border-primary text-primary shadow-2xl shadow-primary/20' 
            : 'bg-white/5 border-white/10 text-slate-500'
          }`}
          aria-label={voiceEnabled ? "Mute Rudh-h" : "Hear Rudh-h"}
        >
          {voiceEnabled ? <ICONS.Volume2 size={24} /> : <ICONS.VolumeX size={24} />}
        </button>
      </div>

      {/* Heart Center Visual */}
      <div className="relative pt-16">
        {isDenied ? (
          <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-700">
            <div className="w-36 h-36 rounded-[3.5rem] bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-500 mb-4">
              <ICONS.Shield size={64} />
            </div>
            <h3 className="text-xl font-black text-white">Opening the Path</h3>
            <p className="text-sm text-slate-400 leading-relaxed px-4">
              I need to hear your voice to walk with you. Please check your microphone permissions or API access.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-[200px]">
              <button 
                onClick={() => initPresence()}
                className="px-8 py-4 bg-primary rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                Reach Out Again
              </button>
              <button 
                onClick={onBack}
                className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Background Glows */}
            <div className={`absolute -inset-24 bg-primary/10 rounded-full blur-[100px] transition-all duration-[2000ms] ${
              isListening ? 'scale-110 opacity-60' : 
              isReflecting ? 'scale-125 opacity-40 bg-amber-400/10' : 
              isSharing ? 'scale-150 opacity-80 bg-indigo-400/10' : 
              'scale-50 opacity-0'
            }`} />
            
            {/* Main Orb */}
            <div className={`relative w-48 h-48 rounded-[5rem] bg-slate-900 flex items-center justify-center border-2 transition-all duration-700 ${
              isListening ? 'border-primary/40 active-glow shadow-primary/10' : 
              isReflecting ? 'border-amber-400/30 shadow-amber-400/10' : 
              isSharing ? 'border-indigo-400/50 shadow-indigo-400/20 scale-105' : 
              'border-white/5'
            }`}>
              <div className={`transition-all duration-700 ${
                isListening ? 'scale-110 text-white' : 
                isReflecting ? 'scale-95 text-amber-200 opacity-60' : 
                isSharing ? 'scale-125 text-indigo-200' : 
                'scale-90 opacity-10'
              }`}>
                {isReflecting ? (
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0s]" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                ) : (
                  <ICONS.Mic size={64} />
                )}
              </div>

              {/* Dynamic Aura Rings */}
              {isListening && (
                <div className="absolute inset-0">
                  <div className="absolute inset-[-20px] rounded-[5.5rem] border border-primary/10 animate-ping duration-[4000ms]" />
                </div>
              )}
              {isSharing && (
                <div className="absolute inset-0">
                  <div className="absolute inset-[-30px] rounded-[6rem] border border-indigo-400/20 animate-pulse duration-[1000ms]" />
                  <div className="absolute inset-[-15px] rounded-[5.5rem] border border-indigo-400/10 animate-ping duration-[2000ms]" />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {!isDenied && (
        <>
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black uppercase text-white tracking-tighter transition-all">
              {isReflecting ? 'Deep Reflection' : isSharing ? 'Inner Wisdom' : 'Shared Rhythm'}
            </h2>
            <p className="text-primary font-black text-[10px] uppercase tracking-[0.7em] animate-pulse">
              {statusText}
            </p>
          </div>

          <div className="w-full">
            <div className="relative group">
              <div className={`absolute -inset-1 rounded-[3rem] blur-2xl opacity-20 transition-all duration-1000 ${
                isReflecting ? 'bg-amber-400' : isSharing ? 'bg-indigo-400' : 'bg-primary'
              }`} />
              <div className="relative w-full p-10 bg-slate-900/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] min-h-[160px] flex flex-col items-center justify-center text-center shadow-2xl">
                {transcription ? (
                  <p className="text-base text-slate-200 italic leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-2">
                    "{transcription}..."
                  </p>
                ) : (
                  <div className="space-y-4">
                     <div className="flex gap-2 justify-center">
                       <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                       <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                       <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                     </div>
                     <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.5em]">
                       {isPreparing ? 'Aligning frequencies' : 'Listening for your heart'}
                     </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Disconnect Control */}
      <div className="w-full px-6 pt-4">
        <button 
          onClick={onBack}
          className="w-full max-w-xs py-6 bg-white/5 border border-white/10 rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.5em] hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-400 transition-all duration-500 text-slate-600 mx-auto block"
        >
          End our time
        </button>
      </div>
    </div>
  );
};

export default LiveSession;
