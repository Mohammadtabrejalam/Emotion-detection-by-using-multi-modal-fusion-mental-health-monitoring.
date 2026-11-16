import { useState } from 'react';
import { apiService } from '../services/api';
export const AccountRecovery = ({onBack}: {onBack: () => void}) => {
  const [identity,setIdentity] = useState('');
  const [token,setToken] = useState('');
  const [password,setPassword] = useState('');
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  const [error,setError] = useState('');
  const request = async () => {
    setBusy(true);setError('');setMessage('');
    const result = await apiService.forgotPassword(identity);
    setBusy(false);
    if(result.success) setMessage(result.data?.message || 'Check your email for a recovery token.');
    else setError(result.error?.message || 'Password recovery is unavailable. Contact the server operator.');
  };
  const reset = async () => {
    setBusy(true);setError('');setMessage('');
    const result = await apiService.resetPassword(token,password);
    setBusy(false);
    if(result.success) {setPassword('');setToken('');setMessage('Password changed. Return to sign in with your new password.');}
    else setError(result.error?.message || 'The reset token is invalid or expired. Request a new one.');
  };
  const style='w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-white';
  return <section className="academic-card max-w-md mx-auto p-8 space-y-5 text-sm text-slate-300">
    <h1 className="text-2xl text-white font-bold">Recover your account</h1>
    <form className="space-y-3" onSubmit={e=>{e.preventDefault();void request();}}>
      <label className="block" htmlFor="recovery-identity">Username or email</label><input id="recovery-identity" className={style} value={identity} onChange={e=>setIdentity(e.target.value)} required autoComplete="username"/>
      <button className="btn-secondary" disabled={busy}>Send recovery email</button>
    </form>
    <p>Paste the token from your email below. Tokens expire after 30 minutes and can be used once.</p>
    <form className="space-y-3" onSubmit={e=>{e.preventDefault();void reset();}}>
      <label className="block" htmlFor="recovery-token">Recovery token</label><input id="recovery-token" className={style} value={token} onChange={e=>setToken(e.target.value)} required autoComplete="off"/>
      <label className="block" htmlFor="recovery-password">New password</label><input id="recovery-password" className={style} type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={8} maxLength={128} required autoComplete="new-password"/>
      <button className="btn-primary" disabled={busy}>Reset password</button>
    </form>
    {message && <p role="status" className="text-emerald-300">{message}</p>}{error && <p role="alert" className="text-rose-300">{error}</p>}
    <button className="underline text-indigo-300" onClick={onBack}>Return to sign in</button>
  </section>;
};
