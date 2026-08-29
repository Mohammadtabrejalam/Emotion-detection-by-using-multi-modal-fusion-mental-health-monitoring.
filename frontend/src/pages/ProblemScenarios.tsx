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
      badge: 'Unimodal NLP Failure',
      badgeColor: 'border-red-500/30 text-red-300 bg-red-500/10',
      text: 'Oh wonderful, the server crashed right before the final presentation. Just what I needed.',
      unimodalText: 'Happy / Joy (due to words "wonderful", "needed")',
      audioVisualReality: 'Voice exhibits low pitch monotonic drag; facial brows furrowed in annoyance.',
      fusedOutcome: 'Angry / Frustrated (Attention correctly weighs vocal prosody & facial expression over literal text).',
      whyMultimodal: 'Text models alone are blinded by positive valence keywords without speech inflection.'
    },
    {
      id: 'burnout',
      title: '2. Workplace Burnout & Concealed Distress',
      badge: 'Subjective Masking',
      badgeColor: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
      text: 'I am completely fine. Everything is totally normal and under control.',
      unimodalText: 'Neutral / Calm (due to word "fine")',
      audioVisualReality: 'Acoustic pitch standard deviation < 0.5 (monotone fatigue), drooped eyelid micro-expression.',
      fusedOutcome: 'Sadness / Exhaustion (Cross-attention captures non-verbal somatic fatigue).',
      whyMultimodal: 'Employees habitually write "I am fine" while their vocal acoustics betray severe depletion.'
    },
    {
      id: 'panic',
      title: '3. Acute Anxiety & Panic Spike',
      badge: 'High Arousal Distress',
      badgeColor: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
      text: 'Did you hear that sudden noise in the building? Where is the emergency exit?',
      unimodalText: 'Surprise / Curiosity',
      audioVisualReality: 'High-frequency spectral tremor in 200 MFCC frames, widened eye aperture and elevated inner brows.',
      fusedOutcome: 'Fear / High Distress (Activates crisis safety wellness guidance).',
      whyMultimodal: 'Differentiates pleasant surprises from genuine panic through physiological acoustic arousal.'
    },
    {
      id: 'pokerface',
      title: '4. Poker-Face Social Suppression',
      badge: 'Vision Model Failure',
      badgeColor: 'border-blue-500/30 text-blue-300 bg-blue-500/10',
      text: 'I have been crying all morning and I do not know how to get through today.',
      unimodalText: 'Sad / Hopeless',
      audioVisualReality: 'Subject holds an intentionally rigid neutral facial expression during video capture.',
      fusedOutcome: 'Sadness (Multimodal Attention masks out neutral facial poker-face and weights semantic text).',
      whyMultimodal: 'Prevents false-negative errors when subjects actively suppress facial emotion in front of a camera.'
    }
  ];

  return (
    <div className="space-y-12 py-4 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Real-World Problem Scenarios
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Why Multimodal AI Is Critical
        </h2>
        <p className="text-slate-400 text-sm">
          Examine real-world dilemmas where single-modality systems fail and test how Cross-Attention Fusion deciphers the true underlying state.
        </p>
      </div>

      {/* Grid of Scenarios */}
      <div className="grid md:grid-cols-2 gap-8">
        {scenarios.map((sc) => (
          <div key={sc.id} className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between hover:border-slate-700 transition shadow-xl">
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${sc.badgeColor}`}>
                  {sc.badge}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Case #{sc.id}</span>
              </div>

              <h3 className="text-xl font-bold text-white">{sc.title}</h3>

              {/* Text Snippet */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Input Statement
                </span>
                <p className="text-xs text-slate-200 italic font-serif">&ldquo;{sc.text}&rdquo;</p>
              </div>

              {/* Unimodal vs Reality Comparison */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 space-y-0.5">
                  <strong className="block text-[11px] text-red-400 font-bold">Unimodal Text-Only Mistake:</strong>
                  <p className="text-[11px]">{sc.unimodalText}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 space-y-0.5">
                  <strong className="block text-[11px] text-slate-400 font-bold flex items-center gap-1">
                    <Mic className="h-3 w-3 text-emerald-400" /> & <Camera className="h-3 w-3 text-blue-400" /> Non-Verbal Signals:
                  </strong>
                  <p className="text-[11px] text-slate-400">{sc.audioVisualReality}</p>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-0.5">
                  <strong className="block text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" /> Multimodal Fused Truth:
                  </strong>
                  <p className="text-[11px] font-semibold">{sc.fusedOutcome}</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                {sc.whyMultimodal}
              </p>

            </div>

            <button
              onClick={() => onLoadScenario(sc.text, sc.title)}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
            >
              <Play className="h-3.5 w-3.5" /> Load Case into Live Studio
            </button>

          </div>
        ))}
      </div>

    </div>
  );
};
