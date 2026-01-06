
import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: (name: string) => void;
}

const IPLogo = () => (
  <div className="relative group select-none">
    {/* Animated Background Glow */}
    <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150 animate-pulse duration-[4000ms]" />
    
    <svg 
      width="120" 
      height="120" 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="relative z-10 floating"
    >
      {/* Outer Focus Ring */}
      <circle 
        cx="60" 
        cy="60" 
        r="54" 
        stroke="url(#logo_grad_outer)" 
        strokeWidth="1.5" 
        strokeDasharray="4 4"
        className="opacity-40"
      />
      
      {/* Inner Path Ring */}
      <circle 
        cx="60" 
        cy="60" 
        r="48" 
        stroke="url(#logo_grad)" 
        strokeWidth="4"
        strokeLinecap="round"
        className="opacity-90"
      />

      {/* Stylized IP Monogram */}
      <g filter="url(#glow)">
        {/* The 'I' Pillar */}
        <rect x="44" y="38" width="6" height="44" rx="3" fill="url(#logo_grad)" />
        
        {/* The 'P' Arc */}
        <path 
          d="M50 41C50 39.3431 51.3431 38 53 38H65C72.732 38 79 44.268 79 52C79 59.732 72.732 66 65 66H50V41Z" 
          fill="url(#logo_grad)" 
        />
        
        {/* Refined Cutout for the 'P' */}
        <path 
          d="M56 44H65C69.4183 44 73 47.5817 73 52C73 56.4183 69.4183 60 65 60H56V44Z" 
          fill="#020617" 
        />
      </g>

      <defs>
        <filter id="glow" x="30" y="30" width="60" height="60" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="logo_grad" x1="44" y1="38" x2="79" y2="66" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id="logo_grad_outer" x1="6" y1="6" x2="114" y2="114" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>
    </svg>
  </div>
);

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onComplete(name.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12 animate-in fade-in duration-1000 px-6">
      <div className="flex flex-col items-center space-y-8">
        <IPLogo />
        
        <div className="text-center space-y-3">
          <div className="text-[10px] font-black text-primary uppercase tracking-[0.6em] mb-2 animate-pulse">
            Neural Interface Ready
          </div>
          <h1 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-500">
            INNERPATH
          </h1>
          <p className="text-slate-500 font-medium text-sm tracking-wide">
            Your journey toward mastery begins with a single step.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-8">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] text-center block">
            Identify yourself, friend
          </label>
          <div className="relative group">
            <div className="absolute -inset-1 bg-primary/20 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name or Alias"
              className="relative w-full bg-slate-900/50 border border-white/10 rounded-[2rem] p-6 text-center text-2xl font-black focus:border-primary/50 focus:bg-slate-900 outline-none transition-all placeholder:text-slate-800 text-white"
              autoFocus
              required
            />
          </div>
        </div>
        
        <button 
          type="submit"
          className="w-full py-6 bg-primary hover:scale-[1.02] active:scale-95 rounded-[2rem] font-black text-lg uppercase tracking-[0.2em] transition-all shadow-2xl shadow-primary/20 text-white"
        >
          Initialize Path
        </button>
      </form>
      
      <div className="pt-12">
        <p className="text-[9px] font-bold text-slate-700 uppercase tracking-[0.5em]">
          Secured by Rudh-h Intelligence
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
