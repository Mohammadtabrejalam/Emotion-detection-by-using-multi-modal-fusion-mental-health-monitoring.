import React, { useState } from 'react';
import { 
  Smile, 
  Battery, 
  Moon, 
  Activity, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { apiService } from '../services/api';
import type { User } from '../types';

interface CheckinProps {
  currentUser?: User | null;
}

export const Checkin: React.FC<CheckinProps> = ({ currentUser }) => {
  const [feeling, setFeeling] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(3);
  const [sleep, setSleep] = useState<number>(3);
  const [stress, setStress] = useState<number>(3);
  const [talkToSomeone, setTalkToSomeone] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

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
      setSuccessMsg("Daily check-in recorded! Metrics updated in your longitudinal trends.");
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
    <div className="space-y-6 py-2 max-w-2xl mx-auto">
      
      <div>
        <p className="text-xs text-slate-400">Self-report your subjective wellness indices to correlate with multimodal model assessments.</p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Sliders Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          
          {/* Feeling */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Smile className="h-4 w-4 text-emerald-400" /> Overall Mood
              </span>
              <span className="font-mono text-emerald-400 font-bold">{feeling} / 5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={feeling}
              onChange={(e) => setFeeling(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>1 (Depleted)</span>
              <span>5 (Flourishing)</span>
            </div>
          </div>

          {/* Energy */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Battery className="h-4 w-4 text-brand-400" /> Energy Level
              </span>
              <span className="font-mono text-brand-400 font-bold">{energy} / 5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={energy}
              onChange={(e) => setEnergy(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>1 (Exhausted)</span>
              <span>5 (High Energy)</span>
            </div>
          </div>

          {/* Sleep */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Moon className="h-4 w-4 text-indigo-400" /> Sleep Quality
              </span>
              <span className="font-mono text-indigo-400 font-bold">{sleep} / 5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={sleep}
              onChange={(e) => setSleep(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>1 (Restless)</span>
              <span>5 (Deep Rest)</span>
            </div>
          </div>

          {/* Stress */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-rose-400" /> Stress Tension
              </span>
              <span className="font-mono text-rose-400 font-bold">{stress} / 5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={stress}
              onChange={(e) => setStress(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
              <span>1 (Peaceful)</span>
              <span>5 (Acute Stress)</span>
            </div>
          </div>

        </div>

        {/* Talk to someone checkbox */}
        <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer bg-slate-900/40 p-3 rounded-lg border border-slate-800 select-none">
          <input
            type="checkbox"
            checked={talkToSomeone}
            onChange={(e) => setTalkToSomeone(e.target.checked)}
            className="rounded border-slate-700 text-brand-600 focus:ring-brand-500 h-4 w-4 bg-slate-950"
          />
          <span>I spoke with a friend, mentor, or professional today</span>
        </label>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Context Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any notable triggers, sleep conditions, or events today..."
            className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg p-3 text-xs text-white outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow"
        >
          {isSubmitting ? 'Logging...' : 'Submit Daily Check-in'}
        </button>
      </form>
    </div>
  );
};
