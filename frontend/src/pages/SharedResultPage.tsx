import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  ShieldAlert, 
  AlertCircle, 
  ArrowLeft
} from 'lucide-react';
import { apiService } from '../services/api';
import { MindSenseLogo } from '../components/MindSenseLogo';

interface SharedResultPageProps {
  token: string;
  onNavigateHome: () => void;
}

export const SharedResultPage: React.FC<SharedResultPageProps> = ({ token, onNavigateHome }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchShared = async () => {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiService.getSharedResult(token);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setErrorMsg(res.error?.message || "Invalid or expired share link.");
      }
      setLoading(false);
    };

    if (token) {
      fetchShared();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-center space-y-3 font-sans">
        <RefreshCw className="h-6 w-6 text-brand-400 animate-spin" />
        <p className="text-slate-400 text-xs font-mono">Resolving secure share token...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)] py-12 px-4 font-sans flex flex-col justify-between">
      
      <div className="max-w-2xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <MindSenseLogo size={24} />
            <div>
              <span className="font-extrabold text-sm text-white">MindSense</span>
              <span className="text-[10px] uppercase font-mono text-brand-400 bg-brand-500/10 px-1.5 py-0.2 rounded border border-brand-500/20 ml-2">
                Shared Report
              </span>
            </div>
          </div>
          <button
            onClick={onNavigateHome}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Open MindSense Platform</span>
          </button>
        </div>

        {errorMsg ? (
          <div className="academic-card p-8 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Unable to Load Shared Analysis</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              {errorMsg}
            </p>
            <button
              onClick={onNavigateHome}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs"
            >
              Return to Homepage
            </button>
          </div>
        ) : data ? (
          <div className="space-y-6">
            
            <div className="academic-card p-6 md:p-8 space-y-6">
              
              <div className="space-y-1 border-b border-slate-800 pb-4">
                <span className="text-[10px] uppercase font-mono text-slate-400">Analysis Date & Time</span>
                <p className="text-xs text-slate-200 font-mono">{new Date(data.timestamp).toLocaleString()}</p>
              </div>

              {/* Dominant Emotion & Confidence */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Detected Affect Classification
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white capitalize tracking-tight">
                    {data.emotion}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-brand-400 font-bold">
                    {(data.confidence * 100).toFixed(1)}% Confidence
                  </span>
                </div>
              </div>

              {/* Modalities Used */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Input Streams Fused
                </span>
                <div className="flex flex-wrap gap-2">
                  {data.modalities_used?.map((m: string, idx: number) => (
                    <span key={idx} className="bg-slate-900 text-slate-200 border border-slate-700 px-3 py-1 rounded-lg text-xs font-mono capitalize">
                      {m} Stream
                    </span>
                  ))}
                </div>
              </div>

              {/* Model Attribution */}
              <div className="text-[11px] text-slate-400 font-mono pt-2">
                Model Version: {data.model_version}
              </div>

            </div>

            {/* MANDATORY NON-MEDICAL DISCLAIMER */}
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Mandatory Non-Medical Disclaimer</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                This result was generated by an AI multimodal fusion model for research and wellness self-reflection only. <strong>It is NOT a medical or psychiatric diagnosis.</strong> AI predictions should not be used to make high-impact decisions regarding an individual's psychological health.
              </p>
            </div>

          </div>
        ) : null}

      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 pt-8 border-t border-slate-800/60 max-w-2xl mx-auto w-full font-mono">
        MindSense Affective Computing Shared Analysis Report
      </footer>

    </div>
  );
};
