import React from 'react';
import { 
  ShieldAlert, 
  Download, 
  Lock, 
  UserCheck, 
  AlertTriangle,
  Scale
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

interface RulesPageProps {
  onBack: () => void;
}

export const RulesPage: React.FC<RulesPageProps> = ({ onBack }) => {
  return (
    <div className="space-y-10 max-w-5xl mx-auto font-sans">
      
      {/* Page Header */}
      <PageHeader
        title="Platform Rules, Regulations & Acceptable Use Policy"
        description="Official operational guidelines, biometric data privacy standards, consent requirements, and non-medical research disclosures."
        onBack={onBack}
        backLabel="Back to Home"
        breadcrumbs={[
          { label: 'Home', onClick: onBack },
          { label: 'Rules & Regulations' }
        ]}
      >
        <a
          href="/MindSense_How_to_Use_Rules_and_Regulations.pdf"
          download="MindSense_How_to_Use_Rules_and_Regulations.pdf"
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-2 shadow transition"
        >
          <Download className="h-4 w-4" />
          <span>Download PDF Guide</span>
        </a>
      </PageHeader>

      {/* NON-MEDICAL MANDATORY DISCLOSURE BANNER */}
      <div className="p-5 rounded-2xl bg-amber-950/50 border border-amber-800/80 text-amber-200 text-xs space-y-2">
        <div className="flex items-center gap-2 font-extrabold text-amber-300 uppercase tracking-wider text-xs">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
          <span>Mandatory Regulatory Disclosures</span>
        </div>
        <ul className="space-y-1.5 text-amber-200/90 leading-relaxed text-[11px] font-medium">
          <li>• <strong>MindSense is NOT a medical diagnostic system.</strong> AI emotion estimates must never be used as a psychiatric diagnosis or clinical assessment.</li>
          <li>• <strong>Do NOT use MindSense to make high-impact decisions</strong> regarding employment, insurance, academic status, or legal proceedings.</li>
          <li>• <strong>Do NOT upload another individual's biometric media</strong> (audio or facial images) without explicit written authorization and consent.</li>
          <li>• <strong>Do NOT fabricate research conclusions</strong> or claim clinical validation from AI predictions.</li>
        </ul>
      </div>

      {/* RULES SECTIONS GRID */}
      <div className="grid md:grid-cols-2 gap-6 text-xs">
        
        {/* 1. ACCEPTABLE USE & CONSENT */}
        <div className="academic-card p-6 space-y-3">
          <div className="flex items-center gap-2 text-brand-400 font-bold text-sm uppercase tracking-wider">
            <UserCheck className="h-4.5 w-4.5" />
            <span>1. Acceptable Use & Consent</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            MindSense is provided for academic affective computing research, educational exploration, and self-reflective wellness monitoring. Users agree to submit only data they own or have permission to process.
          </p>
        </div>

        {/* 2. BIOMETRIC DATA PRIVACY */}
        <div className="academic-card p-6 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
            <Lock className="h-4.5 w-4.5" />
            <span>2. Data Privacy & Storage</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Input audio streams and webcam photo frames are processed in volatile memory for feature extraction (13 MFCCs and 48x48 pixel matrix) and are NOT retained as raw persistent media files. Assessment history stores only numerical Softmax scores.
          </p>
        </div>

        {/* 3. PROHIBITED USE CASES */}
        <div className="academic-card p-6 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm uppercase tracking-wider">
            <AlertTriangle className="h-4.5 w-4.5" />
            <span>3. Prohibited Use Cases</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Users are strictly prohibited from using MindSense for unauthorized surveillance, emotion-based discrimination, automated hiring evaluation, deceptive research reporting, or harassing third parties.
          </p>
        </div>

        {/* 4. RESPONSIBLE AI & RESEARCH INTEGRITY */}
        <div className="academic-card p-6 space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm uppercase tracking-wider">
            <Scale className="h-4.5 w-4.5" />
            <span>4. Responsible AI & Research Standards</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            When publishing academic literature using MindSense output, researchers must explicitly report the model version (v1.3 Fused Cross-Attention), baseline dataset constraints (CREMA-D, RAVDESS, FER-2013), and inherent AI probability limitations.
          </p>
        </div>

      </div>

      {/* SHARING & ACCOUNT SECURITY */}
      <div className="academic-card p-6 space-y-4">
        <h3 className="font-bold text-white text-sm uppercase tracking-wider">5. Safe Sharing & Account Security Regulations</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed text-[11px]">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-white block">Safe Link Sharing</span>
            <p>Shared analysis links use random server-side tokens (`share_links`). URLs never contain raw media, passwords, or authentication credentials. Owners may revoke links at any time.</p>
          </div>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-white block">Account Sovereignty</span>
            <p>Users maintain full sovereignty over their records. You may wipe assessment history or export assessment records at any time from System Settings.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
