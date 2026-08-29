import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Sparkles, 
  Activity, 
  Smile, 
  Compass, 
  Wind,
  ShieldAlert
} from 'lucide-react';

const CONDITIONS = [
  {
    id: 'anxiety',
    title: 'Generalized Anxiety & Hyper-Arousal',
    badge: 'Anxiety Spectrum',
    color: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
    summary: 'Persistent and excessive worry regarding everyday events, accompanied by autonomic physiological hyper-arousal.',
    physical: ['Elevated resting heart rate & palpitations', 'Shallow, rapid diaphragmatic breathing', 'Muscular tension in neck & shoulders', 'Restlessness & sleep disturbance'],
    emotional: ['Heightened apprehension of negative outcomes', 'Cognitive irritability & hypervigilance', 'Difficulty maintaining executive concentration', 'Intrusive catastrophic loops'],
    actionable: 'Practice diaphragmatic 4-4-4-4 box breathing, progressive neuromuscular relaxation, and cognitive reframing.'
  },
  {
    id: 'depression',
    title: 'Depressive States & Low Emotional Valence',
    badge: 'Mood Affect',
    color: 'border-blue-500/30 text-blue-300 bg-blue-500/10',
    summary: 'Prolonged attenuation of positive valence, loss of interest in previously rewarding stimuli (anhedonia), and persistent psychomotor fatigue.',
    physical: ['Chronic low energy / somatic depletion', 'Alterations in appetite & weight', 'Disrupted sleep architecture (insomnia/hypersomnia)', 'Slowed psychomotor response latency'],
    emotional: ['Pervasive feelings of worthlessness or guilt', 'Social withdrawal & anhedonic detachment', 'Persistent subjective numbness', 'Recurrent negative rumination'],
    actionable: 'Establish micro-routines, maintain schedule hygiene, and consult certified mental health clinicians (CBT/psychotherapy).'
  },
  {
    id: 'burnout',
    title: 'Occupational & Academic Burnout Syndrome',
    badge: 'Chronic Stress Reaction',
    color: 'border-red-500/30 text-red-300 bg-red-500/10',
    summary: 'State of emotional, physical, and cognitive exhaustion resulting from prolonged exposure to unresolved occupational stressors.',
    physical: ['Tension headaches & gastrointestinal discomfort', 'Compromised immune response & frequent illness', 'Unrefreshing sleep regardless of duration'],
    emotional: ['Cynicism, detachment, and depersonalization', 'Reduced sense of professional self-efficacy', 'Emotional volatility & shortened patience'],
    actionable: 'Enforce boundary management, schedule non-negotiable recovery windows, and perform targeted digital detox.'
  },
  {
    id: 'ptsd',
    title: 'Stress & Trauma Trigger Responses',
    badge: 'Trauma Spectrum',
    color: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
    summary: 'Neurological reactivity triggered by memories of past distressing events, producing involuntary somatic hyper-reactivity.',
    physical: ['Exaggerated startle response', 'Diaphoresis (sweating) and tremors upon trigger exposure', 'Autonomic fight-or-flight arousal'],
    emotional: ['Intrusive flashback fragments & nightmares', 'Emotional numbness toward close relations', 'Sudden episodic distress or panic'],
    actionable: 'Deploy the 5-4-3-2-1 grounding technique, engage in EMDR therapy, and seek trauma-informed clinical guidance.'
  }
];

