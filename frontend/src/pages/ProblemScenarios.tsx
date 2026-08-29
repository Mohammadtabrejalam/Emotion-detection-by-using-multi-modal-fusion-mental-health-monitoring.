import React from 'react';
import { 
  AlertTriangle, 
  Play, 
  FileText, 
  Mic, 
  Camera, 
  Layers
} from 'lucide-react';

interface ProblemScenariosProps {
  onLoadScenario: (text: string, title: string) => void;
}

export const ProblemScenarios: React.FC<ProblemScenariosProps> = ({ onLoadScenario }) => {
  const scenarios = [
    {
      id: 'sarcasm',
      title: '1. Sarcasm & Irony Inversion',
      badge: 'Unimodal Lexical Failure',
      badgeColor: 'border-red-500/30 text-red-300 bg-red-500/10',
      text: 'Oh wonderful, the server crashed right before the final presentation. Just what I needed.',
      unimodalText: 'Joy / Positive Valence (Triggered by words "wonderful", "needed")',
      audioVisualReality: 'Acoustic pitch exhibits low monotone drag; facial eyebrow muscles furrowed in frustration.',
      fusedOutcome: 'Frustration / Anger (Cross-attention prioritizes acoustic prosody & facial expression over literal text).',
      whyMultimodal: 'Text models alone are deceived by positive valence keywords without acoustic speech prosody.'
    },
    {
      id: 'burnout',
      title: '2. Workplace Burnout & Concealed Distress',
      badge: 'Subjective Masking',
      badgeColor: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
      text: 'I am completely fine. Everything is totally normal and under control.',
      unimodalText: 'Neutral / Calm (Classified via reassurance word "fine")',
      audioVisualReality: 'Pitch variance < 0.5 (monotone fatigue), drooped eyelid and lowered corner-lip micro-expressions.',
      fusedOutcome: 'Exhaustion / Sadness (Cross-attention captures non-verbal somatic fatigue indicators).',
      whyMultimodal: 'Individuals habitually write "I am fine" while vocal dynamics reveal significant depletion.'
    },
    {
      id: 'panic',
      title: '3. Acute Anxiety & Panic Spikes',
      badge: 'High-Arousal Valence',
      badgeColor: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
      text: 'Did you hear that sudden noise in the building? Where is the emergency exit?',
      unimodalText: 'Curiosity / Surprise',
      audioVisualReality: 'High-frequency spectral jitter in 200 MFCC frames, widened eye aperture and elevated inner brows.',
      fusedOutcome: 'Fear / High Distress (Activates crisis safety intervention guidance).',
      whyMultimodal: 'Differentiates pleasant surprises from genuine physiological panic through spectral acoustic arousal.'
    },
    {
      id: 'pokerface',
      title: '4. Poker-Face Social Expression Suppression',
      badge: 'Vision Model Failure',
      badgeColor: 'border-blue-500/30 text-blue-300 bg-blue-500/10',
      text: 'I have been feeling overwhelmed and crying all morning, and I do not know how to get through today.',
      unimodalText: 'Sad / Distress',
      audioVisualReality: 'Subject holds an intentionally rigid neutral facial expression during video capture.',
      fusedOutcome: 'Sadness (Multimodal Attention masks neutral facial poker-face and weights semantic text).',
      whyMultimodal: 'Prevents false-negative errors when subjects actively suppress facial expression in front of a camera.'
    }
  ];

  return (
    <div className="space-y-10 py-2 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-2 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          <span>Real-World Dilemmas & Empirical Case Studies</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Why Multimodal AI Is Critical
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
          Examine classic scenarios where single-modality systems fail and test how Intermediate Cross-Attention resolves contradictory signals.
        </p>
      </div>

      {/* Grid of Scenarios */}
      <div className="grid md:grid-cols-2 gap-6">
        {scenarios.map((sc) => (
          <div key={sc.id} className="academic-card p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3.5">
              
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${sc.badgeColor}`}>
                  {sc.badge}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Case #{sc.id}</span>
              </div>

              <h3 className="text-lg font-bold text-white">{sc.title}</h3>

              {/* Input Transcript */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="h-3 w-3 text-indigo-400" /> Transcript Statement
                </span>
                <p className="text-xs text-slate-200 italic font-serif">&ldquo;{sc.text}&rdquo;</p>
              </div>

              {/* Comparison Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 space-y-0.5">
                  <strong className="block text-[11px] text-red-400 font-semibold">Unimodal Text Model Misclassification:</strong>
                  <p className="text-[11px]">{sc.unimodalText}</p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 space-y-0.5">
                  <strong className="block text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                    <Mic className="h-3 w-3 text-emerald-400" /> & <Camera className="h-3 w-3 text-blue-400" /> Non-Verbal Modalities:
                  </strong>
                  <p className="text-[11px] text-slate-400">{sc.audioVisualReality}</p>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-0.5">
                  <strong className="block text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Layers className="h-3 w-3" /> Fused Multimodal Assessment:
                  </strong>
                  <p className="text-[11px] font-semibold">{sc.fusedOutcome}</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed italic pt-1">
                {sc.whyMultimodal}
              </p>

            </div>

            <button
              onClick={() => onLoadScenario(sc.text, sc.title)}
              className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow transition mt-2"
            >
              <Play className="h-3.5 w-3.5" />
              <span>Load Prompt into Live Studio</span>
            </button>

          </div>
        ))}
      </div>

    </div>
  );
};
