import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Table, 
  Cpu, 
  Database, 
  RefreshCw,
  Info
} from 'lucide-react';
import { apiService } from '../services/api';
import type { ResearchData } from '../types';

export const Research: React.FC = () => {
  const [researchData, setResearchData] = useState<ResearchData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-6 w-6 text-brand-400 animate-spin" />
        <p className="text-slate-400 text-xs">Loading ablation and validation metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-2">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Scientific Evaluation & Ablation</h2>
          <p className="text-slate-400 text-xs">Empirical metrics demonstrating multimodal attention gain and cross-modality classification reliability.</p>
        </div>
        <button
          onClick={fetchResearchMetrics}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition self-start sm:self-auto"
          title="Refresh Metrics"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
          <Info className="h-4.5 w-4.5 text-amber-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {researchData && (
        <div className="space-y-8">
          
          {/* 1. ABLATION STUDY COMPARISON TABLE */}
          <div className="academic-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <Table className="h-4.5 w-4.5" />
              <h3 className="font-bold text-white text-base">Modality Ablation Study</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluating the marginal classification accuracy gain when systematically masking combinations of Text, Acoustic Speech (SER), and Facial Expression (CNN) inputs.
            </p>
            
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
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
                        className={`transition ${isFullModel ? 'bg-brand-500/10 font-bold text-white' : 'text-slate-300 hover:bg-slate-800/30'}`}
                      >
                        <td className="py-3.5 px-4 flex items-center gap-2">
                          {isFullModel && <span className="h-2 w-2 rounded-full bg-brand-400" />}
                          <span>{row.model_type}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">{row.accuracy}%</td>
                        <td className="py-3.5 px-4 text-center font-mono">{row.f1_score}%</td>
                        <td className="py-3.5 px-4 text-right font-mono">
                          {idx === 0 ? (
                            <span className="text-slate-500">Baseline</span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">+{diff}%</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. CONFUSION MATRIX HEATMAP */}
          <div className="academic-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <BrainCircuit className="h-4.5 w-4.5" />
              <h3 className="font-bold text-white text-base">Validation Confusion Matrix</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluating predicted emotion distributions vs. ground-truth validation labels. Darker cells on the main diagonal indicate higher classification hits.
            </p>

            <div className="flex justify-center py-4 overflow-x-auto">
              <div className="space-y-1 min-w-[480px]">
                {/* Column Headers */}
                <div className="flex pl-16">
                  {researchData.labels.map(l => (
                    <div key={`col-${l}`} className="w-14 text-[9px] font-semibold text-slate-400 text-center uppercase tracking-wider truncate px-1">
                      {l}
                    </div>
                  ))}
                </div>
                
                {/* Matrix Rows */}
                {researchData.confusion_matrix.map((row, rIdx) => (
                  <div key={`row-${rIdx}`} className="flex items-center">
                    {/* Row Header */}
                    <div className="w-16 text-[9px] font-semibold text-slate-400 uppercase tracking-wider text-right pr-3 truncate">
                      {researchData.labels[rIdx]}
                    </div>
                    {/* Cells */}
                    <div className="flex gap-1">
                      {row.map((val, cIdx) => {
                        const isDiagonal = rIdx === cIdx;
                        const bgClass = isDiagonal 
                          ? val > 12 ? 'bg-brand-600 text-white font-bold' : 'bg-brand-700/80 text-white' 
                          : val > 1 ? 'bg-slate-800 text-slate-400' : 'bg-slate-900/60 text-slate-600';

                        return (
                          <div 
                            key={`cell-${rIdx}-${cIdx}`} 
                            className={`h-10 w-14 rounded flex items-center justify-center text-xs font-mono transition hover:scale-105 border border-slate-800/40 ${bgClass}`}
                            title={`True: ${researchData.labels[rIdx]}, Pred: ${researchData.labels[cIdx]} (${val} samples)`}
                          >
                            {val}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                <div className="text-center text-[10px] text-slate-500 pt-3">
                  Diagonal elements represent True Positive hits across 7 emotion classes.
                </div>
              </div>
            </div>
          </div>

          {/* 3. NEURAL ARCHITECTURE SCHEMATIC */}
          <div className="academic-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Cpu className="h-4.5 w-4.5" />
              <h3 className="font-bold text-white text-base">Model Neural Architecture & Data Flow</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Unimodal feature vectors are mapped into a shared 64-dimensional latent embedding space, concatenated with learned positional tokens, and passed through Multi-Head Self-Attention layers.
            </p>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[10px] sm:text-[11px] text-brand-300 leading-relaxed overflow-x-auto">
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
          </div>

          {/* 4. DATASET & EVALUATION METADATA */}
          <div className="academic-card p-6 space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Database className="h-4.5 w-4.5" />
              <h3 className="font-bold text-white text-sm">Corpus Partitioning Summary</h3>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400 pt-1">
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Dataset</span>
                <span className="font-semibold text-slate-200">{researchData.dataset_info.name}</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Training Partition</span>
                <span className="font-semibold text-slate-200">{researchData.dataset_info.train_samples} samples</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Testing Partition</span>
                <span className="font-semibold text-slate-200">{researchData.dataset_info.test_samples} samples</span>
              </div>
              <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Target Classes</span>
                <span className="font-semibold text-slate-200">{researchData.dataset_info.classes} Affect Categories</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
