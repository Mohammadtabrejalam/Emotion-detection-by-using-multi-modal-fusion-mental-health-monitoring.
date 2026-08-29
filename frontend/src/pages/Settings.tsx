import React, { useState } from 'react';
import { 
  Shield, 
  Trash2, 
  Download, 
  Settings as SettingsIcon,
  CheckCircle,
  Cpu
} from 'lucide-react';
import { apiService } from '../services/api';

export const Settings: React.FC = () => {
  const [clearing, setClearing] = useState<boolean>(false);

  const handleExportData = async () => {
    try {
      const response = await apiService.getHistory();
      if (response.success && response.data) {
        const historyJson = JSON.stringify(response.data.history, null, 2);
        const blob = new Blob([historyJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `mindsense_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert("Export failed: " + (response.error?.message || "No history data found."));
      }
    } catch (err: any) {
      alert("Failed to download file: " + err.message);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Permanently wipe all emotion history and check-ins? This cannot be undone.")) {
      setClearing(true);
      const response = await apiService.clearHistory();
      setClearing(false);
      if (response.success) {
        alert("All historical assessment records have been cleared.");
      } else {
        alert("Failed to clear data: " + response.error?.message);
      }
    }
  };

  return (
    <div className="space-y-6 py-2 max-w-3xl mx-auto">
      <div>
        <p className="text-xs text-slate-400">Manage privacy preferences, export assessment records, and inspect platform specifications.</p>
      </div>

      {/* PRIVACY POLICY */}
      <div className="academic-card p-6 space-y-3">
        <div className="flex items-center gap-2 text-indigo-400">
          <Shield className="h-4.5 w-4.5" />
          <h3 className="font-bold text-white text-sm">Privacy-First Architecture</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          MindSense is engineered with local zero-persistence inference. Raw webcam captures and speech audio streams are processed strictly in temporary volatile memory and flushed immediately post-classification. Only numerical emotion vectors, probabilities, and wellness metrics are persisted to the local SQLite database.
        </p>
        <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium pt-1">
          <CheckCircle className="h-4 w-4" />
          <span>Biometric media files are never transferred to public cloud storage.</span>
        </div>
      </div>

      {/* DATA MANAGEMENT */}
      <div className="academic-card p-6 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <SettingsIcon className="h-4.5 w-4.5" />
          <h3 className="font-bold text-white text-sm">Data Export & Storage Management</h3>
        </div>
        <p className="text-xs text-slate-400">
          Download your complete history of wellness logs, notes, and classifier logits as a JSON file, or permanently wipe local database records.
        </p>
        
        <div className="flex flex-wrap gap-2.5 pt-2">
          <button
            onClick={handleExportData}
            className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export History (JSON)</span>
          </button>
          
          <button
            onClick={handleClearHistory}
            disabled={clearing}
            className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 text-red-400 border border-red-500/20 font-medium text-xs transition flex items-center gap-2"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{clearing ? 'Clearing...' : 'Wipe Database Cache'}</span>
          </button>
        </div>
      </div>

      {/* SYSTEM TECH SPECS */}
      <div className="academic-card p-6 space-y-3">
        <div className="flex items-center gap-2 text-blue-400">
          <Cpu className="h-4.5 w-4.5" />
          <h3 className="font-bold text-white text-sm">System Platform Specifications</h3>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-400 pt-1">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-300 font-semibold block">Client Stack</span>
            <p className="text-[11px]">React 19, TypeScript, Vite, Tailwind CSS</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-300 font-semibold block">Inference Engine</span>
            <p className="text-[11px]">PyTorch 2.0+, FastAPI, SciPy 16kHz DSP</p>
          </div>
        </div>
      </div>

    </div>
  );
};
