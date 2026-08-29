import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Sparkles
} from 'lucide-react';
import { apiService } from '../services/api';
import type { DailyNote, User } from '../types';

interface DailyNotesProps {
  currentUser: User | null;
  onOpenLogin: () => void;
}

const MOOD_TAGS = [
  { label: '🌟 Grateful', value: 'grateful', color: 'border-amber-500/30 text-amber-300 bg-amber-500/10' },
  { label: '🧘 Calm & Centered', value: 'calm', color: 'border-blue-500/30 text-blue-300 bg-blue-500/10' },
  { label: '⚡ Focused & Energetic', value: 'energetic', color: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10' },
  { label: '🌿 Reflective', value: 'reflective', color: 'border-indigo-500/30 text-indigo-300 bg-indigo-500/10' },
  { label: '🌧️ Overwhelmed / Stressed', value: 'stressed', color: 'border-red-500/30 text-red-300 bg-red-500/10' },
  { label: '😴 Low Energy / Depleted', value: 'tired', color: 'border-purple-500/30 text-purple-300 bg-purple-500/10' },
];

export const DailyNotes: React.FC<DailyNotesProps> = ({ currentUser, onOpenLogin }) => {
  const [notes, setNotes] = useState<DailyNote[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('grateful');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchNotes = async () => {
    if (!currentUser) return;
    setLoading(true);
    const res = await apiService.getDailyNotes(currentUser.id);
    if (res.success && res.data) {
      setNotes(res.data.notes);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotes();
    } else {
      setNotes([]);
    }
  }, [currentUser]);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    if (!title.trim() || !content.trim()) {
      setErrorMsg("Please provide both a reflection title and body content.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await apiService.saveDailyNote(currentUser.id, date, title.trim(), content.trim(), selectedMood);
    setSubmitting(false);

    if (res.success) {
      setSuccessMsg("Reflection recorded in your private daily journal.");
      setTitle('');
      setContent('');
      fetchNotes();
      setTimeout(() => setSuccessMsg(null), 3500);
    } else {
      setErrorMsg(res.error?.message || "Failed to save journal reflection.");
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!currentUser) return;
    if (window.confirm("Permanently remove this reflection entry?")) {
      const res = await apiService.deleteDailyNote(id, currentUser.id);
      if (res.success) {
        setNotes(prev => prev.filter(n => n.id !== id));
      } else {
        alert("Failed to delete note: " + res.error?.message);
      }
    }
  };

  const handleExportNotes = () => {
    if (notes.length === 0) return;
    const jsonStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindsense_journal_${currentUser?.username || 'user'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.mood_tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 py-2">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block mb-1">
            Subjective Longitudinal Reflection
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Daily Journal & Thought Capture
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Record qualitative reflections and environmental triggers to correlate with multimodal model assessments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {notes.length > 0 && (
            <button
              onClick={handleExportNotes}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export (JSON)</span>
            </button>
          )}
        </div>
      </div>

      {!currentUser ? (
        <div className="academic-card p-8 text-center space-y-4 max-w-xl mx-auto my-8">
          <BookOpen className="h-10 w-10 text-brand-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Sign In to Maintain a Private Journal</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your daily reflections are private and tied exclusively to your personal user account profile.
          </p>
          <button
            onClick={onOpenLogin}
            className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow"
          >
            Sign In / Register Profile
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* LEFT: Journal Entry Form */}
          <div className="lg:col-span-5 space-y-4">
            <form onSubmit={handleSaveNote} className="academic-card p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-sm text-white flex items-center gap-2">
                  <Plus className="h-4 w-4 text-brand-400" /> New Journal Entry
                </span>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700/60 rounded-lg px-2.5 py-1 text-xs text-slate-300 outline-none focus:border-brand-500 font-mono"
                />
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Entry Focus / Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cognitive fatigue, Work breakthrough, Reflection..."
                  className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* Mood Tag Selection */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Affect Category Tag
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MOOD_TAGS.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setSelectedMood(t.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border text-left truncate transition ${
                        selectedMood === t.value 
                          ? `${t.color} font-bold ring-1 ring-brand-500` 
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content textarea */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Qualitative Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder="Record triggers, physical sensations, or things you feel grateful for..."
                  className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg p-3 text-xs text-slate-200 outline-none resize-none leading-relaxed font-sans"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow"
              >
                {submitting ? 'Saving entry...' : 'Save Reflection Entry'}
              </button>
            </form>
          </div>

          {/* RIGHT: Saved Reflections Feed */}
          <div className="lg:col-span-7 space-y-3">
            
            {/* Search Bar */}
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reflections by keyword or mood tag..."
                className="bg-transparent text-white outline-none w-full placeholder-slate-500 font-sans"
              />
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">Loading journal records...</div>
            ) : filteredNotes.length === 0 ? (
              <div className="academic-card p-12 text-center space-y-2">
                <Sparkles className="h-7 w-7 text-slate-500 mx-auto" />
                <p className="text-slate-300 font-semibold text-xs">No reflections found</p>
                <p className="text-slate-500 text-xs max-w-xs mx-auto">
                  {searchQuery ? "No journal entries match your query." : "Write your first entry on the left to begin journaling."}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                {filteredNotes.map((note) => {
                  const tagMeta = MOOD_TAGS.find(t => t.value === note.mood_tag) || { label: note.mood_tag, color: 'text-slate-400 bg-slate-800' };
                  return (
                    <div key={note.id} className="academic-card p-4 space-y-2 transition hover:border-slate-700">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{note.title}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${tagMeta.color}`}>
                              {tagMeta.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {note.date}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 text-slate-400 hover:text-red-400 transition"
                          title="Delete reflection"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
