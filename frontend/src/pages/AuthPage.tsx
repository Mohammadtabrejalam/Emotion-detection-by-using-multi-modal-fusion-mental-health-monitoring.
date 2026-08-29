import { useState } from 'react';
import { 
  Brain, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { apiService } from '../services/api';
import type { User } from '../types';

interface AuthPageProps {
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onNavigateHome: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  currentUser,
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
      setErrorMsg("Please enter both your username/email and password.");
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
      setErrorMsg(res.error?.message || "Invalid credentials. Check your username/password.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !email || !regPassword || !name) {
      setErrorMsg("Please fill out all required registration fields.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const res = await apiService.register(regUsername, email, regPassword, name);
    setLoading(false);

    if (res.success && res.data) {
      setSuccessMsg("Account successfully created! Signing you in...");
      setTimeout(async () => {
        const loginRes = await apiService.login(regUsername, regPassword);
        if (loginRes.success && loginRes.data) {
          onLoginSuccess(loginRes.data.user);
          onNavigateHome();
        }
      }, 800);
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
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col justify-center items-center px-6 py-12 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-brand-600/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-indigo-600/10 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Back button */}
      <div className="w-full max-w-md mb-6">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 px-3.5 py-2 rounded-xl transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to MindSense Studio
        </button>
      </div>

      <div className="w-full max-w-md glass-panel p-8 md:p-10 rounded-3xl border border-slate-800 shadow-2xl relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-500/25">
            <Brain className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {currentUser ? 'Account Switcher' : mode === 'login' ? 'Sign In to MindSense' : 'Create an Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login' 
              ? 'Access your private emotion history and daily notes' 
              : 'Join the multimodal mental health research platform'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-lg font-bold transition ${mode === 'login' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-lg font-bold transition ${mode === 'register' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Register
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Username or Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="guest_user or alex@example.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-3.5 py-3 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-10 py-3 text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 hover:shadow-brand-500/40 transition hover:-translate-y-0.5"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div className="pt-3 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={fillDemoAccount}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold inline-flex items-center gap-1.5 bg-brand-500/10 px-3.5 py-2 rounded-xl border border-brand-500/20 transition"
              >
                <Key className="h-3.5 w-3.5" /> 1-Click Fill Demo Guest Account
              </button>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <UserIcon className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Lee"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="jordan_lee"
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@example.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 hover:shadow-brand-500/40 transition hover:-translate-y-0.5"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        )}

        {/* Security badge */}
        <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5 pt-2">
          <Sparkles className="h-3 w-3 text-emerald-400" />
          <span>Local SQLite database with SHA-256 cryptographic security</span>
        </div>

      </div>
    </div>
  );
};
