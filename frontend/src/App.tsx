import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Mic, 
  Camera, 
  ArrowRight, 
  Shield
} from 'lucide-react';
import { Header, type MainPillar } from './components/Header';
import { SubNav, type SubNavTab } from './components/SubNav';
import { Analysis } from './pages/Analysis';
import { Research } from './pages/Research';
import { Trends } from './pages/Trends';
import { History } from './pages/History';
import { AboutOverview } from './pages/AboutOverview';
import { ProblemScenarios } from './pages/ProblemScenarios';
import { DatasetHub } from './pages/DatasetHub';
import { MentalHealthAwareness } from './pages/MentalHealthAwareness';
import { DailyNotes } from './pages/DailyNotes';
import { ArticlesHub } from './pages/ArticlesHub';
import { MediaProcessing } from './pages/MediaProcessing';
import { AuthPage } from './pages/AuthPage';
import { AccountSettings } from './pages/AccountSettings';
import { Checkin } from './pages/Checkin';
import { Settings } from './pages/Settings';
import type { User } from './types';

export const App: React.FC = () => {
  // Navigation State
  const [currentPillar, setCurrentPillar] = useState<MainPillar>('home');
  
  // Sub-navigation states for multi-tab pillars
  const [analyzeSubTab, setAnalyzeSubTab] = useState<'live' | 'media'>('live');
  const [insightsSubTab, setInsightsSubTab] = useState<'trends' | 'history' | 'journal' | 'checkin'>('trends');
  const [researchSubTab, setResearchSubTab] = useState<'overview' | 'architecture' | 'datasets'>('overview');
  const [resourcesSubTab, setResourcesSubTab] = useState<'publications' | 'casestudies' | 'awareness'>('publications');

  // Secondary Utility Views / Modals
  const [isAuthView, setIsAuthView] = useState<boolean>(false);
  const [isAccountView, setIsAccountView] = useState<boolean>(false);
  const [isSettingsModal, setIsSettingsModal] = useState<boolean>(false);

  // Authentication & System State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('mindsense_theme') === 'light';
  });

  // Prompt loader for Analysis
  const [loadedAnalysisPrompt, setLoadedAnalysisPrompt] = useState<string>('');

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

  const handleToggleTheme = () => {
    setIsLightMode(!isLightMode);
  };

  const handleStartAnalysis = () => {
    setIsAuthView(false);
    setIsAccountView(false);
    setCurrentPillar('analyze');
    setAnalyzeSubTab('live');
  };

  const handleLoadPromptToStudio = (text?: string) => {
    if (text) {
      setLoadedAnalysisPrompt(text);
    }
    setIsAuthView(false);
    setIsAccountView(false);
    setCurrentPillar('analyze');
    setAnalyzeSubTab('live');
  };

  const handleOpenAccount = () => {
    if (currentUser) {
      setIsAccountView(true);
      setIsAuthView(false);
    } else {
      setIsAuthView(true);
      setIsAccountView(false);
    }
  };

  // Sub-Navigation Tab Configurations
  const analyzeTabs: SubNavTab[] = [
    { id: 'live', label: 'Live Analysis Studio' },
    { id: 'media', label: 'Signal & Media Processing' }
  ];

  const insightsTabs: SubNavTab[] = [
    { id: 'trends', label: 'Longitudinal Trends' },
    { id: 'history', label: 'Assessment History' },
    { id: 'journal', label: 'Daily Journal' },
    { id: 'checkin', label: 'Daily Check-in' }
  ];

  const researchTabs: SubNavTab[] = [
    { id: 'overview', label: 'Methodology Overview' },
    { id: 'architecture', label: 'Ablation & Architecture' },
    { id: 'datasets', label: 'Benchmark Corpora' }
  ];

  const resourcesTabs: SubNavTab[] = [
    { id: 'publications', label: 'Publications & Literature' },
    { id: 'casestudies', label: 'Empirical Case Studies' },
    { id: 'awareness', label: 'Psychoeducation & Grounding' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-main)] transition-colors">
      
      {/* 1. INSTITUTIONAL 5-PILLAR HEADER */}
      <Header
        currentPillar={currentPillar}
        onSelectPillar={(pillar) => {
          setIsAuthView(false);
          setIsAccountView(false);
          setCurrentPillar(pillar);
        }}
        onStartAnalysis={handleStartAnalysis}
        currentUser={currentUser}
        onOpenAccount={handleOpenAccount}
        onOpenSettings={() => setIsSettingsModal(true)}
        isLightMode={isLightMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* 2. MAIN APPLICATION CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW A: AUTHENTICATION PORTAL */}
        {isAuthView ? (
          <AuthPage
            currentUser={currentUser}
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              setIsAuthView(false);
            }}
            onNavigateHome={() => setIsAuthView(false)}
          />
        ) : isAccountView ? (
          /* VIEW B: ACCOUNT SETTINGS */
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h1 className="text-2xl font-bold text-white">Account & Profile Settings</h1>
              <button
                onClick={() => setIsAccountView(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← Return
              </button>
            </div>
            <AccountSettings
              currentUser={currentUser}
              onUpdateUser={(updated) => setCurrentUser(updated)}
              onLogout={() => {
                setCurrentUser(null);
                setIsAccountView(false);
              }}
              onOpenLogin={() => {
                setIsAccountView(false);
                setIsAuthView(true);
              }}
            />
          </div>
        ) : (
          /* PRIMARY PILLARS */
          <>
            {/* PILLAR 1: HOME (EDITORIAL, CALM HIERARCHY) */}
            {currentPillar === 'home' && (
              <div className="space-y-16 py-4 max-w-5xl mx-auto">
                
                {/* 1.1 Hero Section */}
                <section className="space-y-6 text-center md:text-left pt-6 pb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider">
                    <span>Affective Computing Research Initiative</span>
                  </div>
                  
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
                    Multimodal AI for Emotion-Aware <br className="hidden sm:block" />
                    Wellness & Affective Research
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                    MindSense integrates textual natural language, vocal acoustic prosody, and facial micro-expressions into an Intermediate Cross-Attention Transformer to infer subjective emotional states without loss of cross-modal context.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={handleStartAnalysis}
                      className="px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs uppercase tracking-wider transition shadow flex items-center gap-2"
                    >
                      <span>Start Analysis</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => {
                        setCurrentPillar('research');
                        setResearchSubTab('overview');
                      }}
                      className="px-5 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs border border-slate-800 transition"
                    >
                      Explore Research Methodology
                    </button>
                  </div>
                </section>

                {/* 1.2 Institutional Metrics Banner */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-slate-800">
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono block">3</span>
                    <span className="text-xs text-slate-400 font-medium">Synchronized Modalities</span>
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono block">79.5%</span>
                    <span className="text-xs text-slate-400 font-medium">Fused Test Accuracy</span>
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-brand-400 font-mono block">+18.3%</span>
                    <span className="text-xs text-slate-400 font-medium">Gain Over Unimodal</span>
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400 font-mono block">0 ms</span>
                    <span className="text-xs text-slate-400 font-medium">Biometric Storage Leakage</span>
                  </div>
                </section>

                {/* 1.3 How MindSense Works: 3 Modality Encoders */}
                <section className="space-y-6">
                  <div>
                    <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block mb-1">
                      Architecture Pipeline
                    </span>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      Tri-Modal Sensor Ingestion
                    </h2>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="academic-card p-6 space-y-3">
                      <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
                        <FileText className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-white text-base">1. Text Semantic NLP</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Evaluates lexical polarity, conversational sentiment, and syntax tokens via embedding layers and 1D convolution.
                      </p>
                    </div>

                    <div className="academic-card p-6 space-y-3">
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                        <Mic className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-white text-base">2. Speech Acoustics (SER)</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Extracts 13 Mel-Frequency Cepstral Coefficients (MFCCs) at 16kHz to capture pitch, cadence, and vocal strain.
                      </p>
                    </div>

                    <div className="academic-card p-6 space-y-3">
                      <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit">
                        <Camera className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-white text-base">3. Facial Vision CNN</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Crops facial bounding boxes to 48x48 matrices, evaluated via deep CNN kernels for micro-expression movements.
                      </p>
                    </div>
                  </div>
                </section>

                {/* 1.4 Intermediate Cross-Attention Overview */}
                <section className="academic-card p-6 md:p-8 space-y-4">
                  <span className="text-xs font-bold text-brand-400 uppercase tracking-wider block">
                    Core Technical Distinction
                  </span>
                  <h3 className="text-xl font-bold text-white">Why Intermediate Cross-Attention Matters</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Single-modality algorithms fail when users use sarcasm or conceal facial expressions. Rather than Early Fusion (feature concatenation) or Late Fusion (independent score averaging), MindSense computes dynamic cross-modal attention matrices with availability masking to prevent false zero-biasing.
                  </p>
                </section>

                {/* 1.5 Safety & Clinical Disclaimer Notice */}
                <section className="p-6 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                  <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
                    <Shield className="h-4 w-4 text-slate-400" />
                    <span>Research Advisory & Clinical Scope</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    MindSense is designed strictly for academic affective computing research and longitudinal self-reflection. It does not diagnose psychiatric or medical conditions. For immediate crisis support, contact the 24/7 Lifeline at <strong>988</strong> (US/Canada).
                  </p>
                </section>

              </div>
            )}

            {/* PILLAR 2: ANALYZE */}
            {currentPillar === 'analyze' && (
              <div className="space-y-6">
                <SubNav
                  tabs={analyzeTabs}
                  activeTab={analyzeSubTab}
                  onSelectTab={(id) => setAnalyzeSubTab(id as 'live' | 'media')}
                  title="Affective Analysis Laboratory"
                  description="Synchronize multiple input modalities to perform real-time cross-attention classification."
                />

                {analyzeSubTab === 'live' ? (
                  <Analysis 
                    currentUser={currentUser} 
                    initialText={loadedAnalysisPrompt} 
                  />
                ) : (
                  <MediaProcessing 
                    onSendToAnalyzer={handleLoadPromptToStudio} 
                  />
                )}
              </div>
            )}

            {/* PILLAR 3: INSIGHTS */}
            {currentPillar === 'insights' && (
              <div className="space-y-6">
                <SubNav
                  tabs={insightsTabs}
                  activeTab={insightsSubTab}
                  onSelectTab={(id) => setInsightsSubTab(id as any)}
                  title="Longitudinal Affective Insights"
                  description="Inspect longitudinal trends, view historical inference records, maintain a daily reflection journal, or record somatic check-ins."
                />

                {insightsSubTab === 'trends' && <Trends currentUser={currentUser} />}
                {insightsSubTab === 'history' && <History currentUser={currentUser} />}
                {insightsSubTab === 'journal' && <DailyNotes currentUser={currentUser} onOpenLogin={() => setIsAuthView(true)} />}
                {insightsSubTab === 'checkin' && <Checkin currentUser={currentUser} />}
              </div>
            )}

            {/* PILLAR 4: RESEARCH */}
            {currentPillar === 'research' && (
              <div className="space-y-6">
                <SubNav
                  tabs={researchTabs}
                  activeTab={researchSubTab}
                  onSelectTab={(id) => setResearchSubTab(id as any)}
                  title="Scientific Research & Methodology"
                  description="Review the theoretical framework, multimodal ablation studies, neural architecture diagrams, and benchmark corpora standards."
                />

                {researchSubTab === 'overview' && (
                  <AboutOverview />
                )}
                {researchSubTab === 'architecture' && <Research />}
                {researchSubTab === 'datasets' && (
                  <DatasetHub onLoadSample={(text) => handleLoadPromptToStudio(text)} />
                )}
              </div>
            )}

            {/* PILLAR 5: RESOURCES */}
            {currentPillar === 'resources' && (
              <div className="space-y-6">
                <SubNav
                  tabs={resourcesTabs}
                  activeTab={resourcesSubTab}
                  onSelectTab={(id) => setResourcesSubTab(id as any)}
                  title="Academic Resources & Psychoeducation"
                  description="Read peer-reviewed perspectives, investigate empirical failure mode case studies, and access somatic grounding tools."
                />

                {resourcesSubTab === 'publications' && (
                  <ArticlesHub currentUser={currentUser} onOpenLogin={() => setIsAuthView(true)} />
                )}
                {resourcesSubTab === 'casestudies' && (
                  <ProblemScenarios onLoadScenario={(text) => handleLoadPromptToStudio(text)} />
                )}
                {resourcesSubTab === 'awareness' && (
                  <MentalHealthAwareness />
                )}
              </div>
            )}
          </>
        )}

      </main>

      {/* 3. SETTINGS & PRIVACY MODAL */}
      {isSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="academic-card p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">System Settings & Privacy</h3>
              <button
                onClick={() => setIsSettingsModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>
            <Settings />
          </div>
        </div>
      )}

      {/* 4. INSTITUTIONAL FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 mt-16 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight">MindSense Affective Computing</span>
              <p className="text-xs text-slate-400 mt-0.5">Multimodal Intermediate Cross-Attention Transformer</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <button onClick={() => { setCurrentPillar('research'); setResearchSubTab('overview'); }} className="hover:text-white">Methodology</button>
              <span>•</span>
              <button onClick={() => { setCurrentPillar('resources'); setResourcesSubTab('awareness'); }} className="hover:text-white">Crisis 988</button>
              <span>•</span>
              <button onClick={() => setIsSettingsModal(true)} className="hover:text-white">Privacy Architecture</button>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-800/60 text-[11px] text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
            <span>© {new Date().getFullYear()} MindSense Research Platform. For empirical study and educational demonstration.</span>
            <span className="font-mono text-slate-400">v1.3 Cross-Attention Build</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
