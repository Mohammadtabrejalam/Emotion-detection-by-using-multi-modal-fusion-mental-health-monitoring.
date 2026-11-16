import { useEffect, useState } from 'react';
export const MediaProcessing = ({ onSendToAnalyzer }: {onSendToAnalyzer: (text?: string, file?: File) => void}) => {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  useEffect(() => { if (!file) return; const next = URL.createObjectURL(file); setUrl(next); return () => URL.revokeObjectURL(next); }, [file]);
  return <section className="academic-card p-6 space-y-5 text-slate-300"><h1 className="text-2xl text-white font-bold">Preview your media</h1><p>Check your input before analysis. This preview stays in your browser; no enhancement or noise-removal model is applied.</p><input aria-label="Choose media to preview" type="file" accept="image/png,image/jpeg,image/webp,audio/*" onChange={e => setFile(e.target.files?.[0] || null)}/>{file && <><p className="text-sm break-all">{file.name} · {(file.size/1024).toFixed(0)} KB</p>{file.type.startsWith('image/') ? <img src={url} alt="Selected input preview" className="max-h-80 rounded-xl"/> : <audio src={url} controls className="w-full"/>}<button className="btn-primary" onClick={() => onSendToAnalyzer(undefined, file)}>Use in analysis</button></>}</section>;
};
