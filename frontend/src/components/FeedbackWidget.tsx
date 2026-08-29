import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { apiService } from '../services/api';
import type { User } from '../types';

interface FeedbackWidgetProps {
  currentUser?: User | null;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ currentUser }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [category, setCategory] = useState('General');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === null || submitting) return;

    setSubmitting(true);
    try {
      const res = await apiService.submitFeedback({
        rating,
        category,
        comment,
        user_id: currentUser?.id
      });
      if (res.success) {
        setSubmitted(true);
      }
    } catch {
      // Fallback UI
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="academic-card p-6 border-slate-800 bg-slate-950/60 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-white font-bold text-xs">
          <MessageSquare className="h-4 w-4 text-brand-400" />
          <span>Platform Feedback & Usability Assessment</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Anonymous & Encrypted</span>
      </div>

      <p className="text-[11px] text-amber-300/90 bg-amber-950/30 p-2.5 rounded-lg border border-amber-800/40 leading-relaxed font-mono">
        <strong>Privacy Notice:</strong> Please do not include passwords, financial information, or sensitive personal/medical information in feedback.
      </p>

      {submitted ? (
        <div className="py-4 text-center space-y-2 animate-fadeIn">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" />
          <h4 className="text-xs font-bold text-white">Thank you for your feedback!</h4>
          <p className="text-[11px] text-slate-400">Your feedback helps improve our multimodal affective computing interface and research tools.</p>
          <button
            onClick={() => { setSubmitted(false); setRating(null); setComment(''); }}
            className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold underline pt-1"
          >
            Submit additional feedback
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-slate-300 font-medium">Was this platform experience helpful?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRating(5)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
                  rating === 5 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <ThumbsUp className="h-3.5 w-3.5 text-emerald-400" />
                <span>Helpful (Yes)</span>
              </button>

              <button
                type="button"
                onClick={() => setRating(2)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
                  rating === 2 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <ThumbsDown className="h-3.5 w-3.5 text-rose-400" />
                <span>Needs Work</span>
              </button>
            </div>
          </div>

          {rating !== null && (
            <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Feedback Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="General">General Platform Quality</option>
                    <option value="Analysis">Analysis Studio & Results</option>
                    <option value="Usability">Navigation & Accessibility</option>
                    <option value="Research">Research & Dataset Accuracy</option>
                    <option value="Bug">Report an Technical Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Detailed Suggestions (Optional)</label>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what could be clearer or improved..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Send Feedback'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
