import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ArrowRight, 
  ChevronDown, 
  Sun, 
  Moon, 
  Wind, 
  Apple,
  HelpCircle,
  Activity
} from 'lucide-react';

interface HomeHealthAndAboutProps {
  onNavigateArticles: () => void;
  onNavigateNotes: () => void;
  onNavigateAwareness: () => void;
}

const HEALTH_ARTICLES = [
  {
    id: 1,
    title: 'The Gut-Brain Axis: Nutritional Modulation of Neurotransmitters',
    category: 'Nutrition & Biology',
    readTime: '4 min read',
    icon: Apple,
    summary: 'Over 90% of peripheral serotonin is synthesized in the gastrointestinal microbiome. Whole foods, prebiotic fibers, and magnesium sources directly influence affective volatility.',
    tips: ['Incorporate fermented probiotics', 'Omega-3 fatty acids', 'Attenuate refined glycemic spikes']
  },
  {
    id: 2,
    title: 'Vagus Nerve Stimulation: Activating Parasympathetic Autonomic Calm',
    category: 'Neuroscience & Calm',
    readTime: '3 min read',
    icon: Wind,
    summary: 'The vagus nerve constitutes the bidirectional pathway between brainstem and cardiovascular centers. Prolonged diaphragmatic exhalations trigger rapid physiological calm.',
    tips: ['Extended exhale ratio (4s in, 6s out)', 'Facial cold water immersion', 'Vocal humming resonance']
  },
  {
    id: 3,
    title: 'Circadian Sleep Hygiene: Attenuating Morning Cortisol Spikes',
    category: 'Sleep & Recovery',
    readTime: '4 min read',
    icon: Moon,
    summary: 'Slow-wave and REM sleep cycles defragment emotional tension and reset prefrontal-amygdala connectivity before subsequent waking cycles.',
    tips: ['Early morning natural lux exposure', 'Filter blue spectra 1 hr pre-sleep', 'Ambient temperature at ~19°C (66°F)']
  },
  {
    id: 4,
    title: 'Digital Ergonomics: Mitigating Continuous Cognitive Fatigue',
    category: 'Workplace Wellness',
    readTime: '3 min read',
    icon: Sun,
    summary: 'Frequent context-switching sustains elevated sympathetic tone. Structuring visual rest intervals and scheduled disconnection windows restores focus.',
    tips: ['20-20-20 visual rest rule', 'Batch notification checks', 'Daily 10-minute restorative walk']
  }
];

const FAQS = [
  {
    q: 'How does MindSense achieve 79.5% accuracy compared to unimodal baselines?',
    a: 'Single-modality tools only observe one sensory channel and fail when users employ sarcasm or suppress visible expressions. MindSense combines three independent neural networks—Text NLP, Speech Acoustics (13 MFCCs), and Facial Vision (48x48 CNN)—through an Intermediate Cross-Attention Transformer that weights active signals dynamically.'
  },
  {
    q: 'Is raw webcam video or microphone audio saved to permanent disk?',
    a: 'No. All image matrices and audio buffers are processed exclusively in volatile temporary memory and purged immediately post-inference. Only mathematical classification probabilities and private user notes are retained locally in your SQLite database.'
  },
  {
    q: 'Can MindSense diagnose clinical psychiatric disorders?',
    a: 'No. MindSense is an affective computing research and wellness monitoring system designed for empirical study and self-reflection. It does not provide medical or psychiatric diagnosis or substitute for licensed clinical care.'
  },
  {
    q: 'How are missing input modalities handled by the fusion network?',
    a: 'The cross-attention layer applies dynamic boolean padding masks with -∞ values to exclude inactive sensors, ensuring that unprovided modalities do not introduce misleading zero-vector artifacts into the attention matrix.'
  }
];

