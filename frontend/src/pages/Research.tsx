import { useEffect, useState } from 'react';
import { apiService } from '../services/api';

export const Research = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => { apiService.getResearch().then(r => r.success ? setData(r.data) : setError(r.error?.message || 'No measured evaluation report installed.')); }, []);
  return <section className="academic-card p-6 md:p-8 space-y-6 text-slate-300">
    <h1 className="text-2xl font-bold text-white">Models, evidence, and limitations</h1>
    <p>MindSense runs three published trained classifiers locally. It aligns their labels and combines available scores using equal-weight, support-aware late fusion. This is a baseline, not a jointly trained transformer or a clinical assessment.</p>
    <div className="grid md:grid-cols-3 gap-4">{[
      ['Text', 'SamLowe/roberta-base-go_emotions', 'English; 28 multi-label scores mapped to seven expression groups.'],
      ['Speech', 'superb/wav2vec2-base-superb-er', '16 kHz speech; four labels: happy, sad, angry, neutral.'],
      ['Facial image', 'trpakov/vit-face-expression', 'ViT fine-tuned on FER2013; seven expression labels.'],
    ].map(([title, model, note]) => <article className="bg-slate-950 p-4 rounded-xl space-y-2" key={title}><h2 className="font-bold text-white">{title}</h2><a className="text-indigo-300 text-xs break-all underline" href={`https://huggingface.co/${model}`} target="_blank" rel="noreferrer">{model}</a><p className="text-sm">{note}</p></article>)}</div>
    <h2 className="font-bold text-white text-xl">Measured evaluation</h2>
    {error && <p role="status" className="text-amber-200">{error} Model-card results are not substituted for measurements of this application.</p>}
    {data?.evaluations?.map((evaluation: any) => <div key={evaluation.name} className="space-y-3"><h3 className="font-semibold text-white">{evaluation.name}</h3><p className="text-xs">{evaluation.scope}</p><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr><th className="p-2">Input</th><th>Samples</th><th>Accuracy</th><th>Macro F1</th></tr></thead><tbody>{Object.entries(evaluation.results).map(([mode, value]: [string, any]) => <tr key={mode} className="border-t border-slate-800"><td className="p-2 capitalize">{mode}</td><td>{value.samples}</td><td>{(value.accuracy*100).toFixed(1)}%</td><td>{value.macro_f1.toFixed(3)}</td></tr>)}</tbody></table></div></div>)}
    <p className="text-sm">Expression labels are imperfect proxies. Scores are uncalibrated, text is truncated to 256 tokens, and performance depends on language, lighting, recording conditions, and dataset differences. Missing modalities are omitted; no predictions are invented for them.</p>
    <p className="text-xs text-slate-400">Historical research scripts and phase reports remain in the repository for reproducibility. They are separate from the serving models described here.</p>
  </section>;
};
