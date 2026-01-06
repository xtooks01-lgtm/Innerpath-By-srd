
import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, TimetableSlot, QuestRecord } from '../types';
import { ICONS } from '../constants';
import { getDailyBriefing, findNearbyResources } from '../services/geminiService';
import { playTTS } from '../services/audioService';

interface QuestProps {
  user: UserProfile;
  onNewGoal: () => void;
  timetable: TimetableSlot[];
  setTimetable: React.Dispatch<React.SetStateAction<TimetableSlot[]>>;
  onTaskDone: (xp: number, record: Omit<QuestRecord, 'xpChange'>) => void;
  onTaskMissed: (xp: number, record: Omit<QuestRecord, 'xpChange'>) => void;
  onOpenMentor: () => void;
}

const Quest: React.FC<QuestProps> = ({ 
  user, onNewGoal, timetable, setTimetable, onTaskDone, onTaskMissed, onOpenMentor 
}) => {
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ start: '09:00', end: '10:00', name: '' });
  const [briefing, setBriefing] = useState<string>('');
  const [loadingBriefing, setLoadingBriefing] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [nearbyInfo, setNearbyInfo] = useState<{text: string, locations: any[]} | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    timetable.forEach(slot => {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      const startTotal = sh * 60 + sm;
      const endTotal = eh * 60 + em;
      
      if (!slot.reminderSent && !slot.isCompleted && nowMins === startTotal - 5) {
        const msg = `Hey ${user.name.split(' ')[0]}, your step "${slot.taskName}" is starting in five minutes. Take a deep breath.`;
        playTTS(msg);
        setTimetable(prev => prev.map(s => s.id === slot.id ? { ...s, reminderSent: true } : s));
      }
      
      if (nowMins >= endTotal && !slot.isCompleted && !slot.xpDeducted) {
        onTaskMissed(30, { 
          id: slot.id, 
          taskName: slot.taskName, 
          timestamp: Date.now(), 
          plannedDuration: endTotal - startTotal, 
          status: 'missed' 
        });
        setTimetable(prev => prev.map(s => s.id === slot.id ? { ...s, xpDeducted: true } : s));
      }
    });
  }, [currentTime, timetable, user.name, setTimetable, onTaskMissed]);

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const text = await getDailyBriefing(user.name, user.xp);
        setBriefing(text);
      } catch {
        setBriefing("Focus on the next gentle step, friend.");
      } finally {
        setLoadingBriefing(false);
      }
    };
    fetchBriefing();
  }, [user.name, user.xp]);

  const handleDiscover = () => {
    setDiscovering(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const result = await findNearbyResources('learning and focus', pos.coords.latitude, pos.coords.longitude);
        setNearbyInfo(result);
      } catch (err) {
        console.error(err);
      } finally {
        setDiscovering(false);
      }
    }, () => {
      setDiscovering(false);
    });
  };

  const processedSlots = useMemo(() => {
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const nowSecs = currentTime.getSeconds();

    return timetable.map(slot => {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      const start = sh * 60 + sm;
      const end = eh * 60 + em;
      
      let status: 'upcoming' | 'live' | 'expired' = 'upcoming';
      let remainingSeconds = 0;

      if (nowMins < start) {
        status = 'upcoming';
      } else if (nowMins < end) {
        status = 'live';
        remainingSeconds = (end * 60) - (nowMins * 60 + nowSecs);
      } else {
        status = 'expired';
      }

      return { ...slot, status, remainingSeconds, plannedDuration: end - start };
    });
  }, [timetable, currentTime]);

  const addSlot = () => {
    if (!newSlot.name) return;
    const slot: TimetableSlot = { 
      id: Math.random().toString(36).substr(2, 9), 
      startTime: newSlot.start, 
      endTime: newSlot.end, 
      taskName: newSlot.name, 
      isCompleted: false 
    };
    setTimetable(prev => [...prev, slot].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    setNewSlot({ start: '09:00', end: '10:00', name: '' });
    setIsAddingSlot(false);
  };

  const toggleSlot = (id: string) => {
    const slot = processedSlots.find(s => s.id === id);
    if (!slot || slot.isCompleted) return;

    if (slot.status === 'live') {
      onTaskDone(50, { id: slot.id, taskName: slot.taskName, timestamp: Date.now(), plannedDuration: slot.plannedDuration, status: 'completed' });
      setTimetable(prev => prev.map(s => s.id === id ? { ...s, isCompleted: true } : s));
      playTTS(`Beautifully handled, ${user.name.split(' ')[0]}. One more victory for your spirit.`);
    } else if (slot.status === 'expired') {
      onTaskDone(0, { id: slot.id, taskName: slot.taskName, timestamp: Date.now(), plannedDuration: slot.plannedDuration, status: 'late' });
      setTimetable(prev => prev.map(s => s.id === id ? { ...s, isCompleted: true } : s));
    }
  };

  const formatCountdown = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-10 max-w-lg mx-auto w-full animate-in fade-in duration-700 pb-12">
      <header className="flex justify-between items-end px-2">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Inner Sanctum</p>
          <h1 className="text-4xl font-extrabold tracking-tighter text-white">Daily Rhythm</h1>
        </div>
        <div className="glass px-6 py-3 rounded-2xl flex flex-col items-center border-primary/20">
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Spirit</p>
          <p className="text-2xl font-black text-white">{user.xp}</p>
        </div>
      </header>

      {/* Rudh-h's Presence */}
      <div className="glass p-8 rounded-[2.5rem] relative overflow-hidden group border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="absolute top-0 right-0 p-6 opacity-5 transition-transform group-hover:scale-110 duration-700">
          <ICONS.Target size={64} className="text-primary" />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.5em] opacity-80">Rudh-h's Reflection</h3>
        </div>
        {loadingBriefing ? (
          <div className="space-y-4">
            <div className="h-2.5 bg-white/5 rounded-full animate-pulse w-full" />
            <div className="h-2.5 bg-white/5 rounded-full animate-pulse w-4/5" />
          </div>
        ) : (
          <p className="text-base text-slate-200 leading-relaxed font-medium italic">"{briefing}"</p>
        )}
      </div>

      <div className="space-y-6 px-1">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">The Timeline</h3>
          <button 
            onClick={() => setIsAddingSlot(true)} 
            className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/20 transition-all shadow-lg shadow-primary/5"
          >
            + New Journey Step
          </button>
        </div>
        
        {isAddingSlot && (
          <div className="glass p-8 rounded-[3rem] space-y-6 animate-in slide-in-from-top-4 active-glow border-primary/30 shadow-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-3 tracking-widest">Starts at</label>
                <input type="time" value={newSlot.start} onChange={e => setNewSlot({...newSlot, start: e.target.value})} className="w-full bg-slate-950/50 border border-white/5 p-4 rounded-2xl text-sm outline-none focus:border-primary/50 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-3 tracking-widest">Ends at</label>
                <input type="time" value={newSlot.end} onChange={e => setNewSlot({...newSlot, end: e.target.value})} className="w-full bg-slate-950/50 border border-white/5 p-4 rounded-2xl text-sm outline-none focus:border-primary/50 text-white" />
              </div>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="What focus calls to you, friend?" 
                value={newSlot.name} 
                onChange={e => setNewSlot({...newSlot, name: e.target.value})} 
                className="w-full bg-slate-950/50 border border-white/5 p-5 rounded-[1.5rem] outline-none text-sm focus:border-primary/50 text-white" 
              />
            </div>
            <div className="flex gap-4 pt-2">
              <button onClick={addSlot} className="flex-1 py-5 bg-primary rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 transition-all">Embrace Step</button>
              <button onClick={() => setIsAddingSlot(false)} className="px-8 py-5 bg-white/5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {processedSlots.length === 0 && !isAddingSlot && (
            <div className="py-24 text-center glass border-dashed border-white/10 rounded-[3.5rem] flex flex-col items-center gap-8 px-8">
              <div className="p-6 bg-white/5 rounded-full text-slate-700 animate-pulse">
                <ICONS.Calendar size={40} />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-black uppercase tracking-[0.4em] text-slate-500">A blank canvas for your spirit.</p>
                <p className="text-xs text-slate-600 leading-relaxed italic">"Let us fill this day with intentional steps toward your best self."</p>
              </div>
            </div>
          )}
          {processedSlots.map(slot => (
            <div 
              key={slot.id} 
              className={`group relative p-8 rounded-[3rem] flex items-center justify-between border transition-all duration-700 ${
                slot.isCompleted 
                ? 'bg-emerald-500/5 border-emerald-500/10' 
                : slot.status === 'live' 
                  ? 'glass border-primary/50 shadow-[0_0_50px_rgba(var(--primary-rgb),0.15)] scale-[1.04]' 
                  : slot.status === 'expired' 
                    ? 'bg-rose-500/5 border-rose-500/10 opacity-60' 
                    : 'bg-white/5 border-white/5 opacity-40 grayscale-[0.3]'
              }`}
            >
              <div className="flex items-center gap-8 flex-1">
                <div className="text-[11px] font-mono font-extrabold text-slate-500 border-r border-white/5 pr-8 space-y-1 leading-tight">
                  <div className="text-slate-400">{slot.startTime}</div>
                  <div className="text-[8px] text-slate-800 uppercase font-black">to</div>
                  <div className="text-slate-400">{slot.endTime}</div>
                </div>
                <div className="flex-1">
                  <h4 className={`font-black text-xl tracking-tight transition-all duration-500 ${slot.isCompleted ? 'line-through text-slate-600' : 'text-slate-100'}`}>
                    {slot.taskName}
                  </h4>
                  <div className="flex items-center gap-3 mt-2.5">
                    {slot.status === 'live' && !slot.isCompleted && (
                      <div className="flex items-center gap-2.5 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                          {formatCountdown(slot.remainingSeconds)}
                        </span>
                      </div>
                    )}
                    {slot.status === 'expired' && !slot.isCompleted && (
                      <span className="text-[10px] font-black uppercase text-rose-500/80 tracking-widest flex items-center gap-2">
                        <ICONS.X size={14} /> Reflection Needed
                      </span>
                    )}
                    {slot.status === 'upcoming' && (
                      <span className="text-[9px] font-bold uppercase text-slate-600 tracking-[0.2em]">Patient Focus</span>
                    )}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => toggleSlot(slot.id)} 
                disabled={slot.isCompleted || slot.status === 'upcoming'} 
                className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center border transition-all duration-500 ${
                  slot.isCompleted 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                  : slot.status === 'live' 
                    ? 'bg-primary border-primary/50 text-white hover:scale-110 active:scale-90 shadow-2xl shadow-primary/30' 
                    : slot.status === 'expired'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-500/60'
                      : 'bg-white/5 border-white/10 text-slate-800'
                }`}
              >
                {slot.isCompleted ? <ICONS.Check size={28} /> : slot.status === 'expired' ? <ICONS.X size={28} /> : <ICONS.Check size={28} />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] px-2">Nurturing Spaces</h3>
        <button 
          onClick={handleDiscover}
          disabled={discovering}
          className="w-full glass p-8 rounded-[3rem] flex items-center justify-between group transition-all hover:bg-white/10 border-primary/10 hover:active-glow"
        >
          <div className="flex items-center gap-6">
            <div className="p-5 bg-teal-600/10 border border-teal-500/20 rounded-[1.5rem] text-teal-400 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <ICONS.Compass size={28} />
            </div>
            <div className="text-left">
              <h4 className="text-xl font-black text-slate-100">Nearby Sanctuaries</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Where silence meets soul</p>
            </div>
          </div>
          {discovering ? (
            <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <ICONS.CaretRight size={24} className="text-slate-700 group-hover:text-teal-400 transition-all" />
          )}
        </button>

        {nearbyInfo && (
          <div className="p-8 glass rounded-[3rem] space-y-6 animate-in fade-in slide-in-from-top-3 border-primary/10 bg-gradient-to-tr from-teal-500/5 to-transparent shadow-xl">
            <p className="text-base text-slate-300 leading-relaxed font-medium italic">"{nearbyInfo.text}"</p>
            <div className="flex flex-wrap gap-3">
              {nearbyInfo.locations.map((loc, i) => (
                <a 
                  key={i} 
                  href={loc.maps?.uri} 
                  target="_blank" 
                  rel="noreferrer"
                  className="px-6 py-3 bg-teal-600/10 border border-teal-500/20 rounded-2xl text-[10px] font-black text-teal-400 uppercase tracking-[0.2em] hover:bg-teal-600/20 transition-all flex items-center gap-2 shadow-lg shadow-teal-900/10"
                >
                  📍 {loc.maps?.title || 'Peaceful Spot'}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pb-12 px-2">
        <button 
          onClick={onNewGoal} 
          className="w-full py-7 rounded-[2.5rem] bg-primary font-black text-2xl uppercase tracking-[0.25em] shadow-[0_20px_60px_-15px_rgba(var(--primary-rgb),0.4)] hover:scale-[1.02] active:scale-95 transition-all text-white"
        >
          New Path
        </button>
      </div>
    </div>
  );
};

export default Quest;
