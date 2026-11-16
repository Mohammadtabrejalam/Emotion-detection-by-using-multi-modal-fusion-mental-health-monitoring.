import { useEffect, useRef, useState } from 'react';
import { Camera, Mic, Square, RefreshCw, Shield, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import type { AnalysisData, User } from '../types';
import { ShareModal } from '../components/ShareModal';

export type ModalityMode = 'text' | 'audio' | 'image' | 'multimodal';
type ModelState = { installed: boolean; loaded: boolean; repo: string; error?: string };
interface AnalysisProps { currentUser?: User | null; initialText?: string; initialFile?: File | null }

export const Analysis = ({ currentUser, initialText = '', initialFile }: AnalysisProps) => {
  const [text, setText] = useState(initialText);
  const [audio, setAudio] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [models, setModels] = useState<Record<string, ModelState>>({});
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [camera, setCamera] = useState(false);
  const [share, setShare] = useState(false);
  const [consent, setConsent] = useState(false);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const mounted = useRef(true);
  const stopTracks = () => { stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; };
  useEffect(() => {
    mounted.current = true;
    apiService.getModels().then(res => { if (mounted.current && res.success) setModels(res.data?.models || {}); });
    return () => { mounted.current = false; if (timer.current) clearTimeout(timer.current); if (recorder.current?.state === 'recording') recorder.current.stop(); stopTracks(); };
  }, []);
  useEffect(() => { setText(initialText); }, [initialText]);
  useEffect(() => { if (initialFile) { if (initialFile.type.startsWith('image/')) setImage(initialFile); else setAudio(initialFile); } }, [initialFile]);
  useEffect(() => { if (camera && video.current) video.current.srcObject = stream.current; }, [camera]);

  const chooseFile = (file: File | undefined, kind: 'audio' | 'image') => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Each file must be at most 10 MB.'); return; }
    setError(''); setResult(null);
    (kind === 'audio' ? setAudio : setImage)(file);
  };
  const record = async () => {
    try {
      setError('');
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current) { media.getTracks().forEach(t => t.stop()); return; }
      stream.current = media;
      const rec = new MediaRecorder(media); recorder.current = rec;
      const chunks: Blob[] = [];
      rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        if (timer.current) clearTimeout(timer.current);
        stopTracks();
        if (!mounted.current) return;
        const type = rec.mimeType || chunks[0]?.type || 'audio/webm';
        const ext = type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : 'webm';
        setAudio(new File(chunks, `speech.${ext}`, { type })); setRecording(false);
      };
      rec.start(); setRecording(true); setResult(null);
      timer.current = setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, 30000);
    } catch { stopTracks(); setError('Microphone access was unavailable. You can upload a speech recording instead.'); }
  };
  const openCamera = async () => {
    try {
      setError('');
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (!mounted.current) { media.getTracks().forEach(t => t.stop()); return; }
      stream.current = media; setCamera(true);
    } catch { setError('Camera access was unavailable. You can upload a photo instead.'); }
  };
  const capture = () => {
    if (!video.current?.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.current.videoWidth; canvas.height = video.current.videoHeight;
    canvas.getContext('2d')?.drawImage(video.current, 0, 0);
    canvas.toBlob(blob => { if (blob && mounted.current) setImage(new File([blob], 'portrait.jpg', { type: 'image/jpeg' })); }, 'image/jpeg');
    stopTracks(); setCamera(false); setResult(null);
  };
  const analyze = async () => {
    if (!text.trim() && !audio && !image) { setError('Add at least one input.'); return; }
    setBusy(true); setError(''); setResult(null);
    try {
      const response = await apiService.analyzeEmotion(text.trim() || null, audio, image, false, currentUser?.id);
      if (!mounted.current) return;
      if (response.success && response.data) setResult(response.data);
      else setError(response.error?.message || 'Analysis failed. No substitute result was generated.');
    } finally { if (mounted.current) setBusy(false); }
  };
  const field = 'w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400';
  return <section className="space-y-6 max-w-5xl mx-auto">
    <div className="academic-card p-6 md:p-8 space-y-4">
      <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-widest"><Shield size={16}/> Private by default</div>
      <h1 className="text-2xl md:text-3xl font-bold text-white">Understand expressions. Keep context.</h1>
      <p className="text-slate-300 text-sm leading-relaxed">Analyze English text, up to 30 seconds of speech, or a photo of one consenting adult. Combine inputs from the same moment to compare model outputs.</p>
      <p className="text-xs text-slate-400">These models classify expression patterns. They cannot determine what someone truly feels or diagnose mental-health conditions. {currentUser ? 'Your result will be saved privately to your account.' : 'Guest results are not saved. Sign in to keep history and share results.'} Raw text, photos, and recordings are not stored.</p>
      <div className="flex flex-wrap gap-2" aria-label="Model availability">{['text','audio','image'].map(kind => <span key={kind} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{kind}: {models[kind] ? models[kind].installed ? 'installed' : 'not installed' : 'checking'}</span>)}</div>
    </div>
    <div className="grid md:grid-cols-2 gap-5">
      <div className="academic-card p-5 md:col-span-2 space-y-2">
        <label htmlFor="analysis-text" className="font-semibold text-white">Text <span className="text-slate-400 font-normal text-xs">optional · English · first 256 tokens</span></label>
        <textarea id="analysis-text" className={field} rows={4} maxLength={5000} placeholder="Type or paste a text statement..." value={text} onChange={e => setText(e.target.value)} disabled={busy}/>
        <p className="text-xs text-slate-500 text-right">{text.length}/5000 characters</p>
      </div>
      <div className="academic-card p-5 space-y-3">
        <label htmlFor="analysis-audio" className="font-semibold text-white">Speech <span className="text-xs text-slate-400">optional · 0.1–30 seconds</span></label>
        <input id="analysis-audio" aria-label="Upload speech" type="file" accept=".wav,.mp3,.ogg,.m4a,.webm,.mp4" className={field} disabled={busy || recording} onChange={e => chooseFile(e.target.files?.[0], 'audio')}/>
        <button className="btn-secondary flex gap-2 items-center" disabled={busy || camera} onClick={recording ? () => recorder.current?.stop() : record}>{recording ? <Square size={16}/> : <Mic size={16}/>} {recording ? 'Stop recording' : 'Record speech'}</button>
        {audio && <div className="text-xs text-slate-300 break-all">{audio.name} <button onClick={() => setAudio(null)} className="text-rose-300 ml-2" disabled={busy}>Remove speech</button></div>}
        <p className="text-xs text-slate-400">Speech model labels: happy, sad, angry, neutral.</p>
      </div>
      <div className="academic-card p-5 space-y-3">
        <label htmlFor="analysis-image" className="font-semibold text-white">Facial photo <span className="text-xs text-slate-400">optional · one face</span></label>
        <input id="analysis-image" aria-label="Upload facial photo" type="file" accept=".png,.jpg,.jpeg,.webp" className={field} disabled={busy} onChange={e => chooseFile(e.target.files?.[0], 'image')}/>
        <button className="btn-secondary flex gap-2 items-center" disabled={busy || recording || camera} onClick={openCamera}><Camera size={16}/> Open camera</button>
        {camera && <div className="space-y-2"><video ref={video} autoPlay muted playsInline className="w-full rounded-xl"/><button onClick={capture} className="btn-primary">Capture photo</button><button onClick={() => { stopTracks(); setCamera(false); }} className="btn-secondary ml-2">Close camera</button></div>}
        {image && <div className="text-xs text-slate-300 break-all">{image.name} <button onClick={() => setImage(null)} className="text-rose-300 ml-2" disabled={busy}>Remove photo</button></div>}
        <p className="text-xs text-slate-400">Maximum 10 MB and 12 megapixels. No group photos.</p>
      </div>
    </div>
    <label className="flex items-start gap-3 text-sm text-slate-300"><input type="checkbox" className="mt-1" checked={consent} onChange={e => setConsent(e.target.checked)}/> I have permission to analyze these inputs and understand this is not a clinical assessment.</label>
    {error && <div role="alert" className="p-4 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-200 text-sm flex gap-2"><AlertCircle size={18}/>{error}</div>}
    <button onClick={analyze} disabled={busy || !consent || recording || camera} className="btn-primary w-full py-3 disabled:opacity-40">{busy ? <span className="flex items-center justify-center gap-2"><RefreshCw className="animate-spin" size={18}/> Running installed models…</span> : 'Start Analysis'}</button>
    {result && <div className="academic-card p-6 space-y-5" aria-live="polite">
      <h2 className="text-xl text-white font-bold">Analysis Output & Classification</h2>
      <p className="text-sm text-slate-400">Top expression label</p><p className="text-3xl capitalize font-bold text-indigo-300">{result.emotion}</p>
      <p className="text-sm text-slate-300">Model score: {(result.confidence * 100).toFixed(1)}% · uncalibrated</p>
      <div className="space-y-2">{Object.entries(result.probabilities).sort((a,b) => b[1]-a[1]).map(([label,value]) => <div key={label} className="grid grid-cols-[80px_1fr_55px] gap-3 items-center text-xs text-slate-300"><span className="capitalize">{label}</span><progress aria-label={`${label} model score`} value={value} max={1} className="w-full accent-indigo-400"/><span>{(value*100).toFixed(1)}%</span></div>)}</div>
      <div className="grid sm:grid-cols-3 gap-3">{Object.entries(result.modality_predictions).filter(([,p]) => p).map(([kind,p]) => <div className="rounded-xl bg-slate-950 p-4" key={kind}><p className="text-xs text-slate-400 capitalize">{kind}</p><p className="text-white font-semibold capitalize">{p!.emotion}</p><p className="text-xs text-slate-400 break-all">{p!.model}</p></div>)}</div>
      <p className="text-xs text-slate-400">{result.fusion_method}</p>
      <ul className="list-disc pl-5 text-xs text-amber-200 space-y-1">{result.warnings?.map(w => <li key={w}>{w}</li>)}</ul>
      <p className="text-sm text-slate-300">{result.wellness_insight}</p>
      <p className="text-xs text-slate-500">{result.saved ? 'Saved privately to your history.' : 'Guest result: not saved to the server.'}</p>
      {result.saved && <button className="btn-secondary" onClick={() => setShare(true)}>Share Result</button>}
    </div>}
    {result && <ShareModal isOpen={share} onClose={() => setShare(false)} result={result} currentUser={currentUser}/>}
  </section>;
};
