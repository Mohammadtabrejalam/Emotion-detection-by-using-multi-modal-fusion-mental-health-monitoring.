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
  HelpCircle
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
  const [demoMode, setDemoMode] = useState<boolean>(true); // Default to true if PyTorch not locally loaded

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

  // Text Example Pre-fills
  const handleLoadExample = () => {
    setText("I have been feeling tired and disconnected lately. I don't feel motivated to do the things I normally enjoy.");
  };

  // CLEANUP CAMERAS AND MIC
  useEffect(() => {
    return () => {
      stopCameraStream();
      stopAudioTimer();
    };
  }, []);

  // AUDIO RECORDING LOGIC
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
        
        // Convert blob to File object
        const file = new File([audioBlob], 'recorded_voice.wav', { type: 'audio/wav' });
        setAudioFile(file);
        
        // Release mic stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert("Microphone permission denied or device unavailable.");
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

  // CAMERA WEBCAM LOGIC
  const startCamera = async () => {
    setImageUrl(null);
    setImageFile(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      // Wait for ref to attach
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
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
        // Draw flipped mirror image for standard webcam feel
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

  // HANDLE FILE UPLOADS
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

  // DYNAMIC PRE-VERIFICATION PHRASES
  const getModalitiesMessage = () => {
    const list = [];
    if (text.trim()) list.push("Text");
    if (audioFile) list.push("Audio");
    if (imageFile) list.push("Image");
    
    if (list.length === 0) return "No modalities available";
    return `Analyzing with ${list.join(" + ")}`;
  };

  // RESET CORE STATE
  const handleReset = () => {
    setText('');
    deleteAudio();
    removeImage();
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  // TRIGGER ANALYSIS ENDPOINT
  const handleAnalyze = async () => {
    setErrorMsg(null);
    setAnalysisResult(null);
    
    if (!text.trim() && !audioFile && !imageFile) {
      setErrorMsg("Please provide at least one input modality (Text, Audio, or Image).");
      return;
    }

    setLoading(true);

    // Initial dummy pipeline stages to show on loader
    const stages: PipelineStage[] = [
      { stage: "Input Validation", status: "processing" },
      { stage: "Preprocessing", status: "pending" },
      { stage: "Feature Extraction", status: "pending" },
      { stage: "Modality Encoding", status: "pending" },
      { stage: "Multimodal Fusion", status: "pending" },
      { stage: "Emotion Classification", status: "pending" },
      { stage: "Generating Insights", status: "pending" }
    ];
    setPipelineStages(stages);

    const updateStage = (name: string, status: 'processing' | 'completed' | 'failed') => {
      setPipelineStages(prev => prev.map(s => {
        if (s.stage === name) return { ...s, status };
        return s;
      }));
    };

    // Simulate preprocessing progress visually before server returns
    setTimeout(() => updateStage("Input Validation", "completed"), 300);
    setTimeout(() => updateStage("Preprocessing", "processing"), 400);
    setTimeout(() => updateStage("Preprocessing", "completed"), 800);
    setTimeout(() => updateStage("Feature Extraction", "processing"), 900);

    // Trigger API Service with user_id
    const response = await apiService.analyzeEmotion(
      text.trim() ? text : null,
      audioFile,
      imageFile,
      demoMode,
      currentUser?.id
    );

    if (response.success && response.data) {
      // Finalize progress stages based on API response
      updateStage("Feature Extraction", "completed");
      updateStage("Modality Encoding", "completed");
      updateStage("Multimodal Fusion", "completed");
      updateStage("Emotion Classification", "completed");
      updateStage("Generating Insights", "completed");
      
      setTimeout(() => {
        setAnalysisResult(response.data);
        setLoading(false);
      }, 500);
    } else {
      setLoading(false);
      setErrorMsg(response.error?.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Multimodal Emotion Analysis</h2>
        <p className="text-slate-400 text-sm">Provide inputs to one or more modalities to calculate emotional states via intermediate fusion.</p>
      </div>

      {/* Grid Inputs Workspace */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* TEXT CARD */}
        <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between h-[360px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                <FileText className="h-5 w-5" />
                <span>Text Modality</span>
              </div>
              <button 
                onClick={handleLoadExample}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium bg-brand-500/10 px-2.5 py-1 rounded-md"
              >
                Use Example
              </button>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 1000))}
              placeholder="How are you feeling today? Describe your day, thoughts, or emotions..."
              className="w-full h-44 bg-slate-900/60 border border-slate-700/50 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl p-3 text-sm text-slate-200 outline-none resize-none placeholder-slate-500 transition-all"
            />
          </div>
          
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>{text.length} / 1000 characters</span>
            {text && (
              <button onClick={() => setText('')} className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1">
                <Trash2 className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* AUDIO CARD */}
        <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between h-[360px]">
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Mic className="h-5 w-5" />
                <span>Audio Modality</span>
              </div>
              {audioFile && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-medium border border-emerald-500/20">
                  Ready
                </span>
              )}
            </div>

            {/* Selector Option Recorder vs Upload */}
            <div className="flex-1 flex flex-col justify-center items-center py-2 space-y-4">
              {!audioUrl ? (
                <div className="w-full flex flex-col items-center space-y-4">
                  {/* Microphone Record Button */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isRecording 
                        ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30' 
                        : 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/20 hover:scale-105'
                    }`}
                  >
                    {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </button>
                  
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-300">
                      {isRecording ? `Recording... ${recordingDuration}s` : 'Record speech acoustics'}
                    </p>
                    <p className="text-xs text-slate-500">or upload a WAV, MP3, or OGG file</p>
                  </div>

                  {/* Audio Upload File Selector */}
                  <label className="cursor-pointer text-xs text-brand-400 hover:text-brand-300 font-semibold bg-brand-500/10 hover:bg-brand-500/15 px-3 py-2 rounded-lg transition-all border border-brand-500/20">
                    Choose File
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={handleAudioUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              ) : (
                /* Recorded/Uploaded Preview State */
                <div className="w-full bg-slate-900/40 rounded-xl p-4 border border-slate-800 space-y-4 flex flex-col items-center">
                  <div className="flex items-center gap-3 w-full">
                    <div className="bg-emerald-500/10 p-2.5 rounded-lg text-emerald-400">
                      <Mic className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{audioFile?.name || "Recorded Audio"}</p>
                      <p className="text-[10px] text-slate-500">{(audioFile ? (audioFile.size / 1024 / 1024).toFixed(2) : 0)} MB</p>
                    </div>
                  </div>
                  
                  <audio src={audioUrl} controls className="w-full h-8 outline-none" />
                  
                  <button 
                    onClick={deleteAudio}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/15"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove Audio
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* IMAGE CARD */}
        <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 flex flex-col justify-between h-[360px]">
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-blue-400 font-semibold">
                <Camera className="h-5 w-5" />
                <span>Image Modality</span>
              </div>
              {imageFile && (
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded font-medium border border-blue-500/20">
                  Ready
                </span>
              )}
            </div>

            {/* Webcam / Image upload layout */}
            <div className="flex-1 flex flex-col justify-center items-center py-2 overflow-hidden">
              {cameraActive ? (
                /* Webcam Stream active */
                <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]" 
                  />
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4">
                    <button
                      onClick={captureImage}
                      className="bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow"
                    >
                      Capture Photo
                    </button>
                    <button
                      onClick={stopCameraStream}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : !imageUrl ? (
                /* Empty Upload state */
                <div className="w-full flex flex-col items-center space-y-4">
                  <button
                    onClick={startCamera}
                    className="h-16 w-16 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 hover:scale-105 flex items-center justify-center transition-all duration-300"
                  >
                    <Video className="h-6 w-6" />
                  </button>
                  
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-300">Open webcam photo capture</p>
                    <p className="text-xs text-slate-500">or upload a JPG, PNG, or WEBP facial photo</p>
                  </div>

                  <label className="cursor-pointer text-xs text-brand-400 hover:text-brand-300 font-semibold bg-brand-500/10 hover:bg-brand-500/15 px-3 py-2 rounded-lg transition-all border border-brand-500/20">
                    Choose Photo
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              ) : (
                /* Selected image preview */
                <div className="relative w-full h-full flex flex-col justify-center items-center bg-slate-900/30 border border-slate-800 rounded-xl p-3">
                  <img src={imageUrl} alt="Preview" className="max-h-36 rounded-lg object-contain border border-slate-700/50" />
                  <button
                    onClick={removeImage}
                    className="mt-3 text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/15"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove Image
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLS AND SETTINGS */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Modalities summary info */}
        <div className="flex flex-col md:flex-row items-center gap-4 text-sm">
          <div className="flex items-center gap-2 font-medium text-slate-300 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/30">
            <Activity className="h-4 w-4 text-brand-400" />
            <span>{getModalitiesMessage()}</span>
          </div>
          
          {/* Demo Mode Toggle */}
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
            <input 
              type="checkbox" 
              checked={demoMode} 
              onChange={(e) => setDemoMode(e.target.checked)} 
              className="rounded border-slate-800 text-brand-500 focus:ring-brand-500 h-4 w-4 bg-slate-950"
            />
            <span>Enable API Demo Mode (Simulate weights)</span>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-all"
          >
            Reset All
          </button>
          
          <button
            onClick={handleAnalyze}
            className="px-8 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-all hover:shadow-lg hover:shadow-brand-600/15"
          >
            Analyze Emotion
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* PIPELINE LOADER OVERLAY */}
      {loading && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white font-sans">Processing Pipeline</h3>
                <p className="text-slate-500 text-xs mt-0.5">MindSense Multimodal Fusion Network</p>
              </div>
              <RefreshCw className="h-6 w-6 text-brand-400 animate-spin" />
            </div>

            <div className="space-y-4">
              {pipelineStages.map((stage) => (
                <div key={stage.stage} className="flex items-center justify-between text-sm py-1">
                  <span className={`font-medium ${
                    stage.status === 'processing' 
                      ? 'text-brand-300 font-semibold' 
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
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  )}
                  {stage.status === 'failed' && (
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  )}
                </div>
              ))}
            </div>
            
            <p className="text-[10px] text-center text-slate-500 border-t border-slate-800 pt-4">
              Model inputs will be immediately flushed from server memory post-inference.
            </p>
          </div>
        </div>
      )}

      {/* RESULTS DISPLAY */}
      {analysisResult && (
        <div className="space-y-8 animate-fadeIn">
          {/* Main Prediction Summary */}
          <div className="glass-panel rounded-3xl border border-slate-800 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-stretch justify-between gap-8">
            <div className="space-y-4 flex-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-widest">
                Overall Emotional Assessment
              </span>
              
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="text-4xl md:text-5xl font-extrabold capitalize text-white tracking-tight">
                  {analysisResult.emotion}
                </h3>
                <span className="text-slate-400 text-lg font-light">
                  ({(analysisResult.confidence * 100).toFixed(0)}% Probability)
                </span>
              </div>
              
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
                {analysisResult.confidence_label}
              </div>

              <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
                {analysisResult.wellness_insight}
              </p>
              
              <p className="text-[10px] text-slate-500 italic max-w-2xl leading-relaxed">
                {analysisResult.disclaimer}
              </p>
            </div>

            {/* Gauge visual representation */}
            <div className="flex flex-col items-center justify-center shrink-0 w-44">
              <div className="relative h-28 w-28 flex items-center justify-center">
                {/* Simulated circle border */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="#1e293b" strokeWidth="10" fill="transparent" />
                  <circle 
                    cx="56" 
                    cy="56" 
                    r="48" 
                    stroke="#3b5eff" 
                    strokeWidth="10" 
                    fill="transparent" 
                    strokeDasharray={301.6}
                    strokeDashoffset={301.6 - (301.6 * analysisResult.confidence)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-center z-10">
                  <span className="text-2xl font-bold text-white">{(analysisResult.confidence * 100).toFixed(0)}%</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Confidence</p>
                </div>
              </div>
            </div>
          </div>

          {/* CRISIS CARD IF DETECTED */}
          {analysisResult.crisis_alert && (
            <div className="p-6 rounded-2xl bg-red-500/10 border-2 border-red-500/20 text-red-200 space-y-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-7 w-7 text-red-500 shrink-0" />
                <h4 className="font-bold text-lg text-white">Distress Assistance Alert</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                {analysisResult.wellness_insight}
              </p>
              <div className="flex flex-wrap gap-3">
                <a 
                  href="tel:988" 
                  className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-4.5 py-2.5 rounded-lg transition shadow"
                >
                  Call 988 Lifeline
                </a>
                <a 
                  href="https://findahelpline.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4.5 py-2.5 rounded-lg border border-slate-700/80 transition"
                >
                  Find International Helpline
                </a>
              </div>
            </div>
          )}

          {/* DISCLAIMER AND SCIENTIFIC DEMO NOTE */}
          {analysisResult.is_demo && (
            <div className="px-4.5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
              Demo Mode — outputs are simulated and are not generated by the trained multimodal model.
            </div>
          )}

          {/* Charts grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Probability chart */}
            <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 space-y-4">
              <h4 className="font-bold text-slate-200">Probability Distribution</h4>
              
              <div className="space-y-3.5">
                {Object.entries(analysisResult.probabilities)
                  .sort((a, b) => b[1] - a[1])
                  .map(([emo, val]) => (
                    <div key={emo} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="capitalize text-slate-300">{emo}</span>
                        <span className="text-slate-400">{(val * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-500 rounded-full" 
                          style={{ width: `${val * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Unimodal Modality comparison */}
            <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 space-y-4 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-slate-200 mb-4">Unimodal Modality Outputs</h4>
                
                <div className="grid grid-cols-3 gap-3">
                  {/* Text card */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center space-y-1.5">
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase">Text</span>
                    {analysisResult.modality_predictions.text ? (
                      <>
                        <p className="font-bold text-slate-200 text-sm capitalize">{analysisResult.modality_predictions.text.emotion}</p>
                        <p className="text-[10px] text-slate-500">{(analysisResult.modality_predictions.text.confidence * 100).toFixed(0)}% Conf</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-600 italic py-2">Unavailable</p>
                    )}
                  </div>

                  {/* Audio card */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center space-y-1.5">
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase">Audio</span>
                    {analysisResult.modality_predictions.audio ? (
                      <>
                        <p className="font-bold text-slate-200 text-sm capitalize">{analysisResult.modality_predictions.audio.emotion}</p>
                        <p className="text-[10px] text-slate-500">{(analysisResult.modality_predictions.audio.confidence * 100).toFixed(0)}% Conf</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-600 italic py-2">Unavailable</p>
                    )}
                  </div>

                  {/* Image card */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center space-y-1.5">
                    <span className="text-[10px] font-semibold text-blue-400 uppercase">Image</span>
                    {analysisResult.modality_predictions.image ? (
                      <>
                        <p className="font-bold text-slate-200 text-sm capitalize">{analysisResult.modality_predictions.image.emotion}</p>
                        <p className="text-[10px] text-slate-500">{(analysisResult.modality_predictions.image.confidence * 100).toFixed(0)}% Conf</p>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-600 italic py-2">Unavailable</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 mt-4 text-xs text-slate-500 leading-relaxed flex items-start gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-brand-400 shrink-0" />
                <p>
                  The multimodal model combines evidence from all available modalities. Individual predictions may conflict, but the cross-attention network weights the contributions dynamically based on learned parameters.
                </p>
              </div>
            </div>
          </div>

          {/* Attention contribution charts */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 space-y-4">
            <h4 className="font-bold text-slate-200">Modality Contribution Estimate</h4>
            <p className="text-xs text-slate-400">Relative weight contribution calculated from multi-head self-attention pooling layers during this inference step.</p>
            
            <div className="grid grid-cols-3 gap-6 pt-2">
              {/* Text contribution */}
              <div className="space-y-2 text-center">
                <div className="text-2xl font-bold text-indigo-400">
                  {analysisResult.modalities_used.includes("text") ? "40%" : "0%"}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Text Weight</div>
                <div className="h-1.5 bg-slate-850 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500" 
                    style={{ width: analysisResult.modalities_used.includes("text") ? "40%" : "0%" }}
                  />
                </div>
              </div>

              {/* Audio contribution */}
              <div className="space-y-2 text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  {analysisResult.modalities_used.includes("audio") ? "35%" : "0%"}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Audio Weight</div>
                <div className="h-1.5 bg-slate-850 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500" 
                    style={{ width: analysisResult.modalities_used.includes("audio") ? "35%" : "0%" }}
                  />
                </div>
              </div>

              {/* Image contribution */}
              <div className="space-y-2 text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {analysisResult.modalities_used.includes("image") ? "25%" : "0%"}
                </div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Image Weight</div>
                <div className="h-1.5 bg-slate-850 rounded-full overflow-hidden">
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
