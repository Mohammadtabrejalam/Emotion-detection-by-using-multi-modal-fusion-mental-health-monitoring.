import React, { useState } from 'react';
import { 
  Smile, 
  Battery, 
  Moon, 
  Activity, 
  MessageCircle, 
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../services/api';
import type { User } from '../types';

interface CheckinProps {
  currentUser?: User | null;
}

export const Checkin: React.FC<CheckinProps> = ({ currentUser }) => {
  // Slider Scores (1 to 5)
  const [feeling, setFeeling] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(3);
  const [sleep, setSleep] = useState<number>(3);
  const [stress, setStress] = useState<number>(3);
  const [talkToSomeone, setTalkToSomeone] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  // Form Status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const payload = {
      user_id: currentUser?.id,
      feeling_score: feeling,
      energy_score: energy,
      sleep_score: sleep,
      stress_score: stress,
      talk_to_someone: talkToSomeone,
      notes: notes.trim()
    };

    const response = await apiService.submitCheckin(payload);
    setIsSubmitting(false);
    
    if (response.success) {
      setSuccessMsg("Daily check-in logged successfully! View updates in the Trends Dashboard.");
      // Reset text fields
      setNotes('');
      setTalkToSomeone(false);
      setFeeling(3);
      setEnergy(3);
      setSleep(3);
      setStress(3);
    } else {
      setErrorMsg(response.error?.message || "Failed to record check-in.");
    }
  };

  return (
    <div className="space-y-6 py-4 max-w-2xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Daily Wellness Check-in</h2>
        <p className="text-slate-400 text-sm">Self-report your wellness metrics to evaluate correlations with AI mood assessments.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-800 space-y-6 shadow-xl">
        
        {/* 1. FEELING SLIDER */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
              <Smile className="h-4.5 w-4.5 text-indigo-400" />
              <span>Overall Mood</span>
            </label>
            <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
              {feeling === 1 ? 'Very Low' : feeling === 2 ? 'Low' : feeling === 3 ? 'Neutral' : feeling === 4 ? 'Good' : 'Excellent'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={feeling}
            onChange={(e) => setFeeling(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 outline-none"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            <span>Low</span>
            <span>Average</span>
            <span>High</span>
          </div>
        </div>

        {/* 2. ENERGY SLIDER */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
              <Battery className="h-4.5 w-4.5 text-emerald-400" />
              <span>Energy Levels</span>
            </label>
            <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
              {energy === 1 ? 'Exhausted' : energy === 2 ? 'Low' : energy === 3 ? 'Moderate' : energy === 4 ? 'Active' : 'Fully Charged'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 outline-none"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            <span>Tired</span>
            <span>Medium</span>
            <span>Energetic</span>
          </div>
        </div>

        {/* 3. SLEEP SLIDER */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
              <Moon className="h-4.5 w-4.5 text-blue-400" />
              <span>Sleep Quality</span>
            </label>
            <span className="text-xs font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded">
              {sleep === 1 ? 'Restless' : sleep === 2 ? 'Poor' : sleep === 3 ? 'Average' : sleep === 4 ? 'Good' : 'Deep Rest'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={sleep}
            onChange={(e) => setSleep(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 outline-none"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            <span>Restless</span>
            <span>Adequate</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* 4. STRESS SLIDER */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
              <Activity className="h-4.5 w-4.5 text-red-450" />
              <span>Stress Index</span>
            </label>
            <span className="text-xs font-bold text-red-300 bg-red-500/10 px-2 py-0.5 rounded">
              {stress === 1 ? 'Calm' : stress === 2 ? 'Low' : stress === 3 ? 'Stressed' : stress === 4 ? 'High' : 'Extreme Pressure'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={stress}
            onChange={(e) => setStress(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 outline-none"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
            <span>Relaxed</span>
            <span>Moderate</span>
            <span>Overwhelmed</span>
          </div>
        </div>

        {/* 5. YES/NO SPEAK TO SOMEONE CHECK */}
        <div className="border-t border-slate-800 pt-4 space-y-2">
          <label className="flex items-center gap-3 cursor-pointer text-slate-300 text-sm select-none">
            <input
              type="checkbox"
              checked={talkToSomeone}
              onChange={(e) => setTalkToSomeone(e.target.checked)}
              className="rounded border-slate-800 text-brand-600 focus:ring-brand-500 h-5.5 w-5.5 bg-slate-950 transition"
            />
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4.5 w-4.5 text-slate-400" />
              <span className="font-semibold text-sm">Request professional wellness outreach</span>
            </div>
          </label>
          <p className="text-[10px] text-slate-500 pl-8">
            Checking this flag logs a wellness outreach signifier to trigger advice references.
          </p>
        </div>

        {/* 6. OPTIONAL NOTES AREA */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
            <FileText className="h-4.5 w-4.5 text-slate-400" />
            <span>Personal Journal Notes (Optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            placeholder="Log thoughts, feelings, or sleep details privately in your local database..."
            className="w-full h-24 bg-slate-900/60 border border-slate-700/50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl p-3 text-xs text-slate-200 outline-none resize-none placeholder-slate-500 transition-all"
          />
          <div className="text-right text-[10px] text-slate-500">
            {notes.length} / 500 characters
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-brand-700 disabled:opacity-50 text-white font-bold transition shadow-lg shadow-brand-600/10 hover:shadow-brand-500/15"
        >
          {isSubmitting ? 'Recording check-in...' : 'Submit Wellness Log'}
        </button>

      </form>
    </div>
  );
};
