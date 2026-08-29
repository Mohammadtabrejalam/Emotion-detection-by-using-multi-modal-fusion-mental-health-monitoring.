import React, { useState } from 'react';
import { 
  Sun, 
  Moon, 
  Menu, 
  X, 
  User as UserIcon, 
  Settings as SettingsIcon,
  Activity,
  BarChart3,
  BrainCircuit,
  BookOpen,
  ChevronDown,
  Search,
  HelpCircle
} from 'lucide-react';
import { MindSenseLogo } from './MindSenseLogo';
import { SystemStatusIndicator } from './SystemStatusIndicator';
import type { User } from '../types';

export type MainPillar = 'home' | 'analyze' | 'insights' | 'research' | 'resources';

interface HeaderProps {
  currentPillar: MainPillar;
  onSelectPillar: (pillar: MainPillar) => void;
  onStartAnalysis: () => void;
  currentUser: User | null;
  onOpenAccount: () => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenHelp: () => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPillar,
  onSelectPillar,
  onStartAnalysis,
  currentUser,
  onOpenAccount,
  onOpenSettings,
  onOpenSearch,
  onOpenHelp,
  isLightMode,
  onToggleTheme
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const pillars: { id: MainPillar; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: BookOpen },
    { id: 'analyze', label: 'Analyze', icon: Activity },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'research', label: 'Research', icon: BrainCircuit },
    { id: 'resources', label: 'Resources', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Identity */}
          <button
            onClick={() => { onSelectPillar('home'); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <div className="p-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 group-hover:border-brand-500/40 transition">
              <MindSenseLogo size={28} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white font-sans">MindSense</span>
                <span className="text-[10px] uppercase font-bold text-brand-400 bg-brand-500/10 px-1.5 py-0.2 rounded border border-brand-500/20 font-mono">
                  Research
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden lg:block font-normal">
                Multimodal Affective Computing AI
              </p>
            </div>
          </button>

          {/* Primary Desktop Navigation: Main Pillars */}
          <nav className="hidden md:flex items-center gap-1">
            {pillars.map((item) => {
              const isActive = currentPillar === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPillar(item.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition relative ${
                    isActive 
                      ? 'text-white bg-slate-800/80 shadow-sm border border-slate-700/60 font-bold' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-brand-500 rounded-full" />
                  )}
                </button>
              );
            })}
            <button
              onClick={() => window.location.hash = '#/how-to-use'}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
            >
              How to Use
            </button>
            <button
              onClick={() => window.location.hash = '#/rules'}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition text-slate-400 hover:text-slate-100 hover:bg-slate-900/60"
            >
              Rules
            </button>
          </nav>

          {/* Right Utility Actions & Primary CTA */}
          <div className="hidden md:flex items-center gap-2">
            
            {/* Global Search Button */}
            <button
              onClick={onOpenSearch}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition flex items-center gap-2 text-xs"
              title="Search MindSense (Cmd/Ctrl + K)"
              aria-label="Global search"
            >
              <Search className="h-3.5 w-3.5 text-brand-400" />
              <span className="hidden lg:inline text-[11px]">Search</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.2 text-[9px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
                ⌘K
              </kbd>
            </button>

            {/* System Status Pill */}
            <div className="hidden lg:block">
              <SystemStatusIndicator />
            </div>

            {/* Primary CTA Action Button */}
            <button
              onClick={onStartAnalysis}
              className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow flex items-center gap-1.5"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Start Analysis</span>
            </button>

            {/* Account Profile / Login */}
            <button
              onClick={onOpenAccount}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition flex items-center gap-1.5"
              title={currentUser ? `Signed in as ${currentUser.username}` : "Sign In / Account"}
            >
              <UserIcon className="h-3.5 w-3.5 text-brand-400" />
              <span className="max-w-[90px] truncate">{currentUser ? currentUser.name.split(' ')[0] : 'Account'}</span>
            </button>

            {/* Help / Documentation */}
            <button
              onClick={onOpenHelp}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
              title="Help & User Guide"
              aria-label="Help & User Guide"
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
              title={isLightMode ? "Switch to Dark Theme" : "Switch to Light Theme"}
              aria-label="Toggle theme"
            >
              {isLightMode ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>

            {/* Settings & Privacy */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition"
              title="System Settings & Privacy"
              aria-label="Settings"
            >
              <SettingsIcon className="h-4 w-4" />
            </button>

          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-lg text-slate-400 hover:text-white"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-white"
              aria-label="Toggle theme"
            >
              {isLightMode ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-5 space-y-3 animate-fadeIn">
          
          <button
            onClick={() => { onStartAnalysis(); setIsMobileMenuOpen(false); }}
            className="w-full py-2.5 rounded-lg bg-brand-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow"
          >
            <Activity className="h-4 w-4" />
            <span>Start Analysis</span>
          </button>

          <div className="space-y-1">
            {pillars.map((item) => {
              const isActive = currentPillar === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onSelectPillar(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition ${
                    isActive ? 'bg-slate-800 text-brand-400 border border-slate-700' : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronDown className="h-3.5 w-3.5 -rotate-90 text-slate-500" />
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => { onOpenHelp(); setIsMobileMenuOpen(false); }}
              className="p-2.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white flex items-center gap-2 font-medium"
            >
              <HelpCircle className="h-4 w-4 text-brand-400" />
              <span>How to Use / FAQ</span>
            </button>

            <button
              onClick={() => { onOpenAccount(); setIsMobileMenuOpen(false); }}
              className="p-2.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white flex items-center gap-2 font-medium"
            >
              <UserIcon className="h-4 w-4 text-brand-400" />
              <span>{currentUser ? currentUser.name.split(' ')[0] : 'Account'}</span>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
            <SystemStatusIndicator />
            <button onClick={onOpenSettings} className="text-slate-400 hover:text-white text-xs font-medium">
              Privacy Settings
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
