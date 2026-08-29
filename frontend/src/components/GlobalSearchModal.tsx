import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';

export interface SearchResultItem {
  id: string;
  title: string;
  category: 'Research' | 'Resources' | 'Help' | 'Features';
  description: string;
  action: () => void;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (pillar: 'home' | 'analyze' | 'insights' | 'research' | 'resources', subTab?: string) => void;
  onOpenHelp: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenHelp
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allItems: SearchResultItem[] = [
    {
      id: 'feat-live-analysis',
      title: 'Live Multimodal Analysis Studio',
      category: 'Features',
      description: 'Analyze text, audio, and webcam vision simultaneously via Intermediate Cross-Attention.',
      action: () => { onNavigate('analyze', 'live'); onClose(); }
    },
    {
      id: 'feat-media-processing',
      title: 'Signal & Media Preprocessing Tools',
      category: 'Features',
      description: 'Test audio spectral normalization, MFCC extraction, and facial bounding box isolation.',
      action: () => { onNavigate('analyze', 'media'); onClose(); }
    },
    {
      id: 'feat-trends',
      title: 'Longitudinal Trends & Wellness Indices',
      category: 'Features',
      description: 'View time-series charts of emotion distribution and self-reported wellness indices.',
      action: () => { onNavigate('insights', 'trends'); onClose(); }
    },
    {
      id: 'feat-history',
      title: 'Assessment History & Audit Logs',
      category: 'Features',
      description: 'Inspect previous multimodal classification logs, confidence scores, and modality breakdowns.',
      action: () => { onNavigate('insights', 'history'); onClose(); }
    },
    {
      id: 'feat-journal',
      title: 'Daily Reflection Journal',
      category: 'Features',
      description: 'Write private affective reflections tagged with mood indicators and export JSON logs.',
      action: () => { onNavigate('insights', 'journal'); onClose(); }
    },
    {
      id: 'feat-checkin',
      title: 'Daily Somatic Check-in',
      category: 'Features',
      description: 'Record quick 1-5 scalar self-assessments for mood, energy, sleep quality, and stress.',
      action: () => { onNavigate('insights', 'checkin'); onClose(); }
    },
    {
      id: 'res-overview',
      title: 'Methodology Overview & Theoretical Basis',
      category: 'Research',
      description: 'Read the foundational principles of multimodal intermediate cross-attention fusion.',
      action: () => { onNavigate('research', 'overview'); onClose(); }
    },
    {
      id: 'res-architecture',
      title: 'Neural Architecture & Ablation Studies',
      category: 'Research',
      description: 'Examine 1D CNN text encoders, 13-MFCC acoustic layers, 2D CNN facial models, and cross-modal attention matrices.',
      action: () => { onNavigate('research', 'architecture'); onClose(); }
    },
    {
      id: 'res-datasets',
      title: 'Benchmark Corpora (CREMA-D, RAVDESS, FER-2013, GoEmotions)',
      category: 'Research',
      description: 'Inspect gold-standard academic dataset splits, sample clips, and speaker isolation rules.',
      action: () => { onNavigate('research', 'datasets'); onClose(); }
    },
    {
      id: 'res-articles',
      title: 'Publications & Peer-Reviewed Literature',
      category: 'Resources',
      description: 'Browse academic publications and community research summaries on affective computing.',
      action: () => { onNavigate('resources', 'publications'); onClose(); }
    },
    {
      id: 'res-casestudies',
      title: 'Empirical Case Studies & Modality Failure Modes',
      category: 'Resources',
      description: 'Investigate edge cases such as sarcasm, suppressed facial cues, or acoustic strain.',
      action: () => { onNavigate('resources', 'casestudies'); onClose(); }
    },
    {
      id: 'res-awareness',
      title: 'Psychoeducation & Grounding Tools',
      category: 'Resources',
      description: 'Access somatic breathing exercises, stress management protocols, and crisis helplines.',
      action: () => { onNavigate('resources', 'awareness'); onClose(); }
    },
    {
      id: 'help-how-to-use',
      title: 'How to Use MindSense Walkthrough',
      category: 'Help',
      description: 'Step-by-step 7-stage guide for preparing inputs and interpreting confidence logits.',
      action: () => { onOpenHelp(); onClose(); }
    },
    {
      id: 'help-privacy',
      title: 'Privacy & Local Zero-Persistence Architecture',
      category: 'Help',
      description: 'Understand how microphone and camera buffers are kept local and volatile.',
      action: () => { onOpenHelp(); onClose(); }
    },
    {
      id: 'help-disclaimer',
      title: 'Clinical Scope & Non-Diagnostic Advisory',
      category: 'Help',
      description: 'Important notice clarifying that AI estimations do not constitute medical advice.',
      action: () => { onOpenHelp(); onClose(); }
    }
  ];

  const filteredItems = query.trim() === '' 
    ? allItems.slice(0, 6) 
    : allItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );

  const categories: Array<'Features' | 'Research' | 'Resources' | 'Help'> = ['Features', 'Research', 'Resources', 'Help'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fadeIn">
      <div className="academic-card w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 border-slate-700">
        
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/80">
          <Search className="h-5 w-5 text-brand-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search research, datasets, features, methodology, or help..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
            aria-label="Global search input"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white mr-2"
              aria-label="Clear search query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-[11px] font-mono font-bold text-slate-400 hover:text-white bg-slate-800 rounded border border-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Search className="h-8 w-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-300">No results found for "{query}"</p>
              <p className="text-[11px] text-slate-400">Try searching for keywords like "fusion", "CREMA-D", "privacy", "trends", or "audio".</p>
            </div>
          ) : query.trim() === '' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Suggested Shortcuts</span>
                <span className="font-mono">Use ↑ ↓ to navigate</span>
              </div>
              <div className="grid gap-2">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-brand-500/10 border border-slate-800 hover:border-brand-500/30 transition flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-brand-300 transition">
                          {item.title}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{item.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-brand-400 transition transform group-hover:translate-x-0.5 shrink-0 ml-3" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => {
                const categoryResults = filteredItems.filter(i => i.category === cat);
                if (categoryResults.length === 0) return null;
                return (
                  <div key={cat} className="space-y-2">
                    <h4 className="text-[11px] font-extrabold text-brand-400 uppercase tracking-wider border-b border-slate-800 pb-1">
                      {cat} ({categoryResults.length})
                    </h4>
                    <div className="grid gap-2">
                      {categoryResults.map((item) => (
                        <button
                          key={item.id}
                          onClick={item.action}
                          className="w-full text-left p-3 rounded-xl bg-slate-900/60 hover:bg-brand-500/10 border border-slate-800 hover:border-brand-500/30 transition flex items-center justify-between group"
                        >
                          <div className="space-y-0.5">
                            <h5 className="text-xs font-bold text-white group-hover:text-brand-300 transition">
                              {item.title}
                            </h5>
                            <p className="text-[11px] text-slate-400 leading-relaxed">{item.description}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-brand-400 transition shrink-0 ml-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Search Footer */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center font-mono">
          <span>Search MindSense Research Knowledgebase</span>
          <span>Press ESC to close</span>
        </div>

      </div>
    </div>
  );
};
