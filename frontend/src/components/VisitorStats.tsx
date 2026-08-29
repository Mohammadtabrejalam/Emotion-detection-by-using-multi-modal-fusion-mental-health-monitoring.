import React, { useState, useEffect } from 'react';
import { Activity, Users, Eye, BookOpen, Database } from 'lucide-react';
import { apiService } from '../services/api';
import type { SiteStats } from '../types';

export const VisitorStats: React.FC = () => {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        const res = await apiService.getStats();
        if (isMounted) {
          if (res.success && res.data) {
            setStats(res.data);
            setIsOffline(false);
          } else {
            setIsOffline(true);
          }
        }
      } catch {
        if (isMounted) {
          setIsOffline(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <section className="academic-card p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block mb-0.5">
            Platform Metrics & Audit
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Real-Time System Usage Statistics
          </h2>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 w-fit">
          <Database className="h-3.5 w-3.5 text-brand-400" />
          <span>Backend Analytics Counter</span>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-slate-400 font-mono animate-pulse">
          Retrieving live usage metrics from database...
        </div>
      ) : isOffline || !stats ? (
        <div className="py-8 px-4 text-center rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <Database className="h-6 w-6 text-slate-500 mx-auto" />
          <p className="text-xs font-semibold text-slate-300">
            Usage statistics will appear here when connected to the backend database.
          </p>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            MindSense tracks session page views and completed inferences directly in the backend SQLite ledger without capturing personally identifiable information.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Eye className="h-4 w-4 text-indigo-400" />
              <span>Website Visits</span>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono block">
              {stats.total_visits.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Total session page views</span>
          </div>

          <div className="space-y-1 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Analyses Conducted</span>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono block">
              {stats.total_analyses.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Fused inferences logged</span>
          </div>

          <div className="space-y-1 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <BookOpen className="h-4 w-4 text-brand-400" />
              <span>Research Resources</span>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-brand-400 font-mono block">
              {stats.total_articles.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Published study articles</span>
          </div>

          <div className="space-y-1 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Users className="h-4 w-4 text-amber-400" />
              <span>Registered Accounts</span>
            </div>
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono block">
              {stats.registered_users.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Active research accounts</span>
          </div>
        </div>
      )}
    </section>
  );
};
