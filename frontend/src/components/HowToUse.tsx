import React from 'react';
import { 
  ArrowRight, 
  Info,
  HelpCircle
} from 'lucide-react';

interface HowToUseProps {
  onStartAnalysis: () => void;
  onExploreResearch: () => void;
}

export const HowToUse: React.FC<HowToUseProps> = ({
  onStartAnalysis,
  onExploreResearch
}) => {
  const steps = [
    {
      num: 1,
      title: "Select Session Mode",
      desc: "Use the platform anonymously in guest mode, or register a free local research account to persist longitudinal trends across sessions.",
      badge: "Account / Guest"
    },
    {
      num: 2,
      title: "Choose Input Modalities",
      desc: "Select any combination of Text (typed statement), Audio (microphone or .wav file), and Vision (webcam capture or facial image). MindSense dynamically fuses whatever modalities you provide.",
      badge: "Tri-Modal Pipeline"
    },
    {
      num: 3,
      title: "Prepare Your Input",
      desc: "Type a statement, record 3–5 seconds of continuous speech, or capture a clear frontal webcam image under reasonable lighting.",
      badge: "Sensor Ingestion"
    },
    {
      num: 4,
      title: "Execute Cross-Attention Ingestion",
      desc: "Click 'Execute Intermediate Cross-Attention Analysis'. The neural pipeline projects 64-dimensional feature representations and applies dynamic availability masking.",
      badge: "Inference"
    },
    {
      num: 5,
      title: "Inspect Results & Probability Distribution",
      desc: "Review the estimated dominant emotional state, model confidence score, and full probability distribution across 7 affect classes.",
      badge: "Output Logits"
    },
    {
      num: 6,
      title: "Track Longitudinal Insights",
      desc: "Check the Insights section to review your historical timeline, self-reported daily wellness indices (1–5 scale), and private journal reflections.",
      badge: "Longitudinal Trends"
    },
    {
      num: 7,
      title: "Examine Research & Ablation Studies",
      desc: "Explore the Research section to inspect validation confusion matrices, benchmark corpora (CREMA-D, RAVDESS, FER-2013), and cross-attention weight distributions.",
      badge: "Methodology"
    }
  ];

  return (
    <div className="space-y-12 py-2 max-w-5xl mx-auto font-sans">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>User Guide & Operational Framework</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          How to Use MindSense
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          A step-by-step walkthrough of input preparation, multimodal cross-attention execution, output interpretation, and longitudinal self-reflection.
        </p>
      </div>

      {/* BEFORE YOU BEGIN CALLOUT */}
      <div className="academic-card p-6 md:p-8 space-y-4 border-brand-500/30">
        <div className="flex items-center gap-2 text-brand-400 font-bold text-sm">
          <Info className="h-4.5 w-4.5" />
          <span>Before You Begin: Core Operational Principles</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <strong className="text-white block font-semibold">What the Analysis Does:</strong>
            <ul className="space-y-1 text-slate-400">
              <li>• Extracts lexical embeddings from written text.</li>
              <li>• Evaluates acoustic prosody and 13 MFCC spectral frames from speech.</li>
              <li>• Evaluates 48x48 facial matrices using 2D CNN kernels.</li>
              <li>• Projects vectors through Intermediate Cross-Attention Transformer.</li>
            </ul>
          </div>

          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <strong className="text-amber-300 block font-semibold">What the Results Do NOT Mean:</strong>
            <ul className="space-y-1 text-slate-400">
              <li>• <strong>Not a medical or psychiatric diagnosis.</strong></li>
              <li>• Confidence is a mathematical Softmax output, not a diagnostic probability.</li>
              <li>• Does not replace consultation with certified mental health clinicians.</li>
              <li>• In emergencies, call or text <strong>988</strong> immediately.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 7 NUMBERED STEPS */}
      <div className="space-y-4">
        <div className="border-b border-slate-800 pb-2">
          <h2 className="text-lg font-bold text-white">7-Step Execution Guide</h2>
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <div 
              key={step.num}
              className="academic-card p-5 flex items-start gap-4 hover:border-slate-700 transition"
            >
              <div className="h-8 w-8 rounded-lg bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-bold text-sm font-mono shrink-0">
                {step.num}
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="text-sm font-bold text-white">{step.title}</h3>
                  <span className="text-[10px] uppercase font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 w-fit">
                    {step.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <a
          href="/MindSense_How_to_Use_Rules_and_Regulations.pdf"
          download="MindSense_How_to_Use_Rules_and_Regulations.pdf"
          className="px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow flex items-center gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Download User Guide (PDF)</span>
        </a>
        <button
          onClick={onStartAnalysis}
          className="px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs uppercase tracking-wider transition shadow flex items-center gap-2"
        >
          <span>Launch Analysis Studio</span>
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={onExploreResearch}
          className="px-5 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs border border-slate-800 transition"
        >
          Read Research Methodology
        </button>
      </div>

    </div>
  );
};
