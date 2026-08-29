import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { apiService } from '../services/api';
import type { DashboardData, User } from '../types';

interface TrendsProps {
  currentUser?: User | null;
}

export const Trends: React.FC<TrendsProps> = ({ currentUser }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMsg(null);
    const response = await apiService.getDashboard(currentUser?.id);
    if (response.success && response.data) {
      setData(response.data);
    } else {
      setErrorMsg(response.error?.message || "Failed to compile longitudinal trend metrics.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const formatDateLabel = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="h-6 w-6 text-brand-400 animate-spin" />
        <p className="text-slate-400 text-xs">Aggregating longitudinal trends...</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 space-y-3">
        <AlertTriangle className="h-6 w-6 text-red-400" />
        <p className="font-semibold text-sm">Failed to compile dashboard metrics</p>
        <p className="text-xs text-slate-400">{errorMsg || "Database communication failed."}</p>
        <button 
          onClick={fetchDashboardData}
          className="text-xs text-brand-400 hover:text-brand-300 font-semibold px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, trends } = data;
  const historic = summary.historic_trends || [];
  const checkins = summary.checkin_trends || [];

  const hasHistory = historic.length > 0;
  const hasCheckins = checkins.length > 0;

  const emotionYScale: Record<string, number> = {
    "happy": 5,
    "surprise": 4,
    "neutral": 3,
    "disgust": 2.5,
    "fear": 2,
    "angry": 1.5,
    "sad": 1
  };

  return (
    <div className="space-y-8 py-2">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Longitudinal Affective Trajectory</h2>
          <p className="text-slate-400 text-xs">Temporal analysis of emotional valence shifts and correlated self-reported wellness indices.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition self-start sm:self-auto"
          title="Refresh Trends"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Persistent Negative Warning Card */}
      {trends.alert && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3.5">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="font-bold text-white text-sm">Longitudinal Pattern Notice</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {trends.recent_trend}
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              Note: This is an empirical research threshold indicating elevated negative valence. It does not constitute clinical psychiatric diagnosis.
            </p>
          </div>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyses */}
        <div className="academic-card p-5 space-y-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Assessments</span>
          <p className="text-2xl font-extrabold text-white">{summary.total_analyses}</p>
          <p className="text-[11px] text-slate-500">
            {currentUser ? `@${currentUser.username}'s profile` : 'Session total'}
          </p>
        </div>

        {/* Dominant Emotion */}
        <div className="academic-card p-5 space-y-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Dominant State</span>
          <p className="text-2xl font-extrabold text-brand-400 capitalize">{trends.dominant_emotion}</p>
          <p className="text-[11px] text-slate-500">Variability: <span className="text-slate-300 font-medium">{trends.emotional_variability}</span></p>
        </div>

        {/* Wellness Score */}
        <div className="academic-card p-5 space-y-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Wellness Index</span>
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl font-extrabold text-emerald-400">{trends.wellness_score || 78}%</p>
            <span className="text-[10px] text-emerald-400 font-medium">Positive balance</span>
          </div>
          <p className="text-[11px] text-slate-500">Multimodal correlation</p>
        </div>

        {/* Check-ins & Notes */}
        <div className="academic-card p-5 space-y-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Recorded Entries</span>
          <p className="text-2xl font-extrabold text-indigo-400">{checkins.length + (summary.notes_count || 0)}</p>
          <p className="text-[11px] text-slate-500">{checkins.length} check-ins, {summary.notes_count || 0} reflections</p>
        </div>
      </div>

      {/* CHARTS WORKSPACE */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* 1. Emotion Trend Line (SVG) */}
        <div className="academic-card p-6 space-y-4">
          <div>
            <h4 className="font-bold text-white text-sm">Classification Trajectory</h4>
            <p className="text-xs text-slate-400">Chronological progression of the 10 most recent multimodal predictions.</p>
          </div>
          
          {!hasHistory ? (
            <div className="py-16 text-center text-slate-500 text-xs italic">
              Run analyses in the Live Studio to populate timeline.
            </div>
          ) : (
            <div className="relative h-60 w-full pt-2">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Horizontal scale lines */}
                {[1, 2, 3, 4, 5].map((level, i) => (
                  <line 
                    key={i} 
                    x1="45" 
                    y1={20 + (level - 1) * 40} 
                    x2="490" 
                    y2={20 + (level - 1) * 40} 
                    stroke="#1e293b" 
                    strokeWidth="1" 
                    strokeDasharray="4,4" 
                  />
                ))}

                {/* Y Axis Labels */}
                <text x="40" y="24" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="sans-serif">Happy</text>
                <text x="40" y="64" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="sans-serif">Surprise</text>
                <text x="40" y="104" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="sans-serif">Neutral</text>
                <text x="40" y="144" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="sans-serif">Distress</text>
                <text x="40" y="184" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="sans-serif">Sad</text>

                {(() => {
                  const points = historic.slice().reverse().map((h, i) => {
                    const x = 55 + (i * 430) / Math.max(1, historic.length - 1);
                    const val = emotionYScale[h.final_emotion.toLowerCase()] || 3.0;
                    const y = 180 - ((val - 1) * (160 / 4));
                    return { x, y, emotion: h.final_emotion, date: h.timestamp };
                  });

                  return (
                    <>
                      {points.length > 1 && (
                        <path
                          d={`M ${points.map(p => `${p.x} ${p.y}`).join(" L ")}`}
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      )}
                      {points.map((p, idx) => (
                        <g key={idx} className="cursor-pointer">
                          <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r="4.5" 
                            fill="#2563eb" 
                            stroke="#0f172a" 
                            strokeWidth="2" 
                          />
                          <title>{p.emotion} on {formatDateLabel(p.date)}</title>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          )}
        </div>

        {/* 2. Daily Check-in Scores Line Graph (SVG) */}
        <div className="academic-card p-6 space-y-4">
          <div>
            <h4 className="font-bold text-white text-sm">Self-Reported Wellness Indices</h4>
            <p className="text-xs text-slate-400">Longitudinal self-reported Feeling Score vs. Stress Score (1–5 scale).</p>
          </div>
          
          {!hasCheckins ? (
            <div className="py-16 text-center text-slate-500 text-xs italic">
              Log a Daily Check-in to view wellness trends.
            </div>
          ) : (
            <div className="relative h-60 w-full pt-2">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                {[1, 2.5, 4, 5.5, 7].map((val) => (
                  <line 
                    key={val} 
                    x1="35" 
                    y1={20 + (val - 1) * 25} 
                    x2="490" 
                    y2={20 + (val - 1) * 25} 
                    stroke="#1e293b" 
                    strokeWidth="1" 
                    strokeDasharray="4,4" 
                  />
                ))}

                <text x="30" y="24" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="sans-serif">5 (High)</text>
                <text x="30" y="104" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="sans-serif">3 (Avg)</text>
                <text x="30" y="184" fill="#64748b" fontSize="9" textAnchor="end" fontFamily="sans-serif">1 (Low)</text>

                {(() => {
                  const activeLogs = checkins.slice(0, 10).reverse();
                  
                  const feelingPoints = activeLogs.map((c, i) => {
                    const x = 45 + (i * 440) / Math.max(1, activeLogs.length - 1);
                    const y = 180 - ((c.feeling_score - 1) * 40);
                    return { x, y };
                  });

                  const stressPoints = activeLogs.map((c, i) => {
                    const x = 45 + (i * 440) / Math.max(1, activeLogs.length - 1);
                    const y = 180 - ((c.stress_score - 1) * 40);
                    return { x, y };
                  });

                  return (
                    <>
                      {feelingPoints.length > 1 && (
                        <path
                          d={`M ${feelingPoints.map(p => `${p.x} ${p.y}`).join(" L ")}`}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      )}
                      {stressPoints.length > 1 && (
                        <path
                          d={`M ${stressPoints.map(p => `${p.x} ${p.y}`).join(" L ")}`}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeDasharray="3,3"
                        />
                      )}
                      {feelingPoints.map((p, idx) => (
                        <circle key={`f-${idx}`} cx={p.x} cy={p.y} r="4" fill="#10b981" stroke="#0f172a" strokeWidth="1.5" />
                      ))}
                      {stressPoints.map((p, idx) => (
                        <circle key={`s-${idx}`} cx={p.x} cy={p.y} r="4" fill="#ef4444" stroke="#0f172a" strokeWidth="1.5" />
                      ))}
                    </>
                  );
                })()}
              </svg>
              
              <div className="flex gap-4 text-[10px] font-medium text-slate-400 pt-2">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Feeling Index (Solid)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Stress Index (Dashed)
                </span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 3. Modality Usage Frequency & Psychoeducational Recommendation */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Modality Usage */}
        <div className="academic-card p-6 space-y-4">
          <h4 className="font-bold text-white text-sm">Modality Ingestion Volume</h4>
          
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Written Text</span>
                <span className="font-mono text-slate-200 font-semibold">{summary.modality_usage.text} runs</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-indigo-500" 
                  style={{ width: `${Math.min(100, (summary.modality_usage.text / Math.max(1, summary.total_analyses)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Speech Acoustics</span>
                <span className="font-mono text-slate-200 font-semibold">{summary.modality_usage.audio} runs</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-emerald-500" 
                  style={{ width: `${Math.min(100, (summary.modality_usage.audio / Math.max(1, summary.total_analyses)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Facial Vision</span>
                <span className="font-mono text-slate-200 font-semibold">{summary.modality_usage.image} runs</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${Math.min(100, (summary.modality_usage.image / Math.max(1, summary.total_analyses)) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Longitudinal Wellness Recommendation */}
        <div className="academic-card p-6 md:col-span-2 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="h-4 w-4" />
              <span>Automated Research Insights</span>
            </div>
            <h4 className="font-bold text-white text-base">Longitudinal Affective Synthesis</h4>
            <p className="text-xs text-slate-300 leading-relaxed mt-2">
              {trends.recent_trend || "Maintain consistent multi-modal check-ins to build high-granularity temporal models of emotional transitions and stress recovery curves."}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Aggregated across {summary.total_analyses} inference points</span>
            <span className="font-mono text-slate-500">Cross-Attention Masked</span>
          </div>
        </div>

      </div>
    </div>
  );
};
