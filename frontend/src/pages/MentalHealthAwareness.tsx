import { useState, useEffect } from 'react';
import { 
  Heart, 
  Sparkles, 
  Phone, 
  Activity, 
  Smile, 
  Compass, 
  Wind
} from 'lucide-react';

const CONDITIONS = [
  {
    id: 'anxiety',
    title: 'Generalized Anxiety & Panic',
    badge: 'Anxiety Spectrum',
    color: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
    summary: 'Persistent and excessive worry about everyday scenarios, accompanied by physiological hyper-arousal.',
    physical: ['Rapid heartbeat (palpitations)', 'Shallow, fast breathing', 'Muscle tension in neck/shoulders', 'Insomnia & restlessness'],
    emotional: ['Impending sense of dread or doom', 'Irritability & agitation', 'Difficulty concentrating', 'Fear of losing control'],
    actionable: 'Practice diaphragmatic box breathing, progressive muscle relaxation, and cognitive reframing.'
  },
  {
    id: 'depression',
    title: 'Depressive States & Low Valence',
    badge: 'Mood Disorders',
    color: 'border-blue-500/30 text-blue-300 bg-blue-500/10',
    summary: 'Prolonged periods of low emotional valence, loss of interest in previously enjoyed activities (anhedonia), and chronic fatigue.',
    physical: ['Constant fatigue / low energy', 'Changes in appetite or weight', 'Sleep disruption (hypersomnia or insomnia)', 'Slowed psychomotor movement'],
    emotional: ['Pervasive feelings of worthlessness or guilt', 'Loss of interest in hobbies and socializing', 'Persistent sadness or numbness', 'Recurrent negative cognitive loops'],
    actionable: 'Establish small, structured daily routines, schedule social connection, and seek professional therapy (CBT).'
  },
  {
    id: 'burnout',
    title: 'Workplace & Academic Burnout',
    badge: 'Chronic Stress Reaction',
    color: 'border-red-500/30 text-red-300 bg-red-500/10',
    summary: 'A state of emotional, physical, and mental exhaustion caused by prolonged and overwhelming workplace or caregiving stress.',
    physical: ['Chronic headaches & gastrointestinal distress', 'Frequent illness from weakened immunity', 'Exhaustion despite sleeping'],
    emotional: ['Cynicism and detachment from work', 'Sense of ineffectiveness and lack of accomplishment', 'Emotional numbness & short temper'],
    actionable: 'Enforce strict boundary management, take micro-breaks throughout work, and practice intentional digital detox.'
  },
  {
    id: 'ptsd',
    title: 'Trauma & PTSD Triggers',
    badge: 'Stress & Trauma',
    color: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
    summary: 'Reactions triggered by distressing past events causing intrusive memories, heightened reactivity, and emotional avoidance.',
    physical: ['Exaggerated startle response', 'Sweating or shaking when exposed to triggers', 'Hypervigilance in public spaces'],
    emotional: ['Intrusive flashbacks or nightmares', 'Emotional detachment from loved ones', 'Sudden overwhelming anger or fear'],
    actionable: 'Grounding 5-4-3-2-1 sensory exercises, EMDR therapy, and safe trauma-informed counseling.'
  }
];

