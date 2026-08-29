import React, { useState } from 'react';
import { 
  ArrowRight, 
  FileText, 
  Mic, 
  Camera, 
  Layers, 
  Activity, 
  BarChart3, 
  BrainCircuit, 
  BookOpen, 
  ShieldAlert, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { VisitorStats } from '../components/VisitorStats';
import { FeedbackWidget } from '../components/FeedbackWidget';
import type { User, AnalysisData } from '../types';

interface HomeProps {
  currentUser?: User | null;
  onStartAnalysis: () => void;
  onNavigate: (pillar: 'home' | 'analyze' | 'insights' | 'research' | 'resources', subTab?: string) => void;
  onOpenHelp: () => void;
  recentAnalysis?: AnalysisData | null;
}

export const Home: React.FC<HomeProps> = ({
  currentUser,
  onStartAnalysis,
  onNavigate,
  onOpenHelp,
  recentAnalysis
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "What is MindSense?",
      a: "MindSense is an academic research platform exploring how text, voice, and visual signals can be analyzed together to study emotional expression."
    },
    {
      q: "Is MindSense a medical diagnostic system?",
      a: "No. MindSense is an experimental research system. Emotion estimates are non-clinical computational predictions and do NOT constitute medical diagnosis or psychological advice."
    },
    {
      q: "How does multimodal signal fusion work?",
      a: "MindSense extracts Lexical text vectors, Vocal Prosody acoustic features, and Facial ROI visual features, aligning them using intermediate cross-attention with dynamic modality availability masking."
    },
    {
      q: "How is research data protected?",
      a: "Research participation is completely voluntary. Contributions are assigned anonymized participant codes and kept strictly isolated from standard application data. You may withdraw consent at any time."
    }
  ];

  return (
    <div className="space-y-16 py-2 max-w-6xl mx-auto font-sans">
      
      {/* HERO SECTION */}
      <section className="relative rounded-3xl overflow-hidden academic-card p-8 md:p-14 border border-slate-800 flex flex-col justify-center items-center text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider font-mono">
          <Layers className="h-3.5 w-3.5" />
          <span>Academic Multimodal Affective Research Platform</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          MindSense
        </h1>

        <p className="text-lg sm:text-xl font-semibold text-brand-300 max-w-3xl">
          Understanding emotional expression through multimodal signals.
        </p>
        
        <p className="text-sm sm:text-base text-slate-300 max-w-3xl font-normal leading-relaxed">
          MindSense is a research-oriented platform exploring how text, voice and visual information can be analyzed together to study emotional expression.
        </p>

        {/* Clinical Disclaimer */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
          <Info className="h-4 w-4 text-brand-400 shrink-0" />
          <span>MindSense is an experimental research system. Emotion estimates are non-clinical computational predictions.</span>
        </div>

        {/* Hero Actions */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={onStartAnalysis}
            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            <span>Start an Analysis</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => window.location.hash = '#/how-to-use'}
            className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-800 transition"
          >
            Learn How It Works
          </button>
        </div>
      </section>

      {/* SECTION 1 — WHAT WE STUDY */}
      <section className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-widest block">
            Research Scope
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">What We Study</h2>
          <p className="text-xs text-slate-400">Exploring affective signal patterns across three fundamental human communication modalities.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="academic-card p-6 space-y-3">
            <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 w-fit">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Text</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Analyzes lexical syntax, word choice, and contextual semantic sentiment within written language.
            </p>
          </div>

          <div className="academic-card p-6 space-y-3">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit">
              <Mic className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Voice</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Evaluates speech acoustics, pitch variation, vocal prosody, and autonomic arousal signals.
            </p>
          </div>

          <div className="academic-card p-6 space-y-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit">
              <Camera className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">Visual Expression</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Observes facial micro-expressions and facial muscle movement patterns in visual frame inputs.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2 — HOW IT WORKS (4-STEP VISUAL) */}
      <section className="academic-card p-8 space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-widest block">
            System Methodology
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xl font-bold font-mono text-brand-400 block">01</span>
            <h4 className="font-bold text-white text-xs">Provide an Input</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Supply a text snippet, recorded audio sample, or facial video frame.
            </p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xl font-bold font-mono text-brand-400 block">02</span>
            <h4 className="font-bold text-white text-xs">Signal Processing</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Extract lexical embeddings, acoustic MFCC prosody, and facial ROI movement.
            </p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xl font-bold font-mono text-brand-400 block">03</span>
            <h4 className="font-bold text-white text-xs">Multimodal Analysis</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Cross-attention neural layers align available modalities with dynamic masking.
            </p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-xl font-bold font-mono text-brand-400 block">04</span>
            <h4 className="font-bold text-white text-xs">View Your Result</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Inspect 7-class emotion probabilities, confidence metrics, and signal weightings.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3 — RESEARCH */}
      <section className="academic-card p-8 border-l-4 border-indigo-500 bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest block">
            Academic Validation
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">Scientific Research & Benchmark Datasets</h2>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            MindSense supports empirical research into affective computing. Our algorithms are benchmarked against gold-standard corpora including CREMA-D, RAVDESS, FER-2013, and GoEmotions.
          </p>
        </div>

        <button
          onClick={() => window.location.hash = '#/research'}
          className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition border border-slate-700 shrink-0"
        >
          Learn About the Research
        </button>
      </section>

      {/* SECTION 4 — PARTICIPATE */}
      <section className="academic-card p-8 border-l-4 border-emerald-500 bg-emerald-950/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">
            Scientific Contribution
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">Participate in Research</h2>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Help us improve research into emotional expression by contributing optional responses and multimodal samples under strict informed consent protocol.
          </p>
        </div>

        <button
          onClick={() => window.location.hash = '#/participate'}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shrink-0 flex items-center gap-2"
        >
          <span>Participate in Research</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {/* SECTION 5 — PRIVACY */}
      <section className="academic-card p-8 space-y-4">
        <div className="flex items-center gap-2 text-brand-400">
          <BrainCircuit className="h-5 w-5" />
          <h3 className="font-bold text-white text-base">Privacy & Data Governance</h3>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-4 text-xs text-slate-300 font-sans">
          <div className="space-y-1 bg-slate-900 p-4 rounded-xl border border-slate-800">
            <strong className="text-white block font-sans">Information Collected</strong>
            <p className="text-slate-400 text-[11px]">We collect account identifiers (email/username) and optional submitted analysis text or media features.</p>
          </div>

          <div className="space-y-1 bg-slate-900 p-4 rounded-xl border border-slate-800">
            <strong className="text-white block font-sans">Data Rights & Deletion</strong>
            <p className="text-slate-400 text-[11px]">You can export your complete history in JSON or permanently purge your account via Settings (`/settings`).</p>
          </div>
        </div>
      </section>

      {/* 4. SMART PERSONALIZATION BANNER */}
      {(currentUser || recentAnalysis) && (
        <section className="academic-card p-5 border-brand-500/30 bg-slate-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Sparkles className="h-4 w-4 text-brand-400" />
              <span>Welcome back, {currentUser ? currentUser.name : 'Researcher'}!</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {recentAnalysis 
                ? `Your last analysis detected ${recentAnalysis.emotion} with ${(recentAnalysis.confidence * 100).toFixed(1)}% confidence.` 
                : 'Ready to perform your next multimodal affect evaluation?'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {recentAnalysis && (
              <button
                onClick={() => onNavigate('insights', 'history')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 transition"
              >
                View Last Results
              </button>
            )}
            <button
              onClick={onStartAnalysis}
              className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow transition"
            >
              Continue Analysis
            </button>
          </div>
        </section>
      )}

      {/* 3. HOMEPAGE QUICK START */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block mb-0.5">
              Quick Orientation
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">Get Started in Minutes</h2>
          </div>
          <button
            onClick={onOpenHelp}
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1"
          >
            <span>Full User Guide</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={onStartAnalysis}
            className="academic-card p-5 text-left hover:border-brand-500/40 transition group space-y-3"
          >
            <div className="h-8 w-8 rounded-lg bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold text-xs font-mono">
              1
            </div>
            <h3 className="font-bold text-white text-xs sm:text-sm group-hover:text-brand-300 transition">
              1. Start an Analysis
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Combine text, speech audio, or facial webcam captures into the live studio.
            </p>
          </button>

          <button
            onClick={() => onNavigate('insights', 'history')}
            className="academic-card p-5 text-left hover:border-brand-500/40 transition group space-y-3"
          >
            <div className="h-8 w-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-xs font-mono">
              2
            </div>
            <h3 className="font-bold text-white text-xs sm:text-sm group-hover:text-brand-300 transition">
              2. Explore Your Results
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Inspect estimated emotion classifications, Softmax confidence, and probability curves.
            </p>
          </button>

          <button
            onClick={() => onNavigate('insights', 'trends')}
            className="academic-card p-5 text-left hover:border-brand-500/40 transition group space-y-3"
          >
            <div className="h-8 w-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs font-mono">
              3
            </div>
            <h3 className="font-bold text-white text-xs sm:text-sm group-hover:text-brand-300 transition">
              3. View Longitudinal Trends
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Track longitudinal affect variability and self-reported somatic check-in scores.
            </p>
          </button>

          <button
            onClick={() => onNavigate('research', 'architecture')}
            className="academic-card p-5 text-left hover:border-brand-500/40 transition group space-y-3"
          >
            <div className="h-8 w-8 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-xs font-mono">
              4
            </div>
            <h3 className="font-bold text-white text-xs sm:text-sm group-hover:text-brand-300 transition">
              4. Learn How the Model Works
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Examine cross-attention weights, ablation benchmark gains, and dataset isolation rules.
            </p>
          </button>
        </div>
      </section>

      {/* 5. HOW IT WORKS: PIPELINE */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">
            Architecture Pipeline
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">Tri-Modal Sensor Ingestion</h2>
          <p className="text-xs text-slate-400">
            Text NLP, Speech Audio, and Facial Vision streams processed via Intermediate Cross-Attention Transformer.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="academic-card p-6 space-y-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">1. Text Semantic NLP</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates lexical polarity, conversational sentiment, and syntax tokens via embedding layers and 1D convolution.
            </p>
          </div>

          <div className="academic-card p-6 space-y-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
              <Mic className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">2. Speech Acoustics (SER)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Extracts 13 Mel-Frequency Cepstral Coefficients (MFCCs) at 16kHz to capture pitch, cadence, and vocal strain.
            </p>
          </div>

          <div className="academic-card p-6 space-y-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit">
              <Camera className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">3. Facial Vision CNN</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Crops facial bounding boxes to 48x48 matrices, evaluated via deep CNN kernels for micro-expression movements.
            </p>
          </div>
        </div>
      </section>

      {/* 6. WHAT YOU CAN DO */}
      <section className="space-y-6">
        <div className="border-b border-slate-800 pb-2">
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block mb-0.5">
            Platform Capabilities
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight">What You Can Do on MindSense</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="academic-card p-6 space-y-3 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20 shrink-0">
              <Activity className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm sm:text-base">Multimodal Affect Analysis</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Run single-modality or synchronized tri-modal classifications. Upload text, audio recordings, or facial photos for real-time Softmax distribution outputs.
              </p>
              <button
                onClick={onStartAnalysis}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold pt-1 inline-flex items-center gap-1"
              >
                <span>Launch Analysis</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="academic-card p-6 space-y-3 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm sm:text-base">Track Longitudinal Insights</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review historical inference logs, track daily mood check-ins (1–5 scale), and keep private qualitative reflection journals over time.
              </p>
              <button
                onClick={() => onNavigate('insights', 'trends')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold pt-1 inline-flex items-center gap-1"
              >
                <span>View Insights</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="academic-card p-6 space-y-3 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm sm:text-base">Inspect Neural Methodology</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Explore empirical benchmark ablation metrics across CREMA-D, RAVDESS, FER-2013, and GoEmotions with detailed model card documentation.
              </p>
              <button
                onClick={() => onNavigate('research', 'overview')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold pt-1 inline-flex items-center gap-1"
              >
                <span>Explore Research</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="academic-card p-6 space-y-3 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-sm sm:text-base">Educational Resources & Case Studies</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Read peer-reviewed literature summaries, examine edge-case modality failure modes (sarcasm, suppressed facial expressions), and practice grounding.
              </p>
              <button
                onClick={() => onNavigate('resources', 'publications')}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold pt-1 inline-flex items-center gap-1"
              >
                <span>Browse Resources</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. WEBSITE STATISTICS (REAL METRICS) */}
      <VisitorStats />

      {/* 8. RESEARCH CREDIBILITY */}
      <section className="academic-card p-6 md:p-8 space-y-4">
        <span className="text-xs font-bold text-brand-400 uppercase tracking-wider block">
          Core Technical Distinction
        </span>
        <h3 className="text-xl font-bold text-white">Why Intermediate Cross-Attention Matters</h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Single-modality algorithms fail when users use sarcasm or conceal facial expressions. Rather than Early Fusion (feature concatenation) or Late Fusion (independent score averaging), MindSense computes dynamic cross-modal attention matrices with availability masking to prevent false zero-biasing.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-800 text-xs">
          <div>
            <span className="font-mono text-white font-bold block text-sm">79.5% Test Acc</span>
            <span className="text-[11px] text-slate-400">Fused Tri-Modal Score</span>
          </div>
          <div>
            <span className="font-mono text-emerald-400 font-bold block text-sm">+18.3% Gain</span>
            <span className="text-[11px] text-slate-400">Over Unimodal Baseline</span>
          </div>
          <div>
            <span className="font-mono text-brand-400 font-bold block text-sm">4 Academic Corpora</span>
            <span className="text-[11px] text-slate-400">CREMA-D, RAVDESS, FER, GoEmotions</span>
          </div>
          <div>
            <span className="font-mono text-indigo-400 font-bold block text-sm">Zero Persistence</span>
            <span className="text-[11px] text-slate-400">Local Volatile Biometric Processing</span>
          </div>
        </div>
      </section>

      {/* 9. HOW TO USE WALKTHROUGH PREVIEW */}
      <section className="academic-card p-6 md:p-8 space-y-4 border-brand-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block mb-0.5">
              User Guidance
            </span>
            <h3 className="text-lg font-bold text-white">How to Use MindSense Step-by-Step</h3>
          </div>

          <button
            onClick={onOpenHelp}
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs uppercase tracking-wider transition shadow"
          >
            Open Full Guide
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-brand-400 font-mono font-bold block">STEP 1–2</span>
            <h4 className="font-bold text-white">Choose Modalities</h4>
            <p className="text-[11px] text-slate-400">Select any combination of text, microphone audio, or facial webcam photo.</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-brand-400 font-mono font-bold block">STEP 3–5</span>
            <h4 className="font-bold text-white">Execute & Inspect</h4>
            <p className="text-[11px] text-slate-400">Run cross-attention ingestion and review confidence logits and affect curves.</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-brand-400 font-mono font-bold block">STEP 6–7</span>
            <h4 className="font-bold text-white">Track Trends & Research</h4>
            <p className="text-[11px] text-slate-400">Log longitudinal reflections and explore benchmark dataset ablation studies.</p>
          </div>
        </div>
      </section>

      {/* 10. SAFETY & LIMITATIONS */}
      <section className="p-6 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-3">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
          <ShieldAlert className="h-4.5 w-4.5 text-amber-400 shrink-0" />
          <span>Research Advisory & Clinical Boundaries</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          MindSense is designed strictly for academic affective computing research and longitudinal self-reflection. It does not diagnose psychiatric or medical conditions. For immediate crisis support, contact the 24/7 Lifeline at <strong>988</strong> (US/Canada) or visit findahelpline.com.
        </p>
      </section>

      {/* 11. FAQ ACCORDION */}
      <section className="space-y-4">
        <div className="border-b border-slate-800 pb-2">
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block mb-0.5">
            Common Questions
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="academic-card p-4 hover:border-slate-700 transition space-y-2 cursor-pointer"
                onClick={() => setOpenFaq(isOpen ? null : idx)}
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xs sm:text-sm font-bold text-white">{faq.q}</h4>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-brand-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />}
                </div>
                {isOpen && (
                  <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80 animate-fadeIn">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 12. FEEDBACK */}
      <FeedbackWidget currentUser={currentUser} />

    </div>
  );
};
