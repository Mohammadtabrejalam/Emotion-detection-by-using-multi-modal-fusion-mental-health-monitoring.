import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Check, 
  X, 
  Lock, 
  AlertCircle, 
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { apiService } from '../services/api';
import type { AnalysisData, User } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisData | null;
  currentUser?: User | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  result,
  currentUser
}) => {
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [expirationHours, setExpirationHours] = useState<number>(24);
  const [loading, setLoading] = useState<boolean>(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<boolean>(false);

  if (!isOpen || !result) return null;

  const handleGenerateLink = async () => {
    if (!consentGiven) {
      setErrorMsg("Please review and confirm explicit consent before generating a share link.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const response = await apiService.createShareLink(
      result.id,
      expirationHours,
      currentUser?.id
    );

    if (response.success && response.data) {
      const fullUrl = `${window.location.origin}/#/shared-result/${response.data.share_token}`;
      setShareToken(response.data.share_token);
      setShareUrl(fullUrl);
    } else {
      setErrorMsg(response.error?.message || "Failed to create share link.");
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleRevoke = async () => {
    if (!shareToken) return;
    setRevoking(true);
    const res = await apiService.revokeShareLink(shareToken);
    if (res.success) {
      setShareToken(null);
      setShareUrl(null);
      alert("Share link revoked successfully.");
    } else {
      alert("Failed to revoke link: " + (res.error?.message || "Unknown error"));
    }
    setRevoking(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn font-sans">
      <div className="academic-card p-6 max-w-lg w-full shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Share2 className="h-4 w-4 text-brand-400" />
            <span>Generate Secure Share Link</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sanitization Notice */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Privacy Protection Guarantee
          </span>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            The shared page will display <strong>only</strong> the emotion classification ({result.emotion}), confidence score, and modality list. No raw audio files, webcam photos, passwords, or personal identity details will be exposed.
          </p>
        </div>

        {/* Step 1: Explicit Consent */}
        <div className="space-y-2 text-xs">
          <label className="flex items-start gap-2.5 cursor-pointer text-slate-300 select-none bg-slate-950 p-3 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-brand-600 focus:ring-brand-500 h-4 w-4 bg-slate-900"
            />
            <span className="text-[11px] leading-relaxed">
              I explicitly consent to creating a public view link containing only sanitized affect predictions. I confirm I am authorized to share this assessment.
            </span>
          </label>
        </div>

        {/* Step 2: Expiration Selector */}
        {!shareUrl && (
          <div className="space-y-1.5 text-xs">
            <label className="font-semibold text-slate-300 block">Link Expiration Duration</label>
            <select
              value={expirationHours}
              onChange={(e) => setExpirationHours(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none"
            >
              <option value={24}>24 Hours (Recommended)</option>
              <option value={168}>7 Days</option>
              <option value={720}>30 Days</option>
              <option value={0}>Never Expire</option>
            </select>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Generated Link Display */}
        {shareUrl ? (
          <div className="space-y-3 pt-1 animate-fadeIn">
            <label className="text-xs font-bold text-emerald-400 block">Secure Link Generated:</label>
            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent w-full outline-none text-slate-200 truncate text-[11px]"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-sans text-xs font-bold shrink-0 transition flex items-center gap-1"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex justify-between items-center pt-2 text-xs">
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Revoke Link Now</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleGenerateLink}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition shadow flex items-center justify-center gap-2"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Generate Link</span>
          </button>
        )}

      </div>
    </div>
  );
};
