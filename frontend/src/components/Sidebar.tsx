import React, { useEffect, useState } from 'react';
import { 
  Home, 
  Activity, 
  History, 
  BarChart3, 
  CheckSquare, 
  BrainCircuit, 
  Settings, 
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { apiService } from '../services/api';
import { MindSenseLogo } from './MindSenseLogo';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [checkingConnection, setCheckingConnection] = useState<boolean>(true);

  const checkConnection = async () => {
    setCheckingConnection(true);
    const connected = await apiService.checkHealth();
    setIsBackendConnected(connected);
    setCheckingConnection(false);
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'analysis', label: 'Live Analysis', icon: Activity },
    { id: 'history', label: 'History Logs', icon: History },
    { id: 'trends', label: 'Trends & Insights', icon: BarChart3 },
    { id: 'checkin', label: 'Daily Check-in', icon: CheckSquare },
    { id: 'research', label: 'Research Mode', icon: BrainCircuit },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 font-sans">
      <div className="p-5">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20">
            <MindSenseLogo size={28} />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white">MindSense</h1>
            <p className="text-[11px] text-slate-400">Research Platform</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive 
                    ? 'bg-brand-600 text-white font-semibold shadow' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Backend Status indicator */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isBackendConnected ? (
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-red-400" />
            )}
            <div className="text-xs">
              <p className="font-semibold text-slate-300">
                {isBackendConnected ? 'Backend Connected' : 'Backend Offline'}
              </p>
              <p className="text-slate-500 text-[10px] font-mono">
                {checkingConnection ? 'Checking...' : `FastAPI Server`}
              </p>
            </div>
          </div>
          <button 
            onClick={checkConnection}
            className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold px-2 py-1 rounded bg-brand-500/10 border border-brand-500/20"
          >
            Retry
          </button>
        </div>
      </div>
    </aside>
  );
};
