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
  ArrowRight,
  Filter
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
  const [newTags, setNewTags] = useState<string>('Wellness, Mindfulness');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);

  // Fetch articles on load and when category changes
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

  // Debounced search handler
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
    if (!window.confirm('Are you sure you want to delete this article?')) return;
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
    const tagList = newTags.split(',').map(t => t.trim()).filter(Boolean);

    const res = await apiService.publishArticle({
      user_id: currentUser?.id,
      title: newTitle,
      author: newAuthor || (currentUser ? currentUser.name : 'Community Contributor'),
      category: newCategory,
      summary: newSummary || newContent.substring(0, 140) + '...',
      content: newContent,
      tags: tagList.length > 0 ? tagList : ['General']
    });

    setIsSubmitting(false);

    if (res.success) {
      setPublishSuccess(true);
      setTimeout(() => {
        setPublishSuccess(false);
        setShowPostModal(false);
        setNewTitle('');
        setNewSummary('');
        setNewContent('');
        loadArticles();
      }, 1200);
    }
  };

  const copyShare = (title: string) => {
    navigator.clipboard.writeText(`${window.location.origin} - Read "${title}" on MindSense Community`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Category Color Map
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'AI & Research':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Mental Wellness':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Speech & Acoustics':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Stress & Burnout':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Psychology':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-10 py-6 max-w-6xl mx-auto">
      
      {/* 1. HERO & ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <BookOpen className="h-3.5 w-3.5 text-brand-400" /> Community Knowledge Hub
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Mental Health & AI Articles
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Explore peer-written guides on multimodal emotion detection, stress resilience, speech acoustics, and cognitive wellness.
          </p>
        </div>

        {/* Publish Button */}
        <button
          onClick={() => {
            if (!currentUser) {
              onOpenLogin();
            } else {
              setShowPostModal(true);
            }
          }}
          className="px-6 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-xl shadow-brand-600/25 flex items-center gap-2 transition hover:-translate-y-0.5"
        >
          <PlusCircle className="h-4 w-4" /> Post New Article
        </button>
      </div>

      {/* 2. SEARCH BAR & CATEGORY PILLS */}
      <div className="space-y-4">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search articles by title, topic, author, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3.5 bg-slate-950/80 border border-slate-800 focus:border-brand-500 rounded-2xl text-xs text-white placeholder:text-slate-500 outline-none shadow-inner transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0 ml-1" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition border ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-600/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* 3. ARTICLES GRID */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-panel p-6 rounded-3xl border border-slate-800 animate-pulse h-56 space-y-4">
              <div className="h-4 bg-slate-800 rounded w-1/3" />
              <div className="h-6 bg-slate-800 rounded w-3/4" />
              <div className="h-12 bg-slate-800 rounded w-full" />
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl border border-slate-800 space-y-4">
          <BookOpen className="h-12 w-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Articles Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            We couldn&apos;t find any articles matching &ldquo;{searchQuery}&rdquo;. Try another search or publish your own!
          </p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-brand-400 hover:text-brand-300"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {articles.map((article) => (
            <div
              key={article.id}
              onClick={() => setActiveArticle(article)}
              className="glass-panel glass-panel-hover p-6 md:p-7 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between cursor-pointer group"
            >
              <div className="space-y-3.5">
                
                {/* Meta Top: Category & Read Time */}
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getCategoryBadge(article.category)}`}>
                    {article.category}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {article.read_time}
                  </span>
                </div>

                {/* Article Title */}
                <h3 className="text-xl font-bold text-white group-hover:text-brand-300 transition line-clamp-2">
                  {article.title}
                </h3>

                {/* Summary */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {article.summary}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {article.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-950/80 border border-slate-850 px-2.5 py-0.5 rounded-lg text-slate-400">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Meta Bottom: Author, Likes & Read Action */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center text-[10px] font-bold uppercase">
                    {article.author.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-slate-300 max-w-[140px] truncate">
                    {article.author}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Like Button */}
                  <button
                    onClick={(e) => handleLike(e, article.id)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-xs text-pink-400 transition"
                  >
                    <Heart className="h-3.5 w-3.5 fill-pink-500/20" />
                    <span className="font-mono text-[11px]">{article.likes}</span>
                  </button>

                  <span className="text-xs font-bold text-brand-400 flex items-center gap-1 group-hover:translate-x-1 transition">
                    Read <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. POST ARTICLE MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest block">Author Portal</span>
                <h3 className="text-2xl font-extrabold text-white">Publish New Article</h3>
              </div>
              <button 
                onClick={() => setShowPostModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {publishSuccess ? (
              <div className="py-12 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-bold text-white">Article Published!</h4>
                <p className="text-xs text-slate-400">Your article is now live in the Community Knowledge Hub.</p>
              </div>
            ) : (
              <form onSubmit={handlePublish} className="space-y-4 text-xs">
                
                {/* Title */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Article Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Understanding Cross-Attention in Emotional AI"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-4 py-2.5 text-white outline-none"
                  />
                </div>

                {/* Author & Category */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Author Name</label>
                    <input
                      type="text"
                      placeholder="Your name or organization"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-4 py-2.5 text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-300">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-4 py-2.5 text-white outline-none"
                    >
                      {CATEGORIES.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Quick Summary (1-2 sentences)</label>
                  <input
                    type="text"
                    placeholder="Brief description of what readers will learn..."
                    value={newSummary}
                    onChange={(e) => setNewSummary(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-4 py-2.5 text-white outline-none"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. AI, Multimodal, Speech, Wellness"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-4 py-2.5 text-white outline-none"
                  />
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Full Article Content *</label>
                  <textarea
                    required
                    rows={8}
                    placeholder="Write your article, research breakdown, or mental wellness guide here..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl p-4 text-slate-200 outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-lg transition"
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish Article'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

      {/* 5. FULL ARTICLE READER MODAL */}
      {activeArticle && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 max-w-3xl w-full shadow-2xl relative max-h-[92vh] overflow-y-auto space-y-6">
            
            {/* Header / Actions */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getCategoryBadge(activeArticle.category)}`}>
                {activeArticle.category}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyShare(activeArticle.title)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition"
                  title="Share Article"
                >
                  {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
                </button>
                
                {currentUser && activeArticle.user_id === currentUser.id && (
                  <button
                    onClick={(e) => handleDelete(e, activeArticle.id)}
                    className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                    title="Delete Article"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                <button 
                  onClick={() => setActiveArticle(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Article Headline & Author */}
            <div className="space-y-3">
              <h2 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
                {activeArticle.title}
              </h2>
              
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold uppercase">
                    {activeArticle.author.charAt(0)}
                  </div>
                  <div>
                    <strong className="text-slate-200 block">{activeArticle.author}</strong>
                    <span className="text-[11px] text-slate-500">{activeArticle.created_at?.split('T')[0]}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="h-3.5 w-3.5" /> {activeArticle.read_time}
                  </span>
                  <button
                    onClick={(e) => handleLike(e, activeArticle.id)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold transition hover:bg-pink-500/20"
                  >
                    <Heart className="h-4 w-4 fill-pink-500/30" />
                    <span>{activeArticle.likes}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Lead */}
            <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/15 text-xs md:text-sm text-brand-200 font-medium leading-relaxed italic">
              &ldquo;{activeArticle.summary}&rdquo;
            </div>

            {/* Full Body Content */}
            <div className="text-slate-300 text-sm leading-relaxed space-y-4 whitespace-pre-line border-t border-slate-800/80 pt-6">
              {activeArticle.content}
            </div>

            {/* Tags Footer */}
            <div className="flex flex-wrap gap-2 pt-6 border-t border-slate-800">
              {activeArticle.tags.map((t, idx) => (
                <span key={idx} className="text-xs bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl text-slate-400">
                  #{t}
                </span>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
