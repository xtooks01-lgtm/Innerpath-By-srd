
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { ICONS } from '../constants';
import { GoogleGenAI, Chat } from "@google/genai";
import { playTTS, isVoiceOutputEnabled, setVoiceOutputEnabled } from '../services/audioService';
import { SYSTEM_PERSONA } from '../services/geminiService';
import LiveSession from './LiveSession';

interface MentorProps {
  user: UserProfile;
}

const Mentor: React.FC<MentorProps> = ({ user }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>(() => {
    const saved = localStorage.getItem('innerpath_mentor_history');
    return saved ? JSON.parse(saved) : [{ role: 'ai', text: `Hello ${user.name.split(' ')[0]}. I am Rudh-h. How is your heart today?` }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(isVoiceOutputEnabled());
  const [isListening, setIsListening] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<Chat | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const historyContext = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    })).slice(-10);

    chatRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: historyContext,
      config: {
        systemInstruction: SYSTEM_PERSONA + " Keep our conversation warm and human.",
        thinkingConfig: { thinkingBudget: 0 }
      },
    });
  }, [user.name]);

  useEffect(() => {
    localStorage.setItem('innerpath_mentor_history', JSON.stringify(messages.slice(-20)));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleVoice = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    setVoiceOutputEnabled(newState);
  };

  const handleSend = async (text?: string) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading || !chatRef.current) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMsg });
      const aiText = response.text || "I am listening and thinking with you, friend.";
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      playTTS(aiText);
    } catch (err) {
      const fallback = "I am here with you. Take a breath; every step matters.";
      setMessages(prev => [...prev, { role: 'ai', text: fallback }]);
      playTTS(fallback);
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.continuous = false;
    
    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
    };
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.onerror = () => setIsListening(false);
    
    recognitionRef.current.start();
  };

  if (isLive) {
    return <LiveSession onBack={() => setIsLive(false)} user={user} />;
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <header className="py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <ICONS.Mic className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight uppercase text-white">RUDH-H</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Shared Presence</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleVoice}
            className={`p-2.5 rounded-xl border transition-all ${voiceEnabled ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-500'}`}
            title={voiceEnabled ? "Hear Rudh-h" : "Mute Rudh-h"}
          >
            {voiceEnabled ? <ICONS.Volume2 size={18} /> : <ICONS.VolumeX size={18} />}
          </button>
          <button 
            onClick={() => setIsLive(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/30 text-white"
          >
            <ICONS.Star /> Live Presence
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto py-6 space-y-6 scroll-smooth px-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] p-5 rounded-[1.8rem] text-sm leading-relaxed border transition-all ${
              m.role === 'user' 
              ? 'bg-primary border-primary/50 text-white rounded-tr-none shadow-xl shadow-primary/10' 
              : 'bg-slate-900 border-white/10 text-slate-200 rounded-tl-none backdrop-blur-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center">
              <div className="w-1 h-3 bg-primary rounded-full animate-pulse" />
              <div className="w-1 h-3 bg-primary rounded-full animate-pulse [animation-delay:0.2s]" />
              <div className="w-1 h-3 bg-primary rounded-full animate-pulse [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="py-6 pt-2">
        <div className="relative group flex gap-2">
          <div className="relative flex-1">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Share with Rudh-h..."
              className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 pr-12 outline-none focus:border-primary/50 transition-all text-sm text-white"
            />
            <button 
              onClick={startListening}
              className={`absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${isListening ? 'text-primary scale-125' : 'text-slate-500 hover:text-white'}`}
            >
              <ICONS.Mic size={20} className={isListening ? 'animate-pulse' : ''} />
            </button>
          </div>
          <button 
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="bg-primary px-6 rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/20 text-white"
          >
            <ICONS.Star />
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-600 mt-4 font-bold uppercase tracking-widest">Our Shared Journey</p>
      </div>
    </div>
  );
};

export default Mentor;
