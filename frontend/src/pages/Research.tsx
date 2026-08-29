import React, { useState, useEffect } from 'react';
import { 
  RefreshCw,
  Info
} from 'lucide-react';
import { apiService } from '../services/api';
import type { ResearchData } from '../types';

export const Research: React.FC = () => {
  const [researchData, setResearchData] = useState<ResearchData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('01-methodology');

  const fetchResearchMetrics = async () => {
    setLoading(true);
    setErrorMsg(null);
    const response = await apiService.getResearch();
    if (response.success && response.data) {
      setResearchData(response.data);
    } else {
      setErrorMsg(response.error?.message || "Failed to fetch evaluation metrics.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResearchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3 font-sans">
        <RefreshCw className="h-6 w-6 text-brand-400 animate-spin" />
        <p className="text-slate-400 text-xs font-mono">Loading empirical research and evaluation metrics...</p>
      </div>
    );
  }

  const sections = [
    { id: '01-methodology', num: '01', title: 'Methodology' },
    { id: '02-architecture', num: '02', title: 'Architecture' },
    { id: '03-datasets', num: '03', title: 'Datasets' },
    { id: '04-experiments', num: '04', title: 'Experiments' },
    { id: '05-modelcard', num: '05', title: 'Model Card' }
  ];

  return (
    <div className="space-y-10 py-2 font-sans max-w-6xl mx-auto">
      
      {/* 1. ACADEMIC HEADER */}
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <span className="text-xs font-bold text-brand-400 uppercase tracking-widest block font-mono">
          RESEARCH PUBLICATION
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Scientific Research & Methodology
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          Empirical evaluation of Intermediate Cross-Attention Transformer fusion across text, speech acoustics, and facial micro-expressions.
        </p>
      </div>

      {/* 2. SECTION INDEX / TABLE OF CONTENTS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4 overflow-x-auto text-xs font-mono">
        {sections.map(sec => (
          <a
            key={sec.id}
            href={`#${sec.id}`}
            onClick={() => setActiveSection(sec.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-2 ${
              activeSection === sec.id
                ? 'bg-slate-900 text-white font-bold border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-950'
            }`}
          >
            <span className="text-brand-400 font-bold">{sec.num}</span>
            <span>{sec.title}</span>
          </a>
        ))}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
          <Info className="h-4.5 w-4.5 text-amber-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. SECTION 01: METHODOLOGY */}
      <section id="01-methodology" className="space-y-4 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <span className="text-sm font-bold text-brand-400 font-mono">01</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Methodology Overview</h2>
        </div>

        <div className="max-w-3xl space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Traditional multimodal affect classification approaches fall into two categories: <em>Early Fusion</em> (concatenating raw input feature vectors) or <em>Late Fusion</em> (training independent unimodal classifiers and averaging decision logits). Both approaches possess severe limitations: Early Fusion suffers from feature dimensionality mismatch and curse of dimensionality, while Late Fusion ignores inter-modality cross-correlations (such as facial micro-expressions contextualizing sarcasm in text).
          </p>
          <p>
            MindSense implements an <strong>Intermediate Cross-Attention Transformer</strong>. Unimodal encoders project textual tokens, acoustic MFCC frames, and facial pixel crops into a unified 64-dimensional latent embedding space. Dynamic cross-attention matrices allow modalities to attend to each other during latent representation, while availability masking prevents missing input modalities from introducing false zero-biasing artifacts.
          </p>
        </div>
      </section>

      {/* 4. SECTION 02: ARCHITECTURE */}
      <section id="02-architecture" className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <span className="text-sm font-bold text-brand-400 font-mono">02</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Neural Architecture & Pipeline Schematic</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 text-xs">
          <div className="academic-card p-5 space-y-2">
            <h3 className="font-bold text-white text-sm">Text NLP Encoder</h3>
            <p className="text-slate-400 leading-relaxed">
              Tokenizes input text into a 64-dimensional Word Embedding evaluated via 1D Convolutional layers and global max-pooling.
            </p>
          </div>

          <div className="academic-card p-5 space-y-2">
            <h3 className="font-bold text-white text-sm">Audio Speech SER</h3>
            <p className="text-slate-400 leading-relaxed">
              Extracts 13 Mel-Frequency Cepstral Coefficients (MFCCs) at 16kHz to evaluate pitch, cadence, and vocal prosody.
            </p>
          </div>

          <div className="academic-card p-5 space-y-2">
            <h3 className="font-bold text-white text-sm">Facial Vision CNN</h3>
            <p className="text-slate-400 leading-relaxed">
              Crops facial bounding boxes to 48x48 matrices, evaluated via deep 2D CNN kernels for micro-expression movements.
            </p>
          </div>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono text-[11px] text-brand-300 leading-relaxed overflow-x-auto">
{`    [Text Input]             [Speech Audio]            [Facial Frame]
          |                          |                         |
    Text Tokenizer             13 MFCC Frame              Haar Cascade
          |                    Representations              Alignment
          v                          v                         v
     TextEncoder                AudioEncoder             VisionEncoder
    (WordEmbed+1D CNN)         (3-layer 1D CNN)            (2D CNN)
          |                          |                         |
          v                          v                         v
     [Text Vector]             [Audio Vector]            [Vision Vector]
    (64 dimensions)           (64 dimensions)           (64 dimensions)
          |                          |                         |
          +--------------------------+-------------------------+
                                     |
                                     v
                        Add Positional Modal Tokens
                                     |
                                     v
                        Dynamic Availability Mask
                                     |
                                     v
                        Multi-Head Self-Attention
                          (Fusion Transformer)
                                     |
                                     v
                           Masked Global Pooling
                                     |
                                     v
                          Classification MLP Head
                                     |
                                     v
                       [7-Class Softmax Probabilities]`}
        </div>
      </section>

      {/* 5. SECTION 03: DATASETS */}
      <section id="03-datasets" className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <span className="text-sm font-bold text-brand-400 font-mono">03</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Benchmark Corpora Standards</h2>
        </div>

        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Evaluated against four gold-standard academic benchmarks under strict speaker-independent and actor-independent data isolation:
        </p>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="academic-card p-4 space-y-1.5">
            <span className="font-mono text-brand-400 font-bold block text-sm">CREMA-D</span>
            <span className="text-white font-semibold">Audio-Visual Corpus</span>
            <p className="text-[11px] text-slate-400">7,442 clips from 91 actors labeled by 2,445 crowd reviewers.</p>
          </div>

          <div className="academic-card p-4 space-y-1.5">
            <span className="font-mono text-brand-400 font-bold block text-sm">RAVDESS</span>
            <span className="text-white font-semibold">Speech & Song</span>
            <p className="text-[11px] text-slate-400">7,356 validated North American vocal recordings.</p>
          </div>

          <div className="academic-card p-4 space-y-1.5">
            <span className="font-mono text-brand-400 font-bold block text-sm">FER-2013</span>
            <span className="text-white font-semibold">In-the-Wild Faces</span>
            <p className="text-[11px] text-slate-400">35,887 unconstrained 48x48 facial crops.</p>
          </div>

          <div className="academic-card p-4 space-y-1.5">
            <span className="font-mono text-brand-400 font-bold block text-sm">GoEmotions</span>
            <span className="text-white font-semibold">Reddit Comments</span>
            <p className="text-[11px] text-slate-400">58,000 fine-grained conversational comments.</p>
          </div>
        </div>
      </section>

      {/* 6. SECTION 04: EXPERIMENTS */}
      <section id="04-experiments" className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <span className="text-sm font-bold text-brand-400 font-mono">04</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Experimental Results & Ablation Studies</h2>
        </div>

        {researchData && (
          <div className="space-y-6">
            <div className="academic-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Modality Ablation Study Table</h3>
                <span className="text-[10px] font-mono text-slate-400">Speaker-Isolated Validation Split</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Architecture / Modalities</th>
                      <th className="py-3 px-4 text-center">Accuracy</th>
                      <th className="py-3 px-4 text-center">F1-Score</th>
                      <th className="py-3 px-4 text-right">Marginal Gain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {researchData.metrics.map((row, idx) => {
                      const isFullModel = row.model_type.includes("Text + Audio + Image");
                      const baselineAccuracy = researchData.metrics[0].accuracy;
                      const diff = (row.accuracy - baselineAccuracy).toFixed(1);
                      return (
                        <tr 
                          key={row.model_type} 
                          className={`transition ${isFullModel ? 'bg-brand-500/10 font-bold text-white' : 'text-slate-300 hover:bg-slate-900/40'}`}
                        >
                          <td className="py-3 px-4">{row.model_type}</td>
                          <td className="py-3 px-4 text-center font-mono">{row.accuracy}%</td>
                          <td className="py-3 px-4 text-center font-mono">{row.f1_score}%</td>
                          <td className="py-3 px-4 text-right font-mono">
                            {idx === 0 ? <span className="text-slate-500">Baseline</span> : <span className="text-emerald-400">+{diff}%</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Confusion Matrix */}
            <div className="academic-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">Validation Confusion Matrix</h3>
                <span className="text-[10px] font-mono text-slate-400">7 Affect Classes</span>
              </div>

              <div className="flex justify-center py-2 overflow-x-auto">
                <div className="space-y-1 min-w-[460px]">
                  <div className="flex pl-16">
                    {researchData.labels.map(l => (
                      <div key={`col-${l}`} className="w-14 text-[9px] font-semibold text-slate-400 text-center uppercase font-mono px-1">
                        {l}
                      </div>
                    ))}
                  </div>
                  
                  {researchData.confusion_matrix.map((row, rIdx) => (
                    <div key={`row-${rIdx}`} className="flex items-center">
                      <div className="w-16 text-[9px] font-semibold text-slate-400 uppercase font-mono text-right pr-3 truncate">
                        {researchData.labels[rIdx]}
                      </div>
                      <div className="flex gap-1">
                        {row.map((val, cIdx) => {
                          const isDiagonal = rIdx === cIdx;
                          const bgClass = isDiagonal 
                            ? val > 12 ? 'bg-brand-600 text-white font-bold' : 'bg-brand-700/80 text-white' 
                            : val > 1 ? 'bg-slate-800 text-slate-400' : 'bg-slate-900/60 text-slate-600';

                          return (
                            <div 
                              key={`cell-${rIdx}-${cIdx}`} 
                              className={`h-9 w-14 rounded flex items-center justify-center text-xs font-mono border border-slate-800/40 ${bgClass}`}
                            >
                              {val}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 7. SECTION 05: MODEL CARD */}
      <section id="05-modelcard" className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
          <span className="text-sm font-bold text-brand-400 font-mono">05</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Model Card & Specifications</h2>
        </div>

        <div className="academic-card p-6 space-y-4 text-xs">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-bold text-white text-sm">Model Details</h3>
              <ul className="space-y-1 text-slate-300 leading-relaxed font-mono text-[11px]">
                <li>• <strong>Architecture:</strong> Intermediate Cross-Attention Transformer</li>
                <li>• <strong>Input Dimensions:</strong> Text (64d), Audio (13 MFCCs), Vision (48x48)</li>
                <li>• <strong>Output:</strong> 7-Class Softmax Probability Distribution</li>
                <li>• <strong>Framework:</strong> PyTorch 2.0 / CPU-GPU execution</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-white text-sm">Intended Scope & Limitations</h3>
              <ul className="space-y-1 text-slate-300 leading-relaxed text-[11px]">
                <li>• <strong>Scope:</strong> Academic affective computing & wellness self-reflection.</li>
                <li>• <strong>Non-Medical:</strong> Does not diagnose psychiatric disorders.</li>
                <li>• <strong>Biases:</strong> Performance varies under extreme acoustic noise or non-frontal lighting.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
