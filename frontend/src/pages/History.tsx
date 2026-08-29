import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Eye, 
  Filter, 
  RefreshCw, 
  Calendar, 
  AlertCircle, 
  X, 
  Layers
} from 'lucide-react';
import { apiService } from '../services/api';
import type { AnalysisData, User } from '../types';

interface HistoryProps {
  currentUser?: User | null;
}

export const History: React.FC<HistoryProps> = ({ currentUser }) => {
  const [history, setHistory] = useState<AnalysisData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Filter states
  const [emotionFilter, setEmotionFilter] = useState<string>('all');
  const [modalityFilter, setModalityFilter] = useState<string>('all');
  
  // Selected Detail Modal
  const [selectedRecord, setSelectedRecord] = useState<AnalysisData | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setErrorMsg(null);
    const response = await apiService.getHistory(currentUser?.id);
    if (response.success && response.data) {
      setHistory(response.data.history);
    } else {
      setErrorMsg(response.error?.message || "Failed to load historical assessment logs.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [currentUser]);

  const handleClearHistory = async () => {
    if (window.confirm("Permanently erase assessment logs for this profile? This cannot be reversed.")) {
      const response = await apiService.clearHistory(currentUser?.id);
      if (response.success) {
        setHistory([]);
      } else {
        alert("Failed to clear data: " + response.error?.message);
      }
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredHistory = history.filter(item => {
    const matchEmotion = emotionFilter === 'all' || item.emotion.toLowerCase() === emotionFilter.toLowerCase();
    const matchModality = modalityFilter === 'all' || item.modalities_used.includes(modalityFilter);
    return matchEmotion && matchModality;
  });

  return (
    <div className="space-y-6 py-2">
      {/* Top Filter and Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-slate-300">Emotion:</span>
            <select
              value={emotionFilter}
              onChange={(e) => setEmotionFilter(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer capitalize font-sans"
            >
              <option value="all" className="bg-slate-900 text-white">All Emotions</option>
              <option value="happy" className="bg-slate-900 text-white">Happy</option>
              <option value="sad" className="bg-slate-900 text-white">Sad</option>
              <option value="angry" className="bg-slate-900 text-white">Angry</option>
              <option value="fear" className="bg-slate-900 text-white">Fear</option>
              <option value="surprise" className="bg-slate-900 text-white">Surprise</option>
              <option value="disgust" className="bg-slate-900 text-white">Disgust</option>
              <option value="neutral" className="bg-slate-900 text-white">Neutral</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-slate-300">Modality:</span>
            <select
              value={modalityFilter}
              onChange={(e) => setModalityFilter(e.target.value)}
              className="bg-transparent text-white outline-none cursor-pointer font-sans"
            >
              <option value="all" className="bg-slate-900 text-white">All Combinations</option>
              <option value="text" className="bg-slate-900 text-white">Includes Text</option>
              <option value="audio" className="bg-slate-900 text-white">Includes Audio</option>
              <option value="image" className="bg-slate-900 text-white">Includes Vision</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh History"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium text-xs transition flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Log</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Record Feed */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading historical records...</div>
      ) : filteredHistory.length === 0 ? (
        <div className="academic-card p-12 text-center space-y-2">
          <p className="text-slate-300 font-semibold text-sm">No historical assessments found</p>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            {history.length === 0 
              ? "Run your first multimodal inference in the Live Studio above to log assessment records." 
              : "No records match the selected emotion and modality filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item, idx) => (
            <div 
              key={idx} 
              className="academic-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition cursor-pointer"
              onClick={() => setSelectedRecord(item)}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold text-white capitalize">{item.emotion}</span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({(item.confidence * 100).toFixed(0)}% Conf)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20 text-brand-300 font-medium">
                    {item.confidence_label}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(item.timestamp || new Date().toISOString())}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {item.modalities_used.includes('text') && (
                      <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">Text</span>
                    )}
                    {item.modalities_used.includes('audio') && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Audio</span>
                    )}
                    {item.modalities_used.includes('image') && (
                      <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">Vision</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 line-clamp-1 max-w-2xl pt-0.5">
                  {item.wellness_insight}
                </p>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRecord(item);
                }}
                className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 shrink-0"
              >
                <Eye className="h-3.5 w-3.5 text-brand-400" />
                <span>Inspect</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* DETAILED RECORD INSPECTION MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="academic-card p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] text-brand-400 font-semibold uppercase tracking-wider block">
                  Assessment Record #{selectedRecord.id || 'N/A'}
                </span>
                <h3 className="text-2xl font-bold text-white capitalize">{selectedRecord.emotion}</h3>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Confidence Score</span>
                  <span className="text-sm font-bold text-white font-mono">{(selectedRecord.confidence * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase block">Timestamp</span>
                  <span className="text-slate-300 font-mono">{formatDate(selectedRecord.timestamp || new Date().toISOString())}</span>
                </div>
              </div>

              {/* Unimodal Outputs */}
              <div className="space-y-2">
                <span className="font-semibold text-slate-300 block">Modality Encoder Projections:</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] font-semibold text-indigo-400 block uppercase">Text</span>
                    <span className="font-bold text-slate-200 capitalize">
                      {selectedRecord.modality_predictions.text?.emotion || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] font-semibold text-emerald-400 block uppercase">Audio</span>
                    <span className="font-bold text-slate-200 capitalize">
                      {selectedRecord.modality_predictions.audio?.emotion || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] font-semibold text-blue-400 block uppercase">Vision</span>
                    <span className="font-bold text-slate-200 capitalize">
                      {selectedRecord.modality_predictions.image?.emotion || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Wellness Insight */}
              <div className="space-y-1 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <span className="font-semibold text-slate-200 block">Clinical & Wellness Insight:</span>
                <p className="text-slate-300 leading-relaxed">{selectedRecord.wellness_insight}</p>
              </div>

              {/* Probability bars */}
              <div className="space-y-2 pt-2">
                <span className="font-semibold text-slate-300 block">Probability Breakdown:</span>
                <div className="space-y-1.5">
                  {Object.entries(selectedRecord.probabilities)
                    .sort((a, b) => b[1] - a[1])
                    .map(([emo, val]) => (
                      <div key={emo} className="space-y-0.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="capitalize text-slate-300">{emo}</span>
                          <span className="text-slate-400 font-mono">{(val * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div className="h-full bg-brand-500" style={{ width: `${val * 100}%` }} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
