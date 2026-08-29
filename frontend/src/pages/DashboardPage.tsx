import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  BrainCircuit, 
  AlertTriangle
} from 'lucide-react';
import { apiService } from '../services/api';
import type { User, DashboardData } from '../types';

interface DashboardPageProps {
  currentUser: User | null;
  onStartAnalysis: () => void;
  onNavigate: (pillar: any, subTab?: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  onStartAnalysis,
  onNavigate
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.getDashboard();
        if (res.success && res.data) {
          setDashboardData(res.data);
        } else {
          setError(res.error?.message || "Failed to load dashboard metrics.");
        }
      } catch (err: any) {
        setError(err.message || "Network error loading dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const summary = dashboardData?.summary;
  const trends = dashboardData?.trends;
  const latestAnalysis = summary?.historic_trends && summary.historic_trends.length > 0 ? summary.historic_trends[0] : null;
  const latestCheckin = summary?.checkin_trends && summary.checkin_trends.length > 0 ? summary.checkin_trends[0] : null;

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      
      {/* Welcome Banner */}
      <div className="academic-card p-6 md:p-8 border-l-4 border-brand-500 bg-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-brand-400 font-mono bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
              Authenticated Researcher Application
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-medium text-slate-400">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {currentUser ? currentUser.name : 'Researcher'}
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Your longitudinal affective workspace is synchronized. Fusing vocal acoustics, natural language text, and facial micro-expressions into real-time cross-attention inferences.
          </p>
        </div>

        <button
          onClick={onStartAnalysis}
          className="px-5 py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs md:text-sm transition shadow-lg flex items-center justify-center gap-2 shrink-0 border border-brand-500/30"
        >
          <Activity className="h-4 w-4" />
          <span>Launch Live Analysis Studio</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="academic-card p-12 text-center text-slate-400 text-xs">
          <div className="animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3" />
          Loading personalized affective insights...
        </div>
      ) : error ? (
        <div className="academic-card p-6 border-l-4 border-amber-500 bg-amber-950/20 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={onStartAnalysis} className="text-brand-400 underline font-semibold">Start First Analysis</button>
        </div>
      ) : (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="academic-card p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Total Inferences</span>
                <BrainCircuit className="h-4 w-4 text-brand-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">
                {summary?.total_analyses || 0}
              </p>
              <p className="text-[11px] text-slate-400">Completed in current workspace</p>
            </div>

            <div className="academic-card p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Wellness Alignment Score</span>
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-400 font-mono">
                {trends?.wellness_score || 78}/100
              </p>
              <p className="text-[11px] text-slate-400">Calculated from somatic check-ins</p>
            </div>

            <div className="academic-card p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Dominant Affect</span>
                <Activity className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-extrabold text-indigo-300 capitalize font-sans">
                {trends?.dominant_emotion || 'Neutral'}
              </p>
              <p className="text-[11px] text-slate-400">Emotional variability: {trends?.emotional_variability || 'Low'}</p>
            </div>

            <div className="academic-card p-5 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                <span>Daily Check-ins</span>
                <Calendar className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-2xl font-extrabold text-white font-mono">
                {summary?.checkin_trends?.length || 0}
              </p>
              <p className="text-[11px] text-slate-400">Logged reflection sessions</p>
            </div>

          </div>

          {/* Main Dashboard Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Analysis Card */}
            <div className="academic-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-brand-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Most Recent Inference</h3>
                </div>
                <button 
                  onClick={() => onNavigate('insights', 'history')}
                  className="text-xs text-brand-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <span>View All History</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {latestAnalysis ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-[11px] uppercase tracking-wide font-mono text-slate-400">Detected State</span>
                      <p className="text-lg font-bold text-white capitalize">{latestAnalysis.final_emotion}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] uppercase tracking-wide font-mono text-slate-400">Confidence</span>
                      <p className="text-lg font-bold font-mono text-brand-400">{Math.round((latestAnalysis.confidence_score || 0) * 100)}%</p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-400 flex items-center justify-between font-mono">
                    <span>Modalities: {(latestAnalysis as any).modalities_used || 'multimodal'}</span>
                    <span>{new Date(latestAnalysis.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs space-y-3">
                  <p>No historical analysis recorded yet.</p>
                  <button onClick={onStartAnalysis} className="px-3.5 py-1.5 rounded-lg bg-brand-600 text-white font-semibold text-xs">
                    Start Your First Analysis
                  </button>
                </div>
              )}
            </div>

            {/* Somatic Check-in Card */}
            <div className="academic-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Latest Somatic Check-in</h3>
                </div>
                <button 
                  onClick={() => onNavigate('insights', 'checkin')}
                  className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <span>New Check-in</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>

              {latestCheckin ? (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block font-mono">Feeling</span>
                      <span className="text-base font-bold text-white font-mono">{latestCheckin.feeling_score}/5</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block font-mono">Energy</span>
                      <span className="text-base font-bold text-white font-mono">{latestCheckin.energy_score}/5</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block font-mono">Sleep</span>
                      <span className="text-base font-bold text-white font-mono">{latestCheckin.sleep_score}/5</span>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block font-mono">Stress</span>
                      <span className="text-base font-bold text-amber-400 font-mono">{latestCheckin.stress_score}/5</span>
                    </div>
                  </div>
                  <p className="text-slate-400 font-mono text-[11px] text-right">
                    Recorded: {new Date(latestCheckin.timestamp).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs space-y-3">
                  <p>No somatic check-ins logged today.</p>
                  <button onClick={() => onNavigate('insights', 'checkin')} className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs">
                    Log Daily Check-in
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Quick Actions Shortcuts */}
          <div className="academic-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
              Research & Reflection Shortcuts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <button 
                onClick={() => onNavigate('insights', 'trends')}
                className="p-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 transition group"
              >
                <div className="flex items-center justify-between text-brand-400 font-semibold">
                  <span>Longitudinal Trends</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-[11px] text-slate-400">Inspect affective variability timeline</p>
              </button>

              <button 
                onClick={() => onNavigate('insights', 'journal')}
                className="p-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 transition group"
              >
                <div className="flex items-center justify-between text-indigo-400 font-semibold">
                  <span>Private Journal</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-[11px] text-slate-400">Log qualitative reflections</p>
              </button>

              <button 
                onClick={() => onNavigate('research', 'architecture')}
                className="p-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 transition group"
              >
                <div className="flex items-center justify-between text-amber-400 font-semibold">
                  <span>ML Architecture</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-[11px] text-slate-400">Cross-Attention mathematical specs</p>
              </button>

              <button 
                onClick={() => onNavigate('resources', 'publications')}
                className="p-3.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left space-y-1 transition group"
              >
                <div className="flex items-center justify-between text-emerald-400 font-semibold">
                  <span>Academic Publications</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
                </div>
                <p className="text-[11px] text-slate-400">Explore literature & datasets</p>
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
