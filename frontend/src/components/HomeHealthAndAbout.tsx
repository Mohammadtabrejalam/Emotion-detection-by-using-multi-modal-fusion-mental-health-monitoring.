import { useState } from 'react';
import { 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Phone, 
  ChevronDown, 
  ShieldCheck, 
  Coffee, 
  Sun, 
  Moon, 
  Wind, 
  BookOpen,
  Apple
} from 'lucide-react';
import { MindSenseLogo } from './MindSenseLogo';

interface HomeHealthAndAboutProps {
  onNavigateArticles: () => void;
  onNavigateNotes: () => void;
  onNavigateAwareness: () => void;
}

const HEALTH_ARTICLES = [
  {
    id: 1,
    title: 'The Gut-Brain Axis: How Nutrition Fuels Dopamine & Serotonin',
    category: 'Nutrition & Biology',
    readTime: '4 min read',
    icon: Apple,
    color: 'emerald',
    summary: 'Over 90% of your body\'s serotonin is synthesized in the gastrointestinal tract. Discover which whole foods, prebiotic fibers, and magnesium sources directly stabilize emotional mood swings.',
    tips: ['Eat fermented foods (kefir, kimchi)', 'Incorporate Omega-3 fatty acids', 'Avoid processed sugar spikes']
  },
  {
    id: 2,
    title: 'Vagus Nerve Stimulation: Activating Your Parasympathetic Calm',
    category: 'Neuroscience & Calm',
    readTime: '3 min read',
    icon: Wind,
    color: 'indigo',
    summary: 'The vagus nerve is the superhighway between your brain and heart. Learn how slow diaphragmatic exhalations, cold water splashes, and humming trigger an instant physiological calming response.',
    tips: ['Prolong your exhale (4s in, 6s out)', 'Splash cold water on cheeks', 'Hum or sing gently']
  },
  {
    id: 3,
    title: 'Circadian Sleep Hygiene: Lowering Morning Cortisol Spikes',
    category: 'Sleep & Recovery',
    readTime: '4 min read',
    icon: Moon,
    color: 'blue',
    summary: 'REM sleep is nature\'s emotional first-aid kit. Deep slow-wave sleep defragments daily anxiety and resets prefrontal amygdala reactivity before tomorrow morning.',
    tips: ['Get morning sunlight within 30 min', 'Limit blue light 1 hr before bed', 'Keep bedroom at ~19°C (66°F)']
  },
  {
    id: 4,
    title: 'Micro-Habits to Defeat Continuous Digital Fatigue',
    category: 'Workplace Wellness',
    readTime: '3 min read',
    icon: Sun,
    color: 'amber',
    summary: 'Switching between tabs and chat notifications keeps your brain in a state of high autonomic arousal. Use the 20-20-20 rule and scheduled disconnects to restore focus.',
    tips: ['20-20-20 visual rest rule', 'Turn off non-essential notifications', 'Take a 5-min walk outside daily']
  }
];

