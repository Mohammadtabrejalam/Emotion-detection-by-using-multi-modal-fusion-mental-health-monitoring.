import { 
  Mic, 
  Camera, 
  FileText, 
  Lock, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { MindSenseLogo } from '../components/MindSenseLogo';

interface AboutOverviewProps {
  onStartAnalysis: () => void;
}

export const AboutOverview: React.FC<AboutOverviewProps> = ({ onStartAnalysis }) => {
  return (
    <div className="space-y-16 py-6 max-w-5xl mx-auto">
      
      {/* 1. HERO EXPLANATION */}
      <div className="glass-panel p-8 md:p-12 rounded-3xl border border-slate-800 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="p-4 rounded-3xl bg-brand-500/10 border border-brand-500/20 shadow-lg shadow-brand-500/15">
            <MindSenseLogo size={64} />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-widest block">
              Plain-English Overview
            </span>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              What is MindSense?
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl">
              MindSense is an AI companion that reads your written words, listens to the tone of your voice, and looks at your facial expression together to understand how you really feel.
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap gap-4 border-t border-slate-800">
          <button
            onClick={onStartAnalysis}
            className="px-7 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 flex items-center gap-2 transition hover:-translate-y-0.5"
          >
            Try Live Analysis Now <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. THE 3 SENSES EXPLAINED SIMPLY */}
      <div className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">How Does It Understand You?</h2>
          <p className="text-xs text-slate-400">
            Just like a real human friend uses eyes and ears, MindSense uses 3 natural senses:
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Sense 1: Text */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-lg">1. Words You Write</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When you type a message or journal entry, MindSense reads the emotional meaning and positive or negative keywords in your text.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl text-[11px] text-indigo-300 font-medium">
              Example: &ldquo;I am feeling grateful today&rdquo;
            </div>
          </div>

          {/* Sense 2: Voice */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Mic className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-lg">2. Tone of Your Voice</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When you record your voice, MindSense measures your vocal pitch, speed, and energy. Tired voices sound softer, while excitement or anger sound louder.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl text-[11px] text-emerald-300 font-medium">
              Example: Speed, volume & vocal tremor
            </div>
          </div>

          {/* Sense 3: Face */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Camera className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-white text-lg">3. Facial Expression</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When you snap a webcam photo, MindSense looks for natural micro-expressions like smiling cheek muscles, raised eyebrows, or drooped eyelids.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl text-[11px] text-blue-300 font-medium">
              Example: Smiling vs. furrowed brow
            </div>
          </div>

        </div>
      </div>

      {/* 3. WHY COMBINING SENSES MATTERS (A SIMPLE STORY) */}
      <div className="glass-panel p-8 md:p-10 rounded-3xl border border-slate-800 space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block">The Magic of Fusion</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">Why Combining All 3 Is Much Smarter</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-850 space-y-3">
            <strong className="text-sm font-bold text-red-400 block">The Problem with Just Reading Text:</strong>
            <p>
              If a coworker texts you <em>&ldquo;Oh great, just what I needed&rdquo;</em>, a standard computer thinks they are happy because of the word <em>&ldquo;great&rdquo;</em>. But in real life, you know they are being sarcastic.
            </p>
          </div>

          <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-850 space-y-3">
            <strong className="text-sm font-bold text-emerald-400 block">How MindSense Solves It:</strong>
            <p>
              MindSense listens to their frustrated vocal tone and sees their annoyed face. It combines all three pieces of information to correctly detect <strong>Frustration / Sarcasm</strong> instead of false happiness!
            </p>
          </div>
        </div>
      </div>

      {/* 4. 4-STEP HOW IT WORKS */}
      <div className="space-y-6">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center">4 Simple Steps to Use MindSense</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="h-8 w-8 rounded-xl bg-brand-500/10 text-brand-400 font-extrabold flex items-center justify-center text-sm">
              1
            </div>
            <h4 className="font-bold text-white text-sm">Share What You Want</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Type thoughts, record your voice, or take a picture. Even just 1 input is enough!
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-400 font-extrabold flex items-center justify-center text-sm">
              2
            </div>
            <h4 className="font-bold text-white text-sm">Private Processing</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your voice and photo are converted to numbers instantly and destroyed from memory.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-400 font-extrabold flex items-center justify-center text-sm">
              3
            </div>
            <h4 className="font-bold text-white text-sm">AI Fusion Layer</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Cross-attention neural network matches your words, audio waves, and facial cues.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-400 font-extrabold flex items-center justify-center text-sm">
              4
            </div>
            <h4 className="font-bold text-white text-sm">Gentle Insights</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              You receive emotion percentages, wellness scores, and friendly self-care tips.
            </p>
          </div>
        </div>
      </div>

      {/* 5. PRIVACY & SAFETY PROMISE */}
      <div className="glass-panel p-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
        <div className="flex items-center gap-3 text-emerald-400">
          <Lock className="h-6 w-6" />
          <h3 className="text-lg font-bold text-white">Our 100% Privacy & Safety Promise</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="space-y-1">
            <strong className="text-white block flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> No Video or Audio Saved
            </strong>
            <p className="text-slate-400 text-[11px]">
              Your webcam photos and microphone recordings are never stored on any hard drive or cloud server.
            </p>
          </div>

          <div className="space-y-1">
            <strong className="text-white block flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Isolated to Your Profile
            </strong>
            <p className="text-slate-400 text-[11px]">
              Only emotion scores and your private daily notes are kept locally under your personal account.
            </p>
          </div>

          <div className="space-y-1">
            <strong className="text-white block flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Friendly Companion, Not a Doctor
            </strong>
            <p className="text-slate-400 text-[11px]">
              MindSense provides research and wellness monitoring to help you reflect, not clinical medical diagnosis.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
