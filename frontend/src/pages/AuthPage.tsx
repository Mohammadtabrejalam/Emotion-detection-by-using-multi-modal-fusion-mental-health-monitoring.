import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft
} from 'lucide-react';
import { apiService } from '../services/api';
import type { User } from '../types';
import { MindSenseLogo } from '../components/MindSenseLogo';

interface AuthPageProps {
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onNavigateHome: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  onNavigateHome
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Form Fields
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setErrorMsg("Please enter both username/email and password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const res = await apiService.login(usernameOrEmail, password);
    setLoading(false);

    if (res.success && res.data) {
      onLoginSuccess(res.data.user);
      onNavigateHome();
    } else {
      setErrorMsg(res.error?.message || "Invalid credentials. Please verify your credentials.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !email || !regPassword || !name) {
      setErrorMsg("Please complete all required registration fields.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const res = await apiService.register(regUsername, email, regPassword, name);
    setLoading(false);

    if (res.success && res.data) {
      setSuccessMsg("Profile registered successfully! Logging you in...");
      setTimeout(async () => {
        const loginRes = await apiService.login(regUsername, regPassword);
        if (loginRes.success && loginRes.data) {
          onLoginSuccess(loginRes.data.user);
          onNavigateHome();
        }
      }, 700);
    } else {
      setErrorMsg(res.error?.message || "Registration failed.");
    }
  };

  const fillDemoAccount = () => {
    setUsernameOrEmail('guest_user');
    setPassword('demo123');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden transition-colors">
      
      {/* Return to Home link */}
      <button
        onClick={onNavigateHome}
        className="absolute top-6 left-6 text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Return to Platform</span>
      </button>

      <div className="max-w-md w-full academic-card p-8 space-y-6 shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 w-fit mx-auto">
            <MindSenseLogo size={36} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Academic Workspace Sign In' : 'Register Research Profile'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login' 
              ? 'Access your isolated historical logs, assessments, and daily journal.' 
              : 'Create a local research account to track affective metrics.'}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            className={`w-1/2 py-2 rounded-lg font-semibold transition ${
              mode === 'login' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(null); }}
            className={`w-1/2 py-2 rounded-lg font-semibold transition ${
              mode === 'register' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Profile
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Username or Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="username or email"
                  className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white outline-none font-sans"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg pl-9 pr-9 py-2 text-xs text-white outline-none font-sans"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            </button>

            <button
              type="button"
              onClick={fillDemoAccount}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition"
            >
              Autofill Guest Account (Demo)
            </button>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Jane Doe / Student Explorer"
                  className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="janedoe"
                className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.doe@university.edu"
                  className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg pl-9 pr-3.5 py-2 text-xs text-white outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg pl-9 pr-9 py-2 text-xs text-white outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow"
            >
              {loading ? 'Creating Profile...' : 'Complete Registration'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
