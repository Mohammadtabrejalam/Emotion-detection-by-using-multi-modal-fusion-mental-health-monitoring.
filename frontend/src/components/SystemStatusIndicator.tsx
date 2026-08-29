import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

export const SystemStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<'operational' | 'checking' | 'unavailable'>('checking');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const ok = await apiService.checkHealth();
        if (isMounted) {
          setStatus(ok ? 'operational' : 'unavailable');
        }
      } catch {
        if (isMounted) {
          setStatus('unavailable');
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:text-white transition cursor-pointer"
        aria-label="System status"
      >
        <span className="relative flex h-2 w-2">
          {status === 'operational' ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </>
          ) : status === 'checking' ? (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          ) : (
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          )}
        </span>
        <span>
          {status === 'operational'
            ? 'Operational'
            : status === 'checking'
            ? 'Checking'
            : 'Service Offline'}
        </span>
      </button>

      {showTooltip && (
        <div className="absolute right-0 top-full mt-2 z-50 w-56 p-3 rounded-xl bg-slate-900 border border-slate-800 shadow-xl text-xs space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between font-bold text-white text-[11px]">
            <span>MindSense API Pipeline</span>
            <span className="font-mono text-[10px] text-slate-400">v1.3</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {status === 'operational'
              ? 'Backend API and PyTorch inference pipeline connected successfully.'
              : 'Backend API service is unavailable. Client running in local demo mode.'}
          </p>
        </div>
      )}
    </div>
  );
};
