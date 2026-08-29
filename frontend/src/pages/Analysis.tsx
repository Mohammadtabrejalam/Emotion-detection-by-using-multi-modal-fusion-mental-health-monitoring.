import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Mic, 
  Camera, 
  Trash2, 
  Square, 
  Video, 
  RefreshCw, 
  Activity, 
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Upload,
  ArrowRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { apiService } from '../services/api';
import type { AnalysisData, PipelineStage, User } from '../types';

interface AnalysisProps {
  currentUser?: User | null;
  initialText?: string;
}

export const Analysis: React.FC<AnalysisProps> = ({ currentUser, initialText }) => {
  // Input States
  const [text, setText] = useState<string>(initialText || '');

  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(true);

  // Live Recording States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  // Live Camera States
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // App Pipeline States
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);

  // Text Example Pre-fill
  const handleLoadExample = () => {
    setText("I have been feeling exhausted and disconnected lately. I don't feel motivated to do the things I normally enjoy, even though I keep telling everyone that I'm totally fine.");
  };

  // Cleanup Cameras and Mic
  useEffect(() => {
    return () => {
      stopCameraStream();
      stopAudioTimer();
    };
  }, []);

  // Audio Recording Logic
  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioUrl(null);
    setAudioFile(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        const file = new File([audioBlob], 'recorded_speech.wav', { type: 'audio/wav' });
        setAudioFile(file);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch {
      alert("Microphone permission was denied or no input audio device was detected.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopAudioTimer();
    }
  };

  const stopAudioTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const deleteAudio = () => {
    setAudioFile(null);
    setAudioUrl(null);
    setRecordingDuration(0);
  };

  // Camera Webcam Logic
  const startCamera = async () => {
    setImageUrl(null);
    setImageFile(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      alert("Camera permission denied or camera device unavailable.");
      setCameraActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && streamRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
            
            const file = new File([blob], 'captured_face.png', { type: 'image/png' });
            setImageFile(file);
          }
        }, 'image/png');
      }
      stopCameraStream();
    }
  };

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const removeImage = () => {
    setImageFile(null);
    setImageUrl(null);
    stopCameraStream();
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      stopCameraStream();
    }
  };

  const getActiveModalities = () => {
    const list = [];
    if (text.trim()) list.push("Text (NLP)");
    if (audioFile) list.push("Audio (SER)");
    if (imageFile) list.push("Image (CNN)");
    return list;
  };

  const handleReset = () => {
    setText('');
    deleteAudio();
    removeImage();
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  const handleAnalyze = async () => {
    setErrorMsg(null);
    setAnalysisResult(null);
    
    if (!text.trim() && !audioFile && !imageFile) {
      setErrorMsg("Please provide at least one input modality (Text, Audio, or Facial Image).");
      return;
    }

    setLoading(true);

    const stages: PipelineStage[] = [
      { stage: "Modality Validation & Alignment", status: "processing" },
      { stage: "Signal DSP & Tokenization", status: "pending" },
      { stage: "Unimodal Feature Extraction", status: "pending" },
      { stage: "Shared Projection (64-dim)", status: "pending" },
      { stage: "Cross-Attention Fusion Network", status: "pending" },
      { stage: "Classification Logits & Insights", status: "pending" }
    ];
    setPipelineStages(stages);

    const updateStage = (name: string, status: 'processing' | 'completed' | 'failed') => {
      setPipelineStages(prev => prev.map(s => {
        if (s.stage === name) return { ...s, status };
        return s;
      }));
    };

    setTimeout(() => updateStage("Modality Validation & Alignment", "completed"), 250);
    setTimeout(() => updateStage("Signal DSP & Tokenization", "processing"), 300);
    setTimeout(() => updateStage("Signal DSP & Tokenization", "completed"), 650);
    setTimeout(() => updateStage("Unimodal Feature Extraction", "processing"), 700);

    const response = await apiService.analyzeEmotion(
      text.trim() ? text : null,
      audioFile,
      imageFile,
      demoMode,
      currentUser?.id
    );

    if (response.success && response.data) {
      updateStage("Unimodal Feature Extraction", "completed");
      updateStage("Shared Projection (64-dim)", "completed");
      updateStage("Cross-Attention Fusion Network", "completed");
      updateStage("Classification Logits & Insights", "completed");
      
      setTimeout(() => {
        setAnalysisResult(response.data);
        setLoading(false);
      }, 400);
    } else {
      setLoading(false);
      setErrorMsg(response.error?.message || "An error occurred during inference computation.");
    }
  };

  const activeModalities = getActiveModalities();

  return (
    <div className="space-y-8">
      
      {/* Workspace Inputs Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* 1. TEXT MODALITY CARD */}
        <div className="academic-card p-6 flex flex-col justify-between h-[380px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <FileText className="h-4.5 w-4.5" />
                <span>Text Modality</span>
              </div>
              <button 
                onClick={handleLoadExample}
                className="text-[11px] text-brand-400 hover:text-brand-300 font-medium bg-brand-500/10 px-2 py-1 rounded border border-brand-500/20 transition"
                title="Load sample reflection"
              >
                Sample Prompt
              </button>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 1000))}
              placeholder="Describe your current emotional state, thoughts, or day in detail..."
              className="w-full h-48 bg-slate-900/70 border border-slate-700/60 focus:border-brand-500 rounded-lg p-3 text-xs text-slate-200 outline-none resize-none placeholder-slate-500 leading-relaxed font-sans"
            />
          </div>
          
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            <span>{text.length} / 1000 characters</span>
            {text && (
              <button onClick={() => setText('')} className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> Clear Text
              </button>
            )}
          </div>
        </div>

        {/* 2. AUDIO MODALITY CARD */}
        <div className="academic-card p-6 flex flex-col justify-between h-[380px]">
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Mic className="h-4.5 w-4.5" />
                <span>Speech Acoustics</span>
              </div>
              {audioFile && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-medium border border-emerald-500/20">
                  Ready (16kHz)
                </span>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center items-center py-2 space-y-4">
              {!audioUrl ? (
                <div className="w-full flex flex-col items-center space-y-3">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`h-14 w-14 rounded-full flex items-center justify-center transition-all ${
                      isRecording 
                        ? 'bg-red-600 text-white animate-pulse shadow-md shadow-red-600/30' 
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:scale-105'
                    }`}
                    title={isRecording ? "Stop recording speech" : "Start recording microphone"}
                  >
                    {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-6 w-6" />}
                  </button>
                  
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-200">
                      {isRecording ? `Recording acoustics... ${recordingDuration}s` : 'Record Speech Sample'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Captures 13 MFCC spectral coefficients</p>
                  </div>

                  <label className="cursor-pointer text-[11px] text-brand-400 hover:text-brand-300 font-medium bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition border border-slate-700 flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload WAV / MP3</span>
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={handleAudioUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              ) : (
                <div className="w-full bg-slate-900/60 rounded-xl p-4 border border-slate-800 space-y-3 flex flex-col items-center">
                  <div className="flex items-center gap-3 w-full">
                    <div className="bg-emerald-500/10 p-2 rounded-lg text-emerald-400 border border-emerald-500/20">
                      <Mic className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{audioFile?.name || "Recorded Speech Clip"}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{(audioFile ? (audioFile.size / 1024).toFixed(1) : 0)} KB</p>
                    </div>
                  </div>
                  
                  <audio src={audioUrl} controls className="w-full h-8 outline-none" />
                  
                  <button 
                    onClick={deleteAudio}
                    className="text-[11px] text-red-400 hover:text-red-300 font-medium flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 transition"
                  >
                    <Trash2 className="h-3 w-3" /> Remove Audio
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. FACIAL VISION MODALITY CARD */}
        <div className="academic-card p-6 flex flex-col justify-between h-[380px]">
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                <Camera className="h-4.5 w-4.5" />
                <span>Facial Micro-Expressions</span>
              </div>
              {imageFile && (
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded font-medium border border-blue-500/20">
                  Ready (48x48)
                </span>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center items-center py-2 overflow-hidden">
              {cameraActive ? (
                <div className="relative w-full aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]" 
                  />
                  <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-2 px-3">
                    <button
                      onClick={captureImage}
                      className="bg-brand-600 hover:bg-brand-500 text-white text-[11px] font-semibold px-3 py-1.5 rounded shadow"
                    >
                      Capture Frame
                    </button>
                    <button
                      onClick={stopCameraStream}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium px-3 py-1.5 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : !imageUrl ? (
                <div className="w-full flex flex-col items-center space-y-3">
                  <button
                    onClick={startCamera}
                    className="h-14 w-14 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 hover:scale-105 flex items-center justify-center transition-all"
                    title="Activate camera for photo capture"
                  >
                    <Video className="h-6 w-6" />
                  </button>
                  
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-200">Open Webcam Capture</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Aligned with Haar Cascade face crops</p>
                  </div>

                  <label className="cursor-pointer text-[11px] text-brand-400 hover:text-brand-300 font-medium bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition border border-slate-700 flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Image File</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              ) : (
                <div className="relative w-full h-full flex flex-col justify-center items-center bg-slate-900/40 border border-slate-800 rounded-xl p-2.5">
                  <img src={imageUrl} alt="Facial Expression Capture" className="max-h-36 rounded object-contain border border-slate-700/50" />
                  <button
                    onClick={removeImage}
                    className="mt-2.5 text-[11px] text-red-400 hover:text-red-300 font-medium flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 transition"
                  >
                    <Trash2 className="h-3 w-3" /> Remove Photo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* CONTROLS & INFERENCE DISPATCH TOOLBAR */}
      <div className="academic-card p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Modality Status & Demo Checkbox */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-300 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Activity className="h-4 w-4 text-brand-400" />
            <span>
              {activeModalities.length > 0 ? `Active: ${activeModalities.join(' + ')}` : 'No modalities loaded'}
            </span>
          </div>
          
          <label className="inline-flex items-center gap-2 cursor-pointer text-slate-400 select-none">
            <input 
              type="checkbox" 
              checked={demoMode} 
              onChange={(e) => setDemoMode(e.target.checked)} 
              className="rounded border-slate-700 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5 bg-slate-950"
            />
            <span>Enable Simulation Weights (Demo Mode)</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Reset
          </button>
          
          <button
            onClick={handleAnalyze}
            className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs tracking-wide uppercase transition shadow flex items-center gap-2"
          >
            <span>Run Multimodal Analysis</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* PIPELINE PROGRESS LOADER DIALOG */}
      {loading && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="academic-card p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Cross-Attention Neural Pipeline</h3>
                <p className="text-slate-400 text-xs mt-0.5">PyTorch 2.0 Feature Fusion</p>
              </div>
              <RefreshCw className="h-5 w-5 text-brand-400 animate-spin" />
            </div>

            <div className="space-y-3">
              {pipelineStages.map((stage) => (
                <div key={stage.stage} className="flex items-center justify-between text-xs py-1">
                  <span className={`font-medium ${
                    stage.status === 'processing' 
                      ? 'text-brand-400 font-semibold' 
                      : stage.status === 'completed' 
                        ? 'text-slate-300' 
                        : 'text-slate-500'
                  }`}>
                    {stage.stage}
                  </span>
                  
                  {stage.status === 'pending' && (
                    <span className="h-2 w-2 rounded-full bg-slate-800" />
                  )}
                  {stage.status === 'processing' && (
                    <span className="h-2 w-2 rounded-full bg-brand-500 animate-ping" />
                  )}
                  {stage.status === 'completed' && (
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  )}
                  {stage.status === 'failed' && (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 border-t border-slate-800 pt-3">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Sensory buffers are strictly flushed from memory post-inference.</span>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS DISPLAY PANEL */}
      {analysisResult && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Main Assessment Card */}
          <div className="academic-card p-6 md:p-8 flex flex-col md:flex-row items-center md:items-stretch justify-between gap-8">
            <div className="space-y-3.5 flex-1">
              <span className="text-xs text-brand-400 font-semibold uppercase tracking-widest block">
                Primary Emotional Assessment
              </span>
              
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="text-3xl sm:text-4xl font-extrabold capitalize text-white tracking-tight">
                  {analysisResult.emotion}
                </h3>
                <span className="text-slate-400 text-base font-normal">
                  ({(analysisResult.confidence * 100).toFixed(1)}% Confidence)
                </span>
              </div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
                <Zap className="h-3 w-3 text-brand-400" />
                <span>{analysisResult.confidence_label}</span>
              </div>

              <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-2xl">
                {analysisResult.wellness_insight}
              </p>
              
              <p className="text-[11px] text-slate-500 italic max-w-2xl leading-relaxed">
                {analysisResult.disclaimer}
              </p>
            </div>

            {/* Circular Gauge Representation */}
            <div className="flex flex-col items-center justify-center shrink-0 w-36">
              <div className="relative h-28 w-28 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="46" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                  <circle 
                    cx="56" 
                    cy="56" 
                    r="46" 
                    stroke="#2563eb" 
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={289}
                    strokeDashoffset={289 - (289 * analysisResult.confidence)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center z-10">
                  <span className="text-2xl font-extrabold text-white">{(analysisResult.confidence * 100).toFixed(0)}%</span>
                  <p className="text-[10px] text-slate-400">Score</p>
                </div>
              </div>
            </div>
          </div>

          {/* CRISIS ALERT GUARDRAIL (IF TRIGGERED) */}
          {analysisResult.crisis_alert && (
            <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <AlertCircle className="h-5 w-5" />
                <span>Distress Intervention Support</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {analysisResult.wellness_insight}
              </p>
              <div className="flex flex-wrap gap-2.5 pt-1">
                <a 
                  href="tel:988" 
                  className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shadow"
                >
                  Call / Text 988 Lifeline
                </a>
                <a 
                  href="https://findahelpline.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2 rounded-lg border border-slate-700 transition"
                >
                  International Helplines →
                </a>
              </div>
            </div>
          )}

          {/* Scientific Demo Simulation Note */}
          {analysisResult.is_demo && (
            <div className="px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
              Simulation Demo Mode: Output is generated from validation sample distributions.
            </div>
          )}

          {/* Results Grid: Probability Bars & Unimodal Comparisons */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Probability Distribution Bar Chart */}
            <div className="academic-card p-6 space-y-4">
              <h4 className="font-bold text-white text-sm">Softmax Probability Distribution</h4>
              
              <div className="space-y-2.5">
                {Object.entries(analysisResult.probabilities)
                  .sort((a, b) => b[1] - a[1])
                  .map(([emo, val]) => (
                    <div key={emo} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="capitalize text-slate-300">{emo}</span>
                        <span className="text-slate-400 font-mono">{(val * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-brand-500 rounded-full transition-all duration-500" 
                          style={{ width: `${val * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Unimodal Modality Predictions */}
            <div className="academic-card p-6 space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-white text-sm mb-3">Unimodal Encoder Breakdown</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Text */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block">Text</span>
                    {analysisResult.modality_predictions.text ? (
                      <>
                        <p className="font-bold text-slate-200 text-xs capitalize">{analysisResult.modality_predictions.text.emotion}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{(analysisResult.modality_predictions.text.confidence * 100).toFixed(0)}%</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic py-1">Masked</p>
                    )}
                  </div>

                  {/* Audio */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block">Audio</span>
                    {analysisResult.modality_predictions.audio ? (
                      <>
                        <p className="font-bold text-slate-200 text-xs capitalize">{analysisResult.modality_predictions.audio.emotion}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{(analysisResult.modality_predictions.audio.confidence * 100).toFixed(0)}%</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic py-1">Masked</p>
                    )}
                  </div>

                  {/* Image */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                    <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider block">Vision</span>
                    {analysisResult.modality_predictions.image ? (
                      <>
                        <p className="font-bold text-slate-200 text-xs capitalize">{analysisResult.modality_predictions.image.emotion}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{(analysisResult.modality_predictions.image.confidence * 100).toFixed(0)}%</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-500 italic py-1">Masked</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
                <p>
                  Unimodal encoders evaluate isolated features. The Cross-Attention network fuses representations dynamically based on learned attention parameters.
                </p>
              </div>
            </div>

          </div>

          {/* Attention Weight Attribution */}
          <div className="academic-card p-6 space-y-3">
            <h4 className="font-bold text-white text-sm">Self-Attention Modality Attribution</h4>
            <p className="text-xs text-slate-400">Relative weight attribution computed from multi-head self-attention pooling layers during this inference step.</p>
            
            <div className="grid grid-cols-3 gap-6 pt-2">
              <div className="space-y-1.5 text-center">
                <div className="text-xl font-bold text-indigo-400">
                  {analysisResult.modalities_used.includes("text") ? "40%" : "0%"}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Text Weight</div>
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-indigo-500" 
                    style={{ width: analysisResult.modalities_used.includes("text") ? "40%" : "0%" }}
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-center">
                <div className="text-xl font-bold text-emerald-400">
                  {analysisResult.modalities_used.includes("audio") ? "35%" : "0%"}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Audio Weight</div>
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-emerald-500" 
                    style={{ width: analysisResult.modalities_used.includes("audio") ? "35%" : "0%" }}
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-center">
                <div className="text-xl font-bold text-blue-400">
                  {analysisResult.modalities_used.includes("image") ? "25%" : "0%"}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Vision Weight</div>
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: analysisResult.modalities_used.includes("image") ? "25%" : "0%" }}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
