import React, { useState } from 'react';
import { 
  Shield, 
  Trash2, 
  Download, 
  Settings as SettingsIcon,
  CheckCircle,
  Cpu,
  UserX
} from 'lucide-react';
import { apiService } from '../services/api';

export const Settings: React.FC = () => {
  const [clearing, setClearing] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  const handleExportCompleteData = async () => {
    try {
      const response = await apiService.exportUserData();
      if (response.success && response.data?.export) {
        const historyJson = JSON.stringify(response.data.export, null, 2);
        const blob = new Blob([historyJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `mindsense_user_data_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert("Export failed: " + (response.error?.message || "User data not found. Please sign in."));
      }
    } catch (err: any) {
      alert("Failed to download file: " + err.message);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Permanently clear your emotion analysis history and check-ins? This action cannot be undone.")) {
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

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt("WARNING: This will permanently delete your account and purge all associated assessment records, daily notes, and research samples. Type 'DELETE' to confirm:");
    if (confirmation === 'DELETE') {
      setDeleting(true);
      const response = await apiService.deleteUserAccount();
      setDeleting(false);
      if (response.success) {
        alert("Your account and all associated data have been permanently deleted.");
        window.location.hash = '#/home';
        window.location.reload();
      } else {
        alert("Account deletion failed: " + response.error?.message);
      }
    }
  };

  return (
    <div className="space-y-6 py-2 max-w-3xl mx-auto font-sans">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">System Settings & Data Subject Rights</h2>
        <p className="text-xs text-slate-400 mt-1">Manage privacy preferences, export assessment records, or permanently delete your research account.</p>
      </div>

      {/* PRIVACY POLICY */}
      <div className="academic-card p-6 space-y-3">
        <div className="flex items-center gap-2 text-indigo-400">
          <Shield className="h-4.5 w-4.5" />
          <h3 className="font-bold text-white text-sm">Privacy & Security Controls</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          MindSense is engineered with zero-persistence media processing. Audio streams and facial visual frames are evaluated in temporary memory and discarded post-inference. Only numerical classifier probabilities and user check-ins are saved under authenticated session identity.
        </p>
        <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium pt-1">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>No unauthenticated IDOR exposure. User identity derived strictly from session tokens.</span>
        </div>
      </div>

      {/* DATA SUBJECT RIGHTS */}
      <div className="academic-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <SettingsIcon className="h-4.5 w-4.5" />
          <h3 className="font-bold text-white text-sm">Data Rights & Export Management</h3>
        </div>
        <p className="text-xs text-slate-400">
          Exercise your data rights under research confidentiality guidelines. Download a complete structured JSON copy of your records, or purge database history.
        </p>
        
        <div className="flex flex-wrap gap-3 pt-1">
          <button
            onClick={handleExportCompleteData}
            className="px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow"
          >
            <Download className="h-4 w-4" />
            <span>Download My Data (JSON)</span>
          </button>

          <button
            onClick={handleClearHistory}
            disabled={clearing}
            className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-medium text-xs transition flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4 text-amber-400" />
            <span>{clearing ? 'Clearing...' : 'Clear Assessment History'}</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="px-4 py-2.5 rounded-lg bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/60 disabled:opacity-40 text-rose-300 font-bold text-xs transition flex items-center gap-2"
          >
            <UserX className="h-4 w-4 text-rose-400" />
            <span>{deleting ? 'Deleting...' : 'Delete My Account & Data'}</span>
          </button>
        </div>
      </div>

      {/* SYSTEM TECH SPECS */}
      <div className="academic-card p-6 space-y-3">
        <div className="flex items-center gap-2 text-blue-400">
          <Cpu className="h-4.5 w-4.5" />
          <h3 className="font-bold text-white text-sm">System Platform Specifications</h3>
        </div>
        
        <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-400 pt-1 font-mono">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-300 font-semibold block">Client Architecture</span>
            <p className="text-[11px]">React 19, TypeScript, Vite, Tailwind CSS</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-300 font-semibold block">Inference Engine</span>
            <p className="text-[11px]">PyTorch Multimodal Transformer, FastAPI</p>
          </div>
        </div>
      </div>

    </div>
  );
};

