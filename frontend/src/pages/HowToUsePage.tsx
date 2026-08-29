import React from 'react';
import { 
  CheckCircle2, 
  Download, 
  HelpCircle, 
  AlertCircle, 
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

interface HowToUsePageProps {
  onBack: () => void;
  onStartAnalysis: () => void;
}

export const HowToUsePage: React.FC<HowToUsePageProps> = ({ onBack, onStartAnalysis }) => {
  const steps = [
    {
      num: '01',
      title: 'Open MindSense Platform',
      desc: 'Access the web application on desktop or mobile. Navigation is structured around 5 primary research pillars.'
    },
    {
      num: '02',
      title: 'Sign In (Optional)',
      desc: 'Create or sign into a local research account to save assessment history, journal reflections, and check-ins.'
    },
    {
      num: '03',
      title: 'Choose Analysis Modality',
      desc: 'Select Text, Vocal Acoustics (Audio), Facial Vision (Image), or Multimodal Fusion mode.'
    },
    {
      num: '04',
      title: 'Provide Input Data',
      desc: 'Type or paste a text statement, record 16kHz speech audio, or capture a frontal webcam photo snap.'
    },
    {
      num: '05',
      title: 'Start Analysis',
      desc: 'Execute the Intermediate Cross-Attention Transformer inference pipeline.'
    },
    {
      num: '06',
      title: 'Review Classification Results',
      desc: 'Examine the detected emotion category, Softmax confidence score, and unimodal encoder breakdown.'
    },
    {
      num: '07',
      title: 'Explore Longitudinal Insights',
      desc: 'Track emotional trends over time, log daily reflection notes, or record somatic check-ins.'
    },
    {
      num: '08',
      title: 'Explore Research & Corpora',
      desc: 'Review multi-head cross-attention schematics, CREMA-D / RAVDESS benchmark corpora, and ablation studies.'
    }
  ];

  return (
    <div className="space-y-10 max-w-5xl mx-auto font-sans">
      
      {/* Page Header */}
      <PageHeader
        title="MindSense User Guide & Operational Walkthrough"
        description="Comprehensive step-by-step guidance for executing multimodal affective inferences, interpreting confidence scores, and troubleshooting."
        onBack={onBack}
        backLabel="Back to Home"
        breadcrumbs={[
          { label: 'Home', onClick: onBack },
          { label: 'How to Use' }
        ]}
      >
        <a
          href="/MindSense_How_to_Use_Rules_and_Regulations.pdf"
          download="MindSense_How_to_Use_Rules_and_Regulations.pdf"
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-2 shadow transition"
        >
          <Download className="h-4 w-4" />
          <span>Download PDF Guide</span>
        </a>
      </PageHeader>

      {/* NON-MEDICAL CALLOUT */}
      <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white block">Important Research & Wellness Disclaimer</span>
          <p className="leading-relaxed">
            MindSense is an academic affective computing research and wellness self-reflection platform. It is <strong>NOT a medical diagnostic system</strong> and does not provide psychiatric or clinical diagnoses.
          </p>
        </div>
      </div>

      {/* 8-STEP VISUAL WALKTHROUGH */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>01 — 8-Step Visual Operational Walkthrough</span>
        </h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {steps.map((st) => (
            <div key={st.num} className="academic-card p-5 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-extrabold text-brand-400">{st.num}</span>
                <h3 className="font-bold text-white text-sm leading-snug">{st.title}</h3>
                <p className="text-slate-400 text-[11px] leading-relaxed">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILED EXPLANATORY CARDS */}
      <div className="grid md:grid-cols-2 gap-6 text-xs">
        
        {/* WHAT YOU NEED */}
        <div className="academic-card p-6 space-y-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
            <span>What You Need to Run an Analysis</span>
          </h3>
          <ul className="space-y-2 text-slate-300 leading-relaxed text-[11px]">
            <li>• <strong>Modern Web Browser:</strong> Chrome, Edge, Safari, or Firefox with HTML5 audio/webcam media support.</li>
            <li>• <strong>Input Data:</strong> At least one active input stream (text reflection, spoken audio clip, or webcam image).</li>
            <li>• <strong>Microphone / Camera Permissions:</strong> Explicitly grant browser access when recording speech or capturing photos.</li>
          </ul>
        </div>

        {/* UNDERSTANDING CONFIDENCE */}
        <div className="academic-card p-6 space-y-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Info className="h-4.5 w-4.5 text-brand-400" />
            <span>Understanding Your Prediction & Confidence</span>
          </h3>
          <ul className="space-y-2 text-slate-300 leading-relaxed text-[11px]">
            <li>• <strong>Softmax Probability:</strong> The confidence score (e.g. 84%) represents mathematical model certainty relative to 7 affect classes.</li>
            <li>• <strong>Cross-Attention Fusion:</strong> Combining modalities aligns feature vectors (e.g. text semantics contextualizing vocal tone).</li>
            <li>• <strong>Not Severity:</strong> High confidence means strong pattern alignment with benchmark training corpora, not emotional intensity or clinical risk.</li>
          </ul>
        </div>

        {/* WHAT MINDSENSE CANNOT TELL YOU */}
        <div className="academic-card p-6 space-y-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-amber-400" />
            <span>What MindSense Cannot Tell You</span>
          </h3>
          <ul className="space-y-2 text-slate-300 leading-relaxed text-[11px]">
            <li>• <strong>Cannot Provide Clinical Diagnosis:</strong> MindSense cannot diagnose depression, anxiety disorders, or psychiatric conditions.</li>
            <li>• <strong>Cannot Infer Intent or Deception:</strong> AI affect estimation evaluates signal patterns, not truthfulness or medical state.</li>
            <li>• <strong>Cannot Replace Professional Care:</strong> Always consult licensed mental health professionals for medical concerns.</li>
          </ul>
        </div>

        {/* TROUBLESHOOTING */}
        <div className="academic-card p-6 space-y-3">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <HelpCircle className="h-4.5 w-4.5 text-indigo-400" />
            <span>Common Troubleshooting Solutions</span>
          </h3>
          <ul className="space-y-2 text-slate-300 leading-relaxed text-[11px]">
            <li>• <strong>Microphone / Webcam Permission Denied:</strong> Reset permissions in your browser address bar settings.</li>
            <li>• <strong>Audio Upload Failed:</strong> Ensure audio files are uncompressed 16kHz WAV format.</li>
            <li>• <strong>No Face Detected:</strong> Provide a clear, well-lit frontal face image without heavy facial occlusion.</li>
          </ul>
        </div>

      </div>

      {/* START ANALYSIS CTA FOOTER */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-white">Ready to Run a Research Analysis?</h3>
          <p className="text-xs text-slate-400">Launch the Live Analysis Studio to evaluate text, speech acoustics, or facial expressions.</p>
        </div>
        <button
          onClick={onStartAnalysis}
          className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs uppercase tracking-wider transition shadow flex items-center gap-2"
        >
          <span>Start Analysis</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
};