export const MentalHealthAwareness: React.FC = () => {
  const [selectedCondition, setSelectedCondition] = useState<string>('anxiety');
  
  // Interactive Grounding State
  const [groundingStep, setGroundingStep] = useState<number>(0);
  const groundingPrompts = [
    { count: 5, label: "Scan your surroundings. Identify 5 physical objects you can SEE.", example: "A desk lamp, window frame, book spine, coffee mug, your watch." },
    { count: 4, label: "Notice 4 tactile sensations you can physically TOUCH or feel.", example: "Fabric of your sleeve, smooth desk surface, feet grounded on floor." },
    { count: 3, label: "Listen carefully. Acknowledge 3 distinct sounds you can HEAR.", example: "Computer fan breeze, distant traffic, your own steady respiration." },
    { count: 2, label: "Identify 2 distinct ambient scents you can SMELL right now.", example: "Fresh air, tea aroma, notebook paper." },
    { count: 1, label: "Focus on 1 thing you can TASTE or one calming internal affirmation.", example: "A cool sip of water, or whisper: 'I am safe and grounded right now.'" }
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
    <div className="space-y-10 py-2 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-2 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
          <Heart className="h-3.5 w-3.5 text-indigo-400" />
          <span>Psychoeducation & Somatic Indicator Guide</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Affective Signals & Somatic Indicators
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
          Understanding early behavioral indicators, physiological responses, and evidence-based grounding techniques.
        </p>
      </div>

      {/* 1. INTERACTIVE SYMPTOM EXPLORER */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {CONDITIONS.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCondition(c.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                selectedCondition === c.id 
                  ? `${c.color} ring-1 ring-brand-500 shadow-sm font-bold` 
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Condition Detail Card */}
        <div className="academic-card p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${activeCondition.color}`}>
                {activeCondition.badge}
              </span>
              <h3 className="text-xl font-bold text-white mt-1.5">{activeCondition.title}</h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            {activeCondition.summary}
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Physical Somatic Signs */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Activity className="h-4 w-4" /> Somatic & Physiological Indicators
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {activeCondition.physical.map((p, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Emotional Signs */}
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Smile className="h-4 w-4" /> Cognitive & Affective Markers
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
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
          <div className="bg-brand-500/10 border border-brand-500/20 p-4 rounded-xl text-xs flex items-center gap-3 text-brand-200">
            <Sparkles className="h-4 w-4 text-brand-400 shrink-0" />
            <div>
              <strong className="text-white block font-semibold">Recommended Psychoeducational Response:</strong>
              <span>{activeCondition.actionable}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE SOMATIC GROUNDING TOOLS */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* TOOL 1: 5-4-3-2-1 Sensory Grounding */}
        <div className="academic-card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Compass className="h-4.5 w-4.5" />
              <span>5-4-3-2-1 Sensory Grounding Method</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              When encountering cognitive overload or dissociation, re-anchor focus into the physical environment through sensory activation.
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-3 text-center">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-extrabold text-lg flex items-center justify-center mx-auto">
              {groundingPrompts[groundingStep].count}
            </div>
            <p className="text-xs font-bold text-white leading-snug">
              {groundingPrompts[groundingStep].label}
            </p>
            <p className="text-[11px] text-slate-400 italic">
              Example: &ldquo;{groundingPrompts[groundingStep].example}&rdquo;
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setGroundingStep(prev => Math.max(0, prev - 1))}
              disabled={groundingStep === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium disabled:opacity-30 text-slate-300"
            >
              Previous
            </button>
            <span className="text-[11px] text-slate-500 font-mono">Step {groundingStep + 1} of 5</span>
            <button
              onClick={() => setGroundingStep(prev => (prev + 1) % 5)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
            >
              {groundingStep === 4 ? 'Restart Grounding' : 'Next Step →'}
            </button>
          </div>
        </div>

        {/* TOOL 2: Animated Box Breathing Pacer */}
        <div className="academic-card p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Wind className="h-4.5 w-4.5" />
              <span>4-4-4-4 Parasympathetic Box Breathing</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modulates autonomic nervous system tone by balancing oxygenation and stabilizing cardiovascular vagal response.
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-3 min-h-[140px]">
            <div className={`h-20 w-20 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-1000 ${
              breathingPhase === 'Inhale' 
                ? 'scale-125 bg-indigo-500/20 border-indigo-400 text-indigo-300' 
                : breathingPhase === 'Exhale' 
                ? 'scale-75 bg-blue-500/10 border-blue-400 text-blue-300' 
                : 'scale-100 bg-slate-900 border-slate-700 text-slate-300'
            }`}>
              <span className="font-extrabold text-xs">{breathingPhase}</span>
              <span className="text-[10px] font-mono">{breathingCount}s</span>
            </div>
          </div>

          <button
            onClick={() => setIsBreathingActive(!isBreathingActive)}
            className={`w-full py-2.5 rounded-lg font-semibold text-xs transition shadow ${
              isBreathingActive 
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isBreathingActive ? 'Pause Breathing Pacer' : 'Start Box Breathing Pacer'}
          </button>
        </div>

      </div>

      {/* 3. EMERGENCY CRISIS DIRECTORY */}
      <div className="academic-card p-6 md:p-8 space-y-3 border-red-500/30 bg-red-500/5">
        <div className="flex items-center gap-2 text-red-400">
          <ShieldAlert className="h-5 w-5" />
          <h3 className="text-base font-bold text-white">Immediate 24/7 Crisis Support Directory</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          If you or someone in your community is experiencing acute emotional crisis or thoughts of self-harm, confidential free professional support is available 24/7.
        </p>

        <div className="grid sm:grid-cols-3 gap-4 pt-1">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">USA & Canada</span>
            <p className="text-base font-extrabold text-white">Call or Text 988</p>
            <p className="text-[10px] text-slate-400">Suicide & Crisis Lifeline (Free & 24/7)</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Crisis Text Line</span>
            <p className="text-base font-extrabold text-white">Text HOME to 741741</p>
            <p className="text-[10px] text-slate-400">Connect with a Crisis Counselor</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">International Directory</span>
            <a 
              href="https://findahelpline.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs font-bold text-brand-400 hover:underline block pt-1"
            >
              findahelpline.com →
            </a>
            <p className="text-[10px] text-slate-400">Free certified helplines across 130+ countries</p>
          </div>
        </div>
      </div>

    </div>
  );
};
