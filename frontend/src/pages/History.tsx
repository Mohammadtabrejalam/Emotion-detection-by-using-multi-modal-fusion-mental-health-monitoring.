import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Eye, 
  Filter, 
  RefreshCw, 
  FileText, 
  Mic, 
  Camera, 
  Calendar,
  AlertCircle
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
      setErrorMsg(response.error?.message || "Failed to load history.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [currentUser]);

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to permanently delete all your emotion history and check-ins? This cannot be undone.")) {
      const response = await apiService.clearHistory(currentUser?.id);
      if (response.success) {
        setHistory([]);
        alert("All historical data has been cleared.");
      } else {
        alert("Failed to clear data: " + response.error?.message);
      }
    }
  };

  // Format timestamp helper
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

  // Filtered History computation
  const filteredHistory = history.filter(item => {
    const matchEmotion = emotionFilter === 'all' || item.emotion.toLowerCase() === emotionFilter.toLowerCase();
    const matchModality = modalityFilter === 'all' || item.modalities_used.includes(modalityFilter);
    return matchEmotion && matchModality;
  });

  return (
    <div className="space-y-6 py-4">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">History Logs</h2>
          <p className="text-slate-400 text-sm">Review, filter, and drill down into past emotional-state analyses.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition"
            title="Refresh History"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
          
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/15 text-red-400 border border-red-500/20 font-semibold text-sm transition flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" /> Clear Database
            </button>
          )}
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold uppercase tracking-wider pr-2">
            <Filter className="h-3.5 w-3.5" /> Filter by:
          </div>

          {/* Emotion filter */}
          <select
            value={emotionFilter}
            onChange={(e) => setEmotionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-brand-500"
          >
            <option value="all">All Emotions</option>
            {['happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral'].map(e => (
              <option key={e} value={e} className="capitalize">{e}</option>
            ))}
          </select>

          {/* Modality filter */}
          <select
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-brand-500"
          >
            <option value="all">All Modalities</option>
            <option value="text">Text Only</option>
            <option value="audio">Audio Only</option>
            <option value="image">Image Only</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing {filteredHistory.length} of {history.length} records
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* HISTORY TABLE */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="h-8 w-8 text-brand-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading historical data...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="glass-panel py-20 rounded-2xl border border-slate-800 text-center space-y-3">
          <Calendar className="h-10 w-10 text-slate-600 mx-auto" />
          <p className="text-slate-400 font-semibold">No records match your search criteria</p>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">Try resetting filters or click &quot;New Analysis&quot; to run an assessment.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Timestamp</th>
                  <th className="py-4 px-6">Modality Inputs</th>
                  <th className="py-4 px-6">Resulting Emotion</th>
                  <th className="py-4 px-6">Model Confidence</th>
                  <th className="py-4 px-6">Scope</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredHistory.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/20 transition-all">
                    {/* Timestamp */}
                    <td className="py-4.5 px-6 font-medium text-slate-300">
                      {formatDate(row.timestamp)}
                    </td>
                    
                    {/* Modalities Used Icons */}
                    <td className="py-4.5 px-6">
                      <div className="flex gap-2">
                        {row.modalities_used.includes('text') && (
                          <div className="p-1 bg-indigo-500/10 text-indigo-400 rounded" title="Text Input">
                            <FileText className="h-4 w-4" />
                          </div>
                        )}
                        {row.modalities_used.includes('audio') && (
                          <div className="p-1 bg-emerald-500/10 text-emerald-400 rounded" title="Audio Input">
                            <Mic className="h-4 w-4" />
                          </div>
                        )}
                        {row.modalities_used.includes('image') && (
                          <div className="p-1 bg-blue-500/10 text-blue-400 rounded" title="Image Input">
                            <Camera className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Final Emotion */}
                    <td className="py-4.5 px-6 capitalize font-semibold text-white">
                      {row.emotion}
                    </td>

                    {/* Confidence percentage */}
                    <td className="py-4.5 px-6 font-medium text-slate-300">
                      {(row.confidence * 100).toFixed(0)}%
                    </td>

                    {/* Scope label (is_demo indicator) */}
                    <td className="py-4.5 px-6">
                      {row.is_demo ? (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                          Simulated
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                          Trained
                        </span>
                      )}
                    </td>

                    {/* Actions button */}
                    <td className="py-4.5 px-6 text-center">
                      <button
                        onClick={() => setSelectedRecord(row)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-400 transition"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL DRAWER */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Analysis Report</span>
                <h3 className="text-xl font-bold text-white capitalize">{selectedRecord.emotion} Report</h3>
                <p className="text-xs text-slate-400 mt-1">{formatDate(selectedRecord.timestamp)}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-750"
              >
                Close
              </button>
            </div>

            {/* Model Confidence Overview */}
            <div className="grid md:grid-cols-2 gap-6 bg-slate-950/30 p-4 rounded-xl border border-slate-850">
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Classification Result</span>
                <p className="text-2xl font-bold text-white capitalize">{selectedRecord.emotion}</p>
                <p className="text-xs text-slate-400">Confidence Score: <span className="font-semibold text-slate-200">{(selectedRecord.confidence * 100).toFixed(0)}%</span></p>
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Pipeline Metadata</span>
                <p className="text-xs text-slate-300 font-medium">Model: {selectedRecord.model_version}</p>
                <p className="text-xs text-slate-350">Mode: {selectedRecord.is_demo ? 'Demo Simulation (Fallback)' : 'PyTorch Live Inference'}</p>
              </div>
            </div>

            {/* Wellness Insights */}
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-300 text-sm">System Insights</h4>
              <p className="text-slate-400 text-xs leading-relaxed">{selectedRecord.wellness_insight}</p>
            </div>

            {/* Modalities predictions comparison */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-300 text-sm">Unimodal Breakdown</h4>
              <div className="grid grid-cols-3 gap-3">
                {/* Text prediction card */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-center">
                  <p className="text-[9px] font-semibold text-indigo-400 uppercase tracking-wide">Text Modality</p>
                  {selectedRecord.modality_predictions.text ? (
                    <div className="mt-1">
                      <p className="text-sm font-bold text-white capitalize">{selectedRecord.modality_predictions.text.emotion}</p>
                      <p className="text-[10px] text-slate-500">{(selectedRecord.modality_predictions.text.confidence * 100).toFixed(0)}% Conf</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic py-2 mt-1">Not used</p>
                  )}
                </div>

                {/* Audio prediction card */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-center">
                  <p className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wide">Audio Modality</p>
                  {selectedRecord.modality_predictions.audio ? (
                    <div className="mt-1">
                      <p className="text-sm font-bold text-white capitalize">{selectedRecord.modality_predictions.audio.emotion}</p>
                      <p className="text-[10px] text-slate-500">{(selectedRecord.modality_predictions.audio.confidence * 100).toFixed(0)}% Conf</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic py-2 mt-1">Not used</p>
                  )}
                </div>

                {/* Image prediction card */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-center">
                  <p className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide">Image Modality</p>
                  {selectedRecord.modality_predictions.image ? (
                    <div className="mt-1">
                      <p className="text-sm font-bold text-white capitalize">{selectedRecord.modality_predictions.image.emotion}</p>
                      <p className="text-[10px] text-slate-500">{(selectedRecord.modality_predictions.image.confidence * 100).toFixed(0)}% Conf</p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic py-2 mt-1">Not used</p>
                  )}
                </div>
              </div>
            </div>

            {/* Probability spread */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-300 text-sm">Classifier Probability Output</h4>
              <div className="grid sm:grid-cols-2 gap-3 text-xs">
                {Object.entries(selectedRecord.probabilities)
                  .sort((a,b) => b[1] - a[1])
                  .map(([emo, val]) => (
                    <div key={emo} className="flex justify-between items-center bg-slate-950/20 px-3.5 py-2 rounded-lg border border-slate-850">
                      <span className="capitalize font-medium text-slate-300">{emo}</span>
                      <span className="font-bold text-white">{(val * 100).toFixed(0)}%</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Advisory disclaimer footer */}
            <p className="text-[10px] text-slate-500 border-t border-slate-800 pt-4 leading-relaxed italic text-center">
              {selectedRecord.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
