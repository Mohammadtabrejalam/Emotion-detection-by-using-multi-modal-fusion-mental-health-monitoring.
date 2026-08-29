import React, { useState, useEffect } from 'react';
import { Header, type MainPillar } from './components/Header';
import { SubNav, type SubNavTab } from './components/SubNav';
import { PageHeader } from './components/PageHeader';
import { Home } from './pages/Home';
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
import { HowToUsePage } from './pages/HowToUsePage';
import { RulesPage } from './pages/RulesPage';
import { SharedResultPage } from './pages/SharedResultPage';
import { DeveloperPortal } from './pages/developer/DeveloperPortal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { MindSenseAssistant } from './components/MindSenseAssistant';
import { HelpCenterModal } from './components/HelpCenterModal';
import { apiService } from './services/api';
import type { User, AnalysisData } from './types';

export interface NavLocation {
  pillar: MainPillar;
  subTab?: string;
  isAuthView?: boolean;
  isAccountView?: boolean;
  isHowToUse?: boolean;
  isRules?: boolean;
}

export const App: React.FC = () => {
  // Hash & Route State
  const [currentHash, setCurrentHash] = useState<string>(window.location.hash || '#/home');

  // Navigation History Stack
  const [navStack, setNavStack] = useState<NavLocation[]>([
    { pillar: 'home' }
  ]);

  const currentLocation = navStack[navStack.length - 1] || { pillar: 'home' };
  const currentPillar = currentLocation.pillar;
  const isAuthView = Boolean(currentLocation.isAuthView);
  const isAccountView = Boolean(currentLocation.isAccountView);
  const isHowToUse = Boolean(currentLocation.isHowToUse) || currentHash === '#/how-to-use';
  const isRules = Boolean(currentLocation.isRules) || currentHash === '#/rules';

  // Sub-navigation states for multi-tab pillars
  const [analyzeSubTab, setAnalyzeSubTab] = useState<'live' | 'media'>('live');
  const [insightsSubTab, setInsightsSubTab] = useState<'trends' | 'history' | 'journal' | 'checkin'>('trends');
  const [researchSubTab, setResearchSubTab] = useState<'overview' | 'architecture' | 'datasets'>('overview');
  const [resourcesSubTab, setResourcesSubTab] = useState<'publications' | 'casestudies' | 'awareness'>('publications');

  // Overlay Modals
  const [isSettingsModal, setIsSettingsModal] = useState<boolean>(false);
  const [isSearchModal, setIsSearchModal] = useState<boolean>(false);
  const [isHelpModal, setIsHelpModal] = useState<boolean>(false);

  // Authentication & System State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [recentAnalysis, setRecentAnalysis] = useState<AnalysisData | null>(null);
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    return localStorage.getItem('mindsense_theme') === 'light';
  });

  // Prompt loader for Analysis
  const [loadedAnalysisPrompt, setLoadedAnalysisPrompt] = useState<string>('');

  // Sync hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentHash(window.location.hash || '#/home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Synchronize browser history and popstate
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.pillar) {
        const poppedLoc: NavLocation = e.state;
        setNavStack(prev => {
          if (prev.length > 1) {
            return prev.slice(0, prev.length - 1);
          }
          return [poppedLoc];
        });
        if (poppedLoc.subTab) {
          if (poppedLoc.pillar === 'analyze') setAnalyzeSubTab(poppedLoc.subTab as any);
          else if (poppedLoc.pillar === 'insights') setInsightsSubTab(poppedLoc.subTab as any);
          else if (poppedLoc.pillar === 'research') setResearchSubTab(poppedLoc.subTab as any);
          else if (poppedLoc.pillar === 'resources') setResourcesSubTab(poppedLoc.subTab as any);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Record page visit & load recent analysis on mount / location change
  useEffect(() => {
    apiService.recordVisit(window.location.pathname);
    apiService.getHistory(currentUser?.id).then(res => {
      if (res.success && res.data?.history && res.data.history.length > 0) {
        setRecentAnalysis(res.data.history[0]);
      }
    }).catch(() => {});
  }, [currentPillar, currentUser]);

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

  const handleNavigate = (
    pillar: MainPillar, 
    subTab?: string, 
    isAuth?: boolean, 
    isAccount?: boolean,
    howToUse?: boolean,
    rules?: boolean
  ) => {
    const newLoc: NavLocation = {
      pillar,
      subTab,
      isAuthView: isAuth,
      isAccountView: isAccount,
      isHowToUse: howToUse,
      isRules: rules
    };

    // Avoid duplicate pushes
    if (
      currentLocation.pillar === newLoc.pillar &&
      currentLocation.subTab === newLoc.subTab &&
      Boolean(currentLocation.isAuthView) === Boolean(newLoc.isAuthView) &&
      Boolean(currentLocation.isAccountView) === Boolean(newLoc.isAccountView) &&
      Boolean(currentLocation.isHowToUse) === Boolean(newLoc.isHowToUse) &&
      Boolean(currentLocation.isRules) === Boolean(newLoc.isRules)
    ) {
      return;
    }

    setNavStack(prev => [...prev, newLoc]);

    if (subTab) {
      if (pillar === 'analyze') setAnalyzeSubTab(subTab as any);
      else if (pillar === 'insights') setInsightsSubTab(subTab as any);
      else if (pillar === 'research') setResearchSubTab(subTab as any);
      else if (pillar === 'resources') setResourcesSubTab(subTab as any);
    }

    let hashStr = `/#${pillar}${subTab ? '/' + subTab : ''}`;
    if (howToUse) hashStr = '#/how-to-use';
    if (rules) hashStr = '#/rules';

    try {
      window.history.pushState(newLoc, '', hashStr);
      setCurrentHash(hashStr);
    } catch {}
  };

  const handleBack = () => {
    if (navStack.length > 1) {
      const updatedStack = navStack.slice(0, navStack.length - 1);
      const prevLoc = updatedStack[updatedStack.length - 1];
      setNavStack(updatedStack);

      if (prevLoc.subTab) {
        if (prevLoc.pillar === 'analyze') setAnalyzeSubTab(prevLoc.subTab as any);
        else if (prevLoc.pillar === 'insights') setInsightsSubTab(prevLoc.subTab as any);
        else if (prevLoc.pillar === 'research') setResearchSubTab(prevLoc.subTab as any);
        else if (prevLoc.pillar === 'resources') setResourcesSubTab(prevLoc.subTab as any);
      }

      let hashStr = `/#${prevLoc.pillar}${prevLoc.subTab ? '/' + prevLoc.subTab : ''}`;
      if (prevLoc.isHowToUse) hashStr = '#/how-to-use';
      if (prevLoc.isRules) hashStr = '#/rules';

      try {
        window.history.pushState(prevLoc, '', hashStr);
        setCurrentHash(hashStr);
      } catch {}
    } else {
      setNavStack([{ pillar: 'home' }]);
      window.location.hash = '#/home';
      setCurrentHash('#/home');
    }
  };

  const handleStartAnalysis = () => {
    handleNavigate('analyze', 'live');
  };

  const handleLoadPromptToStudio = (text?: string) => {
    if (text) {
      setLoadedAnalysisPrompt(text);
    }
    handleNavigate('analyze', 'live');
  };

  const handleOpenAccount = () => {
    if (currentUser) {
      handleNavigate('home', undefined, false, true);
    } else {
      handleNavigate('home', undefined, true, false);
    }
  };

  // Compute Previous Location Name for Back Button
  const previousLoc = navStack.length > 1 ? navStack[navStack.length - 2] : null;
  const getBackLabel = (): string => {
    if (!previousLoc) return "Back to Home";
    if (previousLoc.isAccountView) return "Back to Account";
    if (previousLoc.isAuthView) return "Back to Auth";
    
    const pillarNames: Record<MainPillar, string> = {
      home: "Home",
      analyze: "Analyze",
      insights: "Insights",
      research: "Research",
      resources: "Resources"
    };

    return `Back to ${pillarNames[previousLoc.pillar] || 'Previous'}`;
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

  // PRODUCT B: SEPARATE DEVELOPER / ADMIN PORTAL ROUTE
  if (currentHash.startsWith('#/developer')) {
    return <DeveloperPortal />;
  }

  // PUBLIC SHARED RESULT ROUTE
  if (currentHash.startsWith('#/shared-result/')) {
    const token = currentHash.replace('#/shared-result/', '');
    return <SharedResultPage token={token} onNavigateHome={() => handleNavigate('home')} />;
  }

  // PRODUCT A: PUBLIC MINDSENSE USER APPLICATION
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-page)] text-[var(--text-main)] transition-colors font-sans">
      
      {/* INSTITUTIONAL 5-PILLAR HEADER */}
      <Header
        currentPillar={currentPillar}
        onSelectPillar={(pillar) => handleNavigate(pillar)}
        onStartAnalysis={handleStartAnalysis}
        currentUser={currentUser}
        onOpenAccount={handleOpenAccount}
        onOpenSettings={() => setIsSettingsModal(true)}
        onOpenSearch={() => setIsSearchModal(true)}
        onOpenHelp={() => setIsHelpModal(true)}
        isLightMode={isLightMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* MAIN APPLICATION CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {isHowToUse ? (
          <HowToUsePage
            onBack={handleBack}
            onStartAnalysis={handleStartAnalysis}
          />
        ) : isRules ? (
          <RulesPage
            onBack={handleBack}
          />
        ) : isAuthView ? (
          <div className="space-y-6">
            <PageHeader
              title="Authentication Portal"
              description="Sign in or register a free local research account."
              onBack={handleBack}
              backLabel={getBackLabel()}
              breadcrumbs={[
                { label: 'Home', onClick: () => handleNavigate('home') },
                { label: 'Authentication' }
              ]}
            />
            <AuthPage
              currentUser={currentUser}
              onLoginSuccess={(user) => {
                setCurrentUser(user);
                handleBack();
              }}
              onNavigateHome={() => handleNavigate('home')}
            />
          </div>
        ) : isAccountView ? (
          <div className="space-y-6">
            <PageHeader
              title="Account & Profile Settings"
              description="Manage your profile information, password, and session audit history."
              onBack={handleBack}
              backLabel={getBackLabel()}
              breadcrumbs={[
                { label: 'Home', onClick: () => handleNavigate('home') },
                { label: 'Account Settings' }
              ]}
            />
            <AccountSettings
              currentUser={currentUser}
              onUpdateUser={(updated) => setCurrentUser(updated)}
              onLogout={() => {
                setCurrentUser(null);
                handleNavigate('home');
              }}
              onOpenLogin={() => handleNavigate('home', undefined, true, false)}
            />
          </div>
        ) : (
          /* PRIMARY PILLARS */
          <>
            {/* PILLAR 1: HOME (ROOT PAGE - NO BACK BUTTON) */}
            {currentPillar === 'home' && (
              <Home
                currentUser={currentUser}
                onStartAnalysis={handleStartAnalysis}
                onNavigate={handleNavigate}
                onOpenHelp={() => setIsHelpModal(true)}
                recentAnalysis={recentAnalysis}
              />
            )}

            {/* PILLAR 2: ANALYZE */}
            {currentPillar === 'analyze' && (
              <div className="space-y-6">
                <SubNav
                  tabs={analyzeTabs}
                  activeTab={analyzeSubTab}
                  onSelectTab={(id) => handleNavigate('analyze', id)}
                  title="Affective Analysis Laboratory"
                  description="Synchronize text, vocal acoustics, and facial micro-expressions into real-time cross-attention classification."
                  onBack={handleBack}
                  backLabel={getBackLabel()}
                  breadcrumbs={[
                    { label: 'Home', onClick: () => handleNavigate('home') },
                    { label: 'Analyze', onClick: () => handleNavigate('analyze', 'live') },
                    { label: analyzeSubTab === 'live' ? 'Live Studio' : 'Media Preprocessing' }
                  ]}
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
                  onSelectTab={(id) => handleNavigate('insights', id)}
                  title="Longitudinal Affective Insights"
                  description="Inspect longitudinal trends, view historical inference records, maintain a daily reflection journal, or record somatic check-ins."
                  onBack={handleBack}
                  backLabel={getBackLabel()}
                  breadcrumbs={[
                    { label: 'Home', onClick: () => handleNavigate('home') },
                    { label: 'Insights', onClick: () => handleNavigate('insights', 'trends') },
                    { label: insightsSubTab }
                  ]}
                />

                {insightsSubTab === 'trends' && <Trends currentUser={currentUser} />}
                {insightsSubTab === 'history' && <History currentUser={currentUser} />}
                {insightsSubTab === 'journal' && <DailyNotes currentUser={currentUser} onOpenLogin={() => handleNavigate('home', undefined, true, false)} />}
                {insightsSubTab === 'checkin' && <Checkin currentUser={currentUser} />}
              </div>
            )}

            {/* PILLAR 4: RESEARCH */}
            {currentPillar === 'research' && (
              <div className="space-y-6">
                <SubNav
                  tabs={researchTabs}
                  activeTab={researchSubTab}
                  onSelectTab={(id) => handleNavigate('research', id)}
                  title="Scientific Research & Methodology"
                  description="Review theoretical framework, multimodal ablation studies, neural architecture diagrams, and benchmark corpora standards."
                  onBack={handleBack}
                  backLabel={getBackLabel()}
                  breadcrumbs={[
                    { label: 'Home', onClick: () => handleNavigate('home') },
                    { label: 'Research', onClick: () => handleNavigate('research', 'overview') },
                    { label: researchSubTab === 'overview' ? 'Methodology' : researchSubTab === 'architecture' ? 'Ablation' : 'Benchmark Corpora' }
                  ]}
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
                  onSelectTab={(id) => handleNavigate('resources', id)}
                  title="Academic Resources & Psychoeducation"
                  description="Read peer-reviewed perspectives, investigate empirical failure mode case studies, and access somatic grounding tools."
                  onBack={handleBack}
                  backLabel={getBackLabel()}
                  breadcrumbs={[
                    { label: 'Home', onClick: () => handleNavigate('home') },
                    { label: 'Resources', onClick: () => handleNavigate('resources', 'publications') },
                    { label: resourcesSubTab === 'publications' ? 'Publications' : resourcesSubTab === 'casestudies' ? 'Case Studies' : 'Grounding' }
                  ]}
                />

                {resourcesSubTab === 'publications' && (
                  <ArticlesHub currentUser={currentUser} onOpenLogin={() => handleNavigate('home', undefined, true, false)} />
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

      {/* OVERLAY MODALS & ASSISTANT */}

      <GlobalSearchModal
        isOpen={isSearchModal}
        onClose={() => setIsSearchModal(false)}
        onNavigate={handleNavigate}
        onOpenHelp={() => setIsHelpModal(true)}
      />

      <HelpCenterModal
        isOpen={isHelpModal}
        onClose={() => setIsHelpModal(false)}
        onStartAnalysis={handleStartAnalysis}
        onExploreResearch={() => handleNavigate('research', 'overview')}
        currentUser={currentUser}
      />

      <MindSenseAssistant
        onNavigate={handleNavigate}
        onOpenHelp={() => setIsHelpModal(true)}
      />

      {isSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="academic-card p-6 max-w-xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">System Settings & Data Transparency</h3>
              <button
                onClick={() => setIsSettingsModal(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2.5 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>
            <Settings />
          </div>
        </div>
      )}

      {/* INSTITUTIONAL FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 mt-16 py-12 transition-colors font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white tracking-tight">MindSense</span>
                <span className="text-[10px] uppercase font-bold text-brand-400 bg-brand-500/10 px-1.5 py-0.2 rounded border border-brand-500/20 font-mono">
                  Public Research Platform
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Multimodal Affective Computing & Wellness Self-Reflection. Fusing natural language text, speech prosody, and facial micro-expressions.
              </p>
              <div className="pt-1 flex items-center gap-3 text-xs font-semibold">
                <a href="#/how-to-use" className="text-brand-400 hover:underline">How to Use</a>
                <span className="text-slate-700">•</span>
                <a href="#/rules" className="text-brand-400 hover:underline">Rules & Regulations</a>
                <span className="text-slate-700">•</span>
                <a href="#/developer" className="text-indigo-400 hover:underline">Developer Portal</a>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Public Navigation</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li><button onClick={() => handleNavigate('home')} className="hover:text-white transition">Home</button></li>
                <li><button onClick={() => handleNavigate('analyze', 'live')} className="hover:text-white transition">Analyze Studio</button></li>
                <li><button onClick={() => handleNavigate('insights', 'trends')} className="hover:text-white transition">Insights & History</button></li>
                <li><button onClick={() => handleNavigate('research', 'overview')} className="hover:text-white transition">Research Methodology</button></li>
                <li><button onClick={() => handleNavigate('resources', 'publications')} className="hover:text-white transition">Academic Resources</button></li>
              </ul>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Support & Legal</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li><a href="#/how-to-use" className="hover:text-white transition">User Guide Walkthrough</a></li>
                <li><a href="#/rules" className="hover:text-white transition">Rules & Regulations</a></li>
                <li><a href="/MindSense_How_to_Use_Rules_and_Regulations.pdf" download className="hover:text-white transition">Download PDF Guide</a></li>
                <li><button onClick={() => setIsSettingsModal(true)} className="hover:text-white transition">Privacy Architecture</button></li>
              </ul>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">Developer Portal</h4>
              <ul className="space-y-1.5 text-slate-400">
                <li><a href="#/developer" className="hover:text-white transition">Developer Login</a></li>
                <li><a href="#/developer" className="hover:text-white transition">System Health Metrics</a></li>
                <li><a href="#/developer" className="hover:text-white transition">Feedback Management</a></li>
                <li><a href="#/developer" className="hover:text-white transition">Administrative Audit Logs</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} MindSense Affective Computing Platform. Built for empirical research and educational study.</p>
            <p className="font-mono text-[11px] text-slate-400">v1.3 Fused Cross-Attention Architecture</p>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default App;
