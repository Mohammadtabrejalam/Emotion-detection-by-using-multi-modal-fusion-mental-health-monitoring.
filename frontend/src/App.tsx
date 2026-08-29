import { useState, useEffect } from 'react';
import { 
  Activity, 
  FileText, 
  Mic, 
  Camera, 
  Cpu, 
  AlertTriangle, 
  Layers, 
  Sparkles, 
  Lock, 
  Database,
  BookOpen,
  Heart,
  Sun,
  Moon,
  Info
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
import { apiService } from './services/api';
import type { User } from './types';

export const App: React.FC = () => {
  const [backendAlive, setBackendAlive] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<'home' | 'about' | 'scenarios' | 'awareness' | 'datasets' | 'notes' | 'adobe' | 'settings' | 'auth'>('home');
  const [activeModal, setActiveModal] = useState<'checkin' | 'config' | null>(null);
  const [studioText, setStudioText] = useState<string>('');
  
  // Light / Dark Theme State
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('mindsense_theme') === 'light';
  });

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('mindsense_theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
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

  useEffect(() => {
    const ping = async () => {
      const isHealthy = await apiService.checkHealth();
      setBackendAlive(isHealthy);
    };
    ping();
    const interval = setInterval(ping, 10000);
    return () => clearInterval(interval);
  }, []);

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

  // FULL-PAGE AUTH VIEW
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
    <div className={`min-h-screen font-sans selection:bg-brand-500/30 selection:text-brand-200 transition-colors duration-300 ${isLightMode ? 'light-theme bg-slate-50 text-slate-900' : 'bg-[#070a13] text-slate-100'}`}>
      
      {/* 1. STICKY TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-[#070a13]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Logo & Brand (Clicking opens the Plain-English About Page!) */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => setCurrentView('about')}
            title="Click to view simple explanation of MindSense"
          >
            <div className="p-1 rounded-2xl bg-brand-500/10 border border-brand-500/20 group-hover:border-brand-500/40 transition">
              <MindSenseLogo size={32} />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block leading-none group-hover:text-brand-300 transition">
                MindSense
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide flex items-center gap-1">
                <Info className="h-2.5 w-2.5 text-brand-400" /> Click to Learn What It Is
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 text-xs font-medium text-slate-300">
            <button 
              onClick={() => { setCurrentView('home'); scrollTo('hero'); }} 
              className={`px-3 py-2 rounded-lg transition ${currentView === 'home' ? 'text-white bg-slate-800/80 font-bold' : 'hover:text-white hover:bg-slate-800/60'}`}
            >
              Home
            </button>
            <button 
              onClick={() => setCurrentView('about')} 
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${currentView === 'about' ? 'text-brand-300 bg-brand-500/10 border border-brand-500/20 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}
            >
              <Info className="h-3.5 w-3.5 text-brand-400" /> Simple Overview
            </button>
            <button 
              onClick={() => { setCurrentView('home'); scrollTo('analyzer'); }} 
              className="px-3 py-2 rounded-lg hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5 text-brand-300 font-semibold"
            >
              <Activity className="h-3.5 w-3.5 text-brand-400" /> Live Studio
            </button>
            <button 
              onClick={() => setCurrentView('scenarios')} 
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${currentView === 'scenarios' ? 'text-amber-300 bg-amber-500/10 border border-amber-500/20 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Problem Purpose
            </button>
            <button 
              onClick={() => setCurrentView('awareness')} 
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${currentView === 'awareness' ? 'text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}
            >
              <Heart className="h-3.5 w-3.5 text-indigo-400" /> Symptoms Guide
            </button>
            <button 
              onClick={() => setCurrentView('datasets')} 
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${currentView === 'datasets' ? 'text-blue-300 bg-blue-500/10 border border-blue-500/20 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}
            >
              <Database className="h-3.5 w-3.5 text-blue-400" /> Real Datasets
            </button>
            <button 
              onClick={() => setCurrentView('notes')} 
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${currentView === 'notes' ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}
            >
              <BookOpen className="h-3.5 w-3.5 text-emerald-400" /> Daily Notes
            </button>
            <button 
              onClick={() => setCurrentView('adobe')} 
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${currentView === 'adobe' ? 'text-pink-300 bg-pink-500/10 border border-pink-500/20 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'}`}
            >
              <Sparkles className="h-3.5 w-3.5 text-pink-400" /> Adobe Studio
            </button>
          </nav>

          {/* Action, Theme & User Status */}
          <div className="flex items-center gap-2.5">
            
            {/* LIGHT / DARK THEME TOGGLE BUTTON */}
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-slate-700/80 text-xs transition flex items-center gap-1"
              title={isLightMode ? "Switch to Dark Theme" : "Switch to Light Theme"}
            >
              {isLightMode ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px]">
              <span className={`h-2 w-2 rounded-full ${backendAlive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-slate-400">{backendAlive ? 'API Live' : 'API Offline'}</span>
            </div>

            {/* Quick Check-in Button */}
            <button
              onClick={() => setActiveModal('checkin')}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition"
            >
              Daily Check-in
            </button>

            {/* User Profile / Settings Button */}
            {currentUser ? (
              <button
                onClick={() => setCurrentView('settings')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                  currentView === 'settings' 
                    ? 'bg-brand-600 text-white border-brand-500 shadow-lg' 
                    : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700/80'
                }`}
              >
                <div className="h-5 w-5 rounded-full bg-brand-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {currentUser.name.charAt(0)}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline">
                  {currentUser.name}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentView('auth')}
                className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg transition"
              >
                Sign In
              </button>
            )}

            <button
              onClick={() => setActiveModal('config')}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs transition"
              title="System Config"
            >
              ⚙
            </button>
          </div>
        </div>
      </header>

      {/* 2. DYNAMIC PAGE ROUTING VIEWS */}
      
      {/* VIEW: SIMPLE ABOUT / OVERVIEW */}
      {currentView === 'about' && (
        <main className="px-6 py-12">
          <AboutOverview onStartAnalysis={() => { setCurrentView('home'); scrollTo('analyzer'); }} />
        </main>
      )}

      {/* VIEW: PROBLEM SCENARIOS */}
      {currentView === 'scenarios' && (
        <main className="px-6 py-12">
          <ProblemScenarios onLoadScenario={handleLoadTestPrompt} />
        </main>
      )}

      {/* VIEW: MENTAL HEALTH AWARENESS */}
      {currentView === 'awareness' && (
        <main className="px-6 py-12">
          <MentalHealthAwareness />
        </main>
      )}

      {/* VIEW: DATASET HUB */}
      {currentView === 'datasets' && (
        <main className="px-6 py-12">
          <DatasetHub onLoadSample={handleLoadTestPrompt} />
        </main>
      )}

      {/* VIEW: DAILY NOTES */}
      {currentView === 'notes' && (
        <main className="px-6 py-12">
          <div className="max-w-6xl mx-auto">
            <DailyNotes currentUser={currentUser} onOpenLogin={() => setCurrentView('auth')} />
          </div>
        </main>
      )}

      {/* VIEW: ADOBE CREATIVE STUDIO */}
      {currentView === 'adobe' && (
        <main className="px-6 py-12">
          <AdobeStudio onSendToAnalyzer={(quote) => handleLoadTestPrompt(quote || '')} />
        </main>
      )}

      {/* VIEW: ACCOUNT SETTINGS */}
      {currentView === 'settings' && (
        <main className="px-6 py-12">
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

      {/* VIEW: HOME / VERTICAL STUDIO */}
      {currentView === 'home' && (
        <main>
          
          {/* HERO SECTION */}
          <section id="hero" className="relative pt-20 pb-16 px-6 overflow-hidden">
            <div className="absolute top-10 left-1/3 w-[500px] h-[500px] bg-brand-500/15 rounded-full filter blur-[100px] pointer-events-none animate-pulse-slow" />
            <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none" />

            <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" /> Research-Grade Multimodal AI Architecture
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight font-sans">
                Understand Human Emotion Through <span className="text-gradient">Multimodal AI</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
                MindSense combines signals across <strong className="text-slate-200">Written Text</strong>, <strong className="text-slate-200">Voice Acoustics</strong>, and <strong className="text-slate-200">Facial Micro-Expressions</strong> through an intermediate Cross-Attention Fusion Transformer with isolated user history and mood journaling.
              </p>

              <div className="flex flex-wrap justify-center gap-3.5 pt-4">
                <button
                  onClick={() => scrollTo('analyzer')}
                  className="px-7 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition shadow-xl shadow-brand-600/30 hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Activity className="h-4.5 w-4.5" /> Start Live Analysis
                </button>
                <button
                  onClick={() => setCurrentView('about')}
                  className="px-6 py-3.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border border-brand-500/30 font-semibold text-sm transition hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <Info className="h-4 w-4 text-brand-400" /> What is MindSense?
                </button>
                <button
                  onClick={() => setCurrentView('scenarios')}
                  className="px-6 py-3.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-sm transition hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-400" /> Test Real Scenarios
                </button>
              </div>

              {/* Quick Metrics Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto">
                <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
                  <span className="text-2xl font-extrabold text-white block">3</span>
                  <span className="text-xs text-slate-400">Modalities Fused</span>
                </div>
                <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
                  <span className="text-2xl font-extrabold text-brand-400 block">79.5%</span>
                  <span className="text-xs text-slate-400">Multimodal Accuracy</span>
                </div>
                <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
                  <span className="text-2xl font-extrabold text-indigo-400 block">+18.3%</span>
                  <span className="text-xs text-slate-400">Gain over Text-only</span>
                </div>
                <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
                  <span className="text-2xl font-extrabold text-emerald-400 block">100%</span>
                  <span className="text-xs text-slate-400">Private Local Cache</span>
                </div>
              </div>
            </div>
          </section>

          {/* LIVE MULTIMODAL ANALYZER WORKSPACE */}
          <section id="analyzer" className="py-16 px-6 border-t border-slate-800/80 bg-slate-950/40">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block mb-1">Interactive Studio</span>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Live Emotion Analysis</h2>
                </div>
                <div className="text-xs text-slate-400 text-right">
                  {currentUser ? (
                    <span>Logged in as <strong className="text-brand-300">@{currentUser.username}</strong></span>
                  ) : (
                    <button onClick={() => setCurrentView('auth')} className="text-brand-400 hover:underline">
                      Sign in to isolate history to your personal account
                    </button>
                  )}
                </div>
              </div>

              <Analysis currentUser={currentUser} initialText={studioText} />
            </div>
          </section>

          {/* TECHNOLOGY STACK */}
          <section id="technology" className="py-20 px-6 border-t border-slate-800">
            <div className="max-w-6xl mx-auto space-y-12">
              <div className="text-center space-y-3 max-w-3xl mx-auto">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Under The Hood</span>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">Comprehensive Technology Stack</h2>
                <p className="text-slate-400 text-sm">
                  MindSense pairs specialized unimodal encoders with deep multimodal self-attention layers to prevent single-modality bias.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Tech Card 1: NLP */}
                <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit">
                      <FileText className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">1. NLP Text Encoder</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Extracts semantic valence from text. Uses a custom dictionary tokenizer (1,000 vocab tokens) followed by a 64-dimensional Word Embedding layer and 1D Convolutional Neural Network (Conv1D) with Adaptive Max Pooling.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-800/80 text-[11px] text-indigo-300 font-mono">
                    Tensor: [Batch, 64] Vector
                  </div>
                </div>

                {/* Tech Card 2: SER Audio */}
                <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit">
                      <Mic className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">2. Speech Emotion (SER)</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Processes raw speech audio downsampled to 16kHz mono. Computes 13 Mel-Frequency Cepstral Coefficients (MFCCs) over 25ms frames with pure SciPy FFT. Passed through a 3-layer 1D CNN with Batch Normalization.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-800/80 text-[11px] text-emerald-300 font-mono">
                    Tensor: [Batch, 200, 13] MFCC
                  </div>
                </div>

                {/* Tech Card 3: Computer Vision */}
                <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl w-fit">
                      <Camera className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">3. Facial Vision Model</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Decodes images with Pillow & OpenCV Haar Cascades, crops and aligns to 48x48 grayscale, and passes through a 2D CNN (Conv2D $\rightarrow$ MaxPool $\rightarrow$ BatchNorm) to isolate micro-expressions.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-800/80 text-[11px] text-blue-300 font-mono">
                    Tensor: [Batch, 1, 48, 48]
                  </div>
                </div>

                {/* Tech Card 4: Fusion Transformer */}
                <div className="glass-panel glass-panel-hover p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl w-fit">
                      <Layers className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white">4. Fusion Transformer</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Treats multimodal embeddings as a 3-token sequence with learnable modality positional encodings. Uses <code className="text-brand-300">torch.nn.MultiheadAttention</code> with a boolean padding mask to dynamically drop missing inputs.
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-800/80 text-[11px] text-brand-300 font-mono">
                    Softmax: [7 Emotion Classes]
                  </div>
                </div>

              </div>

              {/* Full-Stack Architecture List */}
              <div className="glass-panel p-8 rounded-3xl border border-slate-800 grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-brand-400 font-semibold text-sm">
                    <Cpu className="h-4 w-4" /> Frontend Client
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    React 18, TypeScript, Vite, Tailwind CSS v3, MediaRecorder Audio Stream API, and WebRTC Camera Canvas API.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                    <MindSenseLogo className="h-4 w-4" size={16} /> AI & Backend
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Python 3.10+, FastAPI Web Server, PyTorch 2.0+ Fusion Model, SciPy FFT DSP audio engine, and Pillow/OpenCV.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <Database className="h-4 w-4" /> Local Storage & Auth
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    User accounts with SHA-256 password hashing, login audit history, SQLite storage, and zero permanent media recording.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* PROJECT DEEP-DIVE */}
          <section id="explanation" className="py-20 px-6 border-t border-slate-800 bg-slate-950/60">
            <div className="max-w-5xl mx-auto space-y-12">
              
              <div className="space-y-3">
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block">In-Depth Guide</span>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                  Project Architecture & Academic Deep-Dive
                </h2>
                <p className="text-slate-400 text-sm">
                  Understanding why multimodal fusion outperforms traditional single-modality emotion classifiers.
                </p>
              </div>

              <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
                
                {/* Section 1: The Problem of Unimodal Bias */}
                <div className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    1. The Challenge of Unimodal Emotion Detection
                  </h3>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                    Single-modality systems suffer from significant real-world ambiguity:
                  </p>
                  <ul className="grid md:grid-cols-3 gap-4 text-xs text-slate-400 pt-2">
                    <li className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                      <strong className="text-indigo-300 block">Text Ambiguity & Sarcasm:</strong>
                      Written words lack tone and prosody. For example, &quot;Oh, wonderful&quot; can express joy or bitter disappointment depending on vocal delivery.
                    </li>
                    <li className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                      <strong className="text-emerald-300 block">Acoustic Noise & Loudness:</strong>
                      Audio volume alone cannot differentiate excitement from anger. Environmental noise can distort spectral features.
                    </li>
                    <li className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                      <strong className="text-blue-300 block">Facial Poker Faces:</strong>
                      People often suppress facial expressions during social communication. A neutral face does not guarantee a neutral psychological state.
                    </li>
                  </ul>
                </div>

                {/* Section 2: Why Intermediate Attention Fusion */}
                <div className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="h-5 w-5 text-brand-400" />
                    2. Why Intermediate Feature-Level Cross-Attention Fusion?
                  </h3>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                    Traditional approaches rely on either <strong>Early Fusion</strong> (concatenating raw vectors, which causes high dimensional curse and fails on missing inputs) or <strong>Late Fusion</strong> (averaging independent probabilities, which ignores cross-modal relationships).
                  </p>
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                    MindSense implements <strong>Intermediate Attention-based Fusion</strong>. The sequence of modality embeddings is passed through a Multi-Head Attention layer:
                  </p>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-xs md:text-sm text-brand-300 text-center py-4">
                    Attention(Q, K, V) = softmax( (Q · Kᵀ) / √dₖ + M_mask ) · V
                  </div>

                  <p className="text-slate-400 text-xs leading-relaxed">
                    Where <code className="text-slate-200 font-mono">M_mask</code> is a dynamic boolean tensor that masks missing modalities with -∞, mathematically isolating available signals from zero-biasing artifacts.
                  </p>
                </div>

                {/* Section 3: Privacy & Mental Health Safety */}
                <div className="glass-panel p-6 md:p-8 rounded-2xl border border-slate-800 space-y-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Lock className="h-5 w-5 text-emerald-400" />
                    3. Privacy-First Design & Crisis Safety Protocol
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6 text-xs text-slate-400">
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-200 text-sm">Strict Privacy Architecture</h4>
                      <p className="leading-relaxed">
                        Raw webcam images and microphone streams are processed exclusively in volatile memory and destroyed immediately post-inference. Only mathematical classification distributions and user-submitted check-ins are saved to the local SQLite database.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-200 text-sm">Ethical Safety Guardrails</h4>
                      <p className="leading-relaxed">
                        MindSense explicitly disclaims clinical diagnosis. It uses neutral descriptive phrases (e.g., &quot;The model detected emotional patterns associated with sadness&quot;). If self-harm keywords are detected, the classifier is bypassed to present immediate emergency hotlines (988 Lifeline).
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* RESEARCH METRICS */}
          <section id="research" className="py-20 px-6 border-t border-slate-800">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block mb-1">Scientific Verification</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Research & Ablation Metrics</h2>
              </div>

              <Research />
            </div>
          </section>

          {/* TRENDS & HISTORY */}
          <section id="trends" className="py-20 px-6 border-t border-slate-800 bg-slate-950/40">
            <div className="max-w-6xl mx-auto space-y-12">
              
              <div className="space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest block mb-1">Longitudinal Monitoring</span>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Emotional Trends & Mental Health Curves</h2>
                </div>
                <Trends currentUser={currentUser} />
              </div>

              <div className="space-y-6 pt-8 border-t border-slate-850">
                <div className="border-b border-slate-800 pb-4">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest block mb-1">User Assessment History</span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    {currentUser ? `@${currentUser.username}'s History` : 'Past Assessment Records'}
                  </h2>
                </div>
                <History currentUser={currentUser} />
              </div>

            </div>
          </section>

        </main>
      )}

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-slate-800/80 bg-slate-950 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setCurrentView('about')}
            title="Click to view simple overview"
          >
            <div className="p-1 rounded-xl bg-brand-500/10">
              <MindSenseLogo size={24} />
            </div>
            <span className="font-bold text-slate-300 text-sm">MindSense AI</span>
          </div>

          <p className="text-center md:text-left text-[11px] leading-relaxed max-w-xl text-slate-400">
            This system is for research and wellness monitoring only and does not provide medical diagnosis or professional mental-health assessment. If you are experiencing high distress, please contact qualified professionals or call/text 988.
          </p>

          <div className="text-[11px] text-slate-500">
            Version 1.3.0 (Plain-English & Theme Edition)
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {activeModal === 'checkin' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-xl font-bold text-white">Daily Wellness Check-in</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg"
              >
                Close
              </button>
            </div>
            <Checkin currentUser={currentUser} />
          </div>
        </div>
      )}

      {activeModal === 'config' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-xl font-bold text-white">Settings & Data Export</h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg"
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
