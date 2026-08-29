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
        <RefreshCw className="h-8 w-8 text-brand-400 animate-spin" />
        <p className="text-slate-400 text-sm">Loading model evaluation metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-4">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Research Mode</h2>
          <p className="text-slate-400 text-sm">Inspect deep learning ablation metrics, confusion matrices, and the fusion transformer architecture.</p>
        </div>
        <button
          onClick={fetchResearchMetrics}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
          <Info className="h-5 w-5 text-amber-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {researchData && (
        <div className="space-y-10">
          
          {/* 1. ABLATION STUDY COMPARISON */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <Table className="h-5 w-5" />
              <h3 className="font-bold text-white text-lg">Modality Ablation Study</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ablation evaluates classifier metrics when specific modalities are withheld, proving whether multimodal fusion yields a superior representation compared to unimodal baselines.
            </p>
            
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-5">Model Configuration</th>
                    <th className="py-3 px-5">Accuracy (%)</th>
                    <th className="py-3 px-5">F1-Score (%)</th>
                    <th className="py-3 px-5">Marginal Gain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {researchData.metrics.map((row, idx) => {
                    const isFullModel = row.model_type.includes("Text + Audio + Image");
                    return (
                      <tr 
                        key={row.model_type} 
                        className={`hover:bg-slate-800/25 transition ${isFullModel ? 'bg-brand-500/10 font-bold text-white' : 'text-slate-350'}`}
                      >
                        <td className="py-3.5 px-5">{row.model_type}</td>
                        <td className="py-3.5 px-5">{row.accuracy}%</td>
                        <td className="py-3.5 px-5">{row.f1_score}%</td>
                        <td className="py-3.5 px-5">
                          {idx === 0 ? "Baseline" : `+${(row.accuracy - researchData.metrics[0].accuracy).toFixed(1)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. CONFUSION MATRIX HEATMAP */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 md:p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <BrainCircuit className="h-5 w-5" />
              <h3 className="font-bold text-white text-lg">Classifier Confusion Matrix</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluating true label hits vs. misclassification confusion over our validation test splits. Higher values along the main diagonal indicate robust classification.
            </p>

            <div className="flex justify-center py-4">
              <div className="space-y-1">
                {/* Columns headers */}
                <div className="flex pl-16">
                  {researchData.labels.map(l => (
                    <div key={`col-${l}`} className="w-14 text-[9px] font-semibold text-slate-500 text-center uppercase tracking-wider truncate px-1">
                      {l}
                    </div>
                  ))}
                </div>
                
                {/* Matrix values rows */}
                {researchData.confusion_matrix.map((row, rIdx) => (
                  <div key={`row-${rIdx}`} className="flex items-center">
                    {/* Row headers */}
                    <div className="w-16 text-[9px] font-semibold text-slate-400 uppercase tracking-wider text-right pr-3 truncate">
                      {researchData.labels[rIdx]}
                    </div>
                    {/* Columns grid */}
                    <div className="flex gap-1">
                      {row.map((val, cIdx) => {
                        // Intensity based on hit count
                        const isDiagonal = rIdx === cIdx;
                        const bgIntensity = isDiagonal 
                          ? val > 12 ? 'bg-brand-600 text-white' : 'bg-brand-700 text-slate-200' 
                          : val > 1 ? 'bg-slate-800 text-slate-500' : 'bg-slate-900/40 text-slate-650';

                        return (
                          <div 
                            key={`cell-${rIdx}-${cIdx}`} 
                            className={`h-12 w-14 rounded flex items-center justify-center font-bold text-xs shadow-inner transition hover:scale-105 ${bgIntensity}`}
                            title={`True: ${researchData.labels[rIdx]}, Pred: ${researchData.labels[cIdx]} (${val} samples)`}
                          >
                            {val}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {/* Bottom caption */}
                <div className="text-center text-[10px] text-slate-500 pt-3">
                  Diagonal elements represent True Positive hits (Correct predictions).
                </div>
              </div>
            </div>
          </div>

          {/* 3. DIAGRAM: MODEL ARCHITECTURE */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 md:p-6 space-y-6">
            <div className="flex items-center gap-2 text-blue-400">
              <Cpu className="h-5 w-5" />
              <h3 className="font-bold text-white text-lg">MindSense Neural Architecture</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Our model uses intermediate feature-level cross-attention fusion. Modalities are projected to a shared 64-dimensional space, concatenated with positional modal tokens, and masked dynamically using Multi-head Attention.
            </p>

            {/* ASCII Flowchart */}
            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl font-mono text-[10px] text-brand-300 leading-relaxed overflow-x-auto">
{`    [Text Input]       [Audio Waveform]        [Facial Image]
          |                    |                      |
    Text Tokenizer        13 MFCC Frame          Haar Cascade
          |               Representations          Face Crop
          v                    v                      v
     TextEncoder          AudioEncoder          VisionEncoder
   (Embedding+1D CNN)      (1D CNN Stack)          (2D CNN)
          |                    |                      |
          v                    v                      v
     [Text Vector]       [Audio Vector]         [Visual Vector]
      (64 dimensions)     (64 dimensions)        (64 dimensions)
          |                    |                      |
          |--------+-----------|-----------+----------|
                   |                       |
                   v                       v
            Add Modality Token       Apply Availability
               Embeddings                 Masks
                   |                       |
                   +-----------+-----------+
                               |
                               v
                     Multi-Head Self-Attention
                       (Fusion Transformer)
                               |
                               v
                     Global Average Pooling
                         (Mask Ignored)
                               |
                               v
                    Classification MLP Head
                               |
                               v
                    [7-class Logit Predictions]`}
            </div>
          </div>

          {/* 4. DATASET INFORMATION */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 md:p-6 space-y-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Database className="h-5 w-5" />
              <h3 className="font-bold text-white text-sm">Dataset & Evaluation Summary</h3>
            </div>
            <div className="text-xs text-slate-350 space-y-2">
              <p>Dataset Name: <span className="font-semibold text-slate-200">{researchData.dataset_info.name}</span></p>
              <p>Training Sample Split: <span className="font-semibold text-slate-200">{researchData.dataset_info.train_samples} sequences</span></p>
              <p>Testing Sample Split: <span className="font-semibold text-slate-200">{researchData.dataset_info.test_samples} sequences</span></p>
              <p>Target Class Count: <span className="font-semibold text-slate-200">{researchData.dataset_info.classes} emotion types</span></p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