const FAQS = [
  {
    q: 'How does MindSense achieve 79.5% accuracy compared to text-only tools?',
    a: 'Single-modality tools only see words and fail when someone uses sarcasm or suppresses emotion. MindSense combines three independent neural networks—Text NLP, Speech Acoustics (13 MFCCs), and Facial Vision (48x48 CNN)—through an Intermediate Cross-Attention Transformer that weighs every signal together.'
  },
  {
    q: 'Is my webcam photo or microphone audio saved anywhere?',
    a: 'No. All image crops and audio waveforms are processed entirely in temporary volatile RAM and deleted immediately after the mathematical emotion scores are calculated. Only numerical percentages and your private daily notes are kept locally on your device.'
  },
  {
    q: 'Can MindSense diagnose clinical depression or anxiety disorders?',
    a: 'No. MindSense is an emotional wellness and research companion designed to encourage self-reflection and daily tracking. It does not provide medical diagnosis or replace licensed therapy, psychiatry, or medical consultation.'
  },
  {
    q: 'What should I do if my wellness trends show elevated sadness or stress?',
    a: 'Consider taking a break, using the interactive 5-4-3-2-1 grounding exercise or Box Breathing pacer under the Symptoms Guide, writing your thoughts in Daily Notes, and talking to a trusted friend or healthcare professional.'
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
    <div className="space-y-24 py-12 max-w-6xl mx-auto">
      
      {/* ======================================================== */}
      {/* 1. ABOUT MINDSENSE - MISSION & PHILOSOPHY                */}
      {/* ======================================================== */}
      <section id="about-mindsense" className="glass-panel p-8 md:p-12 rounded-3xl border border-slate-800 space-y-8 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 shadow-lg shadow-brand-500/10">
              <MindSenseLogo size={48} />
            </div>
            <div>
              <span className="text-xs font-bold text-brand-400 uppercase tracking-widest block">
                About Our Project
              </span>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                Why We Built MindSense
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> 100% Privacy Focused
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 text-xs md:text-sm text-slate-300 leading-relaxed">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-400" /> Bridging the Digital Empathy Gap
            </h3>
            <p>
              In our hyper-connected digital world, humans communicate more than ever through screens, but software remains emotionally blind. A text message or video call cannot perceive the subtle strain in a voice or the fatigue behind a smile.
            </p>
            <p>
              MindSense was created to pioneer <strong>Affective Computing</strong>—giving everyday users a safe, private mirror to understand their emotional patterns and practice proactive mental wellness before chronic burnout takes hold.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-400" /> Our Four Core Principles
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-850 space-y-1">
                <strong className="text-brand-300 block font-bold">1. Proactive Self-Care</strong>
                <span className="text-slate-400 text-[11px]">Notice stress trends early before they compound.</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-850 space-y-1">
                <strong className="text-emerald-300 block font-bold">2. Absolute Privacy</strong>
                <span className="text-slate-400 text-[11px]">Zero cloud storage of voice or webcam photos.</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-850 space-y-1">
                <strong className="text-indigo-300 block font-bold">3. Multi-Sensory AI</strong>
                <span className="text-slate-400 text-[11px]">Fuse words, tone, and facial micro-cues.</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-850 space-y-1">
                <strong className="text-pink-300 block font-bold">4. Safe & Ethical</strong>
                <span className="text-slate-400 text-[11px]">Gentle non-clinical guidance with crisis safety.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. HEALTH-CONSCIOUS ARTICLES & WELLNESS INSIGHTS         */}
      {/* ======================================================== */}
      <section id="health-articles" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
              Evidence-Based Lifestyle
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Health-Conscious Articles & Daily Wellness
            </h2>
          </div>
          <button
            onClick={onNavigateArticles}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition"
          >
            Explore All Community Articles <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {HEALTH_ARTICLES.map((article) => {
            const Icon = article.icon;
            return (
              <div
                key={article.id}
                className="glass-panel glass-panel-hover p-6 md:p-7 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      {article.category}
                    </span>
                    <span className="text-[11px] text-slate-400">{article.readTime}</span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 shrink-0 mt-0.5">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white leading-snug">
                      {article.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {article.summary}
                  </p>

                  <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Key Actionable Tips:</span>
                    <ul className="text-[11px] text-slate-300 space-y-1">
                      {article.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onNavigateArticles}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition"
                  >
                    <BookOpen className="h-3.5 w-3.5 text-brand-400" /> Read Full Guide in Articles Hub
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. DAILY SELF-CARE & MENTAL HEALTH ACTION CHECKLIST     */}
      {/* ======================================================== */}
      <section id="self-care-checklist" className="glass-panel p-8 md:p-10 rounded-3xl border border-slate-800 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-bold text-brand-400 uppercase tracking-widest block mb-1">
              Interactive Daily Routine
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Daily Self-Care Action Checklist
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Check off simple sensory habits to nurture your emotional health today.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-2xl border border-slate-850">
            <div className="space-y-1 text-right">
              <span className="text-xs font-bold text-white block">{completedCount} of {totalCount} Done</span>
              <span className="text-[10px] text-brand-400 font-mono font-bold">{progressPercent}% Progress</span>
            </div>
            <div className="w-16 h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <div 
            onClick={() => toggleTask('water')}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
              checklist.water ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className={`p-2 rounded-xl mt-0.5 ${checklist.water ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              <Coffee className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <strong className="text-xs font-bold text-white block flex items-center gap-1.5">
                Hydrate Brain Cells {checklist.water && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              </strong>
              <p className="text-[11px] text-slate-400">Drink 500ml of clean water to maintain neurotransmitter flow.</p>
            </div>
          </div>

          <div 
            onClick={() => toggleTask('breathe')}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
              checklist.breathe ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className={`p-2 rounded-xl mt-0.5 ${checklist.breathe ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              <Wind className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <strong className="text-xs font-bold text-white block flex items-center gap-1.5">
                4-4-4-4 Box Breathing {checklist.breathe && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              </strong>
              <p className="text-[11px] text-slate-400">Complete 1 minute of box breathing to lower sympathetic heart-rate.</p>
            </div>
          </div>

          <div 
            onClick={() => toggleTask('walk')}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
              checklist.walk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className={`p-2 rounded-xl mt-0.5 ${checklist.walk ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              <Sun className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <strong className="text-xs font-bold text-white block flex items-center gap-1.5">
                5-Minute Fresh Air Walk {checklist.walk && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              </strong>
              <p className="text-[11px] text-slate-400">Step outside to soak natural daylight and reset ocular convergence.</p>
            </div>
          </div>

          <div 
            onClick={() => toggleTask('notes')}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
              checklist.notes ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className={`p-2 rounded-xl mt-0.5 ${checklist.notes ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <strong className="text-xs font-bold text-white block flex items-center gap-1.5">
                Log Gratitude / Note {checklist.notes && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              </strong>
              <p className="text-[11px] text-slate-400">Record one positive reflection or mood tag in Daily Notes.</p>
            </div>
          </div>

          <div 
            onClick={() => toggleTask('disconnect')}
            className={`p-4 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
              checklist.disconnect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className={`p-2 rounded-xl mt-0.5 ${checklist.disconnect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              <Moon className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <strong className="text-xs font-bold text-white block flex items-center gap-1.5">
                15-Min Evening Screen Rest {checklist.disconnect && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              </strong>
              <p className="text-[11px] text-slate-400">Disconnect from blue light 15 minutes before sleep.</p>
            </div>
          </div>

          <div 
            onClick={onNavigateNotes}
            className="p-4 rounded-2xl border border-brand-500/20 bg-brand-500/10 hover:bg-brand-500/20 transition cursor-pointer flex items-center justify-center text-center group"
          >
            <span className="text-xs font-bold text-brand-300 flex items-center gap-1.5 group-hover:translate-x-1 transition">
              Open Daily Notes Journal <ArrowRight className="h-4 w-4" />
            </span>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. FREQUENTLY ASKED QUESTIONS (FAQ)                      */}
      {/* ======================================================== */}
      <section id="faq" className="space-y-6">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">
            Help & Transparency
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx}
                className="glass-panel rounded-2xl border border-slate-800 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 text-xs md:text-sm font-bold text-white hover:text-brand-300 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-400' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. 24/7 CRISIS & GLOBAL SUPPORT BANNER                   */}
      {/* ======================================================== */}
      <section id="crisis-support" className="glass-panel p-8 md:p-10 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">24/7 Free & Confidential Crisis Support</h3>
              <p className="text-xs text-slate-300">If you or someone you know is in acute distress, help is available right now.</p>
            </div>
          </div>
          <button
            onClick={onNavigateAwareness}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition"
          >
            Open Symptoms Guide
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-200">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-850 space-y-1">
            <strong className="text-emerald-400 block font-bold">988 Lifeline (USA & Canada)</strong>
            <span className="text-slate-300">Call or Text: <strong className="text-white">988</strong></span>
            <p className="text-[10px] text-slate-400">Free, confidential, 24/7 support.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-850 space-y-1">
            <strong className="text-indigo-400 block font-bold">Crisis Text Line</strong>
            <span className="text-slate-300">Text <strong className="text-white">HOME</strong> to <strong className="text-white">741741</strong></span>
            <p className="text-[10px] text-slate-400">Free 24/7 text support with trained counselors.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-850 space-y-1">
            <strong className="text-pink-400 block font-bold">The Trevor Project</strong>
            <span className="text-slate-300">Call: <strong className="text-white">1-866-488-7386</strong></span>
            <p className="text-[10px] text-slate-400">24/7 LGBTQ youth crisis lifeline.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-850 space-y-1">
            <strong className="text-blue-400 block font-bold">International Directory</strong>
            <a 
              href="https://findahelpline.com" 
              target="_blank" 
              rel="noreferrer" 
              className="text-blue-300 underline block text-xs"
            >
              findahelpline.com
            </a>
            <p className="text-[10px] text-slate-400">Support in 130+ countries worldwide.</p>
          </div>
        </div>
      </section>

    </div>
  );
};
