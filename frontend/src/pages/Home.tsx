import { 
  ArrowRight, 
  MessageSquare, 
  Mic, 
  Camera, 
  Brain, 
  HeartHandshake
} from 'lucide-react';

interface HomeProps {
  onStartAnalysis: () => void;
  onLearnMore: () => void;
}

export const Home: React.FC<HomeProps> = ({ onStartAnalysis, onLearnMore }) => {
  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden glass-panel p-8 md:p-16 border border-slate-800/80 flex flex-col justify-center items-center text-center space-y-6">
        {/* Abstract glowing background shapes */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider">
          <Brain className="h-3.5 w-3.5" /> Next-Gen Emotional Analysis
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white max-w-4xl leading-tight font-sans">
          Understand Emotions Through <span className="text-gradient">Multimodal AI</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl font-light">
          Deep learning models fusing signals from written text, voice acoustics, and facial micro-expressions to construct deep emotional and mental-wellness insights.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 pt-4 z-10">
          <button
            onClick={onStartAnalysis}
            className="px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25 hover:shadow-brand-500/35 hover:-translate-y-0.5"
          >
            Start Analysis
            <ArrowRight className="h-5 w-5" />
          </button>
          
          <button
            onClick={onLearnMore}
            className="px-8 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700/80 transition-all duration-300 hover:-translate-y-0.5"
          >
            Learn How It Works
          </button>
        </div>
      </section>

      {/* Support Modalities Section */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-white">Supported Modalities</h2>
          <p className="text-slate-400">MindSense processes each input stream independently before performing unified feature-level attention fusion.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {/* Text Modality */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-4 transition-all duration-300">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">1. Written Text</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Analyzes emotional cues, semantic content, and vocabulary indices using a localized Text Embedding network that extracts valence weights from thoughts or journal entries.
            </p>
          </div>

          {/* Audio Modality */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-4 transition-all duration-300">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit">
              <Mic className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">2. Voice Acoustics</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Extracts 13 Mel-Frequency Cepstral Coefficients (MFCCs) over overlapping frames. Analyzes prosody, amplitude variance, and speech pacing via a 1D Convolutional Network.
            </p>
          </div>

          {/* Image Modality */}
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-4 transition-all duration-300">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl w-fit">
              <Camera className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">3. Facial Expression</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Detects, crops, and normalizes faces using OpenCV Haar Cascades, passing grayscale facial micro-expressions through a 2D convolutional model to capture visual emotional states.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Workflow Section */}
      <section className="glass-panel p-8 md:p-12 rounded-3xl border border-slate-800 space-y-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center">The Multimodal Fusion Workflow</h2>
        
        <div className="grid md:grid-cols-4 gap-6 relative">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="bg-brand-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md shadow-brand-600/20">1</div>
            <h4 className="font-semibold text-slate-200">Input Data Capture</h4>
            <p className="text-xs text-slate-400">Record voice, type feelings, or capture a webcam photo in the secure workspace.</p>
          </div>
          
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="bg-brand-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md shadow-brand-600/20">2</div>
            <h4 className="font-semibold text-slate-200">Preprocessing & Encoding</h4>
            <p className="text-xs text-slate-400">Signals are filtered, faces are cropped, and individual unimodal feature embeddings are generated.</p>
          </div>

          <div className="flex flex-col items-center text-center space-y-3">
            <div className="bg-brand-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md shadow-brand-600/20">3</div>
            <h4 className="font-semibold text-slate-200">Cross-Modal Attention</h4>
            <p className="text-xs text-slate-400">Modality sequences pass through the Fusion Transformer, dynamically masking missing inputs.</p>
          </div>

          <div className="flex flex-col items-center text-center space-y-3">
            <div className="bg-brand-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-md shadow-brand-600/20">4</div>
            <h4 className="font-semibold text-slate-200">Wellness Predictions</h4>
            <p className="text-xs text-slate-400">View final confidence classifications, comparative breakdowns, and trends over time.</p>
          </div>
        </div>
      </section>

      {/* Tech stack badges */}
      <section className="space-y-4">
        <h3 className="text-center text-xs font-semibold text-slate-500 uppercase tracking-widest">Powered by Research-Grade Technology</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {['Natural Language Processing', 'Speech Emotion Recognition', 'Computer Vision Face-crop', 'Multi-head Attention', 'PyTorch CNN Encoders', 'Intermediate Feature Fusion', 'SQLite Historic Analytics'].map((tech) => (
            <span key={tech} className="px-3.5 py-1.5 rounded-lg bg-slate-800/40 text-slate-300 text-xs font-medium border border-slate-700/30">
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* Safety Notice Footer */}
      <section className="border-t border-slate-800/80 pt-8 flex items-center gap-4 text-slate-500 text-xs leading-relaxed max-w-3xl mx-auto">
        <HeartHandshake className="h-8 w-8 text-brand-400 shrink-0" />
        <p>
          <span className="font-semibold text-slate-400">Wellness Advisory:</span> This application is an AI research and wellness monitoring tool. It is not intended for medical diagnostics, clinical assessments, or crisis counseling. If you are experiencing prolonged stress or distress, please reach out to qualified healthcare providers.
        </p>
      </section>
    </div>
  );
};