export const HomeHealthAndAbout: React.FC<HomeHealthAndAboutProps> = ({
  onNavigateArticles,
  onNavigateNotes,
  onNavigateAwareness
}) => {
  // Self-Care Checklist state
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    water: true,
    breathe: false,
    walk: false,
    notes: false,
    disconnect: false
  });

  const toggleTask = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // FAQ open states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="space-y-16 py-12 max-w-6xl mx-auto">
      
      {/* 1. CURATED RESEARCH PERSPECTIVES & WELLNESS ARTICLES */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block mb-1">
              Evidence-Based Literature
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Affective Biology & Neurological Insights
            </h2>
          </div>
          <button
            onClick={onNavigateArticles}
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View All Publications</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HEALTH_ARTICLES.map((art) => {
            const Icon = art.icon;
            return (
              <div key={art.id} className="academic-card p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{art.readTime}</span>
                  </div>

                  <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider block">
                    {art.category}
                  </span>

                  <h3 className="text-sm font-bold text-white leading-snug">
                    {art.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {art.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Protocols</span>
                  <ul className="text-[11px] text-slate-300 space-y-0.5">
                    {art.tips.slice(0, 2).map((t, idx) => (
                      <li key={idx} className="truncate">• {t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. INTERACTIVE DAILY SELF-CARE CHECKLIST & GROUNDING PROMPT */}
      <section className="grid lg:grid-cols-12 gap-6">
        
        {/* Checklist */}
        <div className="lg:col-span-7 academic-card p-6 md:p-8 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Daily Self-Care Hygiene Protocol</h3>
              <p className="text-xs text-slate-400 mt-0.5">Evidence-based somatic and reflection benchmarks.</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-emerald-400 font-mono">{progressPercent}%</span>
              <span className="text-[10px] text-slate-500 block">Completed</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="space-y-2.5 pt-1">
            {[
              { key: 'water', label: 'Hydration: Consume 500ml of water upon waking' },
              { key: 'breathe', label: 'Respiration: 3 minutes of 4-4-4-4 Box Breathing' },
              { key: 'walk', label: 'Circadian: 15 minutes of outdoor daylight exposure' },
              { key: 'notes', label: 'Reflection: Log qualitative thoughts in Daily Journal' },
              { key: 'disconnect', label: 'Ergonomics: 30 minutes of screen-free digital rest' }
            ].map((item) => (
              <label 
                key={item.key}
                onClick={() => toggleTask(item.key)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer select-none transition ${
                  checklist[item.key]
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-200'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className={`h-4 w-4 rounded border flex items-center justify-center transition ${
                  checklist[item.key] 
                    ? 'bg-emerald-600 border-emerald-500 text-white' 
                    : 'border-slate-700 bg-slate-950'
                }`}>
                  {checklist[item.key] && <CheckCircle2 className="h-3 w-3" />}
                </div>
                <span className={checklist[item.key] ? 'line-through text-slate-400' : ''}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Grounding & Journal CTA */}
        <div className="lg:col-span-5 academic-card p-6 md:p-8 space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[10px] font-semibold uppercase tracking-wider">
              <Activity className="h-3 w-3" />
              <span>Somatic Grounding</span>
            </div>

            <h3 className="text-base font-bold text-white">5-4-3-2-1 Sensory Grounding Tool</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When encountering sudden cognitive hyper-arousal or dissociation, deploy our interactive sensory stepper to restore physiological equilibrium.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={onNavigateAwareness}
              className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow flex items-center justify-center gap-1.5"
            >
              <span>Launch Grounding Stepper</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onNavigateNotes}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
            >
              Open Daily Notes Journal
            </button>
          </div>
        </div>

      </section>

      {/* 3. STRUCTURED FREQUENTLY ASKED QUESTIONS */}
      <section className="space-y-6">
        <div className="border-b border-slate-800 pb-3">
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block mb-1">
            System FAQs
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Frequently Asked Research Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="academic-card overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4"
                >
                  <span className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-brand-400 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-400' : ''}`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};
