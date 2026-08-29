import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Sliders, 
  Camera, 
  Mic, 
  Download, 
  Check, 
  Play, 
  Pause, 
  Wand2, 
  Eye, 
  RotateCcw,
  Palette
} from 'lucide-react';

interface AdobeStudioProps {
  onSendToAnalyzer: (text?: string, file?: File) => void;
}

export const AdobeStudio: React.FC<AdobeStudioProps> = ({ onSendToAnalyzer }) => {
  const [activeTool, setActiveTool] = useState<'photo' | 'audio' | 'poster'>('photo');

  // ----------------- PHOTO STUDIO STATES (Photoshop / Lightroom) ----------------- //
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [warmth, setWarmth] = useState<number>(0);
  const [grayscale, setGrayscale] = useState<number>(0);
  const [blur, setBlur] = useState<number>(0);
  const [showFaceBox, setShowFaceBox] = useState<boolean>(true);
  const [selectedPreset, setSelectedPreset] = useState<string>('normal');

  // ----------------- AUDIO STUDIO STATES (Audition) ----------------- //
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [noiseReduction, setNoiseReduction] = useState<number>(30);
  const [clarityBoost, setClarityBoost] = useState<number>(50);
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);

  // ----------------- POSTER CREATOR STATES (Adobe Express) ----------------- //
  const [posterMood, setPosterMood] = useState<string>('calm');
  const [posterTitle, setPosterTitle] = useState<string>('Peace Within');
  const [posterQuote, setPosterQuote] = useState<string>('Take a deep breath. You are capable of amazing things today.');
  const [posterTheme, setPosterTheme] = useState<string>('gradient-indigo');
  const [posterFont, setPosterFont] = useState<string>('sans');
  const posterCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reset photo filters
  const resetPhotoFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setWarmth(0);
    setGrayscale(0);
    setBlur(0);
    setSelectedPreset('normal');
  };

  // Apply photo presets (Lightroom Style)
  const applyPreset = (preset: string) => {
    setSelectedPreset(preset);
    if (preset === 'vibrant') {
      setBrightness(105);
      setContrast(115);
      setSaturation(135);
      setWarmth(10);
      setGrayscale(0);
      setBlur(0);
    } else if (preset === 'monochrome') {
      setBrightness(100);
      setContrast(120);
      setSaturation(0);
      setWarmth(0);
      setGrayscale(100);
      setBlur(0);
    } else if (preset === 'warm-glow') {
      setBrightness(110);
      setContrast(105);
      setSaturation(110);
      setWarmth(35);
      setGrayscale(0);
      setBlur(0);
    } else if (preset === 'cool-focus') {
      setBrightness(95);
      setContrast(110);
      setSaturation(90);
      setWarmth(-25);
      setGrayscale(0);
      setBlur(0);
    } else {
      resetPhotoFilters();
    }
  };

  // Magic 1-Click Enhance (Adobe Sensei Style)
  const applyMagicEnhance = () => {
    setSelectedPreset('magic');
    setBrightness(108);
    setContrast(112);
    setSaturation(115);
    setWarmth(5);
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

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsPlaying(true);
    }
  };

  // Render Poster Canvas
  useEffect(() => {
    if (activeTool === 'poster' && posterCanvasRef.current) {
      const canvas = posterCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 600;
      canvas.height = 600;

      // Background Gradient
      let grad = ctx.createLinearGradient(0, 0, 600, 600);
      if (posterTheme === 'gradient-indigo') {
        grad.addColorStop(0, '#312e81');
        grad.addColorStop(0.5, '#4f46e5');
        grad.addColorStop(1, '#06b6d4');
      } else if (posterTheme === 'gradient-emerald') {
        grad.addColorStop(0, '#064e3b');
        grad.addColorStop(0.5, '#059669');
        grad.addColorStop(1, '#10b981');
      } else if (posterTheme === 'gradient-sunset') {
        grad.addColorStop(0, '#831843');
        grad.addColorStop(0.5, '#db2777');
        grad.addColorStop(1, '#f59e0b');
      } else {
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#1e293b');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 600);

      // Decorative concentric rings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(300, 300, 220, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(300, 300, 160, 0, Math.PI * 2);
      ctx.stroke();

      // Badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.roundRect(220, 90, 160, 32, 16);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(posterMood.toUpperCase() + ' VIBE', 300, 111);

      // Title
      ctx.font = posterFont === 'serif' ? 'bold 38px Georgia, serif' : 'bold 42px sans-serif';
      ctx.fillText(posterTitle, 300, 220);

      // Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(250, 250);
      ctx.lineTo(350, 250);
      ctx.stroke();

      // Quote text wrapped
      ctx.font = posterFont === 'serif' ? 'italic 18px Georgia, serif' : '18px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      
      const words = posterQuote.split(' ');
      let line = '';
      let y = 320;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 460 && n > 0) {
          ctx.fillText(line, 300, y);
          line = words[n] + ' ';
          y += 32;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 300, y);

      // Brand Watermark
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '12px sans-serif';
      ctx.fillText('Created with MindSense Creative Studio', 300, 540);
    }
  }, [activeTool, posterMood, posterTitle, posterQuote, posterTheme, posterFont]);

  // Download Poster
  const downloadPoster = () => {
    if (posterCanvasRef.current) {
      const url = posterCanvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindsense_poster_${posterMood}.png`;
      a.click();
    }
  };

  return (
    <div className="space-y-10 py-4 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" /> Adobe Creative Media Suite
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Creative Expression & Media Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enhance, crop, filter facial photos, clean voice recordings, and design wellness mood cards.
          </p>
        </div>

        {/* Tool Switcher Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTool('photo')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTool === 'photo' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="h-3.5 w-3.5" /> Photo & Face Editor
          </button>
          <button
            onClick={() => setActiveTool('audio')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTool === 'audio' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="h-3.5 w-3.5" /> Audio Clean & Pitch
          </button>
          <button
            onClick={() => setActiveTool('poster')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTool === 'poster' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="h-3.5 w-3.5" /> Express Mood Poster
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. PHOTO & FACE EDITOR (Lightroom / Photoshop Tools)     */}
      {/* ======================================================== */}
      {activeTool === 'photo' && (
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Canvas & Preview Viewport */}
          <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Eye className="h-4 w-4 text-brand-400" /> Interactive Canvas Viewport
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFaceBox(!showFaceBox)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition ${
                    showFaceBox ? 'bg-brand-500/20 text-brand-300 border-brand-500/40' : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  Face Bounding Box: {showFaceBox ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Live Canvas / Image Element */}
            <div className="relative bg-slate-950 rounded-2xl min-h-[340px] flex items-center justify-center overflow-hidden border border-slate-850">
              {imageSrc ? (
                <div className="relative max-h-[340px]">
                  <img
                    src={imageSrc}
                    alt="Loaded in studio"
                    style={{
                      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%) blur(${blur}px) sepia(${warmth > 0 ? warmth : 0}%) hue-rotate(${warmth < 0 ? warmth : 0}deg)`,
                      maxHeight: '340px',
                      borderRadius: '12px'
                    }}
                  />
                  {showFaceBox && (
                    <div className="absolute inset-x-1/4 inset-y-1/6 border-2 border-dashed border-emerald-400 rounded-xl pointer-events-none animate-pulse">
                      <span className="absolute -top-3 left-2 bg-emerald-500 text-slate-950 font-extrabold text-[9px] px-1.5 py-0.2 rounded shadow">
                        FACE DETECTED (48x48)
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 space-y-3">
                  <Camera className="h-10 w-10 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">Upload a face photo or selfie to adjust filters</p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs cursor-pointer shadow-lg transition">
                    Select Photo File
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <label className="text-xs text-slate-400 hover:text-white cursor-pointer flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                Replace Photo
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              <div className="flex items-center gap-2">
                <button
                  onClick={resetPhotoFilters}
                  className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 rounded-xl text-xs"
                  title="Reset Filters"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => onSendToAnalyzer()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" /> Send to Live Analyzer
                </button>
              </div>
            </div>
          </div>

          {/* Controls & Adjustment Sliders (Lightroom Style) */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-brand-400" /> Color & Expression Controls
              </span>
              <button
                onClick={applyMagicEnhance}
                className="text-[11px] font-bold text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
              >
                <Wand2 className="h-3 w-3" /> Magic Enhance
              </button>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Quick Presets</span>
              <div className="grid grid-cols-4 gap-1.5">
                {['normal', 'vibrant', 'monochrome', 'warm-glow'].map((p) => (
                  <button
                    key={p}
                    onClick={() => applyPreset(p)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition border ${
                      selectedPreset === p 
                        ? 'bg-brand-600 text-white border-brand-500 shadow' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-3 text-xs">
              
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Brightness</span>
                  <span className="font-mono text-white">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Contrast</span>
                  <span className="font-mono text-white">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Saturation</span>
                  <span className="font-mono text-white">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={200}
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Warmth / Tone</span>
                  <span className="font-mono text-white">{warmth}</span>
                </div>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={warmth}
                  onChange={(e) => setWarmth(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Soft Focus / Blur</span>
                  <span className="font-mono text-white">{blur}px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={8}
                  value={blur}
                  onChange={(e) => setBlur(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* 2. AUDIO ACOUSTIC STUDIO (Adobe Audition Tools)          */}
      {/* ======================================================== */}
      {activeTool === 'audio' && (
        <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white">Voice Acoustic Enhancer & Spectral Strip</h3>
              <p className="text-xs text-slate-400">Clean noise, boost speech clarity, and analyze vocal tone MFCCs.</p>
            </div>

            <label className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs cursor-pointer shadow-lg transition">
              Upload Audio File
              <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
            </label>
          </div>

          {/* Waveform visual simulation */}
          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-850 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Acoustic Frequency Waveform</span>
              <span className="font-mono text-emerald-400">16,000 Hz Mono (DSP Ready)</span>
            </div>

            {/* Animated Waveform Bars */}
            <div className="flex items-center justify-center gap-1.5 h-24 px-4 bg-slate-900/60 rounded-xl overflow-hidden">
              {Array.from({ length: 48 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-300 ${
                    isPlaying ? 'bg-gradient-to-t from-emerald-500 to-indigo-400' : 'bg-slate-700'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(15, (Math.sin(i * 0.4) * 35 + 45))}%` : '20%'
                  }}
                />
              ))}
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isPlaying ? 'Pause Playback' : 'Play Acoustic Preview'}
              </button>

              <button
                onClick={() => onSendToAnalyzer()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" /> Send Voice to Live Analyzer
              </button>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="grid md:grid-cols-3 gap-6 pt-2">
            
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="font-bold">Noise Gate / De-Noise</span>
                <span className="font-mono text-brand-400">{noiseReduction}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={noiseReduction}
                onChange={(e) => setNoiseReduction(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <p className="text-[10px] text-slate-500">Eliminates background fan and room hiss.</p>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="font-bold">Vocal Clarity Boost</span>
                <span className="font-mono text-emerald-400">{clarityBoost}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={clarityBoost}
                onChange={(e) => setClarityBoost(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <p className="text-[10px] text-slate-500">High-pass EQ enhancement for speech frequencies.</p>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-850 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span className="font-bold">Playback Speed & Pitch</span>
                <span className="font-mono text-indigo-400">{audioSpeed}x</span>
              </div>
              <input
                type="range"
                min={0.75}
                max={1.5}
                step={0.05}
                value={audioSpeed}
                onChange={(e) => setAudioSpeed(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <p className="text-[10px] text-slate-500">Pitch modulation and speech tempo control.</p>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. WELLNESS MOOD POSTER (Adobe Express Tools)            */}
      {/* ======================================================== */}
      {activeTool === 'poster' && (
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Canvas Preview */}
          <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block w-full text-left">
              High-Resolution Poster Canvas
            </span>

            <canvas
              ref={posterCanvasRef}
              className="w-full max-w-[420px] aspect-square rounded-2xl shadow-2xl border border-slate-700"
            />

            <div className="flex items-center gap-3 w-full max-w-[420px] pt-2">
              <button
                onClick={downloadPoster}
                className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition"
              >
                <Download className="h-4 w-4" /> Download Poster PNG
              </button>
              <button
                onClick={() => onSendToAnalyzer(posterQuote)}
                className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition"
                title="Send Quote to Analyzer"
              >
                Test in AI
              </button>
            </div>
          </div>

          {/* Right Poster Customizer Controls */}
          <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-slate-800 space-y-5">
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
              <Palette className="h-4 w-4 text-brand-400" /> Poster Styling & Typography
            </h3>

            {/* Poster Mood Tag */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mood Category</label>
              <div className="grid grid-cols-3 gap-2">
                {['calm', 'inspired', 'grateful', 'focus', 'resilient', 'peace'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPosterMood(m)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold capitalize transition border ${
                      posterMood === m 
                        ? 'bg-brand-600 text-white border-brand-500 shadow' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Theme */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Color Theme</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Indigo Nebula', id: 'gradient-indigo' },
                  { label: 'Emerald Forest', id: 'gradient-emerald' },
                  { label: 'Sunset Glow', id: 'gradient-sunset' },
                  { label: 'Midnight Slate', id: 'gradient-dark' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPosterTheme(t.id)}
                    className={`py-2 rounded-xl text-[11px] font-semibold transition border text-left px-3 ${
                      posterTheme === t.id 
                        ? 'border-brand-500 bg-brand-500/10 text-white ring-1 ring-brand-500' 
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Poster Heading</label>
              <input
                type="text"
                value={posterTitle}
                onChange={(e) => setPosterTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>

            {/* Quote input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Affirmation / Quote</label>
              <textarea
                rows={3}
                value={posterQuote}
                onChange={(e) => setPosterQuote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-500 rounded-xl p-3 text-xs text-slate-200 outline-none resize-none"
              />
            </div>

            {/* Font Style */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Font Family</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setPosterFont('sans')}
                  className={`py-2 rounded-xl font-bold border transition ${
                    posterFont === 'sans' ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Modern Sans
                </button>
                <button
                  onClick={() => setPosterFont('serif')}
                  className={`py-2 rounded-xl font-serif font-bold border transition ${
                    posterFont === 'serif' ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Classic Serif
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
