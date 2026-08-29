import React from 'react';
import { 
  ArrowRight, 
  FileText, 
  Mic, 
  Camera, 
  Layers
} from 'lucide-react';

interface HomeProps {
  onStartAnalysis: () => void;
  onLearnMore: () => void;
}

export const Home: React.FC<HomeProps> = ({ onStartAnalysis, onLearnMore }) => {
  return (
    <div className="space-y-16 py-4 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden academic-card p-8 md:p-14 border border-slate-800 flex flex-col justify-center items-center text-center space-y-6">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider">
          <Layers className="h-3.5 w-3.5" />
          <span>Multimodal Affective Computing Initiative</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          Understand Affect & Emotional State Through <br />
          <span className="text-gradient">Multimodal Cross-Attention AI</span>
        </h1>
        
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-normal leading-relaxed">
          Deep learning models fusing signals from written text, acoustic speech prosody, and facial micro-expressions to construct robust emotional and mental-wellness insights.
        </p>
        
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={onStartAnalysis}
            className="px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs tracking-wide uppercase transition shadow flex items-center justify-center gap-2"
          >
            <span>Launch Live Analysis</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={onLearnMore}
            className="px-5 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
          >
            Learn How It Works
          </button>
        </div>
      </section>

      {/* Supported Modalities Section */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Tri-Modal Pipeline</span>
          <h2 className="text-2xl font-bold tracking-tight text-white">Synchronized Modalities</h2>
          <p className="text-xs text-slate-400">MindSense processes each input stream independently before performing unified feature-level attention fusion.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="academic-card p-6 space-y-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
              <FileText className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">1. NLP Text Encoder</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tokenizes input text into a 64-dimensional Word Embedding with 1D Convolutional Neural Networks and adaptive pooling.
            </p>
          </div>

          <div className="academic-card p-6 space-y-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
              <Mic className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">2. Speech Acoustics (SER)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Processes 16kHz mono audio into 13 MFCC frames to evaluate vocal prosody, pitch, and acoustic energy variations.
            </p>
          </div>

          <div className="academic-card p-6 space-y-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit">
              <Camera className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">3. Facial Vision CNN</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Aligns face bounding boxes and crops to 48x48 grayscale matrices, evaluated via 2D CNN layers to identify micro-expressions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
