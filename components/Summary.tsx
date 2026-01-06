
import React, { useEffect, useState } from 'react';
import { Goal } from '../types';
import { ICONS } from '../constants';
import { playTTS } from '../services/audioService';

interface SummaryProps {
  goal: Goal;
  onDone: () => void;
}

const Summary: React.FC<SummaryProps> = ({ goal, onDone }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      playTTS(`I'm beaming with pride, friend. Your completion of "${goal.title}" is a beautiful testament to your growth.`);
    }, 2000);
    return () => clearTimeout(timer);
  }, [goal]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in duration-500">
        <div className="relative">
           <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
           </div>
        </div>
        <p className="text-[11px] font-black text-primary uppercase tracking-[0.5em] animate-pulse">Gathering our shared victories...</p>
      </div>
    );
  }

  return (
    <div className="py-12 space-y-12 animate-in fade-in zoom-in duration-1000 h-full flex flex-col items-center px-6">
      <div className="text-center space-y-4">
        <div className="text-[11px] font-black text-primary uppercase tracking-[0.6em] mb-6 animate-bounce">Journey Ascended</div>
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full scale-150 animate-pulse" />
          <h1 className="relative z-10 text-6xl font-black text-white leading-none uppercase tracking-tighter drop-shadow-2xl">
            Pure<br/>Mastery
          </h1>
        </div>
        <p className="text-slate-400 font-bold text-lg mt-8 bg-white/5 py-2 px-6 rounded-full border border-white/5 inline-block">{goal.title}</p>
      </div>

      <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
        <div className="p-8 glass border-primary/10 rounded-[2.5rem] text-center space-y-2 shadow-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Growth</p>
          <p className="text-4xl font-black text-white">High</p>
        </div>
        <div className="p-8 glass border-primary/10 rounded-[2.5rem] text-center space-y-2 shadow-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Spirit Points</p>
          <p className="text-4xl font-black text-primary">+100</p>
        </div>
      </div>

      <div className="flex-1 w-full max-w-sm">
        <div className="bg-primary/5 border border-primary/10 p-10 rounded-[3.5rem] relative overflow-hidden group shadow-inner">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl transition-transform duration-[3000ms] group-hover:scale-125" />
          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
            <ICONS.Star size={16} /> Rudh-h's Celebration
          </h3>
          <p className="text-base text-slate-200 leading-relaxed italic font-medium">
            "Your persistence in this journey of ${goal.category} has been a joy to witness. 
            By choosing focus over distraction, you've nourished your spirit today. 
            Take a moment to simply breathe in this victory before our next path begins."
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm pt-8">
        <button 
          onClick={onDone}
          className="w-full py-7 bg-primary rounded-[2.5rem] font-black text-xl uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] hover:scale-[1.02] active:scale-95 transition-all text-white"
        >
          Return to Peace
        </button>
      </div>
    </div>
  );
};

export default Summary;
