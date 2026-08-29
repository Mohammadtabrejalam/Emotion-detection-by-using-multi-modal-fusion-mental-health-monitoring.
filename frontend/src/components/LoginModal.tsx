import { useState, useEffect } from 'react';
import { 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';
import { apiService } from '../services/api';
import type { User, LoginSession } from '../types';
import { MindSenseLogo } from './MindSenseLogo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'history'>('login');
  
  // Form fields
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login sessions history state
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser && tab === 'history') {
      fetchLoginHistory();
    }
  }, [currentUser, tab]);

  const fetchLoginHistory = async () => {
    if (!currentUser) return;
    setLoadingSessions(true);
    const res = await apiService.getLoginHistory(currentUser.id);
    if (res.success && res.data) {
      setSessions(res.data.login_sessions);
    }
    setLoadingSessions(false);
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setErrorMsg("Please enter username and password.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const res = await apiService.login(usernameOrEmail, password);
    setLoading(false);

    if (res.success && res.data) {
      onLoginSuccess(res.data.user);
      onClose();
    } else {
      setErrorMsg(res.error?.message || "Invalid credentials.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !email || !regPassword || !name) {
      setErrorMsg("Please complete all registration fields.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const res = await apiService.register(regUsername, email, regPassword, name);
    setLoading(false);

    if (res.success && res.data) {
      setSuccessMsg("Account created! Signing you in...");
      setTimeout(async () => {
        const loginRes = await apiService.login(regUsername, regPassword);
        if (loginRes.success && loginRes.data) {
          onLoginSuccess(loginRes.data.user);
          onClose();
        }
      }, 700);
    } else {
      setErrorMsg(res.error?.message || "Registration failed.");
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="academic-card p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-lg bg-brand-500/10 border border-brand-500/20">
              <MindSenseLogo size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                {currentUser ? `@${currentUser.username}` : 'Academic Profile'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {currentUser ? currentUser.email : 'MindSense AI Research'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher if user logged in vs out */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setTab('login')}
                className={`w-1/2 py-1.5 rounded-md font-semibold transition ${
                  tab === 'login' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Profile Overview
              </button>
              <button
                type="button"
                onClick={() => setTab('history')}
                className={`w-1/2 py-1.5 rounded-md font-semibold transition ${
                  tab === 'history' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Session History
              </button>
            </div>

            {tab === 'login' ? (
              <div className="space-y-3 text-xs">
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Name</span>
                  <p className="font-bold text-white">{currentUser.name}</p>
                </div>
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Email</span>
                  <p className="font-bold text-white">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => { onLogout(); onClose(); }}
                  className="w-full py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {loadingSessions ? (
                  <div className="py-6 text-center text-xs text-slate-500">Loading audit history...</div>
                ) : sessions.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">No session logs found.</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                    {sessions.map((s) => (
                      <div key={s.id} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center text-[11px]">
                        <span className="font-mono text-slate-400">{formatDate(s.timestamp)}</span>
                        <span className="font-mono text-brand-400">{s.ip_address}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => { setTab('login'); setErrorMsg(null); }}
                className={`w-1/2 py-1.5 rounded-md font-semibold transition ${
                  tab === 'login' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setErrorMsg(null); }}
                className={`w-1/2 py-1.5 rounded-md font-semibold transition ${
                  tab === 'register' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Register
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Username or Email</label>
                  <input
                    type="text"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="username or email"
                    className="w-full bg-slate-900 border border-slate-700/60 focus:border-brand-500 rounded-lg px-3 py-2 text-white outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700/60 focus:border-brand-500 rounded-lg px-3 py-2 text-white outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-2.5 text-xs">
                <div className="space-y-0.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-900 border border-slate-700/60 focus:border-brand-500 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    required
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase">Username</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="janedoe"
                    className="w-full bg-slate-900 border border-slate-700/60 focus:border-brand-500 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    required
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@university.edu"
                    className="w-full bg-slate-900 border border-slate-700/60 focus:border-brand-500 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    required
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700/60 focus:border-brand-500 rounded-lg px-2.5 py-1.5 text-white outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow mt-1"
                >
                  {loading ? 'Creating...' : 'Register Profile'}
                </button>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
