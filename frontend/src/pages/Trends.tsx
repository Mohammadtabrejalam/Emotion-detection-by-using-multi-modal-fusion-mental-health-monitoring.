import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  AlertTriangle,
  RefreshCw
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
      setErrorMsg(response.error?.message || "Failed to compile trend logs.");
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
        <RefreshCw className="h-8 w-8 text-brand-400 animate-spin" />
        <p className="text-slate-400 text-sm">Aggregating historical trends...</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 space-y-3">
        <AlertTriangle className="h-8 w-8 text-red-400" />
        <p className="font-semibold">Failed to compile dashboard metrics</p>
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

  // Total analysis check
  const hasHistory = historic.length > 0;
  const hasCheckins = checkins.length > 0;

  // Emotion mapping for SVG line charts (0-6 mapping scale)
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
    <div className="space-y-8 py-4">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Trends & Insights</h2>
          <p className="text-slate-400 text-sm">Longitudinal evaluation of emotional states and check-in scores.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* PERSISTENT NEGATIVE SIGNALS WARNING CARD */}
      {trends.alert && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/20 text-amber-200 flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-bold text-white text-base">Longitudinal Signal Alert</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {trends.recent_trend}
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              Note: This is an AI-generated warning threshold indicating elevated negative inputs. It is not a clinical assessment of mood disorders.
            </p>
          </div>
        </div>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total analyses */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Assessments</span>
          <p className="text-3xl font-extrabold text-white">{summary.total_analyses}</p>
          <p className="text-xs text-slate-400">
            {currentUser ? `@${currentUser.username}'s analyses` : 'Workspace total'}
          </p>
        </div>

        {/* Dominant Emotion */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Dominant Mood</span>
          <p className="text-3xl font-extrabold text-brand-400 capitalize">{trends.dominant_emotion}</p>
          <p className="text-xs text-slate-400">Variability: <span className="text-indigo-300 font-semibold">{trends.emotional_variability}</span></p>
        </div>

        {/* Mental Health Score */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Wellness Index</span>
          <div className="flex items-baseline gap-1.5">
            <p className="text-3xl font-extrabold text-emerald-400">{trends.wellness_score || 78}%</p>
            <span className="text-xs text-emerald-300 font-medium">Positive balance</span>
          </div>
          <p className="text-xs text-slate-400">AI mood & check-in correlation</p>
        </div>

        {/* Check-ins & Notes */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Logs & Reflections</span>
          <p className="text-3xl font-extrabold text-indigo-400">{checkins.length + (summary.notes_count || 0)}</p>
          <p className="text-xs text-slate-400">{checkins.length} check-ins, {summary.notes_count || 0} notes</p>
        </div>
      </div>

      {/* CHARTS GRAPH WORKSPACE */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 1. Emotion Trend Line (SVG) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h4 className="font-bold text-slate-200">Assessment History Timeline</h4>
            <p className="text-xs text-slate-400">Sequence of the 10 most recent emotional classifications.</p>
          </div>
          
          {!hasHistory ? (
            <div className="py-20 text-center text-slate-500 text-xs italic">
              Assess emotions in the workspace to view timeline.
            </div>
          ) : (
            <div className="relative h-64 w-full">
              {/* Native SVG plotting */}
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Horizontal scale lines */}
                {[1, 2, 3, 4, 5].map((level, i) => (
                  <line 
                    key={i} 
                    x1="40" 
                    y1={20 + (level - 1) * 40} 
                    x2="490" 
                    y2={20 + (level - 1) * 40} 
                    stroke="#1e293b" 
                    strokeWidth="1" 
                    strokeDasharray="4,4" 
                  />
                ))}

                {/* Y Axis Labels */}
                <text x="35" y="25" fill="#64748b" fontSize="8" textAnchor="end">Happy</text>
                <text x="35" y="65" fill="#64748b" fontSize="8" textAnchor="end">Surprise</text>
                <text x="35" y="105" fill="#64748b" fontSize="8" textAnchor="end">Neutral</text>
                <text x="35" y="145" fill="#64748b" fontSize="8" textAnchor="end">Fear/Stress</text>
                <text x="35" y="185" fill="#64748b" fontSize="8" textAnchor="end">Sad</text>

                {/* Plotting points & connecting lines */}
                {(() => {
                  const points = historic.slice().reverse().map((h, i) => {
                    const x = 50 + (i * 440) / Math.max(1, historic.length - 1);
                    const val = emotionYScale[h.final_emotion.toLowerCase()] || 3.0; // Fallback neutral
                    // map val (1 to 5) to y coordinates (180 to 20)
                    const y = 180 - ((val - 1) * (160 / 4));
                    return { x, y, emotion: h.final_emotion, date: h.timestamp };
                  });

                  return (
                    <>
                      {/* Connection Line */}
                      {points.length > 1 && (
                        <path
                          d={`M ${points.map(p => `${p.x} ${p.y}`).join(" L ")}`}
                          fill="none"
                          stroke="#3b5eff"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      )}
                      {/* Data Dots */}
                      {points.map((p, idx) => (
                        <g key={idx} className="group cursor-pointer">
                          <circle 
                            cx={p.x} 
                            cy={p.y} 
                            r="5" 
                            fill="#3b5eff" 
                            stroke="#070a13" 
                            strokeWidth="2" 
                          />
                          {/* Tooltip trigger hover */}
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
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h4 className="font-bold text-slate-200">Daily Wellness Score Trends</h4>
            <p className="text-xs text-slate-400">Tracking daily levels (feeling, stress, sleep, energy) mapped on 1-5 scale.</p>
          </div>
          
          {!hasCheckins ? (
            <div className="py-20 text-center text-slate-500 text-xs italic">
              Log a Daily Check-in to view wellness trends.
            </div>
          ) : (
            <div className="relative h-64 w-full">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                {/* Horizontal scale lines */}
                {[1, 2.5, 4, 5.5, 7].map((val) => (
                  <line 
                    key={val} 
                    x1="30" 
                    y1={20 + (val - 1) * 25} 
                    x2="490" 
                    y2={20 + (val - 1) * 25} 
                    stroke="#1e293b" 
                    strokeWidth="1" 
                    strokeDasharray="4,4" 
                  />
                ))}

                {/* Y Axis labels (Scale 5 down to 1) */}
                <text x="25" y="25" fill="#64748b" fontSize="8" textAnchor="end">5 (High)</text>
                <text x="25" y="105" fill="#64748b" fontSize="8" textAnchor="end">3 (Avg)</text>
                <text x="25" y="185" fill="#64748b" fontSize="8" textAnchor="end">1 (Low)</text>

                {/* Plotting feeling trend curve (Emerald) and stress curve (Red) */}
                {(() => {
                  // Last 10 checkins in chronological order
                  const activeLogs = checkins.slice(0, 10).reverse();
                  
                  const feelingPoints = activeLogs.map((c, i) => {
                    const x = 40 + (i * 440) / Math.max(1, activeLogs.length - 1);
                    const y = 180 - ((c.feeling_score - 1) * 40); // Map 1-5 to 180-20
                    return { x, y };
                  });

                  const stressPoints = activeLogs.map((c, i) => {
                    const x = 40 + (i * 440) / Math.max(1, activeLogs.length - 1);
                    const y = 180 - ((c.stress_score - 1) * 40); // Map 1-5 to 180-20
                    return { x, y };
                  });

                  return (
                    <>
                      {/* Feeling Curve */}
                      {feelingPoints.length > 1 && (
                        <path
                          d={`M ${feelingPoints.map(p => `${p.x} ${p.y}`).join(" L ")}`}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      )}
                      
                      {/* Stress Curve */}
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

                      {/* Dots for Feeling */}
                      {feelingPoints.map((p, idx) => (
                        <circle key={`f-${idx}`} cx={p.x} cy={p.y} r="4" fill="#10b981" stroke="#070a13" strokeWidth="1.5" />
                      ))}

                      {/* Dots for Stress */}
                      {stressPoints.map((p, idx) => (
                        <circle key={`s-${idx}`} cx={p.x} cy={p.y} r="4" fill="#ef4444" stroke="#070a13" strokeWidth="1.5" />
                      ))}
                    </>
                  );
                })()}
              </svg>
              
              {/* Legend */}
              <div className="absolute bottom-1 left-12 flex gap-4 text-[9px] font-semibold tracking-wider text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Feeling (Solid)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Stress (Dashed)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Modality usage and Advice Breakdown */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Modality usage breakdown card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h4 className="font-bold text-slate-200">Modality Usage Frequency</h4>
          
          <div className="space-y-4 pt-2">
            {/* Text usage */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Written Text</span>
                <span className="font-semibold text-slate-300">{summary.modality_usage.text} runs</span>
              </div>
              <div className="h-2 bg-slate-850 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500" 
                  style={{ width: `${(summary.modality_usage.text / Math.max(1, summary.total_analyses)) * 100}%` }}
                />
              </div>
            </div>

            {/* Audio usage */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Voice Acoustics</span>
                <span className="font-semibold text-slate-300">{summary.modality_usage.audio} runs</span>
              </div>
              <div className="h-2 bg-slate-850 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500" 
                  style={{ width: `${(summary.modality_usage.audio / Math.max(1, summary.total_analyses)) * 100}%` }}
                />
              </div>
            </div>

            {/* Image usage */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Facial Expressions</span>
                <span className="font-semibold text-slate-300">{summary.modality_usage.image} runs</span>
              </div>
              <div className="h-2 bg-slate-850 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${(summary.modality_usage.image / Math.max(1, summary.total_analyses)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Emotion Distribution aggregation card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h4 className="font-bold text-slate-200">Emotion Aggregate Distribution</h4>
          
          {Object.keys(summary.emotion_distribution).length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">No emotion distribution aggregates.</p>
          ) : (
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {Object.entries(summary.emotion_distribution)
                .sort((a,b) => b[1] - a[1])
                .map(([emo, count]) => (
                  <div key={emo} className="flex justify-between items-center text-xs border-b border-slate-850 py-1.5">
                    <span className="capitalize text-slate-400">{emo}</span>
                    <span className="font-bold text-slate-200">{count} assessments</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Wellness Tip Advisory card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand-400">
              <Heart className="h-5 w-5" />
              <h4 className="font-bold text-slate-200">Wellness Advisory</h4>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              If your trends show continuous high stress or low feeling metrics, check in with a friend or write down details. Taking a 10-minute walk or practicing progressive muscle relaxation can help offset negative acoustics and tension signals.
            </p>
          </div>

          <div className="text-[10px] text-slate-500 border-t border-slate-850 pt-2.5 leading-relaxed italic">
            Advisory notice: Suggestions are lifestyle guidelines for wellness maintenance and are not medical plans.
          </div>
        </div>
      </div>
    </div>
  );
};
