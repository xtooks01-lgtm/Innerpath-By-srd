
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Goal, SubTask, TimerResetMode } from '../types';
import { ICONS } from '../constants';
import { breakdownGoalWithAI } from '../services/geminiService';
import { playTTS } from '../services/audioService';
import VideoModal from './VideoModal';

interface GoalBreakdownProps {
  goal: Goal;
  onUpdateGoal: React.Dispatch<React.SetStateAction<Goal | null>>;
  onCompleteTask: (xp: number) => void;
  onFailTask: (xp: number) => void;
  onFinish: () => void;
}

const PRESETS = [
  { label: '25m', value: 25 * 60 },
  { label: '30m', value: 30 * 60 },
  { label: '60m', value: 60 * 60 },
];

const GoalBreakdown: React.FC<GoalBreakdownProps> = ({ goal, onUpdateGoal, onCompleteTask, onFailTask, onFinish }) => {
  const [loading, setLoading] = useState(!goal.subTasks.length);
  const [activeTaskIndex, setActiveTaskIndex] = useState(goal.lastCheckpointIndex || 0);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(goal.subTasks[0]?.id || null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [now, setNow] = useState(Date.now());
  const initialAIFetched = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const initAI = useCallback(async () => {
    if (goal.subTasks.length || initialAIFetched.current) return;
    initialAIFetched.current = true;
    try {
      setLoading(true);
      const result = await breakdownGoalWithAI(goal.title, goal.category, goal.topic, goal.notes);
      const formattedTasks: SubTask[] = result.subTasks.map((t: any, i: number) => ({
        id: `task-${i}-${Date.now()}`,
        title: t.title,
        description: t.description,
        detailedExplanation: t.detailedExplanation,
        completed: false,
        timerStartedAt: null,
        duration: t.durationMinutes * 60,
        timeLeft: t.durationMinutes * 60,
        status: 'pending',
        resetMode: 'manual'
      }));
      onUpdateGoal(prev => prev ? ({ ...prev, subTasks: formattedTasks }) : null);
      setExpandedTaskId(formattedTasks[0].id);
      playTTS(`Your path is clear for "${goal.title}", friend. Let's take the first step together.`);
    } catch (err) {
      console.error("Path breakdown failed", err);
      initialAIFetched.current = false;
    } finally {
      setLoading(false);
    }
  }, [goal.title, goal.category, goal.topic, goal.notes, goal.subTasks.length, onUpdateGoal]);

  useEffect(() => {
    initAI();
  }, [initAI]);

  const activeTask = goal.subTasks[activeTaskIndex];
  
  const derivedTimeLeft = useMemo(() => {
    if (!activeTask || activeTask.status !== 'active' || !activeTask.timerStartedAt) {
      return activeTask?.timeLeft ?? 0;
    }
    const elapsed = Math.floor((now - activeTask.timerStartedAt) / 1000);
    return Math.max(0, activeTask.duration - elapsed);
  }, [activeTask, now]);

  const notifyUser = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body });
      } catch (e) {}
    }
  }, []);

  const startTask = useCallback((index: number, customDuration?: number, mode?: TimerResetMode) => {
    onUpdateGoal(prevGoal => {
      if (!prevGoal) return null;
      const task = prevGoal.subTasks[index];
      const duration = customDuration ?? task.duration;
      const resetMode = mode ?? task.resetMode ?? 'manual';
      
      const updatedTasks = prevGoal.subTasks.map((t, idx) => 
        idx === index ? { 
          ...t, 
          status: 'active' as const, 
          timerStartedAt: Date.now(), 
          duration, 
          resetMode,
          timeLeft: duration 
        } : t
      );
      return { ...prevGoal, subTasks: updatedTasks, lastCheckpointIndex: index };
    });
  }, [onUpdateGoal]);

  useEffect(() => {
    if (activeTask?.resetMode === 'daily' && activeTask?.timerStartedAt) {
      const lastResetDate = new Date(activeTask.timerStartedAt);
      const currentDate = new Date(now);
      if (currentDate.getDate() !== lastResetDate.getDate() || currentDate.getMonth() !== lastResetDate.getMonth()) {
        startTask(activeTaskIndex, activeTask.duration, 'daily');
        notifyUser("A New Morning", "Your daily rhythm has reset, friend.");
        playTTS("A new sun has risen. Your step has reset for our daily focus.");
      }
    }
  }, [now, activeTask, activeTaskIndex, notifyUser, startTask]);

  useEffect(() => {
    if (activeTask?.status === 'active' && derivedTimeLeft <= 0) {
      if (activeTask.resetMode === 'auto') {
        startTask(activeTaskIndex, activeTask.duration, 'auto');
        notifyUser("Step Concluded", `Our focus on step ${activeTaskIndex + 1} has finished. Beginning again.`);
        playTTS(`Step ${activeTaskIndex + 1} has finished. I am beginning it again for you.`);
      } else {
        // Fix: Explicitly type prevGoal and use 'as const' to prevent status string widening
        onUpdateGoal((prevGoal: Goal | null) => {
          if (!prevGoal) return null;
          const updatedTasks: SubTask[] = prevGoal.subTasks.map((t, idx) => 
            idx === activeTaskIndex ? { ...t, status: 'failed' as const, timeLeft: 0, timerStartedAt: null } : t
          );
          return { ...prevGoal, subTasks: updatedTasks };
        });
        onFailTask(10);
        setIsFocusMode(false);
        notifyUser("Time Rests", `Our time for "${activeTask.title}" has come to an end.`);
        playTTS(`Time reached its rest for our current step.`);
      }
    }
  }, [derivedTimeLeft, activeTask?.status, activeTask?.resetMode, activeTaskIndex, onUpdateGoal, onFailTask, notifyUser, startTask, activeTask?.duration, activeTask?.title]);

  const updateResetMode = (index: number, mode: TimerResetMode) => {
    onUpdateGoal(prevGoal => {
      if (!prevGoal) return null;
      const updatedTasks = prevGoal.subTasks.map((t, idx) => 
        idx === index ? { ...t, resetMode: mode } : t
      );
      return { ...prevGoal, subTasks: updatedTasks };
    });
  };

  const completeTask = (index: number) => {
    onUpdateGoal(prevGoal => {
      if (!prevGoal) return null;
      const updatedTasks = prevGoal.subTasks.map((t, idx) => 
        idx === index ? { ...t, status: 'completed' as const, completed: true, timerStartedAt: null } : t
      );
      const nextIndex = index < updatedTasks.length - 1 ? index + 1 : index;
      return { ...prevGoal, subTasks: updatedTasks, lastCheckpointIndex: nextIndex };
    });

    onCompleteTask(20);
    setIsFocusMode(false);
    
    if (index < goal.subTasks.length - 1) {
      const nextIdx = index + 1;
      setActiveTaskIndex(nextIdx);
      setExpandedTaskId(goal.subTasks[nextIdx].id);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getEndTime = (seconds: number) => {
    const end = new Date(now + seconds * 1000);
    return end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 py-20">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] animate-pulse">Designing our path...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6 h-full flex flex-col max-w-lg mx-auto w-full transition-all duration-700">
      
      {/* FOCUS SANCTUARY */}
      {isFocusMode && activeTask && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-8 space-y-16 animate-in fade-in duration-500">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[120px] rounded-full animate-pulse" />
          </div>

          <div className="relative z-10 text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <h3 className="text-[12px] font-black uppercase text-primary tracking-[0.6em]">Focus Sanctuary</h3>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter leading-tight max-w-sm">{activeTask.title}</h2>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">
              Our time rests at <span className="text-primary">{getEndTime(derivedTimeLeft)}</span>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center">
             <div className="absolute -inset-24 bg-primary/10 blur-[60px] rounded-full animate-pulse duration-[3000ms]" />
             <div className="relative text-[120px] font-black tracking-tighter text-white font-mono leading-none drop-shadow-2xl tabular-nums">
               {formatTime(derivedTimeLeft)}
             </div>
             <div className="w-64 h-1.5 bg-white/5 mt-8 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] transition-all duration-1000" 
                  style={{ width: `${(derivedTimeLeft / activeTask.duration) * 100}%` }} 
                />
             </div>
          </div>

          <div className="relative z-10 flex flex-col gap-4 w-full max-w-xs pt-8">
            <button 
              onClick={() => completeTask(activeTaskIndex)} 
              className="w-full py-6 bg-primary rounded-[2.5rem] font-black text-xl uppercase tracking-widest text-white shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              Step Finished
            </button>
            <button 
              onClick={() => setIsFocusMode(false)} 
              className="py-4 text-slate-600 font-black text-[10px] uppercase tracking-[0.4em] hover:text-slate-400 transition-colors"
            >
              Leave Sanctuary
            </button>
          </div>
        </div>
      )}

      <header className="flex justify-between items-start px-2">
        <div className="max-w-[70%]">
          <h2 className="text-2xl font-black uppercase text-white truncate tracking-tight">{goal.title}</h2>
          <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">{goal.topic}</span>
        </div>
        <div className="flex gap-2">
           <button 
                onClick={() => setShowVideoModal(true)}
                className="p-3 bg-primary/10 border border-primary/30 text-primary rounded-[1.2rem] hover:bg-primary/20 transition-all active-glow"
              >
                <ICONS.Zap size={22} />
            </button>
        </div>
      </header>

      {/* PATH FLOW */}
      <div className="px-4 flex items-center justify-between mb-2">
        {goal.subTasks.map((_, i) => (
          <React.Fragment key={i}>
            <div className={`w-10 h-10 rounded-[1.25rem] flex items-center justify-center border-2 transition-all duration-500 ${
              i < activeTaskIndex ? 'bg-primary border-primary text-white' : 
              i === activeTaskIndex ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 
              'bg-white/5 border-white/10 text-slate-700'
            }`}>
              {i < activeTaskIndex ? <ICONS.Check size={16} /> : <span className="text-[11px] font-black">{i + 1}</span>}
            </div>
            {i < goal.subTasks.length - 1 && (
              <div className={`flex-1 h-[2px] mx-1 rounded-full ${i < activeTaskIndex ? 'bg-primary' : 'bg-white/5'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-hide">
        {goal.subTasks.map((task, idx) => {
          const isActive = idx === activeTaskIndex;
          const isExpanded = expandedTaskId === task.id;
          const isTimerActive = task.status === 'active';
          const currentDisplayTime = isActive ? derivedTimeLeft : task.timeLeft;

          return (
            <div 
              key={task.id}
              className={`group overflow-hidden rounded-[2.5rem] border transition-all duration-500 ${
                isActive ? 'bg-primary/5 border-primary/50 active-glow' : 
                task.completed ? 'bg-emerald-500/5 border-emerald-500/10 opacity-60' : 'bg-white/5 border-white/5 opacity-40'
              }`}
            >
              <div onClick={() => setExpandedTaskId(isExpanded ? null : task.id)} className="p-7 cursor-pointer flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-200 tracking-tight">{task.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                      <ICONS.Clock size={12} /> {formatTime(currentDisplayTime)}
                    </span>
                    {isTimerActive && (
                      <span className="text-[9px] font-black uppercase text-primary animate-pulse tracking-[0.2em] border border-primary/30 px-2 py-0.5 rounded-md">
                        Current Focus
                      </span>
                    )}
                  </div>
                </div>
                {isTimerActive ? (
                   <div className="text-right">
                     <span className="font-mono font-black text-primary text-2xl tabular-nums">{formatTime(derivedTimeLeft)}</span>
                     <div className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Rests at {getEndTime(derivedTimeLeft)}</div>
                   </div>
                ) : (
                  <div className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ICONS.CaretRight size={20} className="text-slate-600 rotate-90" />
                  </div>
                )}
              </div>

              <div className={`overflow-hidden transition-all duration-700 ${isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-7 pb-7 pt-2 border-t border-white/5 space-y-6">
                  <p className="text-sm text-slate-300 leading-relaxed font-medium italic">"{task.description}"</p>
                  
                  <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-white/5">
                    <h4 className="text-[10px] font-black text-primary uppercase mb-3 tracking-[0.2em] flex items-center gap-2">
                      <ICONS.Compass size={14} /> Journey Wisdom
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{task.detailedExplanation}</p>
                  </div>

                  {isActive && !task.completed && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Select Interval</label>
                          {isTimerActive && <span className="text-[10px] font-bold text-primary">Rests at {getEndTime(derivedTimeLeft)}</span>}
                        </div>
                        <div className="flex gap-2">
                          {PRESETS.map(p => (
                            <button 
                              key={p.label}
                              onClick={() => startTask(idx, p.value)}
                              className={`flex-1 py-3 rounded-xl border text-[11px] font-black transition-all ${task.duration === p.value && isTimerActive ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-400 hover:border-primary/50'}`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Rhythm Style</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['manual', 'auto', 'daily'] as TimerResetMode[]).map(mode => (
                              <button 
                                key={mode}
                                onClick={() => updateResetMode(idx, mode)}
                                className={`py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${task.resetMode === mode ? 'bg-white/10 border-white/30 text-white' : 'bg-white/2 border-white/5 text-slate-700'}`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        {task.status === 'pending' || task.status === 'failed' ? (
                          <button onClick={() => startTask(idx)} className="w-full py-5 bg-primary rounded-2xl font-black text-sm uppercase tracking-[0.2em] text-white shadow-xl shadow-primary/20">Begin our Step</button>
                        ) : (
                          <div className="flex gap-3">
                            <button onClick={() => setIsFocusMode(true)} className="flex-1 py-5 bg-primary rounded-2xl font-black text-xs uppercase tracking-widest text-white flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                              <ICONS.Zap size={14} /> Focus Sanctuary
                            </button>
                            <button onClick={() => completeTask(idx)} className="flex-1 py-5 bg-emerald-600 border border-emerald-500 rounded-2xl font-black text-xs uppercase tracking-widest text-white hover:bg-emerald-500 transition-all">Mark Done</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 flex flex-col gap-3">
        <button 
          onClick={() => {
            const incompleteCount = goal.subTasks.filter(t => !t.completed).length;
            if (incompleteCount > 0) {
              if (window.confirm(`You still have ${incompleteCount} steps on this journey. Shall we rest this path for now?`)) {
                onFinish();
              }
            } else {
              onFinish();
            }
          }}
          className="w-full py-6 bg-primary rounded-[2.5rem] font-black text-lg uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:opacity-90 transition-all text-white"
        >
          Rest this Path
        </button>
      </div>

      {showVideoModal && <VideoModal goalTitle={goal.title} category={goal.category} onClose={() => setShowVideoModal(false)} />}
    </div>
  );
};

export default GoalBreakdown;
