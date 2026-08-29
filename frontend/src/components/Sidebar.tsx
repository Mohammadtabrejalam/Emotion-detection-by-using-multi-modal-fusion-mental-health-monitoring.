import React, { useEffect, useState } from 'react';
import { 
  Home, 
  Activity, 
  History, 
  BarChart3, 
  CheckSquare, 
  BrainCircuit, 
  Settings, 
  ActivitySquare,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { apiService } from '../services/api';

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
    // Poll connection status every 15 seconds
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'analysis', label: 'New Analysis', icon: Activity },
    { id: 'history', label: 'History Logs', icon: History },
    { id: 'trends', label: 'Trends & Insights', icon: BarChart3 },
    { id: 'checkin', label: 'Daily Check-in', icon: CheckSquare },
    { id: 'research', label: 'Research Mode', icon: BrainCircuit },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0">
      <div className="p-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-brand-500 text-white p-2.5 rounded-xl shadow-lg shadow-brand-500/25 flex items-center justify-center">
            <ActivitySquare className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white font-sans">MindSense</h1>
            <p className="text-xs text-slate-400">Multimodal AI Platform</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/10' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Backend Status indicator */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isBackendConnected ? (
              <ShieldCheck className="h-4 w-4 text-emerald-400 animate-pulse" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-red-400" />
            )}
            <div className="text-xs">
              <p className="font-semibold text-slate-300">
                {isBackendConnected ? 'Server Connected' : 'Server Offline'}
              </p>
              <p className="text-slate-500 text-[10px]">
                {checkingConnection ? 'Checking...' : `API v1.0`}
              </p>
            </div>
          </div>
          <button 
            onClick={checkConnection}
            className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold px-2 py-1 rounded bg-brand-500/10"
          >
            Retry
          </button>
        </div>
      </div>
    </aside>
  );
};