export const MentalHealthAwareness: React.FC = () => {
  const [selectedCondition, setSelectedCondition] = useState<string>('anxiety');
  
  // Interactive Grounding State
  const [groundingStep, setGroundingStep] = useState<number>(0);
  const groundingPrompts = [
    { count: 5, label: "Look around you. Identify 5 things you can SEE.", example: "A lamp, a blue book, the window frame, a pen, your shoes." },
    { count: 4, label: "Notice 4 things you can physically TOUCH or feel.", example: "The texture of your shirt, the cool desk surface, your feet on the floor." },
    { count: 3, label: "Listen carefully. Acknowledge 3 distinct sounds you can HEAR.", example: "Computer fan humming, traffic outside, your own steady breath." },
    { count: 2, label: "Identify 2 distinct things you can SMELL right now.", example: "Coffee aroma, fresh rain, scented candle, or the room's air." },
    { count: 1, label: "Focus on 1 thing you can TASTE or one positive affirmation.", example: "A sip of water, lingering mint, or whisper: 'I am safe in this moment.'" }
  ];

  // Box Breathing State
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [breathingCount, setBreathingCount] = useState<number>(4);
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);

  useEffect(() => {
    let timer: any;
    if (isBreathingActive) {
      timer = setInterval(() => {
        setBreathingCount((prev) => {
          if (prev <= 1) {
            setBreathingPhase((phase) => {
              if (phase === 'Inhale') return 'Hold';
              if (phase === 'Hold') return 'Exhale';
              if (phase === 'Exhale') return 'Rest';
              return 'Inhale';
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBreathingActive]);

  const activeCondition = CONDITIONS.find(c => c.id === selectedCondition) || CONDITIONS[0];

  return (
    <div className="space-y-16 py-4 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <Heart className="h-3.5 w-3.5 text-indigo-400" /> Evidence-Based Psychoeducation Guide
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Mental Health & Symptom Awareness
        </h2>
        <p className="text-slate-400 text-sm">
          Understanding early psychological indicators, physical somatic responses, and evidence-based grounding techniques.
        </p>
      </div>

      {/* 1. INTERACTIVE SYMPTOM EXPLORER */}
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2.5 justify-center">
          {CONDITIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCondition(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                selectedCondition === c.id 
                  ? `${c.color} ring-2 ring-brand-500 shadow-lg` 
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Condition Detail Card */}
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${activeCondition.color}`}>
                {activeCondition.badge}
              </span>
              <h3 className="text-2xl font-bold text-white mt-2">{activeCondition.title}</h3>
            </div>
          </div>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            {activeCondition.summary}
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Physical Somatic Signs */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-850 space-y-3">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Activity className="h-4 w-4" /> Physical & Somatic Signs
              </span>
              <ul className="space-y-2 text-xs text-slate-300">
                {activeCondition.physical.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Emotional & Cognitive Signs */}
            <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-850 space-y-3">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Smile className="h-4 w-4" /> Emotional & Cognitive Signals
              </span>
              <ul className="space-y-2 text-xs text-slate-300">
                {activeCondition.emotional.map((e, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Actionable Strategy */}
          <div className="bg-brand-500/10 border border-brand-500/20 p-4 rounded-2xl text-xs flex items-center gap-3 text-brand-200">
            <Sparkles className="h-5 w-5 text-brand-400 shrink-0" />
            <div>
              <strong className="text-white block">Recommended Wellness Response:</strong>
              <span>{activeCondition.actionable}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE COPING TOOLS */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* TOOL 1: 5-4-3-2-1 Grounding Technique */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Compass className="h-5 w-5" /> 5-4-3-2-1 Sensory Grounding Tool
            </div>
            <p className="text-xs text-slate-400">
              When feeling overwhelmed or dissociated, reconnect with the physical present moment through your senses.
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4 text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-xl flex items-center justify-center mx-auto">
              {groundingPrompts[groundingStep].count}
            </div>
            <p className="text-sm font-bold text-white">
              {groundingPrompts[groundingStep].label}
            </p>
            <p className="text-xs text-slate-400 italic">
              Example: &ldquo;{groundingPrompts[groundingStep].example}&rdquo;
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setGroundingStep(prev => Math.max(0, prev - 1))}
              disabled={groundingStep === 0}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold disabled:opacity-30 text-slate-300"
            >
              Previous Step
            </button>
            <span className="text-xs text-slate-500 font-mono">Step {groundingStep + 1} of 5</span>
            <button
              onClick={() => setGroundingStep(prev => (prev + 1) % 5)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition"
            >
              {groundingStep === 4 ? 'Restart Grounding' : 'Next Sense →'}
            </button>
          </div>
        </div>

        {/* TOOL 2: Animated Box Breathing Pacer */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Wind className="h-5 w-5" /> 4-4-4-4 Box Breathing Visualizer
            </div>
            <p className="text-xs text-slate-400">
              Regulates the autonomic nervous system by equalizing oxygen and carbon dioxide levels.
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 flex flex-col items-center justify-center space-y-4 min-h-[160px]">
            <div className={`h-24 w-24 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-1000 ${
              breathingPhase === 'Inhale' 
                ? 'scale-125 bg-indigo-500/20 border-indigo-400 text-indigo-300' 
                : breathingPhase === 'Exhale' 
                ? 'scale-75 bg-blue-500/10 border-blue-400 text-blue-300' 
                : 'scale-100 bg-slate-900 border-slate-700 text-slate-300'
            }`}>
              <span className="font-extrabold text-sm">{breathingPhase}</span>
              <span className="text-xs font-mono">{breathingCount}s</span>
            </div>
          </div>

          <button
            onClick={() => setIsBreathingActive(!isBreathingActive)}
            className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition ${
              isBreathingActive 
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isBreathingActive ? 'Pause Breathing Pacer' : 'Start Box Breathing (4s cycle)'}
          </button>
        </div>

      </div>

      {/* 3. EMERGENCY CRISIS DIRECTORY */}
      <div className="glass-panel p-8 rounded-3xl border border-red-500/20 bg-red-500/5 space-y-4">
        <div className="flex items-center gap-3 text-red-400">
          <Phone className="h-6 w-6" />
          <h3 className="text-lg font-bold text-white">Immediate Crisis Support & 24/7 Hotlines</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          If you or someone you know is in immediate crisis or having thoughts of self-harm, confidential free support is available 24/7.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">USA & Canada</span>
            <p className="text-sm font-extrabold text-white">Call or Text 988</p>
            <p className="text-[10px] text-slate-400">Suicide & Crisis Lifeline (Free & 24/7)</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Crisis Text Line</span>
            <p className="text-sm font-extrabold text-white">Text HOME to 741741</p>
            <p className="text-[10px] text-slate-400">Connect with a Crisis Counselor</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">International Directory</span>
            <a 
              href="https://findahelpline.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs font-bold text-brand-400 hover:underline block pt-1"
            >
              findahelpline.com →
            </a>
            <p className="text-[10px] text-slate-400">Free hotlines in 130+ countries</p>
          </div>
        </div>
      </div>

    </div>
  );
};
