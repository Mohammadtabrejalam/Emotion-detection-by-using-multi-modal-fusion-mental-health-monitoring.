import React from 'react';
import { PageHeader } from '../components/PageHeader';

interface PrivacyPageProps {
  onBack: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto font-sans">
      <PageHeader
        title="Privacy Architecture & Data Protection"
        description="Comprehensive breakdown of how MindSense handles user data, research sample storage, retention policies, and data subject rights."
        onBack={onBack}
        backLabel="Back to Home"
        breadcrumbs={[
          { label: 'Home', onClick: onBack },
          { label: 'Privacy' }
        ]}
      />

      <div className="academic-card p-6 md:p-8 space-y-6 text-xs text-slate-300 leading-relaxed">
        
        <div className="border-b border-slate-800 pb-4 space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
            Privacy Policy Version 1.4
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">1. Data Ownership & Governance</h2>
          <p className="text-slate-400">
            All user data, including personal assessment history, daily check-ins, and private journal notes, belongs strictly to the individual user. MindSense does not sell, rent, or monetize user data.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-white text-sm">2. Information We Collect</h3>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
            <li><strong>Account Identifiers:</strong> Username, hashed password, and email address for session authentication.</li>
            <li><strong>Affective Input Samples:</strong> Text snippets, vocal audio streams, or facial frame images submitted during active analysis sessions.</li>
            <li><strong>Longitudinal Logs:</strong> Feeling, energy, sleep, and stress scores submitted during daily check-ins.</li>
            <li><strong>Research Contributions (Optional):</strong> Demographics and questionnaire responses contributed during explicit `/participate` consent workflows.</li>
          </ul>
        </div>

        <div className="space-y-3 border-t border-slate-800 pt-4">
          <h3 className="font-bold text-white text-sm">3. Separation of Application & Research Data</h3>
          <p className="text-slate-400">
            Standard application usage data is kept completely isolated from scientific research participation datasets. Research data is stored under anonymized participant codes (e.g. `PAR-49201`) without attaching personal email or username fields.
          </p>
        </div>

        <div className="space-y-3 border-t border-slate-800 pt-4">
          <h3 className="font-bold text-white text-sm">4. Data Subject Rights (Export & Deletion)</h3>
          <p className="text-slate-400">
            Under your Account Settings (`/settings`), you can exercise your full data rights at any time:
          </p>
          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <strong className="text-white block font-sans">Download My Data</strong>
              <p className="text-[11px] text-slate-400">Export your complete analysis history, check-ins, and journal entries in a structured JSON file.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <strong className="text-white block font-sans">Delete My Account</strong>
              <p className="text-[11px] text-slate-400">Permanently purge your account, hashed credentials, and all historical records from SQLite storage.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-800 pt-4">
          <h3 className="font-bold text-white text-sm">5. Non-Clinical Safety Disclaimer</h3>
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/60 text-amber-200 space-y-1">
            <p className="font-semibold">
              MindSense is an experimental research system for studying multimodal emotional expression. Predictions are computational estimates and do NOT constitute medical advice or psychological diagnosis.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
