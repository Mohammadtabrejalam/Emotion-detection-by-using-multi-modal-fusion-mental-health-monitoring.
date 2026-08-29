import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  LogOut
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
      setTimeout(() => setProfileSuccess(null), 3500);
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
      setPasswordSuccess("Security password updated successfully!");
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(null), 3500);
    } else {
      setPasswordError(res.error?.message || "Failed to update password.");
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!currentUser) {
    return (
      <div className="academic-card p-12 text-center space-y-4 max-w-xl mx-auto my-8">
        <UserIcon className="h-10 w-10 text-brand-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Sign In to Manage Profile Settings</h3>
        <p className="text-xs text-slate-400">
          Account profiles isolate your assessments, daily journals, and security audit sessions.
        </p>
        <button
          onClick={onOpenLogin}
          className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow"
        >
          Sign In to Account
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-2 max-w-4xl mx-auto">
      
      {/* Header Profile Card */}
      <div className="academic-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-lg uppercase shadow">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{currentUser.name}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono">
                @{currentUser.username}
              </span>
            </div>
            <p className="text-xs text-slate-400">{currentUser.email}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="px-3.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Forms Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Profile Information */}
        <form onSubmit={handleUpdateProfile} className="academic-card p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserIcon className="h-4 w-4 text-brand-400" />
            <h3 className="font-bold text-white text-sm">Profile Details</h3>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              required
            />
          </div>

          {profileError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={updatingProfile}
            className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow"
          >
            {updatingProfile ? 'Saving...' : 'Update Profile Details'}
          </button>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="academic-card p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="h-4 w-4 text-brand-400" />
            <h3 className="font-bold text-white text-sm">Security & Password</h3>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Current Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
              required
            />
          </div>

          {passwordError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow"
          >
            {changingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </form>

      </div>

      {/* Session Audit History Table */}
      <div className="academic-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            <h3 className="font-bold text-white text-sm">Login Audit History</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">SQLite Session Log</span>
        </div>

        {loadingSessions ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading audit history...</div>
        ) : sessions.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">No session history available.</div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] font-semibold">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Client IP</th>
                  <th className="py-2.5 px-4">User Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">{formatDate(s.timestamp)}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-brand-400">{s.ip_address}</td>
                    <td className="py-2.5 px-4 text-[11px] text-slate-400 truncate max-w-xs">{s.user_agent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
