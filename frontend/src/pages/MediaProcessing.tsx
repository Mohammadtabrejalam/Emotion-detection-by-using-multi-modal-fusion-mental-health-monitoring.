import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Mic, 
  Download, 
  Wand2, 
  RotateCcw,
  Palette
} from 'lucide-react';

interface MediaProcessingProps {
  onSendToAnalyzer: (text?: string, file?: File) => void;
}

export const MediaProcessing: React.FC<MediaProcessingProps> = ({ onSendToAnalyzer }) => {
  const [activeTool, setActiveTool] = useState<'photo' | 'audio' | 'poster'>('photo');

  // Photo Studio States
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [grayscale, setGrayscale] = useState<number>(0);
  const [blur, setBlur] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<string>('normal');

  // Audio Studio States
  const [noiseReduction, setNoiseReduction] = useState<number>(30);
  const [clarityBoost, setClarityBoost] = useState<number>(50);

  // Poster Creator States
  const [posterTitle, setPosterTitle] = useState<string>('Emotional Equilibrium');
  const [posterQuote, setPosterQuote] = useState<string>('Allow yourself the space to breathe and process. Clarity follows steady reflection.');
  const [posterTheme, setPosterTheme] = useState<string>('gradient-indigo');
  const posterCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const resetPhotoFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setGrayscale(0);
    setBlur(0);
    setSelectedPreset('normal');
  };

  const applyPreset = (preset: string) => {
    setSelectedPreset(preset);
    if (preset === 'vibrant') {
      setBrightness(105);
      setContrast(115);
      setSaturation(130);
      setGrayscale(0);
      setBlur(0);
    } else if (preset === 'monochrome') {
      setBrightness(100);
      setContrast(120);
      setSaturation(0);
      setGrayscale(100);
      setBlur(0);
    } else if (preset === 'warm-glow') {
      setBrightness(110);
      setContrast(105);
      setSaturation(110);
      setGrayscale(0);
      setBlur(0);
    } else if (preset === 'cool-focus') {
      setBrightness(95);
      setContrast(110);
      setSaturation(90);
      setGrayscale(0);
      setBlur(0);
    } else {
      resetPhotoFilters();
    }
  };

  const applyMagicEnhance = () => {
    setSelectedPreset('magic');
    setBrightness(106);
    setContrast(110);
    setSaturation(112);
    setGrayscale(0);
    setBlur(0);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageSrc(url);
    }
  };

  // Render Poster Canvas
  useEffect(() => {
    if (activeTool !== 'poster') return;
    const canvas = posterCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 600;

    // Theme Background
    let bgGrad = ctx.createLinearGradient(0, 0, 600, 600);
    if (posterTheme === 'gradient-indigo') {
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.5, '#1e1b4b');
      bgGrad.addColorStop(1, '#090d16');
    } else if (posterTheme === 'gradient-emerald') {
      bgGrad.addColorStop(0, '#022c22');
      bgGrad.addColorStop(0.5, '#064e3b');
      bgGrad.addColorStop(1, '#022c22');
    } else if (posterTheme === 'gradient-amber') {
      bgGrad.addColorStop(0, '#451a03');
      bgGrad.addColorStop(0.5, '#78350f');
      bgGrad.addColorStop(1, '#1c1917');
    } else {
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(1, '#1e293b');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 600);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, 552, 552);

    // Title
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.textAlign = 'center';
    ctx.fillText('MINDSENSE AFFECTIVE COMPUTING', 300, 70);

    // Header Focus
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.fillText(posterTitle, 300, 180);

    // Quote Body
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px Inter, sans-serif';
    
    // Multi-line wrap helper
    const words = posterQuote.split(' ');
    let line = '';
    let y = 260;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 460 && n > 0) {
        ctx.fillText(line, 300, y);
        line = words[n] + ' ';
        y += 28;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 300, y);

    // Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText('Research & Longitudinal Wellness Protocol', 300, 530);

  }, [activeTool, posterTitle, posterQuote, posterTheme]);

  const handleDownloadPoster = () => {
    const canvas = posterCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `mindsense_poster_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-tool Selector */}
      <div className="flex justify-start">
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTool('photo')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTool === 'photo' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="h-3.5 w-3.5" /> Facial Calibration
          </button>
          <button
            onClick={() => setActiveTool('audio')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTool === 'audio' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="h-3.5 w-3.5" /> Acoustic DSP
          </button>
          <button
            onClick={() => setActiveTool('poster')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTool === 'poster' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="h-3.5 w-3.5" /> Affect Poster
          </button>
        </div>
      </div>

      {/* 1. PHOTO STUDIO (FACIAL CALIBRATION) */}
      {activeTool === 'photo' && (
        <div className="grid lg:grid-cols-12 gap-6">
          
          {/* Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div className="academic-card p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-white text-xs uppercase tracking-wider">Calibration Presets</span>
                <button 
                  onClick={resetPhotoFilters}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {['normal', 'vibrant', 'monochrome', 'warm-glow', 'cool-focus'].map((p) => (
                  <button
                    key={p}
                    onClick={() => applyPreset(p)}
                    className={`px-2.5 py-1.5 rounded-lg border capitalize text-[11px] font-medium transition ${
                      selectedPreset === p 
                        ? 'bg-brand-600 text-white border-brand-500 font-semibold shadow' 
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.replace('-', ' ')}
                  </button>
                ))}
              </div>

              <button
                onClick={applyMagicEnhance}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow flex items-center justify-center gap-1.5"
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span>Auto Contrast Enhance</span>
              </button>

              {/* Sliders */}
              <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Brightness</span>
                    <span className="font-mono">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Contrast</span>
                    <span className="font-mono">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Saturation</span>
                    <span className="font-mono">{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-8 space-y-4">
            <div className="academic-card p-6 flex flex-col items-center justify-center min-h-[380px] relative overflow-hidden">
              {imageSrc ? (
                <div className="relative max-w-md w-full">
                  <img
                    src={imageSrc}
                    alt="Calibrated Preview"
                    style={{
                      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%) blur(${blur}px)`
                    }}
                    className="w-full rounded-xl object-contain border border-slate-700 shadow"
                  />
                </div>
              ) : (
                <div className="text-center space-y-3 p-8">
                  <Camera className="h-10 w-10 text-slate-500 mx-auto" />
                  <p className="text-slate-300 font-semibold text-xs">No image loaded for calibration</p>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow">
                    <span>Choose Image</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 2. AUDIO STUDIO (Acoustic DSP) */}
      {activeTool === 'audio' && (
        <div className="academic-card p-6 md:p-8 space-y-6 max-w-2xl mx-auto">
          <div className="space-y-1 border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">Spectral Acoustic Filtering</h3>
            <p className="text-xs text-slate-400">Pre-processing filters to isolate speech prosody before Mel-Frequency Cepstral analysis.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Ambient Noise Suppression</span>
                <span className="font-mono text-emerald-400">{noiseReduction}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={noiseReduction}
                onChange={(e) => setNoiseReduction(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Vocal Harmonic Clarity</span>
                <span className="font-mono text-indigo-400">{clarityBoost}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={clarityBoost}
                onChange={(e) => setClarityBoost(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-300">SciPy 16kHz DSP Engine</span>
            <span className="text-[11px] font-mono text-emerald-400">Active</span>
          </div>
        </div>
      )}

      {/* 3. POSTER CREATOR */}
      {activeTool === 'poster' && (
        <div className="grid lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-5 space-y-4">
            <div className="academic-card p-6 space-y-4">
              <span className="font-bold text-white text-xs uppercase tracking-wider block border-b border-slate-800 pb-2">
                Poster Configuration
              </span>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Title Heading</label>
                <input
                  type="text"
                  value={posterTitle}
                  onChange={(e) => setPosterTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 focus:border-brand-500 rounded-lg px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Affect Reflection Quote</label>
                <textarea
                  value={posterQuote}
                  onChange={(e) => setPosterQuote(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700/60 focus:border-brand-500 rounded-lg p-3 text-xs text-white outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Palette Theme</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'gradient-indigo', name: 'Indigo Deep' },
                    { id: 'gradient-emerald', name: 'Emerald Calm' },
                    { id: 'gradient-amber', name: 'Amber Glow' },
                    { id: 'slate', name: 'Slate Obsidian' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setPosterTheme(t.id)}
                      className={`px-3 py-2 rounded-lg border text-[11px] font-medium transition ${
                        posterTheme === t.id 
                          ? 'bg-brand-600 text-white border-brand-500 font-semibold shadow' 
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={handleDownloadPoster}
                  className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition shadow flex items-center justify-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download High-Res PNG</span>
                </button>
                <button
                  onClick={() => onSendToAnalyzer(posterQuote)}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition"
                >
                  Send Quote to Live Studio →
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 flex items-center justify-center">
            <div className="academic-card p-4 shadow-xl">
              <canvas ref={posterCanvasRef} className="rounded-lg max-w-full h-auto shadow-inner" />
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
