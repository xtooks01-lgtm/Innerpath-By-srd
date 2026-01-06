
import React, { useState, useRef } from 'react';
import { ICONS } from '../constants';
import { Goal, UserProfile } from '../types';
import { analyzeImageForGoal, suggestGoalsWithAI } from '../services/geminiService';

interface GoalEntryProps {
  user: UserProfile;
  onBack: () => void;
  onGoalBreakdown: (goal: Goal) => void;
}

const CATEGORIES = ['learning', 'projects', 'fitness', 'creativity', 'wellbeing'];

const GoalEntry: React.FC<GoalEntryProps> = ({ user, onBack, onGoalBreakdown }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('learning');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [scanning, setScanning] = useState(false);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{title: string, topic: string, category: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !topic) return;

    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      category,
      topic,
      notes,
      subTasks: [],
      createdAt: Date.now(),
      status: 'active'
    };
    onGoalBreakdown(newGoal);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await analyzeImageForGoal(base64);
        if (result.title) setTitle(result.title);
        if (result.topic) setTopic(result.topic);
        if (result.category && CATEGORIES.includes(result.category.toLowerCase())) {
          setCategory(result.category.toLowerCase());
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Scan failed", err);
    } finally {
      setScanning(false);
    }
  };

  const handleFetchSuggestions = async () => {
    setFetchingSuggestions(true);
    try {
      const result = await suggestGoalsWithAI(user);
      setSuggestions(result.suggestions);
    } catch (err) {
      console.error("Failed to fetch suggestions", err);
    } finally {
      setFetchingSuggestions(false);
    }
  };

  const selectSuggestion = (s: {title: string, topic: string, category: string}) => {
    setTitle(s.title);
    setTopic(s.topic);
    if (CATEGORIES.includes(s.category.toLowerCase())) {
      setCategory(s.category.toLowerCase());
    }
    setSuggestions([]);
  };

  return (
    <div className="space-y-8 py-6 animate-in slide-in-from-bottom duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full">
            <ICONS.X />
          </button>
          <h1 className="text-2xl font-bold">Set a New Goal</h1>
        </div>
        
        <div className="flex gap-2">
          {/* AI Suggestions Button */}
          <button 
            onClick={handleFetchSuggestions}
            disabled={fetchingSuggestions}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-500/20 transition-all"
          >
            {fetchingSuggestions ? (
              <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ICONS.Star />
            )}
            AI Suggester
          </button>

          {/* Visual Scan Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-500/20 transition-all"
          >
            {scanning ? (
              <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ICONS.Award />
            )}
            Scan Goal
          </button>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          capture="environment"
          onChange={handleImageUpload} 
        />
      </div>

      {/* Suggested Goals chips */}
      {suggestions.length > 0 && (
        <div className="space-y-3 animate-in fade-in">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest px-1">Rudh-h's Recommendations:</p>
          <div className="flex flex-nowrap gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => selectSuggestion(s)}
                className="flex-shrink-0 p-4 bg-white/5 border border-white/10 rounded-2xl text-left hover:border-blue-500/50 transition-all max-w-[200px]"
              >
                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">{s.category}</p>
                <p className="text-sm font-bold text-slate-100 truncate">{s.title}</p>
                <p className="text-[10px] text-slate-500 truncate">{s.topic}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-400">What's the goal?</label>
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Master the guitar"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-400">Type of Journey</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full border text-sm capitalize transition-all ${
                  category === cat ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-400">Specific Area / Topic</label>
          <input 
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Learning jazz scales"
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-400">Any extra thoughts?</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="I want to focus on hand coordination..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none h-32"
          />
        </div>

        <button 
          type="submit"
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
        >
          Create My Steps
        </button>
      </form>
    </div>
  );
};

export default GoalEntry;
