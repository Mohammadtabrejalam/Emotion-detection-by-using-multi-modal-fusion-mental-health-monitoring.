import type { User, AnalysisData } from '../types';
interface HomeProps {
  currentUser?: User | null;
  onStartAnalysis: () => void;
  onNavigate: (pillar: 'home' | 'analyze' | 'insights' | 'research' | 'resources', subTab?: string) => void;
  onOpenHelp: () => void;
  recentAnalysis?: AnalysisData | null;
}
export const Home = ({ currentUser, onStartAnalysis, onNavigate, onOpenHelp, recentAnalysis }: HomeProps) => <div className="space-y-8 max-w-6xl mx-auto">
  <section className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-8 md:p-14 space-y-6">
    <p className="uppercase tracking-[0.2em] text-xs text-indigo-300 font-semibold">Expression research · personal reflection</p>
    <h1 className="text-5xl md:text-7xl text-white font-extrabold tracking-tight">MindSense</h1>
    <p className="text-xl md:text-2xl text-slate-200 max-w-2xl">Understanding emotional expression through multimodal signals.</p>
    <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">Explore how published AI models interpret words, speech, and facial expressions. Compare their outputs, understand their limitations, and keep your own reflections alongside them.</p>
    <div className="flex flex-wrap gap-3"><button className="btn-primary px-6 py-3" onClick={onStartAnalysis}>Start an Analysis</button><button className="btn-secondary px-6 py-3" onClick={() => onNavigate('research','architecture')}>Explore model evidence</button></div>
    <p className="text-xs text-slate-400">No clinical diagnosis. No claims to know how someone truly feels. Guest inputs are processed without saving results.</p>
  </section>
  <section className="grid md:grid-cols-3 gap-5">{[
    ['01', 'Bring your context', 'Use English text, a short speech recording, or a photo of one consenting adult. All models run on the application server.'],
    ['02', 'Compare the signals', 'Inspect individual model labels and the combined score. Disagreement and uncertainty remain visible.'],
    ['03', 'Reflect privately', 'Sign in to save results, write journal entries, and log check-ins. Export or delete your records whenever you choose.'],
  ].map(([n,title,body]) => <article key={n} className="academic-card p-6 space-y-3"><p className="text-indigo-400 font-mono text-sm">{n}</p><h2 className="text-lg font-bold text-white">{title}</h2><p className="text-slate-400 text-sm leading-relaxed">{body}</p></article>)}</section>
  {currentUser && <section className="academic-card p-6 flex flex-wrap justify-between gap-4 items-center"><div><h2 className="text-lg font-bold text-white">Welcome, {currentUser.name}</h2><p className="text-sm text-slate-400">{recentAnalysis ? `Most recent expression label: ${recentAnalysis.emotion}.` : 'Your private workspace is ready.'}</p></div><button onClick={() => onNavigate('insights','journal')} className="btn-secondary">Open my journal</button></section>}
  <button onClick={onOpenHelp} className="text-sm text-indigo-300 underline">How to use MindSense</button>
</div>;
