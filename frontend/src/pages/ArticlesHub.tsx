import React, { useState, useEffect } from 'react';
import { 
  Search, 
  PlusCircle, 
  BookOpen, 
  Heart, 
  Clock, 
  X, 
  Share2, 
  Check, 
  Trash2, 
  RefreshCw
} from 'lucide-react';
import { apiService } from '../services/api';
import type { Article, User } from '../types';

interface ArticlesHubProps {
  currentUser: User | null;
  onOpenLogin: () => void;
}

const CATEGORIES = [
  'All',
  'AI & Research',
  'Mental Wellness',
  'Speech & Acoustics',
  'Stress & Burnout',
  'Psychology'
];

export const ArticlesHub: React.FC<ArticlesHubProps> = ({ currentUser, onOpenLogin }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [showPostModal, setShowPostModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // New Article Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newAuthor, setNewAuthor] = useState<string>(currentUser ? currentUser.name : '');
  const [newCategory, setNewCategory] = useState<string>('Mental Wellness');
  const [newSummary, setNewSummary] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newTags, setNewTags] = useState<string>('Wellness, Affective AI');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadArticles = async () => {
    setIsLoading(true);
    const res = await apiService.getArticles(searchQuery, selectedCategory);
    if (res.success && res.data) {
      setArticles(res.data.articles);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadArticles();
  }, [selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadArticles();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLike = async (e: React.MouseEvent, articleId: number) => {
    e.stopPropagation();
    const res = await apiService.likeArticle(articleId);
    if (res.success && res.data) {
      setArticles(prev => prev.map(a => a.id === articleId ? { ...a, likes: res.data!.likes } : a));
      if (activeArticle && activeArticle.id === articleId) {
        setActiveArticle(prev => prev ? { ...prev, likes: res.data!.likes } : null);
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, articleId: number) => {
    e.stopPropagation();
    if (!window.confirm('Permanently delete this research publication?')) return;
    const res = await apiService.deleteArticle(articleId, currentUser?.id);
    if (res.success) {
      setArticles(prev => prev.filter(a => a.id !== articleId));
      if (activeArticle && activeArticle.id === articleId) {
        setActiveArticle(null);
      }
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSubmitting(true);
    const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean);

    const res = await apiService.publishArticle({
      user_id: currentUser?.id,
      title: newTitle.trim(),
      author: newAuthor.trim() || 'MindSense Contributor',
      category: newCategory,
      summary: newSummary.trim() || newContent.slice(0, 160) + '...',
      content: newContent.trim(),
      tags: tagsArray.length > 0 ? tagsArray : ['Research']
    });

    setIsSubmitting(false);

    if (res.success) {
      setShowPostModal(false);
      setNewTitle('');
      setNewSummary('');
      setNewContent('');
      loadArticles();
    } else {
      alert('Failed to publish: ' + (res.error?.message || 'Unknown error'));
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-8 py-2 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block mb-1">
            Research Repository & Clinical Insights
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Articles & Publications Hub
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Peer-reviewed perspectives, affective computing advancements, and evidence-based self-care literature.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (!currentUser) {
                onOpenLogin();
              } else {
                setShowPostModal(true);
              }
            }}
            className="px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow flex items-center gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Publish Article</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search publications..."
              className="w-full bg-slate-900/60 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-brand-500 font-sans placeholder-slate-500"
            />
          </div>

          {/* Category Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
          <RefreshCw className="h-6 w-6 text-brand-400 animate-spin" />
          <span>Fetching publications repository...</span>
        </div>
      ) : articles.length === 0 ? (
        <div className="academic-card p-12 text-center space-y-3">
          <BookOpen className="h-8 w-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Publications Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All' 
              ? 'No articles match your current category or search filters.' 
              : 'Be the first to publish a research perspective to the repository.'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <div
              key={art.id}
              onClick={() => setActiveArticle(art)}
              className="academic-card p-6 space-y-4 flex flex-col justify-between hover:border-slate-700 transition cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                    {art.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {art.read_time || '4 min'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition leading-snug">
                  {art.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {art.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span className="text-[11px] font-medium text-slate-300 truncate max-w-[130px]">
                  By {art.author}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => handleLike(e, art.id)}
                    className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-mono transition"
                    title="Like article"
                  >
                    <Heart className="h-3.5 w-3.5 fill-rose-500/20" />
                    <span>{art.likes}</span>
                  </button>

                  {currentUser && currentUser.id === art.user_id && (
                    <button
                      onClick={(e) => handleDelete(e, art.id)}
                      className="text-slate-500 hover:text-red-400 transition"
                      title="Delete publication"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ARTICLE READER MODAL */}
      {activeArticle && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="academic-card p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                  {activeArticle.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  {activeArticle.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                  <span>Author: <strong className="text-slate-200 font-medium">{activeArticle.author}</strong></span>
                  <span>•</span>
                  <span className="font-mono text-slate-500">{activeArticle.read_time || '4 min'} read</span>
                </div>
              </div>

              <button
                onClick={() => setActiveArticle(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Article Body */}
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
              {activeArticle.content}
            </div>

            {/* Tags */}
            {activeArticle.tags && activeArticle.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                {activeArticle.tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded border border-slate-800">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={(e) => handleLike(e, activeArticle.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition"
              >
                <Heart className="h-4 w-4 fill-rose-500/20" />
                <span>{activeArticle.likes} Likes</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center gap-1"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
                </button>

                <button
                  onClick={() => setActiveArticle(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* PUBLISH ARTICLE MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="academic-card p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Publish Research Perspective</h3>
              <button
                onClick={() => setShowPostModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePublish} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Evaluating Vagal Tone in Multimodal SER..."
                  className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Author Name</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="Your Name / Institution"
                    className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/60 focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none font-sans cursor-pointer"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c} className="bg-slate-900">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Abstract / Summary</label>
                <input
                  type="text"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Short 1-2 sentence overview of the publication..."
                  className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Full Content</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={6}
                  placeholder="Write the full research article or educational perspective..."
                  className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg p-3 text-xs text-slate-200 outline-none resize-none leading-relaxed font-sans"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Affective AI, Neuroscience, Mental Health"
                  className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Publication'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
