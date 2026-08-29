import { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  LogOut, 
  Key
} from 'lucide-react';
import { apiService } from '../services/api';
import type { User, LoginSession } from '../types';

interface AccountSettingsProps {
  currentUser: User | null;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  currentUser,
  onUpdateUser,
  onLogout,
  onOpenLogin
}) => {
  // Profile update form
  const [name, setName] = useState<string>(currentUser?.name || '');
  const [email, setEmail] = useState<string>(currentUser?.email || '');
  const [updatingProfile, setUpdatingProfile] = useState<boolean>(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password change form
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [changingPassword, setChangingPassword] = useState<boolean>(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Login sessions history
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      fetchLoginSessions();
    }
  }, [currentUser]);

  const fetchLoginSessions = async () => {
    if (!currentUser) return;
    setLoadingSessions(true);
    const res = await apiService.getLoginHistory(currentUser.id);
    if (res.success && res.data) {
      setSessions(res.data.login_sessions);
    }
    setLoadingSessions(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!name.trim() || !email.trim()) {
      setProfileError("Name and email cannot be empty.");
      return;
    }

    setUpdatingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    const res = await apiService.updateProfile(currentUser.id, name.trim(), email.trim());
    setUpdatingProfile(false);

    if (res.success && res.data) {
      setProfileSuccess("Profile updated successfully!");
      onUpdateUser(res.data.user);
      setTimeout(() => setProfileSuccess(null), 4000);
    } else {
      setProfileError(res.error?.message || "Failed to update profile.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!oldPassword || !newPassword) {
      setPasswordError("Please enter your current and new password.");
      return;
    }

    setChangingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    const res = await apiService.changePassword(currentUser.id, oldPassword, newPassword);
    setChangingPassword(false);

    if (res.success) {
      setPasswordSuccess("Password changed securely!");
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } else {
      setPasswordError(res.error?.message || "Failed to change password. Ensure old password is correct.");
    }
  };

  const handleClearUserData = async () => {
    if (!currentUser) return;
    if (window.confirm("Are you sure you want to permanently wipe all emotion analyses, check-ins, and journal notes associated with your account? This action cannot be reversed.")) {
      const res = await apiService.clearHistory(currentUser.id);
      if (res.success) {
        alert("All your private data records have been wiped.");
        window.location.reload();
      } else {
        alert("Failed to wipe data: " + res.error?.message);
      }
    }
  };

  if (!currentUser) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4 max-w-xl mx-auto my-12">
        <UserIcon className="h-12 w-12 text-brand-400 mx-auto" />
        <h3 className="text-xl font-bold text-white">Account Portal</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Please sign in to access your personal profile details, change security settings, or review your login history.
        </p>
        <button
          onClick={onOpenLogin}
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg transition"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block mb-1">
            Personal Security & Controls
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Account Settings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage your personal profile, credentials, login session history, and privacy boundaries.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-2 transition w-fit"
        >
          <LogOut className="h-4 w-4" /> Sign Out of Account
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* 1. Profile Information */}
        <form onSubmit={handleUpdateProfile} className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Profile Information</h3>
              <p className="text-[11px] text-slate-400">Update your display name and email address</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={currentUser.username}
              disabled
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 cursor-not-allowed font-mono"
            />
            <span className="text-[10px] text-slate-500">Usernames are unique and cannot be changed.</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none"
            />
          </div>

          {profileError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={updatingProfile}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg transition"
          >
            {updatingProfile ? 'Updating Profile...' : 'Save Profile Changes'}
          </button>
        </form>

        {/* 2. Security & Password Update */}
        <form onSubmit={handleChangePassword} className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-5 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Security & Password</h3>
              <p className="text-[11px] text-slate-400">Change your secret authentication password</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new strong password"
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none"
              />
            </div>
          </div>

          {passwordError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition"
          >
            {changingPassword ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>

      </div>

      {/* 3. Login Audit Sessions History */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-brand-400" />
            <h3 className="font-bold text-white text-base">Login Session History & Audit Trail</h3>
          </div>
          <button onClick={fetchLoginSessions} className="text-xs text-brand-400 hover:underline">
            Refresh
          </button>
        </div>

        {loadingSessions ? (
          <p className="text-xs text-slate-500 py-4 text-center">Loading session audit trail...</p>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No previous login records found.</p>
        ) : (
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {sessions.map((s) => (
              <div key={s.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-mono text-slate-200 block">
                    {new Date(s.timestamp).toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> Client IP: {s.ip_address || '127.0.0.1'} | {s.user_agent ? s.user_agent.slice(0, 40) + '...' : 'Browser'}
                  </span>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  s.status === 'SUCCESS' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Privacy & Data Wipe Controls */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-red-500/20 space-y-4 bg-red-500/5">
        <div className="flex items-center gap-2.5 text-red-400">
          <Trash2 className="h-5 w-5" />
          <h3 className="font-bold text-white text-base">Privacy & Local Data Wipe</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
          MindSense stores your emotion assessments, check-ins, and daily journal notes locally in SQLite. If you wish to delete all records associated with your account, click the button below.
        </p>

        <button
          onClick={handleClearUserData}
          className="px-5 py-2.5 rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-bold text-xs shadow-lg transition"
        >
          Permanently Wipe My Private Data
        </button>
      </div>

    </div>
  );
};
