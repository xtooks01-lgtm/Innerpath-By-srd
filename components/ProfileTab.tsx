import React from 'react';
import { UserProfile } from '../types';
import { BADGES, ICONS } from '../constants';

interface ProfileTabProps {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
}

const THEMES = [
  { id: 'emerald', label: 'Growth', color: '#10b981', rgb: '16, 185, 129' },
  { id: 'violet', label: 'Spirit', color: '#8b5cf6', rgb: '139, 92, 246' },
  { id: 'steel', label: 'Focus', color: '#64748b', rgb: '100, 116, 139' }
] as const;

const ProfileTab: React.FC<ProfileTabProps> = ({ user, onUpdateUser }) => {
  return (
    <div className="space-y-12 max-w-lg mx-auto w-full animate-in fade-in duration-700">
      <header className="flex flex-col items-center text-center pt-6">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-primary blur-[100px] opacity-20 rounded-full animate-pulse transition-all duration-700" />
          <div className="relative w-36 h-36 rounded-[3.5rem] bg-primary border-[8px] border-white/5 flex items-center justify-center text-6xl font-black shadow-2xl overflow-hidden active-glow transition-all duration-700">
             <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
             <span className="relative z-10 text-white drop-shadow-lg">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-primary border border-white/20 rounded-full shadow-2xl transition-all duration-700">
             <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Level {user.level}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-4xl font-extrabold tracking-tighter text-white">{user.name}</h2>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.4em]">Journey Enthusiast</p>
        </div>
      </header>

      {/* Theme Switcher */}
      <div className="glass p-8 rounded-[2.5rem] space-y-5 border-primary/10 transition-all duration-700">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Atmosphere</h3>
          <span className="text-[8px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">Custom UI</span>
        </div>
        <div className="flex gap-3">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => onUpdateUser({ ...user, theme: theme.id })}
              className={`flex-1 group py-4 px-2 rounded-2xl border transition-all duration-500 flex flex-col items-center gap-2 ${
                user.theme === theme.id 
                ? 'bg-white/10 border-primary shadow-xl scale-[1.05]' 
                : 'bg-white/5 border-white/5 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-[1.02]'
              }`}
              style={{
                boxShadow: user.theme === theme.id ? `0 10px 30px -10px rgba(${theme.rgb}, 0.3)` : 'none'
              }}
            >
              <div 
                className={`w-5 h-5 rounded-full border-2 border-white/20 transition-transform duration-500 ${user.theme === theme.id ? 'scale-110' : 'group-hover:scale-110'}`} 
                style={{ backgroundColor: theme.color }} 
              />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">{theme.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="glass p-8 rounded-[2.5rem] space-y-2 border-primary/10 transition-all duration-700">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Growth Path</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-3xl font-black text-white">{user.xp}</p>
            <p className="text-xs font-bold text-primary transition-all duration-700">pts</p>
          </div>
        </div>
        <div className="glass p-8 rounded-[2.5rem] space-y-2 border-primary/10 transition-all duration-700">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Continuous Days</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-white">{user.streak}</p>
            <ICONS.Star className="text-amber-500" size={18} />
          </div>
        </div>
      </div>

      {/* Goal Archive */}
      {user.completedGoals && user.completedGoals.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
               Legacy Journeys
            </h3>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{user.completedGoals.length} Completed</p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {user.completedGoals.map((goal, i) => (
              <div key={goal.id} className="glass p-6 rounded-[2rem] border-primary/5 flex items-center justify-between group hover:bg-white/10 transition-all duration-500">
                <div>
                  <h4 className="font-black text-white text-lg tracking-tight">{goal.title}</h4>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[8px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 transition-all duration-700">{goal.category}</span>
                    <span className="text-[9px] font-medium text-slate-600">{new Date(goal.finishedAt!).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="text-primary opacity-20 group-hover:opacity-100 transition-all duration-500 translate-x-2 group-hover:translate-x-0">
                   <ICONS.Check size={28} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-2">
            <ICONS.Award size={14} className="text-primary transition-all duration-700" /> Hall of Mastery
          </h3>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{user.badges.length} / {BADGES.length}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 pb-12">
          {BADGES.map(badge => {
            const isUnlocked = user.badges.includes(badge.id);
            const BadgeIcon = (ICONS as any)[badge.icon] || ICONS.Award;
            return (
              <div key={badge.id} className={`group relative p-6 rounded-[2.2rem] border flex flex-col items-center justify-center text-center gap-3 transition-all duration-700 ${isUnlocked ? 'glass border-primary/20 active-glow' : 'bg-white/5 border-white/5 grayscale opacity-10'}`}>
                {isUnlocked && (
                   <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-primary transition-all duration-700" />
                )}
                <div className="transition-transform group-hover:scale-125 duration-500 text-white">
                  <BadgeIcon size={36} />
                </div>
                <span className={`text-[9px] font-black uppercase leading-tight tracking-widest ${isUnlocked ? 'text-slate-300' : 'text-slate-600'}`}>{badge.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;