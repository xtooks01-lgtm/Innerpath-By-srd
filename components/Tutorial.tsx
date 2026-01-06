import React, { useState } from 'react';
import { ICONS } from '../constants';

interface TutorialProps {
  onComplete: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to InnerPath",
      desc: "I am your AI mentor. I help you break complex goals into 5 actionable steps.",
      icon: <ICONS.Target size={48} className="text-primary" />
    },
    {
      title: "XP & Timers",
      desc: "Complete tasks before the timer ends to earn XP. Miss them, and your progress takes a hit.",
      icon: <ICONS.Clock size={48} className="text-primary" />
    },
    {
      title: "Daily Timetable",
      desc: "Plan your entire day. Disciplined schedules lead to mastery.",
      icon: <ICONS.Calendar size={48} className="text-primary" />
    },
    {
      title: "Recovery Mode",
      desc: "Having a bad day? I'll adjust your plan to protect your streaks and minimize XP loss.",
      icon: <ICONS.Shield size={48} className="text-primary" />
    }
  ];

  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 space-y-8 animate-in zoom-in duration-500">
      <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center mb-4 border border-primary/30 active-glow">
        {steps[step].icon}
      </div>
      
      <div className="text-center space-y-4 max-w-xs">
        <h2 className="text-3xl font-black text-white">{steps[step].title}</h2>
        <p className="text-slate-400 text-lg leading-relaxed">{steps[step].desc}</p>
      </div>

      <div className="flex gap-4 w-full max-w-xs pt-4">
        {step < steps.length - 1 ? (
          <>
            <button onClick={onComplete} className="flex-1 py-4 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Skip</button>
            <button 
              onClick={() => setStep(step + 1)} 
              className="flex-1 py-4 bg-primary rounded-2xl font-black text-white uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
            >
              Next
            </button>
          </>
        ) : (
          <button 
            onClick={onComplete} 
            className="w-full py-4 bg-primary rounded-2xl font-black text-white text-lg uppercase tracking-widest shadow-xl shadow-primary/30"
          >
            Get Started
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {steps.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-primary shadow-lg shadow-primary/50' : 'bg-white/10'}`} />
        ))}
      </div>
    </div>
  );
};

export default Tutorial;
