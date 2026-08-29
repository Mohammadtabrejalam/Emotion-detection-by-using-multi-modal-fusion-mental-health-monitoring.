import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Mic, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown, 
  Square, 
  Trash2, 
  Check, 
  Layers, 
  Zap,
  Info,
  SlidersHorizontal
} from 'lucide-react';
import { apiService } from '../services/api';
import type { AnalysisData, User } from '../types';
import { ShareModal } from '../components/ShareModal';

export type ModalityMode = 'text' | 'audio' | 'image' | 'multimodal';

interface AnalysisProps {
  currentUser?: User | null;
  initialText?: string;
}

export const Analysis: React.FC<AnalysisProps> = ({ currentUser, initialText }) => {
  // Active modality selection mode tab
  const [selectedMode, setSelectedMode] = useState<ModalityMode>('text');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Input states
  const [text, setText] = useState<string>(initialText || '');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Advanced Configuration & Details
  const [showAdvancedConfig, setShowAdvancedConfig] = useState<boolean>(false);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [showModelDetails, setShowModelDetails] = useState<boolean>(false);

  // Execution & Pipeline States
  const [loading, setLoading] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio Recording States
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioTimerRef = useRef<any>(null);

  // Webcam Capture States
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
      setSelectedMode('text');
    }
  }, [initialText]);

  // Audio Recording handlers
  const startAudioRecording = async () => {
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg("Audio recording is not supported in this browser environment.");
        return;
      }
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
    } catch (err: any) {
      setErrorMsg("Microphone access permission was denied or microphone is unavailable.");
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
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg("Webcam access is not supported in this browser environment.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsWebcamActive(true);
    } catch {
      setErrorMsg("Camera access permission was denied or camera is unavailable.");
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
    // Mode-specific validation
    let textToSend: string | null = null;
    let audioToSend: File | null = null;
    let imageToSend: File | null = null;

    if (selectedMode === 'text') {
      if (!text.trim()) {
        setErrorMsg("Please enter a text statement to analyze.");
        return;
      }
      textToSend = text.trim();
    } else if (selectedMode === 'audio') {
      if (!audioFile) {
        setErrorMsg("Please record microphone audio or upload a .wav audio file.");
        return;
      }
      audioToSend = audioFile;
    } else if (selectedMode === 'image') {
      if (!imageFile) {
        setErrorMsg("Please capture a webcam photo or upload a facial image.");
        return;
      }
      imageToSend = imageFile;
    } else if (selectedMode === 'multimodal') {
      if (!text.trim() && !audioFile && !imageFile) {
        setErrorMsg("Please provide at least one active modality stream (Text, Audio, or Image).");
        return;
      }
      if (text.trim()) textToSend = text.trim();
      if (audioFile) audioToSend = audioFile;
      if (imageFile) imageToSend = imageFile;
    }

    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setPipelineStep(1);

    const stepInterval = setInterval(() => {
      setPipelineStep(prev => (prev < 4 ? prev + 1 : prev));
    }, 400);

    try {
      const response = await apiService.analyzeEmotion(
        textToSend,
        audioToSend,
        imageToSend,
        demoMode,
        currentUser?.id
      );

      clearInterval(stepInterval);
      setPipelineStep(4);

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setErrorMsg(response.error?.message || "Inference failed. Please verify your backend server connection.");
      }
    } catch (err: any) {
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

  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto">
      
      {/* 1. SECTION HEADER */}
      <div className="space-y-1">
        <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest block">
          Affective Laboratory
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Start Analysis
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
          Select your input modality method, provide input data, and execute the Intermediate Cross-Attention Transformer.
        </p>
      </div>

      {/* 2. MODALITY SELECTION TABS */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Step 1: Choose Your Input Method
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
          <button
            onClick={() => { setSelectedMode('text'); setErrorMsg(null); }}
            className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
              selectedMode === 'text'
                ? 'bg-slate-900 text-white border-brand-500 shadow-md font-bold'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className={`h-4 w-4 ${selectedMode === 'text' ? 'text-brand-400' : 'text-slate-500'}`} />
              <span>Text</span>
            </div>
            {selectedMode === 'text' && <span className="h-2 w-2 rounded-full bg-brand-500" />}
          </button>

          <button
            onClick={() => { setSelectedMode('audio'); setErrorMsg(null); }}
            className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
              selectedMode === 'audio'
                ? 'bg-slate-900 text-white border-brand-500 shadow-md font-bold'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Mic className={`h-4 w-4 ${selectedMode === 'audio' ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>Audio</span>
            </div>
            {selectedMode === 'audio' && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
          </button>

          <button
            onClick={() => { setSelectedMode('image'); setErrorMsg(null); }}
            className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
              selectedMode === 'image'
                ? 'bg-slate-900 text-white border-brand-500 shadow-md font-bold'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Camera className={`h-4 w-4 ${selectedMode === 'image' ? 'text-blue-400' : 'text-slate-500'}`} />
              <span>Image</span>
            </div>
            {selectedMode === 'image' && <span className="h-2 w-2 rounded-full bg-blue-500" />}
          </button>

          <button
            onClick={() => { setSelectedMode('multimodal'); setErrorMsg(null); }}
            className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
              selectedMode === 'multimodal'
                ? 'bg-slate-900 text-white border-brand-500 shadow-md font-bold'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className={`h-4 w-4 ${selectedMode === 'multimodal' ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>Multimodal</span>
            </div>
            {selectedMode === 'multimodal' && <span className="h-2 w-2 rounded-full bg-indigo-500" />}
          </button>
        </div>
      </div>

      {/* 3. INPUT AREA (PROGRESSIVE DISCLOSURE) */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Step 2: Provide Input Data
        </label>

        {/* MODE A: TEXT ONLY */}
        {selectedMode === 'text' && (
          <div className="academic-card p-6 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <FileText className="h-4 w-4 text-brand-400" />
                <span>Qualitative Text Statement</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{text.length} characters</span>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste a text statement to evaluate lexical emotion signals..."
              rows={5}
              className="w-full bg-slate-900/80 border border-slate-700/80 focus:border-brand-500 rounded-xl p-3 text-xs text-white outline-none resize-none leading-relaxed"
            />
            {text && (
              <div className="flex justify-end">
                <button onClick={() => setText('')} className="text-[11px] text-slate-400 hover:text-red-400">
                  Clear Text
                </button>
              </div>
            )}
          </div>
        )}

        {/* MODE B: AUDIO ONLY */}
        {selectedMode === 'audio' && (
          <div className="academic-card p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Mic className="h-4 w-4 text-emerald-400" />
                <span>Speech Acoustic Ingestion (16kHz Mono)</span>
              </div>
              {audioFile && (
                <span className="text-[11px] text-emerald-400 font-semibold font-mono flex items-center gap-1">
                  <Check className="h-3 w-3" /> Audio File Loaded
                </span>
              )}
            </div>

            <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center space-y-4 min-h-[140px]">
              {audioFile ? (
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{audioFile.name}</span>
                  </div>
                  <div>
                    <button
                      onClick={() => setAudioFile(null)}
                      className="text-xs text-slate-400 hover:text-red-400 inline-flex items-center gap-1 transition"
                    >
                      <Trash2 className="h-3 w-3" /> Remove Audio File
                    </button>
                  </div>
                </div>
              ) : isRecordingAudio ? (
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-red-400 animate-pulse">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="font-mono text-xs font-bold">Recording Speech: {formatSecs(recordingSeconds)}</span>
                  </div>
                  <button
                    onClick={stopAudioRecording}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 mx-auto shadow"
                  >
                    <Square className="h-3.5 w-3.5" /> Stop Recording
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={startAudioRecording}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs border border-slate-700 transition flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4 text-emerald-400" /> Record Microphone
                  </button>
                  <span className="text-xs text-slate-500">or</span>
                  <label className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition cursor-pointer">
                    <span>Upload .wav File</span>
                    <input type="file" accept="audio/*" onChange={handleAudioFileUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE C: IMAGE ONLY */}
        {selectedMode === 'image' && (
          <div className="academic-card p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Camera className="h-4 w-4 text-blue-400" />
                <span>Facial Vision Expression Crop (48x48 Matrix)</span>
              </div>
              {imageFile && (
                <span className="text-[11px] text-emerald-400 font-semibold font-mono flex items-center gap-1">
                  <Check className="h-3 w-3" /> Image Loaded
                </span>
              )}
            </div>

            <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center min-h-[140px]">
              {isWebcamActive ? (
                <div className="space-y-3 text-center w-full max-w-sm">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-40 rounded-xl object-cover border border-slate-700" />
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={captureFrame}
                      className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow"
                    >
                      Capture Photo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : imageFile && imagePreviewUrl ? (
                <div className="text-center space-y-2">
                  <img src={imagePreviewUrl} alt="Facial Preview" className="h-24 w-24 rounded-xl object-cover mx-auto border border-slate-700 shadow" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreviewUrl(null); }}
                    className="text-xs text-slate-400 hover:text-red-400 inline-flex items-center gap-1 transition"
                  >
                    <Trash2 className="h-3 w-3" /> Remove Image
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={startCamera}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs border border-slate-700 transition flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4 text-blue-400" /> Open Webcam
                  </button>
                  <span className="text-xs text-slate-500">or</span>
                  <label className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-700 transition cursor-pointer">
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE D: MULTIMODAL (ALL INPUTS) */}
        {selectedMode === 'multimodal' && (
          <div className="grid md:grid-cols-3 gap-4 animate-fadeIn">
            
            {/* Text Box */}
            <div className="academic-card p-5 space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-white text-xs">1. Text Stream</span>
                  {text.trim() && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text statement..."
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white outline-none resize-none"
                />
              </div>
            </div>

            {/* Audio Box */}
            <div className="academic-card p-5 space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-white text-xs">2. Audio Stream</span>
                  {audioFile && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
                {audioFile ? (
                  <div className="text-center py-3 space-y-1">
                    <span className="text-[11px] font-mono text-emerald-400 block truncate">{audioFile.name}</span>
                    <button onClick={() => setAudioFile(null)} className="text-[10px] text-slate-400 hover:text-red-400">Remove</button>
                  </div>
                ) : (
                  <div className="py-2 space-y-2 text-center">
                    <button onClick={startAudioRecording} className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded border border-slate-800">
                      Record Audio
                    </button>
                    <label className="text-[10px] text-brand-400 hover:underline cursor-pointer block">
                      <span>Upload .wav</span>
                      <input type="file" accept="audio/*" onChange={handleAudioFileUpload} className="hidden" />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Image Box */}
            <div className="academic-card p-5 space-y-2 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="font-bold text-white text-xs">3. Vision Stream</span>
                  {imageFile && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                </div>
                {imageFile && imagePreviewUrl ? (
                  <div className="text-center py-1 space-y-1">
                    <img src={imagePreviewUrl} alt="Snap" className="h-12 w-12 rounded object-cover mx-auto border border-slate-700" />
                    <button onClick={() => { setImageFile(null); setImagePreviewUrl(null); }} className="text-[10px] text-slate-400 hover:text-red-400">Remove</button>
                  </div>
                ) : (
                  <div className="py-2 space-y-2 text-center">
                    <button onClick={startCamera} className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs rounded border border-slate-800">
                      Open Camera
                    </button>
                    <label className="text-[10px] text-brand-400 hover:underline cursor-pointer block">
                      <span>Upload Image</span>
                      <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                    </label>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 4. PROGRESSIVE DISCLOSURE: ADVANCED SETTINGS */}
      <div className="space-y-2">
        <button
          onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Advanced Configuration</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvancedConfig ? 'rotate-180 text-brand-400' : ''}`} />
        </button>

        {showAdvancedConfig && (
          <div className="academic-card p-4 space-y-3 animate-fadeIn text-xs">
            <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                className="rounded border-slate-700 text-brand-600 focus:ring-brand-500 h-4 w-4 bg-slate-950"
              />
              <div>
                <span className="font-semibold block">Rule-Based Simulation Mode</span>
                <span className="text-[11px] text-slate-400">Run heuristic classification without active PyTorch model weights.</span>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* 5. PRIMARY ACTION BUTTON */}
      <div className="space-y-4 pt-2">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm tracking-wide transition shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Analyzing your input...</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 text-amber-300" />
              <span>Start Analysis</span>
            </>
          )}
        </button>
      </div>

      {/* PIPELINE OVERLAY */}
      {loading && (
        <div className="academic-card p-6 space-y-3 animate-fadeIn">
          <span className="text-xs font-bold text-white uppercase tracking-wider block">
            Analyzing your input...
          </span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
            {[
              { num: 1, label: 'Modality Preprocessing' },
              { num: 2, label: 'Unimodal Encoders' },
              { num: 3, label: 'Cross-Attention Fusion' },
              { num: 4, label: 'Softmax Classification' }
            ].map((st) => (
              <div 
                key={st.num}
                className={`p-2.5 rounded-lg border flex items-center gap-2 transition ${
                  pipelineStep >= st.num 
                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-300' 
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <span className="text-[10px] font-bold">{st.num}.</span>
                <span className="text-[11px]">{st.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. RESEARCH-STYLE RESULTS DISPLAY */}
      {result && (
        <div className="space-y-6 animate-fadeIn pt-4 border-t border-slate-800">
          
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-tight">Analysis Output & Classification</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/30 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <span>Share Result</span>
              </button>
              <span className="text-[10px] uppercase font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded border border-brand-500/20 font-mono">
                Research Estimate
              </span>
            </div>
          </div>

          <div className="academic-card p-6 md:p-8 space-y-6">
            
            {/* Primary Emotion & Confidence */}
            <div className="grid md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                  Detected Dominant Emotion
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-white capitalize tracking-tight flex items-center gap-3">
                  <span>{result.emotion}</span>
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-brand-400 font-bold">
                    {(result.confidence * 100).toFixed(1)}% Confidence
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-normal pt-1">
                  Intermediate cross-attention fused {result.modalities_used.length} active modality stream(s): {result.modalities_used.join(' + ')}.
                </p>
              </div>

              <div className="md:col-span-5 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block font-mono">
                  Input Modalities Evaluated
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

            {/* Probability Curves */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Softmax Probability Distribution Across 7 Affect Categories
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

          {/* Explanation Callouts */}
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="academic-card p-5 space-y-2 border-indigo-500/30">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Info className="h-4 w-4" />
                <span>What Does This Result Mean?</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 leading-relaxed">
                <li>• <strong>Pattern Estimate:</strong> The neural model identified feature alignments corresponding to {result.emotion} across your input stream(s).</li>
                <li>• <strong>Softmax Confidence:</strong> {(result.confidence * 100).toFixed(1)}% confidence represents mathematical model certainty relative to the 7 classified affect categories.</li>
              </ul>
            </div>

            <div className="academic-card p-5 space-y-2 border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <AlertCircle className="h-4 w-4" />
                <span>What This Result Does NOT Mean</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 leading-relaxed">
                <li>• <strong>Not a Medical Diagnosis:</strong> This output is an AI research estimate and does not replace psychiatric or clinical diagnosis.</li>
                <li>• <strong>Not Clinical Severity:</strong> Softmax scores reflect mathematical alignment with benchmark training distributions, not medical status.</li>
              </ul>
            </div>
          </div>

          {/* Collapsible Model Details */}
          <div className="space-y-2">
            <button
              onClick={() => setShowModelDetails(!showModelDetails)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span>Inspect Collapsed Technical Model Details</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showModelDetails ? 'rotate-180 text-brand-400' : ''}`} />
            </button>

            {showModelDetails && (
              <div className="academic-card p-6 space-y-4 animate-fadeIn">
                {result.modality_predictions && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">
                      Unimodal Encoder Breakdown
                    </span>
                    <div className="grid sm:grid-cols-3 gap-3 text-xs">
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

        </div>
      )}

      {/* SECURE SHARE MODAL */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        result={result}
        currentUser={currentUser}
      />

    </div>
  );
};
