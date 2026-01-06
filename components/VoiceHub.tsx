import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { getSearchGroundedInfo } from '../services/geminiService';
import { playTTS, isVoiceOutputEnabled, setVoiceOutputEnabled } from '../services/audioService';

interface VoiceHubProps {
  onBack: () => void;
}

const VoiceHub: React.FC<VoiceHubProps> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(isVoiceOutputEnabled());

  const handleAsk = async () => {
    if (!query) return;
    setLoading(true);
    setResponse('');
    setSources([]);
    try {
      const result = await getSearchGroundedInfo(query);
      setResponse(result.text);
      setSources(result.sources);
      playTTS(result.text);
    } catch (err) {
      setResponse("I'm having a little trouble finding that right now.");
    } finally {
      setLoading(false);
    }
  };

  const toggleVoice = () => {
    const newState = !voiceEnabled;
    setVoiceEnabled(newState);
    setVoiceOutputEnabled(newState);
  };

  return (
    <div className="space-y-6 py-6 animate-in zoom-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
            <ICONS.X />
          </button>
          <h1 className="text-2xl font-bold">Ask Rudh-h</h1>
        </div>
        <button 
          onClick={toggleVoice}
          className={`p-2.5 rounded-full border transition-all ${voiceEnabled ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-500'}`}
        >
          {voiceEnabled ? <ICONS.Volume2 size={18} /> : <ICONS.VolumeX size={18} />}
        </button>
      </div>

      <div className="p-6 bg-primary/10 border border-primary/30 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center animate-pulse">
            <ICONS.Mic className="text-white" />
          </div>
          <span className="text-primary font-bold">Real-world Wisdom</span>
        </div>
        <p className="text-sm text-slate-400">Search the world for answers grounded in reality.</p>
        
        <div className="relative">
          <textarea 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for wisdom..."
            className="w-full bg-black/20 border border-white/10 rounded-2xl p-4 pr-16 min-h-[120px] focus:ring-2 focus:ring-primary outline-none text-white"
          />
          <button 
            onClick={handleAsk}
            disabled={loading}
            className="absolute bottom-4 right-4 p-3 bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all text-white"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <ICONS.Star />}
          </button>
        </div>
      </div>

      {response && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top duration-700">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">My Thoughts</h3>
            <p className="text-slate-200 leading-relaxed">{response}</p>
          </div>

          {sources.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase text-primary">Sources</h4>
              <div className="flex flex-wrap gap-2">
                {sources.map((s, i) => (
                  <a 
                    key={i} 
                    href={s.web?.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-all text-slate-400 truncate max-w-[150px]"
                  >
                    {s.web?.title || 'External Wisdom'}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VoiceHub;