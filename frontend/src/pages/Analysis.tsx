import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Mic, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown, 
  Sliders, 
  Square, 
  Trash2, 
  ShieldAlert, 
  Check, 
  Layers, 
  Zap
} from 'lucide-react';
import { apiService } from '../services/api';
import type { AnalysisData, User } from '../types';

interface AnalysisProps {
  currentUser?: User | null;
  initialText?: string;
}

export const Analysis: React.FC<AnalysisProps> = ({ currentUser, initialText }) => {
  // Input states
  const [text, setText] = useState<string>(initialText || '');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Progressive Disclosure: Advanced Configuration
  const [showAdvancedConfig, setShowAdvancedConfig] = useState<boolean>(false);
  const [demoMode, setDemoMode] = useState<boolean>(false);

  // Progressive Disclosure: Detailed Model Attribution
  const [showModelDetails, setShowModelDetails] = useState<boolean>(false);

  // Execution & Pipeline States
  const [loading, setLoading] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Media Capture States
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioTimerRef = useRef<any>(null);

  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  // Audio Recording handlers
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const file = new File([audioBlob], `recorded_audio_${Date.now()}.wav`, { type: 'audio/wav' });
        setAudioFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      audioTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } catch {
      setErrorMsg("Microphone access permission was denied or unavailable.");
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (audioTimerRef.current) {
        clearInterval(audioTimerRef.current);
      }
    }
  };

  // Webcam Capture handlers
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsWebcamActive(true);
    } catch {
      setErrorMsg("Camera access permission was denied or unavailable.");
    }
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `webcam_snap_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setImageFile(file);
          setImagePreviewUrl(URL.createObjectURL(blob));
          stopCamera();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsWebcamActive(false);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  // Run Inference Pipeline
  const handleAnalyze = async () => {
    if (!text.trim() && !audioFile && !imageFile) {
      setErrorMsg("Please provide at least one active modality (Text, Audio, or Webcam Vision).");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setPipelineStep(1);

    const stepInterval = setInterval(() => {
      setPipelineStep(prev => (prev < 4 ? prev + 1 : prev));
    }, 450);

    try {
      const response = await apiService.analyzeEmotion(
        text.trim() || null,
        audioFile,
        imageFile,
        demoMode,
        currentUser?.id
      );

      clearInterval(stepInterval);
      setPipelineStep(4);

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setErrorMsg(response.error?.message || "Inference failed. Please check your backend connection.");
      }
    } catch {
      clearInterval(stepInterval);
      setErrorMsg("An unexpected connection failure occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const configuredModalityCount = (text.trim() ? 1 : 0) + (audioFile ? 1 : 0) + (imageFile ? 1 : 0);

  return (
    <div className="space-y-8">
      
      {/* 1. INPUT MODALITIES GRID */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* TEXT MODALITY */}
        <div className="academic-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wider">1. Text Statement</span>
              </div>
              {text.trim() && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                  <Check className="h-3 w-3" /> Ready
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Natural language semantics & lexical valence.</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter qualitative statement or reflection to evaluate..."
              rows={4}
              className="w-full bg-slate-900/80 border border-slate-700/60 focus:border-brand-500 rounded-lg p-3 text-xs text-slate-200 outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
            <span>{text.length} chars</span>
            {text && (
              <button onClick={() => setText('')} className="text-slate-400 hover:text-red-400 transition">
                Clear Text
              </button>
            )}
          </div>
        </div>

        {/* AUDIO MODALITY */}
        <div className="academic-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wider">2. Vocal Acoustics</span>
              </div>
              {audioFile && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                  <Check className="h-3 w-3" /> Ready
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Speech prosody, pitch variance & 13 MFCCs.</p>

            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-3 min-h-[110px]">
              {audioFile ? (
                <div className="text-center space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[170px]">{audioFile.name}</span>
                  </div>
                  <button
                    onClick={() => setAudioFile(null)}
                    className="text-[10px] text-slate-400 hover:text-red-400 flex items-center gap-1 mx-auto transition"
                  >
                    <Trash2 className="h-3 w-3" /> Remove Audio
                  </button>
                </div>
              ) : isRecordingAudio ? (
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-red-400 animate-pulse">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    <span className="font-mono text-xs font-bold">Recording: {formatSecs(recordingSeconds)}</span>
                  </div>
                  <button
                    onClick={stopAudioRecording}
                    className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-1 mx-auto shadow"
                  >
                    <Square className="h-3 w-3" /> Stop Recording
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={startAudioRecording}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <Mic className="h-3.5 w-3.5 text-emerald-400" /> Record Microphone
                  </button>
                  <label className="text-[10px] text-brand-400 hover:underline cursor-pointer">
                    <span>Or upload .wav audio file</span>
                    <input type="file" accept="audio/*" onChange={handleAudioFileUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">16kHz Mono Sampling</div>
        </div>

        {/* VISION MODALITY */}
        <div className="academic-card p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-blue-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wider">3. Facial Vision</span>
              </div>
              {imageFile && (
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 font-mono">
                  <Check className="h-3 w-3" /> Ready
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">48x48 Grayscale Facial Expression CNN.</p>

            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[110px]">
              {isWebcamActive ? (
                <div className="space-y-2 text-center w-full">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-28 rounded object-cover border border-slate-700" />
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={captureFrame}
                      className="px-3 py-1 rounded bg-brand-600 text-white text-xs font-semibold shadow"
                    >
                      Capture Photo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : imageFile && imagePreviewUrl ? (
                <div className="text-center space-y-1.5">
                  <img src={imagePreviewUrl} alt="Face Preview" className="h-16 w-16 rounded-lg object-cover mx-auto border border-slate-700 shadow" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreviewUrl(null); }}
                    className="text-[10px] text-slate-400 hover:text-red-400 flex items-center gap-1 mx-auto transition"
                  >
                    <Trash2 className="h-3 w-3" /> Remove Image
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={startCamera}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <Camera className="h-3.5 w-3.5 text-blue-400" /> Open Webcam
                  </button>
                  <label className="text-[10px] text-brand-400 hover:underline cursor-pointer">
                    <span>Or upload facial image</span>
                    <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">Haar / CNN Face Cropping</div>
        </div>

      </div>

      {/* 2. PROGRESSIVE DISCLOSURE: ADVANCED CONFIGURATION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <button
            onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Advanced Configuration & Diagnostics</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvancedConfig ? 'rotate-180 text-brand-400' : ''}`} />
          </button>
          
          <span className="text-[11px] text-slate-400 font-mono">
            {configuredModalityCount} / 3 Modalities Configured
          </span>
        </div>

        {showAdvancedConfig && (
          <div className="academic-card p-4 rounded-xl space-y-3 animate-fadeIn text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={demoMode}
                  onChange={(e) => setDemoMode(e.target.checked)}
                  className="rounded border-slate-700 text-brand-600 focus:ring-brand-500 h-4 w-4 bg-slate-950"
                />
                <div>
                  <span className="font-semibold block">Simulation / Offline Demo Mode</span>
                  <span className="text-[11px] text-slate-400">Evaluate heuristic rule-based fusion without active PyTorch GPU/CPU weights.</span>
                </div>
              </label>

              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                Session User ID: {currentUser ? `@${currentUser.username}` : 'Anonymous / Ephemeral'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. PRIMARY ACTION & PIPELINE LOADER */}
      <div className="space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || configuredModalityCount === 0}
          className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white font-bold text-sm tracking-wide transition shadow-md flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Processing Multimodal Ingestion...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 text-amber-300" />
              <span>Execute Intermediate Cross-Attention Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* PIPELINE OVERLAY */}
      {loading && (
        <div className="academic-card p-6 space-y-4 animate-fadeIn">
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            Inference Pipeline Execution
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { num: 1, label: 'Modality Preprocessing' },
              { num: 2, label: 'Unimodal Encoders' },
              { num: 3, label: 'Cross-Attention Fusion' },
              { num: 4, label: 'Softmax Logits' }
            ].map((st) => (
              <div 
                key={st.num}
                className={`p-3 rounded-lg border flex items-center gap-2 transition ${
                  pipelineStep >= st.num 
                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-300' 
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <span className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] font-mono ${
                  pipelineStep >= st.num ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {st.num}
                </span>
                <span className="font-medium text-[11px]">{st.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. RESULTS SECTION */}
      {result && (
        <div className="space-y-6 animate-fadeIn pt-4 border-t border-slate-800">
          
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Multimodal Assessment Results</h2>
            <span className="text-[10px] uppercase font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 font-mono">
              Fused Vector Classification
            </span>
          </div>

          {/* Primary Result Headline Card */}
          <div className="academic-card p-6 md:p-8 space-y-6">
            <div className="grid md:grid-cols-12 gap-6 items-center">
              
              <div className="md:col-span-7 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                  Dominant Emotional State
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-white capitalize tracking-tight flex items-center gap-3">
                  <span>{result.emotion}</span>
                  <span className="text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-brand-400 font-bold">
                    {(result.confidence * 100).toFixed(1)}% Confidence
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-normal pt-1">
                  Cross-attention transformer successfully fused {result.modalities_used.length} modality streams with dynamic availability masking.
                </p>
              </div>

              {/* Active Modalities Pill Box */}
              <div className="md:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                  Active Modality Inputs
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.modalities_used.map((m: string, idx: number) => (
                    <span key={idx} className="bg-slate-900 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-md text-[11px] font-mono capitalize">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Probability Distribution Bar Chart */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Probability Distribution Across Affect Categories
              </span>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(result.probabilities || {}).map(([emo, prob]) => {
                  const percent = Math.round(Number(prob) * 100);
                  const isTop = emo.toLowerCase() === result.emotion.toLowerCase();
                  return (
                    <div key={emo} className={`p-3 rounded-xl border ${isTop ? 'bg-brand-500/10 border-brand-500/30' : 'bg-slate-900/60 border-slate-800'}`}>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className={`capitalize font-semibold ${isTop ? 'text-white font-bold' : 'text-slate-300'}`}>{emo}</span>
                        <span className="font-mono text-[11px] text-slate-400">{percent}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isTop ? 'bg-brand-500' : 'bg-slate-700'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 5. PROGRESSIVE DISCLOSURE: MODEL ATTRIBUTION & WEIGHTS */}
          <div className="space-y-3">
            <button
              onClick={() => setShowModelDetails(!showModelDetails)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>Inspect Unimodal Predictions & Attention Weight Attributions</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showModelDetails ? 'rotate-180 text-brand-400' : ''}`} />
            </button>

            {showModelDetails && (
              <div className="academic-card p-6 space-y-6 animate-fadeIn">
                
                {/* Unimodal Comparisons */}
                {result.modality_predictions && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">
                      Individual Modality Encoders vs. Multimodal Fusion
                    </span>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {result.modality_predictions.text && (
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Text NLP Encoder</span>
                          <p className="text-sm font-bold text-white capitalize">{result.modality_predictions.text.emotion}</p>
                          <span className="text-[11px] text-slate-400 font-mono">Confidence: {(result.modality_predictions.text.confidence * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {result.modality_predictions.audio && (
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Audio SER Encoder</span>
                          <p className="text-sm font-bold text-white capitalize">{result.modality_predictions.audio.emotion}</p>
                          <span className="text-[11px] text-slate-400 font-mono">Confidence: {(result.modality_predictions.audio.confidence * 100).toFixed(1)}%</span>
                        </div>
                      )}
                      {result.modality_predictions.image && (
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Vision CNN Encoder</span>
                          <p className="text-sm font-bold text-white capitalize">{result.modality_predictions.image.emotion}</p>
                          <span className="text-[11px] text-slate-400 font-mono">Confidence: {(result.modality_predictions.image.confidence * 100).toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Clinical Crisis Notice */}
          {result.crisis_alert && (
            <div className="academic-card p-6 border-red-500/40 bg-red-500/5 space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <ShieldAlert className="h-4.5 w-4.5" />
                <span>Elevated Distress Threshold Detected</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                If you are experiencing overwhelming emotional distress or crisis, confidential certified support is available 24/7. Call or text <strong>988</strong> (USA & Canada) or visit findahelpline.com.
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
