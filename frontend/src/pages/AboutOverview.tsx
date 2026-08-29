import React from 'react';
import { 
  Mic, 
  Camera, 
  FileText, 
  ArrowRight,
  CheckCircle2,
  Shield
} from 'lucide-react';
import { MindSenseLogo } from '../components/MindSenseLogo';

interface AboutOverviewProps {
  onStartAnalysis?: () => void;
}

export const AboutOverview: React.FC<AboutOverviewProps> = ({ onStartAnalysis }) => {
  return (
    <div className="space-y-12 py-2 max-w-5xl mx-auto">
      
      {/* 1. HERO EXPLANATION */}
      <div className="academic-card p-8 md:p-10 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 shadow-sm shrink-0">
            <MindSenseLogo size={56} />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block">
              Project Abstract & Overview
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              What is MindSense?
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-3xl font-normal">
              MindSense is an academic research platform for multimodal affective computing. It analyzes text semantic valence, acoustic vocal prosody, and facial micro-expressions simultaneously using a cross-attention transformer to decipher underlying emotional states and provide longitudinal mental wellness monitoring.
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap gap-3 border-t border-slate-800">
          <button
            onClick={onStartAnalysis}
            className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs tracking-wide uppercase transition shadow flex items-center gap-2"
          >
            <span>Launch Live Analysis</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. THE 3 SENSES EXPLAINED */}
      <div className="space-y-6">
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Tri-Modal Encoders</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">How Does MindSense Understand Affect?</h2>
          <p className="text-xs text-slate-400">
            Similar to human clinical observation, the system fuses three distinct behavioral channels:
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Sense 1: Text */}
          <div className="academic-card p-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-bold text-white text-base">1. Semantic Lexicon</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tokenizes written statements into word embeddings to calculate semantic valence, sentiment orientation, and cognitive markers.
              </p>
            </div>
            <div className="p-2.5 bg-slate-900/80 rounded-lg text-[11px] text-indigo-300 font-mono border border-slate-800">
              Embedding: 64-dim Conv1D
            </div>
          </div>

          {/* Sense 2: Voice */}
          <div className="academic-card p-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <Mic className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-bold text-white text-base">2. Speech Acoustics (SER)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Extracts 13 Mel-Frequency Cepstral Coefficients (MFCCs) over 25ms timeframes to capture vocal pitch, jitter, and energy variations.
              </p>
            </div>
            <div className="p-2.5 bg-slate-900/80 rounded-lg text-[11px] text-emerald-300 font-mono border border-slate-800">
              DSP: 16kHz Mono 13-MFCC
            </div>
          </div>

          {/* Sense 3: Face */}
          <div className="academic-card p-6 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                <Camera className="h-4.5 w-4.5" />
              </div>
              <h3 className="font-bold text-white text-base">3. Facial Expression CNN</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Aligns face bounding boxes and computes spatial feature representations (eyebrows, lips, cheeks) across 48x48 pixel grayscale tensors.
              </p>
            </div>
            <div className="p-2.5 bg-slate-900/80 rounded-lg text-[11px] text-blue-300 font-mono border border-slate-800">
              Vision: 2D CNN [1, 48, 48]
            </div>
          </div>

        </div>
      </div>

      {/* 3. WHY COMBINING SENSES MATTERS (SARCASM & SOCIAL SUPPRESSION) */}
      <div className="academic-card p-8 space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block">The Value of Fusion</span>
          <h2 className="text-xl md:text-2xl font-extrabold text-white">Overcoming Sarcasm & Social Suppression</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 text-xs text-slate-300 leading-relaxed">
          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-2">
            <strong className="text-sm font-bold text-red-400 block">Single-Modality Failure Example:</strong>
            <p>
              When a user writes <em>&ldquo;Oh perfect, just what I needed&rdquo;</em>, standalone text models assign high positive joy due to the words &ldquo;perfect&rdquo; and &ldquo;needed&rdquo;.
            </p>
          </div>

          <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 space-y-2">
            <strong className="text-sm font-bold text-emerald-400 block">Multimodal Cross-Attention Resolution:</strong>
            <p>
              MindSense pairs the written statement with monotonic vocal pitch and furrowed eyebrows. The self-attention matrix dynamically attenuates text valence and correctly outputs <strong>Frustration / Sarcasm</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 4. 4-STEP WORKFLOW */}
      <div className="space-y-6">
        <h2 className="text-xl md:text-2xl font-extrabold text-white text-center">4-Step Ingestion & Inference Workflow</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="academic-card p-5 space-y-2">
            <div className="h-7 w-7 rounded-lg bg-brand-500/10 text-brand-400 font-bold flex items-center justify-center text-xs border border-brand-500/20">
              1
            </div>
            <h4 className="font-bold text-white text-xs">Modality Intake</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Submit text, vocal audio, or photo. The architecture supports any subset from 1 to 3 inputs.
            </p>
          </div>

          <div className="academic-card p-5 space-y-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-xs border border-indigo-500/20">
              2
            </div>
            <h4 className="font-bold text-white text-xs">Volatile Extraction</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Raw audio and camera matrices are converted to mathematical tensors and cleared from RAM.
            </p>
          </div>

          <div className="academic-card p-5 space-y-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center text-xs border border-emerald-500/20">
              3
            </div>
            <h4 className="font-bold text-white text-xs">Cross-Attention</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Multi-head attention applies dynamic masks to weight active modalities without zero-bias.
            </p>
          </div>

          <div className="academic-card p-5 space-y-2">
            <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-xs border border-blue-500/20">
              4
            </div>
            <h4 className="font-bold text-white text-xs">Affect Insights</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Delivers confidence distributions, attention weights, and longitudinal wellness tracking.
            </p>
          </div>
        </div>
      </div>

      {/* 5. PRIVACY & SAFETY COMMITMENT */}
      <div className="academic-card p-8 space-y-4 border-emerald-500/30 bg-emerald-500/5">
        <div className="flex items-center gap-2.5 text-emerald-400">
          <Shield className="h-5 w-5" />
          <h3 className="text-base font-bold text-white">Privacy Architecture & Research Ethics</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="space-y-1">
            <strong className="text-white block flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Zero Media Persistence
            </strong>
            <p className="text-slate-400 text-[11px]">
              Raw facial pictures and vocal wave streams are never stored to permanent disk or cloud storage.
            </p>
          </div>

          <div className="space-y-1">
            <strong className="text-white block flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Profile Isolation
            </strong>
            <p className="text-slate-400 text-[11px]">
              Only mathematical classification logs and daily reflections are retained under your local profile.
            </p>
          </div>

          <div className="space-y-1">
            <strong className="text-white block flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Academic & Wellness Purpose
            </strong>
            <p className="text-slate-400 text-[11px]">
              MindSense provides research insights and daily reflection tools, not medical or psychiatric diagnosis.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
