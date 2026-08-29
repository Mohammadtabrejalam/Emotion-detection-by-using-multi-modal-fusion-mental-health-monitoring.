import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  BarChart3, 
  MessageSquare, 
  ShieldCheck, 
  Bot, 
  LogOut, 
  RefreshCw, 
  AlertCircle, 
  Cpu, 
  Filter,
  FileCode,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { apiService } from '../../services/api';

export type DevTab = 'overview' | 'analytics' | 'feedback' | 'health' | 'assistant' | 'audit' | 'requests';
export type DevAuthMode = 'login' | 'register' | 'verify' | 'pending' | 'forgot' | 'reset';

export const DeveloperPortal: React.FC = () => {
  // Session & Auth State
  const [devSession, setDevSession] = useState<{ developer: any; token: string } | null>(() => {
    const saved = localStorage.getItem('mindsense_dev_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [authMode, setAuthMode] = useState<DevAuthMode>('login');
  
  // Login Form
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('admin@mindsense.ai');
  const [password, setPassword] = useState<string>('admin123');
  
  // Registration Form
  const [regFullName, setRegFullName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [regOrganization, setRegOrganization] = useState<string>('Independent Research Lab');
  const [regRole, setRegRole] = useState<string>('DEVELOPER');

  // Forgot / Reset Password Form
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [resetTokenInput, setResetTokenInput] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // Active Developer Navigation Tab
  const [activeTab, setActiveTab] = useState<DevTab>('overview');

  // Data States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [healthData, setHealthData] = useState<any>(null);
  const [assistantMetrics, setAssistantMetrics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [developerRequests, setDeveloperRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Selected feedback for editing notes
  const [selectedFeedback, setSelectedFeedback] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState<string>('New');
  const [editPriority, setEditPriority] = useState<string>('Medium');
  const [editNotes, setEditNotes] = useState<string>('');
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const res = await apiService.developerLogin(usernameOrEmail, password);
    if (res.success && res.data) {
      setDevSession(res.data);
      localStorage.setItem('mindsense_dev_session', JSON.stringify(res.data));
    } else {
      setAuthError(res.error?.message || "Invalid developer credentials or inactive account.");
    }
    setAuthLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);

    if (regPassword !== regConfirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }

    setAuthLoading(true);
    const res = await apiService.developerRegister({
      full_name: regFullName,
      username: regUsername,
      email: regEmail,
      password: regPassword,
      organization: regOrganization,
      requested_role: regRole
    });

    if (res.success && res.data) {
      setAuthSuccessMsg("Developer registration submitted successfully! Your account state is PENDING_APPROVAL. An administrator must approve your request before login.");
      setAuthMode('pending');
    } else {
      setAuthError(res.error?.message || "Developer registration failed.");
    }
    setAuthLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessMsg(null);

    const res = await apiService.developerForgotPassword(forgotEmail);
    if (res.success && res.data) {
      setAuthSuccessMsg(`Password reset token generated: ${res.data.reset_token || 'Sent to email'}`);
      if (res.data.reset_token) setResetTokenInput(res.data.reset_token);
      setAuthMode('reset');
    } else {
      setAuthError(res.error?.message || "Failed to initiate password reset.");
    }
    setAuthLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessMsg(null);

    const res = await apiService.developerResetPassword(resetTokenInput, newPassword);
    if (res.success) {
      setAuthSuccessMsg("Developer password updated successfully. You may now sign in.");
      setAuthMode('login');
    } else {
      setAuthError(res.error?.message || "Failed to reset password.");
    }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    await apiService.developerLogout();
    setDevSession(null);
    localStorage.removeItem('mindsense_dev_session');
  };

  const fetchDevData = async () => {
    if (!devSession) return;
    setLoading(true);
    
    if (activeTab === 'overview') {
      const res = await apiService.getDeveloperDashboard(devSession.token);
      if (res.success) setDashboardData(res.data);
    } else if (activeTab === 'analytics') {
      const res = await apiService.getDeveloperAnalytics(devSession.token);
      if (res.success) setAnalyticsData(res.data);
    } else if (activeTab === 'feedback') {
      const res = await apiService.getDeveloperFeedback(statusFilter, priorityFilter);
      if (res.success && res.data) setFeedbackList(res.data.feedback);
    } else if (activeTab === 'health') {
      const res = await apiService.getDeveloperHealth();
      if (res.success) setHealthData(res.data);
    } else if (activeTab === 'assistant') {
      const res = await apiService.getDeveloperAssistant();
      if (res.success) setAssistantMetrics(res.data);
    } else if (activeTab === 'audit') {
      const res = await apiService.getDeveloperAuditLogs();
      if (res.success && res.data) setAuditLogs(res.data.logs);
    } else if (activeTab === 'requests') {
      const res = await apiService.getDeveloperRequests();
      if (res.success && res.data) setDeveloperRequests(res.data.requests);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDevData();
  }, [devSession, activeTab, statusFilter, priorityFilter]);

  const handleUpdateDevStatus = async (devId: number, status: string) => {
    setUpdateMsg(null);
    const res = await apiService.updateDeveloperStatus(devId, status);
    if (res.success) {
      setUpdateMsg(`Developer account status changed to ${status}.`);
      fetchDevData();
    } else {
      alert("Failed to update status: " + (res.error?.message || "Permission denied"));
    }
  };

  const handleUpdateFeedback = async () => {
    if (!selectedFeedback) return;
    setUpdateMsg(null);
    const res = await apiService.updateDeveloperFeedback(
      selectedFeedback.id,
      editStatus,
      editPriority,
      editNotes,
      devSession?.developer.username || "ADMIN"
    );
    if (res.success) {
      setUpdateMsg("Feedback status & internal notes updated.");
      setSelectedFeedback(null);
      fetchDevData();
    } else {
      alert("Failed to update feedback: " + (res.error?.message || "Unknown error"));
    }
  };

  // DEVELOPER AUTH SCREENS (LOGIN, REGISTER, FORGOT, RESET, PENDING)
  if (!devSession) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-2xl">
          
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <Cpu className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">MindSense Developer Portal</h1>
            <p className="text-xs text-slate-400">Operational diagnostics, system metrics, and administrative access.</p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-950 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono">
              {authSuccessMsg}
            </div>
          )}

          {/* VIEW 1: DEVELOPER LOGIN */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-indigo-300 text-[11px] font-mono">
                <strong>Demo Admin:</strong> admin@mindsense.ai / admin123
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Developer ID / Email</label>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-brand-500 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-300">Password</label>
                  <button type="button" onClick={() => setAuthMode('forgot')} className="text-brand-400 hover:underline text-[11px]">
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-brand-500 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-white text-xs uppercase tracking-wider shadow transition"
              >
                {authLoading ? 'Authenticating...' : 'Sign In to Developer Portal'}
              </button>

              <div className="pt-2 text-center text-slate-400 border-t border-slate-800">
                Need developer API access?{' '}
                <button type="button" onClick={() => setAuthMode('register')} className="text-brand-400 hover:underline font-bold">
                  Apply for Developer Account
                </button>
              </div>
            </form>
          )}

          {/* VIEW 2: DEVELOPER REGISTRATION */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Dr. Elena Vance"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Username</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="elena_vance"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="elena@lab.org"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Confirm Password</label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Organization</label>
                  <input
                    type="text"
                    value={regOrganization}
                    onChange={(e) => setRegOrganization(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Requested Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="DEVELOPER">DEVELOPER</option>
                    <option value="ANALYST">ANALYST</option>
                    <option value="SUPPORT">SUPPORT</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-white text-xs uppercase tracking-wider shadow transition"
              >
                {authLoading ? 'Submitting Application...' : 'Submit Developer Application'}
              </button>

              <div className="pt-2 text-center text-slate-400">
                Already registered?{' '}
                <button type="button" onClick={() => setAuthMode('login')} className="text-brand-400 hover:underline font-bold">
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: PENDING APPROVAL NOTICE */}
          {authMode === 'pending' && (
            <div className="space-y-4 text-center text-xs">
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 space-y-2 text-amber-200">
                <Clock className="h-8 w-8 text-amber-400 mx-auto" />
                <h3 className="font-bold text-sm text-white">Application Pending Approval</h3>
                <p>Your developer registration has been recorded and verified. Your account remains in <strong>PENDING_APPROVAL</strong> state until an administrator reviews and approves your access.</p>
              </div>
              <button
                onClick={() => setAuthMode('login')}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-white font-bold"
              >
                Back to Developer Login
              </button>
            </div>
          )}

          {/* VIEW 4: FORGOT PASSWORD */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Developer Username or Email</label>
                <input
                  type="text"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="admin@mindsense.ai"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-white text-xs uppercase"
              >
                {authLoading ? 'Generating Reset Token...' : 'Generate Password Reset Token'}
              </button>

              <div className="pt-2 text-center text-slate-400">
                <button type="button" onClick={() => setAuthMode('login')} className="text-brand-400 hover:underline">
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* VIEW 5: RESET PASSWORD */}
          {authMode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Reset Token</label>
                <input
                  type="text"
                  value={resetTokenInput}
                  onChange={(e) => setResetTokenInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 font-bold text-white text-xs uppercase"
              >
                {authLoading ? 'Updating Password...' : 'Set New Password'}
              </button>
            </form>
          )}

        </div>
      </div>
    );
  }

  const devRole = devSession.developer.role || "DEVELOPER";
  const isAdmin = devRole === "SUPER_ADMIN" || devRole === "ADMIN";

  // MAIN DEVELOPER PORTAL DASHBOARD
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      
      {/* 1. DEVELOPER HEADER NAVBAR */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <Cpu className="h-5 w-5 text-brand-400" />
            <span className="font-extrabold text-base text-white font-mono tracking-tight">MindSense DevPortal</span>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {devRole}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 hidden sm:inline font-mono">
              Signed in as <strong className="text-white">{devSession.developer.name}</strong> ({devSession.developer.organization || 'Lab'})
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium border border-slate-700 transition flex items-center gap-1.5"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. TAB SELECTION BAR */}
      <div className="bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto py-2.5 text-xs font-mono">
          {[
            { id: 'overview', label: 'System Overview', icon: Activity },
            { id: 'analytics', label: 'Usage Analytics', icon: BarChart3 },
            { id: 'feedback', label: 'Feedback Workflow', icon: MessageSquare },
            { id: 'health', label: 'System Health', icon: ShieldCheck },
            { id: 'assistant', label: 'Assistant Monitor', icon: Bot },
            { id: 'audit', label: 'Audit Logs', icon: FileCode },
            ...(isAdmin ? [{ id: 'requests', label: 'Developer Requests', icon: UserCheck }] : [])
          ].map((tab) => {
            const Icon = tab.icon as any;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DevTab)}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {updateMsg && (
          <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono">
            {updateMsg}
          </div>
        )}

        {loading && (
          <div className="py-4 text-center text-slate-400 text-xs font-mono flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-brand-400" />
            <span>Fetching operational metrics...</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && dashboardData && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Site Visits</span>
                <p className="text-2xl font-extrabold text-white">{dashboardData.total_visits}</p>
                <span className="text-[10px] text-emerald-400">Real backend visits count</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Analyses Completed</span>
                <p className="text-2xl font-extrabold text-white">{dashboardData.total_analyses}</p>
                <span className="text-[10px] text-brand-400">{dashboardData.pytorch_analyses} PyTorch weights</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Analysis Success Rate</span>
                <p className="text-2xl font-extrabold text-emerald-400">{dashboardData.success_rate}%</p>
                <span className="text-[10px] text-slate-400">{dashboardData.failure_rate}% failure rate</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">New Feedback Items</span>
                <p className="text-2xl font-extrabold text-amber-400">{dashboardData.new_feedback_count}</p>
                <span className="text-[10px] text-slate-400">Action required</span>
              </div>
            </div>

            {/* Service Status */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Service Availability Overview</h2>
              <div className="grid sm:grid-cols-3 gap-3 text-xs font-mono">
                {Object.entries(dashboardData.system_health || {}).map(([service, stat]) => (
                  <div key={service} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="capitalize text-slate-300 font-semibold">{service.replace('_', ' ')}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase">
                      {String(stat)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: ANALYTICS */}
        {activeTab === 'analytics' && analyticsData && (
          <div className="space-y-6 animate-fadeIn text-xs">
            <div className="grid md:grid-cols-2 gap-6">
              
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="font-bold text-white text-sm font-mono uppercase tracking-wider">Site Visits Over Time (7 Days)</h3>
                <div className="space-y-2 font-mono">
                  {analyticsData.visits_time_series.map((item: any) => (
                    <div key={item.date} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-300">{item.date}</span>
                      <span className="font-bold text-brand-400">{item.count} visits</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="font-bold text-white text-sm font-mono uppercase tracking-wider">Analyses Completed Over Time (7 Days)</h3>
                <div className="space-y-2 font-mono">
                  {analyticsData.analyses_time_series.map((item: any) => (
                    <div key={item.date} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-300">{item.date}</span>
                      <span className="font-bold text-emerald-400">{item.count} analyses</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: FEEDBACK WORKFLOW */}
        {activeTab === 'feedback' && (
          <div className="space-y-6 animate-fadeIn text-xs">
            
            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 font-mono">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-brand-400" />
                <span className="font-bold text-white">Filter:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
                >
                  <option value="All">All Statuses</option>
                  <option value="New">New</option>
                  <option value="In Review">In Review</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
                >
                  <option value="All">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <span className="text-slate-400 font-mono text-[11px]">{feedbackList.length} items found</span>
            </div>

            {/* List */}
            <div className="space-y-3">
              {feedbackList.map((item) => (
                <div key={item.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-brand-400 font-bold">#{item.id}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px] uppercase">{item.category}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                        item.status === 'New' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        item.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">{new Date(item.timestamp).toLocaleString()}</span>
                  </div>

                  <p className="text-slate-200 leading-relaxed font-normal">{item.comment || 'No comment provided.'}</p>

                  {item.internal_notes && (
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-brand-300">
                      <strong>Internal Notes:</strong> {item.internal_notes}
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        setSelectedFeedback(item);
                        setEditStatus(item.status || 'New');
                        setEditPriority(item.priority || 'Medium');
                        setEditNotes(item.internal_notes || '');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-[11px] font-semibold"
                    >
                      Update Status & Notes
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* EDIT FEEDBACK MODAL */}
            {selectedFeedback && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 text-xs">
                  <h3 className="font-bold text-white text-sm font-mono">Update Feedback #{selectedFeedback.id}</h3>
                  
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      <option value="New">New</option>
                      <option value="In Review">In Review</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Internal Developer Notes</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={3}
                      placeholder="Add developer notes..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setSelectedFeedback(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">Cancel</button>
                    <button onClick={handleUpdateFeedback} className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold">Save Changes</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: HEALTH DIAGNOSTICS */}
        {activeTab === 'health' && healthData && (
          <div className="space-y-6 animate-fadeIn font-mono text-xs">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Multi-Service System Health</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(healthData.services || {}).map(([service, info]: [string, any]) => (
                  <div key={service} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="capitalize font-bold text-white block">{service.replace('_', ' ')}</span>
                    <span className="text-emerald-400 font-mono font-bold uppercase text-[10px]">Status: {info.status}</span>
                    {info.latency_ms && <p className="text-slate-400 text-[10px]">Latency: {info.latency_ms}ms</p>}
                    {info.mode && <p className="text-slate-400 text-[10px]">Mode: {info.mode}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ASSISTANT MONITOR */}
        {activeTab === 'assistant' && assistantMetrics && (
          <div className="space-y-6 animate-fadeIn font-mono text-xs">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Queries Processed</span>
                <p className="text-2xl font-extrabold text-white">{assistantMetrics.total_queries_processed}</p>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Crisis Diversions Triggered</span>
                <p className="text-2xl font-extrabold text-emerald-400">{assistantMetrics.crisis_diversions_triggered}</p>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Response Latency</span>
                <p className="text-2xl font-extrabold text-brand-400">{assistantMetrics.avg_response_ms} ms</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-4 animate-fadeIn font-mono text-xs">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Administrative Audit Logs</h2>
              
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap justify-between items-center gap-2">
                    <div className="space-y-0.5">
                      <span className="font-bold text-brand-400">{log.action}</span>
                      <span className="text-slate-400 block text-[11px]">Actor: {log.actor_id} ({log.actor_role})</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: DEVELOPER REQUESTS (ADMIN ONLY) */}
        {activeTab === 'requests' && isAdmin && (
          <div className="space-y-6 animate-fadeIn font-mono text-xs">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Developer Registration & Access Applications</h2>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">Review, approve, or revoke access for developer applicants.</p>
                </div>
                <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                  {developerRequests.length} Applications
                </span>
              </div>

              {developerRequests.length === 0 ? (
                <p className="text-slate-400 py-6 text-center">No pending or registered developer requests found.</p>
              ) : (
                <div className="space-y-3">
                  {developerRequests.map((req) => (
                    <div key={req.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{req.name}</span>
                          <span className="text-slate-400">({req.username})</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            req.account_state === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            req.account_state === 'PENDING_APPROVAL' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            req.account_state === 'SUSPENDED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {req.account_state}
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px] flex flex-wrap gap-x-4">
                          <span>Email: {req.email}</span>
                          <span>Org: {req.organization || 'N/A'}</span>
                          <span>Role: {req.requested_role || req.role}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">Registered: {new Date(req.created_at).toLocaleString()}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {req.account_state !== 'ACTIVE' && (
                          <button
                            onClick={() => handleUpdateDevStatus(req.id, 'ACTIVE')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                        )}
                        {req.account_state === 'ACTIVE' && (
                          <button
                            onClick={() => handleUpdateDevStatus(req.id, 'SUSPENDED')}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold transition"
                          >
                            Suspend
                          </button>
                        )}
                        {req.account_state !== 'REVOKED' && (
                          <button
                            onClick={() => handleUpdateDevStatus(req.id, 'REVOKED')}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition flex items-center gap-1"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject / Revoke</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

    </div>
  );
};
