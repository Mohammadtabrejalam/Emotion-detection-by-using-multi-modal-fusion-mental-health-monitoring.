import { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  Mail, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Key,
  Globe,
  Clock
} from 'lucide-react';
import { apiService } from '../services/api';
import type { User, LoginSession } from '../types';

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
      onClose();
    } else {
      setErrorMsg(res.error?.message || "Invalid login credentials.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !email || !regPassword || !name) {
      setErrorMsg("Please fill out all registration fields.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    const res = await apiService.register(regUsername, email, regPassword, name);
    setLoading(false);

    if (res.success && res.data) {
      setSuccessMsg("Account created! Logging you in...");
      setTimeout(async () => {
        const loginRes = await apiService.login(regUsername, regPassword);
        if (loginRes.success && loginRes.data) {
          onLoginSuccess(loginRes.data.user);
          onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">
                {currentUser ? currentUser.name : tab === 'login' ? 'Sign In to MindSense' : 'Create Account'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {currentUser ? `@${currentUser.username}` : 'User Portal & Session History'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 bg-slate-800 px-3 py-1.5 rounded-lg transition"
          >
            Close
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-850 text-xs">
          {!currentUser ? (
            <>
              <button
                onClick={() => { setTab('login'); setErrorMsg(null); }}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${tab === 'login' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setTab('register'); setErrorMsg(null); }}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${tab === 'register' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Register
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setTab('login')}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${tab === 'login' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Profile Info
              </button>
              <button
                onClick={() => setTab('history')}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${tab === 'history' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Login History
              </button>
            </>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* VIEW 1: SIGN IN FORM */}
        {!currentUser && tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Username or Email</label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="guest_user or your@email.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg transition"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            {/* Demo 1-Click Autofill */}
            <div className="pt-2 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={fillDemoAccount}
                className="text-[11px] text-brand-400 hover:text-brand-300 font-semibold inline-flex items-center gap-1.5 bg-brand-500/10 px-3 py-1.5 rounded-lg border border-brand-500/20 transition"
              >
                <Key className="h-3.5 w-3.5" /> 1-Click Fill Demo Account
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: REGISTRATION FORM */}
        {!currentUser && tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="alex_m"
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Create a secure password"
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg transition"
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>
          </form>
        )}

        {/* VIEW 3: LOGGED-IN PROFILE INFO */}
        {currentUser && tab === 'login' && (
          <div className="space-y-5">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Name</span>
                <span className="font-semibold text-white">{currentUser.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Username</span>
                <span className="font-semibold text-white">@{currentUser.username}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-500">Email</span>
                <span className="font-semibold text-white">{currentUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">User ID</span>
                <span className="font-mono text-slate-400">#{currentUser.id}</span>
              </div>
            </div>

            <button
              onClick={() => { onLogout(); onClose(); }}
              className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        )}

        {/* VIEW 4: LOGIN SESSIONS HISTORY */}
        {currentUser && tab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Previous Login Sessions</span>
              <button onClick={fetchLoginHistory} className="text-[11px] text-brand-400 hover:underline">Refresh</button>
            </div>

            {loadingSessions ? (
              <p className="text-xs text-slate-500 py-6 text-center">Loading audit log...</p>
            ) : sessions.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No session history found.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {sessions.map((s) => (
                  <div key={s.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-300 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {new Date(s.timestamp).toLocaleString()}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${s.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400'}`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="text-slate-500 flex items-center gap-2 text-[10px]">
                      <Globe className="h-3 w-3" />
                      <span>IP: {s.ip_address || '127.0.0.1'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
