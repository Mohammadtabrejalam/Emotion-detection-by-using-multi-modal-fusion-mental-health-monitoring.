import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  FileText, 
  Mic, 
  Camera, 
  Layers, 
  Database,
  BookOpen,
  Heart,
  Sun,
  Moon,
  Info,
  Menu,
  X,
  Shield,
  Sliders
} from 'lucide-react';
import { MindSenseLogo } from './components/MindSenseLogo';
import { Analysis } from './pages/Analysis';
import { History } from './pages/History';
import { Trends } from './pages/Trends';
import { Checkin } from './pages/Checkin';
import { Research } from './pages/Research';
import { Settings } from './pages/Settings';
import { DailyNotes } from './pages/DailyNotes';
import { AuthPage } from './pages/AuthPage';
import { AccountSettings } from './pages/AccountSettings';
import { MentalHealthAwareness } from './pages/MentalHealthAwareness';
import { DatasetHub } from './pages/DatasetHub';
import { ProblemScenarios } from './pages/ProblemScenarios';
import { AboutOverview } from './pages/AboutOverview';
import { AdobeStudio } from './pages/AdobeStudio';
import { ArticlesHub } from './pages/ArticlesHub';
import { HomeHealthAndAbout } from './components/HomeHealthAndAbout';
import type { User } from './types';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'about' | 'scenarios' | 'awareness' | 'datasets' | 'notes' | 'adobe' | 'articles' | 'settings' | 'auth'>('home');
  const [activeModal, setActiveModal] = useState<'checkin' | 'config' | null>(null);
  const [studioText, setStudioText] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  
  // Light / Dark Theme State
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('mindsense_theme') === 'light';
  });

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mindsense_theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark');
      localStorage.setItem('mindsense_theme', 'dark');
    }
  }, [isLightMode]);

  // Persistent User State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('mindsense_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      id: 1,
      username: 'guest_user',
      email: 'guest@mindsense.ai',
      name: 'Demo Explorer'
    };
  });

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('mindsense_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mindsense_user');
    setCurrentView('home');
  };

  const handleLoadTestPrompt = (text: string) => {
    setStudioText(text);
    setCurrentView('home');
    setTimeout(() => {
      const el = document.getElementById('analyzer');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const scrollTo = (id: string) => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', action: () => { setCurrentView('home'); scrollTo('hero'); } },
    { id: 'about', label: 'Overview', action: () => setCurrentView('about') },
    { id: 'analyzer', label: 'Live Studio', action: () => { setCurrentView('home'); scrollTo('analyzer'); } },
    { id: 'scenarios', label: 'Case Studies', action: () => setCurrentView('scenarios') },
    { id: 'awareness', label: 'Clinical Signs', action: () => setCurrentView('awareness') },
    { id: 'datasets', label: 'Datasets', action: () => setCurrentView('datasets') },
    { id: 'notes', label: 'Journal', action: () => setCurrentView('notes') },
    { id: 'articles', label: 'Publications', action: () => setCurrentView('articles') },
    { id: 'adobe', label: 'Pre-Processing', action: () => setCurrentView('adobe') },
  ];

  // Full-Page Auth View
  if (currentView === 'auth') {
    return (
      <AuthPage 
        currentUser={currentUser} 
        onLoginSuccess={handleLoginSuccess} 
        onNavigateHome={() => setCurrentView('home')} 
      />
    );
  }

  return (
    <div className="min-h-screen font-sans antialiased transition-colors duration-200">
      
      {/* 1. TOP INSTITUTIONAL NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Brand Identity */}
            <div 
              className="flex items-center gap-3 cursor-pointer select-none group" 
              onClick={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              title="MindSense Academic Research Initiative"
            >
              <div className="p-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 group-hover:border-brand-500/40 transition">
                <MindSenseLogo size={28} />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight text-white group-hover:text-brand-400 transition">
                    MindSense
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    Research
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-normal tracking-tight hidden sm:block">
                  Multimodal Emotion & Mental Health AI
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-slate-300">
              {navItems.map((item) => {
                const isActive = currentView === item.id || (item.id === 'home' && currentView === 'home');
                return (
                  <button 
                    key={item.id}
                    onClick={() => {
                      item.action();
                      setMobileMenuOpen(false);
                    }} 
                    className={`px-3 py-2 rounded-md transition-all ${
                      isActive 
                        ? 'text-white bg-slate-800 font-semibold shadow-sm' 
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Quick Actions & Utilities */}
            <div className="flex items-center gap-2">
              
              {/* Theme Toggle Button */}
              <button
                onClick={() => setIsLightMode(!isLightMode)}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
                title={isLightMode ? "Switch to Dark Theme" : "Switch to Light Theme"}
                aria-label="Toggle theme"
              >
                {isLightMode ? <Moon className="h-4 w-4 text-indigo-600" /> : <Sun className="h-4 w-4 text-amber-400" />}
              </button>

              {/* Quick Daily Check-in */}
              <button
                onClick={() => setActiveModal('checkin')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
              >
                <Heart className="h-3.5 w-3.5 text-rose-400" />
                <span>Daily Check-in</span>
              </button>

              {/* User Profile / Auth */}
              {currentUser ? (
                <button
                  onClick={() => setCurrentView('settings')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                    currentView === 'settings' 
                      ? 'bg-brand-600 text-white border-brand-500 shadow' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title="Account Profile"
                >
                  <div className="h-5 w-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold uppercase">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="max-w-[90px] truncate hidden md:inline">
                    {currentUser.name}
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => setCurrentView('auth')}
                  className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs transition shadow-sm"
                >
                  Sign In
                </button>
              )}

              {/* System Config Modal Trigger */}
              <button
                onClick={() => setActiveModal('config')}
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
                title="System Configuration"
                aria-label="Settings"
              >
                <Sliders className="h-4 w-4" />
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 lg:hidden"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-slate-800 py-3 space-y-1 animate-fadeIn">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition ${
                    currentView === item.id ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center px-2">
                <button
                  onClick={() => {
                    setActiveModal('checkin');
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-brand-400 font-medium py-1"
                >
                  Daily Check-in →
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. DYNAMIC PAGE ROUTING VIEWS */}
      
      {/* VIEW: ABOUT / RESEARCH OVERVIEW */}
      {currentView === 'about' && (
        <main className="px-4 sm:px-6 lg:px-8 py-10 max-w-6xl mx-auto">
          <AboutOverview onStartAnalysis={() => { setCurrentView('home'); scrollTo('analyzer'); }} />
        </main>
      )}

      {/* VIEW: CASE SCENARIOS */}
      {currentView === 'scenarios' && (
        <main className="px-4 sm:px-6 lg:px-8 py-10 max-w-6xl mx-auto">
          <ProblemScenarios onLoadScenario={handleLoadTestPrompt} />
        </main>
      )}

      {/* VIEW: CLINICAL SIGNS & MENTAL HEALTH AWARENESS */}
      {currentView === 'awareness' && (
        <main className="px-4 sm:px-6 lg:px-8 py-10 max-w-6xl mx-auto">
          <MentalHealthAwareness />
        </main>
      )}

      {/* VIEW: DATASET BENCHMARK HUB */}
      {currentView === 'datasets' && (
        <main className="px-4 sm:px-6 lg:px-8 py-10 max-w-6xl mx-auto">
          <DatasetHub onLoadSample={handleLoadTestPrompt} />
        </main>
      )}

      {/* VIEW: DAILY MOOD JOURNAL */}
      {currentView === 'notes' && (
        <main className="px-4 sm:px-6 lg:px-8 py-10 max-w-6xl mx-auto">
          <DailyNotes currentUser={currentUser} onOpenLogin={() => setCurrentView('auth')} />
        </main>
      )}

      {/* VIEW: PRE-PROCESSING STUDIO */}
      {currentView === 'adobe' && (
        <main className="px-4 sm:px-6 lg:px-8 py-10 max-w-6xl mx-auto">
          <AdobeStudio onSendToAnalyzer={(quote) => handleLoadTestPrompt(quote || '')} />
        </main>
      )}

      {/* VIEW: ARTICLES & RESEARCH PUBLICATIONS */}
      {currentView === 'articles' && (
        <main className="px-4 sm:px-6 lg:px-8 py-10 max-w-6xl mx-auto">
          <ArticlesHub 
            currentUser={currentUser} 
            onOpenLogin={() => setCurrentView('auth')} 
          />
        </main>
      )}

      {/* VIEW: ACCOUNT SETTINGS */}
      {currentView === 'settings' && (
        <main className="px-4 sm:px-6 lg:px-8 py-10 max-w-5xl mx-auto">
          <AccountSettings 
            currentUser={currentUser} 
            onUpdateUser={(updated) => {
              setCurrentUser(updated);
              localStorage.setItem('mindsense_user', JSON.stringify(updated));
            }}
            onLogout={handleLogout}
            onOpenLogin={() => setCurrentView('auth')}
          />
        </main>
      )}

      {/* VIEW: HOME / VERTICAL RESEARCH LABORATORY */}
      {currentView === 'home' && (
        <main className="space-y-16">
          
          {/* HERO SECTION */}
          <section id="hero" className="relative pt-16 pb-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 overflow-hidden">
            <div className="max-w-5xl mx-auto text-center space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider">
                <Shield className="h-3.5 w-3.5 text-brand-400" />
                <span>Multimodal Affective Computing & Mental Health Research</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Multimodal Emotion Detection & <br />
                <span className="text-gradient">Mental Health Monitoring</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
                MindSense investigates cross-modal affective synthesis across <strong className="text-slate-200">Written Text</strong>, <strong className="text-slate-200">Speech Acoustics</strong>, and <strong className="text-slate-200">Facial Micro-Expressions</strong> using an Intermediate Cross-Attention Transformer network to overcome unimodal bias and social expression masking.
              </p>

              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  onClick={() => scrollTo('analyzer')}
                  className="px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs tracking-wide uppercase transition shadow-md flex items-center gap-2"
                >
                  <Activity className="h-4 w-4" />
                  <span>Launch Live Studio</span>
                </button>
                <button
                  onClick={() => setCurrentView('about')}
                  className="px-5 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs tracking-wide transition flex items-center gap-2"
                >
                  <Info className="h-4 w-4 text-slate-400" />
                  <span>System Architecture</span>
                </button>
                <button
                  onClick={() => setCurrentView('scenarios')}
                  className="px-5 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs tracking-wide transition flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4 text-slate-400" />
                  <span>Explore Case Studies</span>
                </button>
              </div>

              {/* Research Metrics Summary Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 max-w-4xl mx-auto">
                <div className="academic-card p-5 text-center">
                  <span className="text-3xl font-extrabold text-white block">3</span>
                  <span className="text-xs text-slate-400 font-medium">Synchronized Modalities</span>
                </div>
                <div className="academic-card p-5 text-center">
                  <span className="text-3xl font-extrabold text-brand-400 block">79.5%</span>
                  <span className="text-xs text-slate-400 font-medium">Multimodal Accuracy</span>
                </div>
                <div className="academic-card p-5 text-center">
                  <span className="text-3xl font-extrabold text-indigo-400 block">+18.3%</span>
                  <span className="text-xs text-slate-400 font-medium">Gain Over Unimodal Text</span>
                </div>
                <div className="academic-card p-5 text-center">
                  <span className="text-3xl font-extrabold text-emerald-400 block">100%</span>
                  <span className="text-xs text-slate-400 font-medium">Volatile RAM Privacy</span>
                </div>
              </div>

            </div>
          </section>

          {/* LIVE MULTIMODAL ANALYZER WORKSPACE */}
          <section id="analyzer" className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block mb-1">
                    Interactive Research Laboratory
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Live Multimodal Analysis
                  </h2>
                </div>
                <div className="text-xs text-slate-400">
                  {currentUser ? (
                    <span>Logged in as <strong className="text-brand-300">@{currentUser.username}</strong></span>
                  ) : (
                    <button onClick={() => setCurrentView('auth')} className="text-brand-400 hover:underline">
                      Sign in to isolate history to your personal profile
                    </button>
                  )}
                </div>
              </div>

              <Analysis currentUser={currentUser} initialText={studioText} />
            </div>
          </section>

          {/* TECHNOLOGY STACK */}
          <section id="technology" className="py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
            <div className="max-w-6xl mx-auto space-y-10">
              
              <div className="text-center space-y-2 max-w-3xl mx-auto">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">
                  Neural Pipeline
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Unimodal Encoders & Cross-Attention Transformer
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Specialized neural feature extraction pipelines project heterogeneous inputs into a unified 64-dimensional semantic space.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Tech Card 1: NLP */}
                <div className="academic-card p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg w-fit border border-indigo-500/20">
                      <FileText className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-white">1. NLP Text Encoder</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Custom dictionary tokenizer (1,000 vocab) mapped to a 64-dimensional Word Embedding with 1D Convolutional layers and Adaptive Max Pooling for lexical valence.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-800 text-[11px] text-indigo-400 font-mono">
                    Output: [Batch, 64] Vector
                  </div>
                </div>

                {/* Tech Card 2: SER Audio */}
                <div className="academic-card p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg w-fit border border-emerald-500/20">
                      <Mic className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-white">2. Speech Acoustics (SER)</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Downsamples raw speech to 16kHz mono, extracts 13 Mel-Frequency Cepstral Coefficients (MFCCs) over 25ms windows, and computes prosody via 3-layer 1D CNN with BatchNorm.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-800 text-[11px] text-emerald-400 font-mono">
                    Output: [Batch, 200, 13] MFCC
                  </div>
                </div>

                {/* Tech Card 3: Computer Vision */}
                <div className="academic-card p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg w-fit border border-blue-500/20">
                      <Camera className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-white">3. Facial Vision CNN</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Utilizes OpenCV Haar Cascades for face alignment, crops to 48x48 grayscale, and processes micro-expressions through a multi-stage 2D CNN with MaxPool.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-800 text-[11px] text-blue-400 font-mono">
                    Output: [Batch, 1, 48, 48]
                  </div>
                </div>

                {/* Tech Card 4: Fusion Transformer */}
                <div className="academic-card p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="p-2.5 bg-brand-500/10 text-brand-400 rounded-lg w-fit border border-brand-500/20">
                      <Layers className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-white">4. Fusion Transformer</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Treats modality projections as a 3-token sequence with learned positional embeddings. Dynamic boolean padding masks prevent missing inputs from distorting self-attention.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-800 text-[11px] text-brand-400 font-mono">
                    Softmax: [7 Emotion Classes]
                  </div>
                </div>

              </div>

              {/* Architecture Infrastructure Specifications */}
              <div className="academic-card p-6 grid md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs uppercase tracking-wider">
                    <Layers className="h-4 w-4" /> Frontend Client Stack
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    React 19, TypeScript, Vite, Tailwind CSS, MediaRecorder Audio Stream API, and WebRTC Camera Canvas API.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                    <Activity className="h-4 w-4" /> AI & Backend Service
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Python 3.10+, FastAPI Web Server, PyTorch 2.0+ Fusion Model, SciPy FFT DSP engine, and OpenCV Haar Cascades.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                    <Database className="h-4 w-4" /> Persistence & Auth
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Isolated user profiles with SHA-256 password hashing, audit history, SQLite storage, and zero media storage.
                  </p>
                </div>
              </div>

            </div>
          </section>

          {/* PROJECT DEEP-DIVE */}
          <section id="explanation" className="py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
            <div className="max-w-5xl mx-auto space-y-8">
              
              <div className="space-y-2">
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block">
                  Methodology & Theoretical Framework
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Why Multimodal Fusion Outperforms Single Modalities
                </h2>
              </div>

              <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
                
                {/* 1. Unimodal Ambiguity */}
                <div className="academic-card p-6 md:p-8 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-brand-400">1.</span> The Real-World Ambiguity of Single-Modality Classifiers
                  </h3>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                    Individual modalities are frequently insufficient to accurately decode affective human states:
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 text-xs text-slate-400 pt-2">
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                      <strong className="text-indigo-400 block font-semibold">Text & Sarcasm:</strong>
                      Written statements lack acoustic prosody. Positive words like &quot;just perfect&quot; can conceal intense frustration.
                    </div>
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                      <strong className="text-emerald-400 block font-semibold">Acoustic Ambiguity:</strong>
                      Acoustic loudness cannot reliably separate joy from rage without syntactic semantic anchoring.
                    </div>
                    <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                      <strong className="text-blue-400 block font-semibold">Facial Suppression:</strong>
                      Individuals routinely maintain neutral facial expressions in professional settings despite severe subjective fatigue.
                    </div>
                  </div>
                </div>

                {/* 2. Cross-Attention Mathematics */}
                <div className="academic-card p-6 md:p-8 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-brand-400">2.</span> Mathematical Formulation: Intermediate Cross-Attention
                  </h3>
                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                    Rather than Early Fusion (raw feature concatenation vulnerable to dimensional curse) or Late Fusion (independent score averaging without cross-modal context), MindSense implements Intermediate Cross-Attention with dynamic availability masking:
                  </p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs md:text-sm text-brand-300 text-center py-4">
                    Attention(Q, K, V) = Softmax( (Q · Kᵀ) / √dₖ + M_mask ) · V
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Where <code className="text-slate-200 font-mono font-semibold">M_mask</code> enforces mathematical isolation of missing modalities with $-\infty$, guaranteeing that unavailable sensors do not inject false zero-bias artifacts into the sequence representation.
                  </p>
                </div>

              </div>

            </div>
          </section>

          {/* RESEARCH METRICS */}
          <section id="research" className="py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block mb-1">
                  Empirical Verification
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Ablation Benchmarks & Confusion Matrix
                </h2>
              </div>

              <Research />
            </div>
          </section>

          {/* TRENDS & HISTORY */}
          <section id="trends" className="py-8 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
            <div className="max-w-6xl mx-auto space-y-12">
              
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest block mb-1">
                    Longitudinal Monitoring
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Emotional Trends & Wellness Progression
                  </h2>
                </div>
                <Trends currentUser={currentUser} />
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-800">
                <div className="border-b border-slate-800 pb-4">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest block mb-1">
                    Historical Assessment Records
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    {currentUser ? `@${currentUser.username}'s Assessment Log` : 'Assessment Records'}
                  </h2>
                </div>
                <History currentUser={currentUser} />
              </div>

            </div>
          </section>

          {/* LOWER ARTICLES, CHECKLIST, FAQS & DIRECTORY */}
          <section className="px-4 sm:px-6 lg:px-8 border-t border-slate-800">
            <HomeHealthAndAbout 
              onNavigateArticles={() => { setCurrentView('articles'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onNavigateNotes={() => { setCurrentView('notes'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onNavigateAwareness={() => { setCurrentView('awareness'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </section>

        </main>
      )}

      {/* FOOTER */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 bg-slate-950 text-xs text-slate-400 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => { setCurrentView('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            title="MindSense Research Platform"
          >
            <div className="p-1 rounded-lg bg-brand-500/10">
              <MindSenseLogo size={24} />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm block">MindSense AI</span>
              <span className="text-[10px] text-slate-500">Affective Computing Research Laboratory</span>
            </div>
          </div>

          <p className="text-center md:text-left text-[11px] leading-relaxed max-w-xl text-slate-400">
            <strong>Research Notice:</strong> MindSense is an academic multimodal affective research system. It does not provide medical or clinical psychiatric diagnosis. In case of acute emotional distress, please contact qualified medical professionals or call/text <strong>988</strong> (Lifeline).
          </p>

          <div className="text-[11px] text-slate-500 font-mono">
            Platform Release v1.4.0 (Academic Edition)
          </div>
        </div>
      </footer>

      {/* SYSTEM MODALS */}
      {activeModal === 'checkin' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="academic-card p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-400" /> Daily Wellness Check-in
              </h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                Close
              </button>
            </div>
            <Checkin currentUser={currentUser} />
          </div>
        </div>
      )}

      {activeModal === 'config' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="academic-card p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="h-5 w-5 text-brand-400" /> Platform Configuration & Privacy
              </h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              >
                Close
              </button>
            </div>
            <Settings />
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
