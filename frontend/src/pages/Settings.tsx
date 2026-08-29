import React, { useState } from 'react';
import { 
  Shield, 
  Trash2, 
  Download, 
  Accessibility, 
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
    if (window.confirm("Are you sure you want to permanently delete all emotion history and check-ins? This cannot be undone.")) {
      setClearing(true);
      const response = await apiService.clearHistory();
      setClearing(false);
      if (response.success) {
        alert("All historical data has been cleared.");
      } else {
        alert("Failed to clear data: " + response.error?.message);
      }
    }
  };

  return (
    <div className="space-y-6 py-4 max-w-3xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Workspace Settings</h2>
        <p className="text-slate-400 text-sm">Manage privacy preferences, export assessment data, and verify platform specifications.</p>
      </div>

      {/* PRIVACY POLICY */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-indigo-400">
          <Shield className="h-5 w-5" />
          <h3 className="font-bold text-white text-base">Privacy-First Architecture</h3>
        </div>
        <p className="text-xs text-slate-350 leading-relaxed">
          MindSense is built with a local processing methodology. By default, raw webcam photos and audio voice recordings are processed in temporary server memory and immediately flushed post-inference. Only mathematical emotion features, probabilities, and wellness metrics are saved to the local SQLite database.
        </p>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <CheckCircle className="h-4 w-4 text-brand-400" />
          <span>Inputs are never synced to public cloud servers.</span>
        </div>
      </div>

      {/* DATA MANAGEMENT */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <SettingsIcon className="h-5 w-5" />
          <h3 className="font-bold text-white text-base">Data Management</h3>
        </div>
        <p className="text-xs text-slate-350">
          Download your complete history of wellness logs and classifier metrics as a JSON file, or permanently wipe database records.
        </p>
        
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={handleExportData}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow"
          >
            <Download className="h-4 w-4" /> Export History (JSON)
          </button>
          
          <button
            onClick={handleClearHistory}
            disabled={clearing}
            className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/15 disabled:bg-red-550/10 text-red-400 border border-red-500/20 font-semibold text-xs transition flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" /> {clearing ? 'Clearing...' : 'Wipe Database Cache'}
          </button>
        </div>
      </div>

      {/* ACCESSIBILITY CHECKLIST */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-blue-400">
          <Accessibility className="h-5 w-5" />
          <h3 className="font-bold text-white text-base">Accessibility Preferences</h3>
        </div>
        <p className="text-xs text-slate-350 leading-relaxed">
          MindSense complies with standard WCAG criteria. Color is never utilized as the sole classifier signifier; all predictions display absolute text categories and percentages. Focus indicators are styled with high-contrast outlines for keyboard navigatees.
        </p>
      </div>

      {/* PLATFORM HARDWARE AND SYSTEM DETAILS */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Cpu className="h-5 w-5" />
          <h3 className="font-bold text-white text-base">System Specifications</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs text-slate-350">
          <div>
            <p className="text-slate-500">Core Engine</p>
            <p className="font-semibold text-slate-200">MindSense v1.0.0</p>
          </div>
          <div>
            <p className="text-slate-500">Backend Web Server</p>
            <p className="font-semibold text-slate-200">FastAPI (Python 3+)</p>
          </div>
          <div>
            <p className="text-slate-500">Neural Network Framework</p>
            <p className="font-semibold text-slate-200">PyTorch (Intermediate Fusion)</p>
          </div>
          <div>
            <p className="text-slate-500">Database Engine</p>
            <p className="font-semibold text-slate-200">SQLite Local Cache</p>
          </div>
        </div>
      </div>
    </div>
  );
};
