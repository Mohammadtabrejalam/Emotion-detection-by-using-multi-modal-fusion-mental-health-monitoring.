import React, { useState, useEffect, useRef } from 'react';
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
  Search,
  HelpCircle,
  ShieldAlert,
  FileText
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
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Keyboard accessibility: Escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Accessibility: Focus Trapping in Mobile Menu
  useEffect(() => {
    if (!isMobileMenuOpen || !mobileMenuRef.current) return;
    
    const focusableElements = mobileMenuRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const menuNode = mobileMenuRef.current;
    if (!menuNode) return;

    menuNode.addEventListener('keydown', handleTabTrap);
    firstElement.focus();

    return () => {
      menuNode.removeEventListener('keydown', handleTabTrap);
    };
  }, [isMobileMenuOpen]);

  // Main navigation pillars (Desktop Center)
  const pillars: { id: MainPillar; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'analyze', label: 'Analyze', icon: Activity },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'research', label: 'Research', icon: BrainCircuit },
    { id: 'resources', label: 'Resources', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LEFT: MindSense Logo Identity */}
          <button
            onClick={() => { onSelectPillar('home'); setIsMobileMenuOpen(false); }}
            className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg group"
            aria-label="MindSense Home"
          >
            <div className="p-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 group-hover:border-brand-500/40 transition">
              <MindSenseLogo size={26} />
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

          {/* CENTER: Main Navigation Pillars (Desktop Only) */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            {pillars.map((item) => {
              const isActive = currentPillar === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectPillar(item.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition relative focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    isActive 
                      ? 'text-white bg-slate-800/90 shadow-sm border border-slate-700/60 font-bold' 
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
          </nav>

          {/* RIGHT: Utility Controls & Primary CTA Button */}
          <div className="hidden md:flex items-center gap-2">
            
            {/* Global Search */}
            <button
              onClick={onOpenSearch}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition flex items-center gap-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
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

            {/* Primary CTA Button */}
            <button
              onClick={onStartAnalysis}
              className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Start Analysis</span>
            </button>

            {/* Account Profile / Login */}
            <button
              onClick={onOpenAccount}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              title={currentUser ? `Signed in as ${currentUser.username}` : "Sign In / Account"}
              aria-label={currentUser ? `Account settings for ${currentUser.name}` : "Sign In or Register"}
            >
              <UserIcon className="h-3.5 w-3.5 text-brand-400" />
              <span className="max-w-[90px] truncate">{currentUser ? currentUser.name.split(' ')[0] : 'Account'}</span>
            </button>

            {/* Help / Guide */}
            <button
              onClick={onOpenHelp}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
              title="Help & User Guide"
              aria-label="Help & User Guide"
            >
              <HelpCircle className="h-4 w-4" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
              title={isLightMode ? "Switch to Dark Theme" : "Switch to Light Theme"}
              aria-label="Toggle theme"
            >
              {isLightMode ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>

            {/* System Settings & Privacy */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition focus:outline-none focus:ring-2 focus:ring-brand-500"
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
              className="p-2 rounded-lg text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Toggle theme"
            >
              {isLightMode ? <Moon className="h-4 w-4 text-indigo-400" /> : <Sun className="h-4 w-4 text-amber-400" />}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Accessible Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div 
          ref={mobileMenuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-6 space-y-4 animate-fadeIn"
        >
          {/* Primary CTA */}
          <button
            onClick={() => { onStartAnalysis(); setIsMobileMenuOpen(false); }}
            className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow"
          >
            <Activity className="h-4 w-4" />
            <span>Start Analysis</span>
          </button>

          {/* Navigation Links */}
          <div className="space-y-1 text-xs">
            <button
              onClick={() => { onSelectPillar('home'); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-slate-300 hover:bg-slate-900 font-medium"
            >
              <BookOpen className="h-4 w-4 text-brand-400" />
              <span>Home</span>
            </button>
            {pillars.map((item) => (
              <button
                key={item.id}
                onClick={() => { onSelectPillar(item.id); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg font-medium transition ${
                  currentPillar === item.id ? 'bg-slate-800 text-white font-bold border border-slate-700' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <item.icon className="h-4 w-4 text-brand-400" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Secondary Pages & User Utilities */}
          <div className="pt-3 border-t border-slate-800 space-y-1 text-xs">
            <button
              onClick={() => { onOpenAccount(); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-slate-300 hover:bg-slate-900 font-medium"
            >
              <UserIcon className="h-4 w-4 text-brand-400" />
              <span>Account & Profile ({currentUser ? currentUser.username : 'Sign In'})</span>
            </button>
            <button
              onClick={() => { onOpenSettings(); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-slate-300 hover:bg-slate-900 font-medium"
            >
              <SettingsIcon className="h-4 w-4 text-brand-400" />
              <span>Settings & Privacy</span>
            </button>
            <button
              onClick={() => { onOpenHelp(); setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-slate-300 hover:bg-slate-900 font-medium"
            >
              <HelpCircle className="h-4 w-4 text-brand-400" />
              <span>Help & Assistance</span>
            </button>
            <button
              onClick={() => { window.location.hash = '#/how-to-use'; setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-slate-300 hover:bg-slate-900 font-medium"
            >
              <FileText className="h-4 w-4 text-brand-400" />
              <span>How to Use Walkthrough</span>
            </button>
            <button
              onClick={() => { window.location.hash = '#/rules'; setIsMobileMenuOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-slate-300 hover:bg-slate-900 font-medium"
            >
              <ShieldAlert className="h-4 w-4 text-brand-400" />
              <span>Rules & Regulations</span>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
            <SystemStatusIndicator />
            <a href="#/developer" className="text-indigo-400 hover:underline font-semibold">
              Developer Portal
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

