
import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, AppState, AppTab, Goal, TimetableSlot, QuestRecord } from './types';
import { ICONS } from './constants';
import Onboarding from './components/Onboarding';
import Quest from './components/Quest';
import GoalEntry from './components/GoalEntry';
import GoalBreakdown from './components/GoalBreakdown';
import Mentor from './components/Mentor';
import ProfileTab from './components/ProfileTab';
import StatsTab from './components/StatsTab';
import Tutorial from './components/Tutorial';
import Summary from './components/Summary';

const STORAGE_KEY = 'innerpath_master_data_v6';

const DEFAULT_USER: UserProfile = {
  name: '',
  xp: 0,
  streak: 0,
  lastActive: null,
  badges: [],
  level: 1,
  recoveryNeeded: false,
  totalFocusMinutes: 0,
  theme: 'emerald',
  completedGoals: []
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.ONBOARDING);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.QUEST);
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [history, setHistory] = useState<QuestRecord[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', user.theme || 'emerald');
  }, [user.theme]);

  // Persistent Hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedUser = { ...DEFAULT_USER, ...(parsed.user || {}) };
        
        if (savedUser.lastActive) {
          const lastDate = new Date(savedUser.lastActive).getTime();
          const daysDiff = Math.floor((Date.now() - lastDate) / (1000 * 60 * 60 * 24));
          if (daysDiff >= 2) {
            const decay = daysDiff * 5;
            savedUser.xp = Math.max(0, (savedUser.xp || 0) - decay);
          }
        }

        setUser(savedUser);
        setTimetable(parsed.timetable || []);
        setHistory(parsed.history || []);
        
        if (parsed.activeGoal && parsed.activeGoal.status === 'active') {
          setActiveGoal(parsed.activeGoal);
          setAppState(AppState.GOAL_BREAKDOWN);
        } else if (savedUser.name) {
          setAppState(AppState.MAIN);
        }
      }
    } catch (err) {
      console.error("Hydration Error", err);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Autosave
  useEffect(() => {
    if (isInitialized && user.name) {
      try {
        const updatedUser = { ...user, lastActive: new Date().toISOString() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
          user: updatedUser, 
          timetable, 
          history, 
          activeGoal 
        }));
      } catch (err) {
        console.error("Save Error", err);
      }
    }
  }, [user, timetable, history, activeGoal, isInitialized]);

  const addXP = useCallback((amount: number, record?: Omit<QuestRecord, 'xpChange'>) => {
    setUser(prev => {
      const streakBonus = Math.floor((prev.streak || 0) / 5) * 5;
      const finalAmount = amount + streakBonus;
      const newXP = (prev.xp || 0) + finalAmount;
      const newLevel = Math.floor(newXP / 500) + 1;
      const newBadges = [...(prev.badges || [])];
      if (newLevel >= 10 && !newBadges.includes('b10')) newBadges.push('b10');
      if (newXP >= 500 && !newBadges.includes('b5')) newBadges.push('b5');
      return { ...prev, xp: newXP, level: newLevel, badges: newBadges, recoveryNeeded: false };
    });
    if (record) {
      setHistory(prev => [...prev, { ...record, xpChange: amount }]);
    }
  }, []);

  const deductXP = useCallback((amount: number, record?: Omit<QuestRecord, 'xpChange'>) => {
    setUser(prev => ({ ...prev, xp: Math.max(0, (prev.xp || 0) - amount), recoveryNeeded: true }));
    if (record) {
      setHistory(prev => [...prev, { ...record, xpChange: -amount }]);
    }
  }, []);

  const handleGoalFinish = () => {
    if (activeGoal) {
      const finishedGoal = { ...activeGoal, status: 'completed' as const, finishedAt: Date.now() };
      setUser(prev => ({
        ...prev,
        completedGoals: [...(prev.completedGoals || []), finishedGoal]
      }));
    }
    setAppState(AppState.SUMMARY);
  };

  if (!isInitialized) return null;

  const renderMainTab = () => {
    switch (activeTab) {
      case AppTab.QUEST:
        return (
          <Quest 
            user={user} 
            onNewGoal={() => setAppState(AppState.GOAL_ENTRY)}
            onOpenMentor={() => setActiveTab(AppTab.MENTOR)}
            timetable={timetable}
            setTimetable={setTimetable}
            onTaskDone={(xp, record) => addXP(xp, record)}
            onTaskMissed={(xp, record) => deductXP(xp, record)}
          />
        );
      case AppTab.MENTOR:
        return <Mentor user={user} />;
      case AppTab.STATS:
        return <StatsTab history={history} user={user} />;
      case AppTab.PROFILE:
        return <ProfileTab user={user} onUpdateUser={setUser} />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.ONBOARDING:
        return <Onboarding onComplete={(name) => { setUser(p => ({ ...p, name })); setAppState(AppState.TUTORIAL); }} />;
      case AppState.TUTORIAL:
        return <Tutorial onComplete={() => setAppState(AppState.MAIN)} />;
      case AppState.GOAL_ENTRY:
        return <GoalEntry user={user} onBack={() => setAppState(AppState.MAIN)} onGoalBreakdown={(g) => { setActiveGoal(g); setAppState(AppState.GOAL_BREAKDOWN); }} />;
      case AppState.GOAL_BREAKDOWN:
        return activeGoal ? (
          <GoalBreakdown 
            goal={activeGoal} 
            onUpdateGoal={setActiveGoal}
            onCompleteTask={(xp) => addXP(xp)} 
            onFailTask={(xp) => deductXP(xp)} 
            onFinish={handleGoalFinish} 
          />
        ) : null;
      case AppState.SUMMARY:
        return activeGoal ? <Summary goal={activeGoal} onDone={() => { setActiveGoal(null); setAppState(AppState.MAIN); }} /> : null;
      case AppState.MAIN:
      default:
        return (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto pb-28 scrollbar-hide pt-4">
              {renderMainTab()}
            </div>
            
            <nav className="fixed bottom-6 left-4 right-4 bg-slate-900/80 backdrop-blur-2xl border border-white/5 px-6 py-3 flex justify-around items-center z-50 rounded-[2rem] shadow-2xl transition-all duration-500">
              {(Object.keys(AppTab) as Array<keyof typeof AppTab>).map((key) => {
                const tab = AppTab[key];
                const Icon = tab === AppTab.QUEST ? ICONS.Award : tab === AppTab.MENTOR ? ICONS.Target : tab === AppTab.STATS ? ICONS.ChartBar : ICONS.User;
                const label = tab === AppTab.QUEST ? 'Plan' : tab === AppTab.MENTOR ? 'Mentor' : tab === AppTab.STATS ? 'Stats' : 'Profile';
                
                return (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab ? 'text-primary scale-110' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Icon size={22} />
                    <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen theme-transition bg-slate-950 text-slate-100 flex flex-col items-center selection:bg-emerald-500/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary opacity-5 blur-[150px] rounded-full transition-all duration-700" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-600/5 blur-[120px] rounded-full" />
      </div>
      <div className="relative w-full max-w-lg h-screen flex flex-col px-4">{renderContent()}</div>
    </div>
  );
};

export default App;
