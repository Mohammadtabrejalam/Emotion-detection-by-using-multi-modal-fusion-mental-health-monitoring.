import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  BookOpen, 
  Shield, 
  BrainCircuit, 
  ChevronDown, 
  ChevronRight,
  Accessibility,
  Lock,
  MessageSquare
} from 'lucide-react';
import { HowToUse } from './HowToUse';
import { FeedbackWidget } from './FeedbackWidget';
import type { User } from '../types';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartAnalysis: () => void;
  onExploreResearch: () => void;
  currentUser?: User | null;
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({
  isOpen,
  onClose,
  onStartAnalysis,
  onExploreResearch,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'faq' | 'privacy' | 'clinical' | 'accessibility' | 'feedback'>('guide');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const faqs = [
    {
      q: "What is MindSense?",
      a: "MindSense is a multimodal AI research and wellness-monitoring platform that analyzes emotional signals from text, speech audio, and visual face micro-expressions using an Intermediate Cross-Attention Transformer."
    },
    {
      q: "Is MindSense a medical diagnostic tool?",
      a: "No. MindSense is designed strictly for academic research, affective computing experiments, and self-reflection. It is NOT a medical device and does NOT replace professional psychiatric or medical evaluation."
    },
    {
      q: "What does the confidence score mean?",
      a: "Confidence represents the Softmax output probability computed by our fused neural network model across 7 affect classes. High confidence indicates mathematical model certainty based on your provided inputs, NOT a clinical diagnosis."
    },
    {
      q: "What modalities can I analyze?",
      a: "You can analyze any combination of Text (typed text statement), Audio (microphone recording or uploaded .wav file), and Image (webcam snap or facial photo). MindSense uses dynamic availability masking to process whichever inputs you provide."
    },
    {
      q: "How is my audio and camera data handled?",
      a: "MindSense adheres to local zero-persistence inference. Raw audio buffers and camera frames are processed in temporary volatile memory and flushed immediately after feature extraction. No raw facial images or audio recordings are saved."
    },
    {
      q: "Where can I view my past analyses and trends?",
      a: "Under the 'Insights' tab in the top navigation, you can inspect your longitudinal trends, assessment history logs, daily mood reflections, and somatic check-ins."
    },
    {
      q: "Which benchmark datasets are used for model evaluation?",
      a: "Our models are evaluated against CREMA-D (crowd-sourced multimodal audio-visual), RAVDESS (validated North American speech/song), FER-2013 (in-the-wild facial crops), and GoEmotions (Reddit comments) under strict speaker-isolated splits."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn font-sans">
      <div className="academic-card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl space-y-0 border-slate-700">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Help & Documentation Center
              </h2>
              <p className="text-xs text-slate-400">User guide, operational principles, FAQs, privacy, and accessibility</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close Help Center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-1 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'guide' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>How to Use</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'faq' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>FAQ</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'privacy' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Data Privacy</span>
          </button>

          <button
            onClick={() => setActiveTab('clinical')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'clinical' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Clinical Scope</span>
          </button>

          <button
            onClick={() => setActiveTab('accessibility')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'accessibility' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Accessibility className="h-3.5 w-3.5" />
            <span>Accessibility</span>
          </button>

          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === 'feedback' ? 'bg-brand-600 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Feedback</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: HOW TO USE */}
          {activeTab === 'guide' && (
            <HowToUse 
              onStartAnalysis={() => { onStartAnalysis(); onClose(); }}
              onExploreResearch={() => { onExploreResearch(); onClose(); }}
            />
          )}

          {/* TAB 2: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="border-b border-slate-800 pb-2">
                <h3 className="text-lg font-bold text-white">Frequently Asked Questions</h3>
                <p className="text-xs text-slate-400">Common inquiries regarding multimodal affective computing and system capabilities.</p>
              </div>

              <div className="space-y-2">
                {faqs.map((faq, idx) => {
                  const isOpenItem = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="academic-card p-4 hover:border-slate-700 transition space-y-2 cursor-pointer"
                      onClick={() => setOpenFaqIndex(isOpenItem ? null : idx)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-xs sm:text-sm font-bold text-white">{faq.q}</h4>
                        {isOpenItem ? <ChevronDown className="h-4 w-4 text-brand-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />}
                      </div>
                      {isOpenItem && (
                        <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-800/80 animate-fadeIn">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: DATA PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 max-w-3xl mx-auto text-xs text-slate-300">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">How Your Data is Handled</h3>
                <p className="text-slate-400">MindSense prioritizes transparency and zero-persistence biometric privacy.</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="academic-card p-5 space-y-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                    <Lock className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Volatile Media Processing</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Webcam frames and microphone audio streams are preprocessed in local ephemeral memory to extract numerical feature tensors (MFCC matrices and 48x48 pixel tensors) and are purged immediately after execution.
                  </p>
                </div>

                <div className="academic-card p-5 space-y-2">
                  <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 w-fit">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Stored Assessment History</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Only numerical Softmax output classification logits, timestamp metadata, and private journal entries (if saved to your account) are stored in your SQLite database. You can purge history logs at any time under Settings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLINICAL SCOPE */}
          {activeTab === 'clinical' && (
            <div className="space-y-6 max-w-3xl mx-auto text-xs text-slate-300">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Clinical Scope & Crisis Support</h3>
                <p className="text-slate-400">Essential research boundaries and emergency support hotlines.</p>
              </div>

              <div className="p-6 rounded-2xl bg-rose-950/60 border border-rose-800/80 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                  <Shield className="h-5 w-5 text-rose-400" />
                  <span>Immediate Crisis Support Resources</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  If you are experiencing severe emotional distress, self-harm thoughts, or crisis, please utilize these free 24/7 confidential services:
                </p>
                <ul className="space-y-1 text-slate-200 font-mono text-[11px]">
                  <li>• <strong>USA & Canada:</strong> Call or text <strong>988</strong> (Suicide & Crisis Lifeline)</li>
                  <li>• <strong>Crisis Text Line:</strong> Text <strong>HOME</strong> to <strong>741741</strong></li>
                  <li>• <strong>International Resources:</strong> Visit <a href="https://findahelpline.com" target="_blank" rel="noreferrer" className="text-brand-300 underline">findahelpline.com</a></li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: ACCESSIBILITY */}
          {activeTab === 'accessibility' && (
            <div className="space-y-6 max-w-3xl mx-auto text-xs text-slate-300">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Accessibility Features</h3>
                <p className="text-slate-400">Designed to conform with WCAG 2.1 AA accessibility guidelines.</p>
              </div>

              <div className="academic-card p-5 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Accessibility className="h-4 w-4 text-brand-400" />
                  <span>Implemented Standards</span>
                </div>
                <ul className="space-y-2 text-slate-400">
                  <li>• <strong>Semantic HTML Structure:</strong> Heading hierarchy (`h1`-`h4`), landmarks (`header`, `main`, `footer`), and ARIA labels.</li>
                  <li>• <strong>Keyboard Navigation:</strong> Focus indicators across all interactive inputs, buttons, modals, and search triggers (`Cmd/Ctrl+K`).</li>
                  <li>• <strong>44px Interactive Target Standard:</strong> Touch and button targets meet minimum recommended dimensions.</li>
                  <li>• <strong>Zoom Resilience:</strong> Tested for responsive fluid reflow at 200%+ browser zoom without horizontal scrolling.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 6: FEEDBACK */}
          {activeTab === 'feedback' && (
            <div className="max-w-3xl mx-auto">
              <FeedbackWidget currentUser={currentUser} />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>MindSense Research Platform Help System</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
          >
            Close Documentation
          </button>
        </div>

      </div>
    </div>
  );
};
