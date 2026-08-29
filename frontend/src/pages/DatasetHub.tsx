import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ExternalLink, 
  Play, 
  CheckCircle2, 
  FileText, 
  Mic, 
  Camera, 
  Layers,
  RefreshCw 
} from 'lucide-react';
import { apiService } from '../services/api';

interface DatasetHubProps {
  onLoadSample: (text: string, groundTruth: string) => void;
}

export const DatasetHub: React.FC<DatasetHubProps> = ({ onLoadSample }) => {
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'samples' | 'benchmarks'>('samples');

  useEffect(() => {
    const fetchSamples = async () => {
      setLoading(true);
      const res = await apiService.getDatasetSamples();
      if (res.success && res.data) {
        setSamples(res.data.samples);
      }
      setLoading(false);
    };
    fetchSamples();
  }, []);

  const benchmarkDatasets = [
    {
      name: "CREMA-D",
      fullName: "Crowd-Sourced Emotional Multimodal Actors Dataset",
      modalities: ["Audio (Speech)", "Video (Facial Expressions)"],
      size: "7,442 clips from 91 actors (48 male, 43 female)",
      emotions: "Happy, Sad, Angry, Fear, Disgust, Neutral",
      highlights: "Diverse ethnicities, crowd-annotated by 2,445 raters with 4 emotional intensity levels.",
      link: "https://github.com/CheyneyComputerScience/CREMA-D"
    },
    {
      name: "RAVDESS",
      fullName: "Ryerson Audio-Visual Database of Emotional Speech and Song",
      modalities: ["Audio (SER)", "Video (Facial Micro-Expressions)"],
      size: "7,356 validated multimodal files across 24 professional actors",
      emotions: "Calm, Happy, Sad, Angry, Fearful, Surprise, Disgust",
      highlights: "Gold-standard test benchmark recorded in North American accent with validated inter-rater reliability.",
      link: "https://zenodo.org/record/1188976"
    },
    {
      name: "FER-2013",
      fullName: "Facial Expression Recognition 2013 Corpus",
      modalities: ["Vision (Grayscale Facial Crops)"],
      size: "35,887 in-the-wild web crawled facial images (48x48)",
      emotions: "Angry, Disgust, Fear, Happy, Sad, Surprise, Neutral",
      highlights: "Standard benchmark for unconstrained facial emotion classification under varying lighting and pose conditions.",
      link: "https://www.kaggle.com/c/challenges-in-representation-learning-facial-expression-recognition-challenge"
    },
    {
      name: "GoEmotions",
      fullName: "Google Reddit Emotion Corpus",
      modalities: ["Text (Social Media Conversational Comments)"],
      size: "58,000 Reddit comments annotated by trained crowd workers",
      emotions: "27 fine-grained emotion labels mapped into primary categories",
      highlights: "Captures natural internet language, idioms, modern slang, and informal communication patterns.",
      link: "https://github.com/google-research/google-research/tree/master/goemotions"
    }
  ];

  return (
    <div className="space-y-8 py-2 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-2 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider">
          <Database className="h-3.5 w-3.5 text-brand-400" />
          <span>Multimodal Corpora & Benchmarks</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Validated Datasets & Live Samples
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
          Inspect standardized academic multimodal corpora and test authentic real-world dataset samples with 1-click in the live analyzer.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('samples')}
            className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === 'samples' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="h-3.5 w-3.5" /> Interactive Real Samples
          </button>
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === 'benchmarks' ? 'bg-brand-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="h-3.5 w-3.5" /> Benchmark Dataset Standards
          </button>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE SAMPLES */}
      {activeTab === 'samples' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-white">Live Benchmark Sample Ingestion</h3>
              <p className="text-xs text-slate-400">Click any validated dataset record below to preload its transcript into the Live Studio.</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="h-5 w-5 text-brand-400 animate-spin" />
              <span>Loading benchmark samples library...</span>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {samples.map((sample) => (
                <div key={sample.id} className="academic-card p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-400 px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                        {sample.dataset}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                        Ground Truth: {sample.ground_truth}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">{sample.title}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">Speaker: {sample.speaker}</p>
                    </div>

                    {/* Text preview */}
                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="h-3 w-3 text-indigo-400" /> Transcript
                      </span>
                      <p className="text-xs text-slate-200 italic">&ldquo;{sample.text}&rdquo;</p>
                    </div>

                    {/* Feature notes */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-0.5">
                        <span className="text-slate-400 font-semibold flex items-center gap-1 text-[10px]">
                          <Mic className="h-3 w-3 text-emerald-400" /> Audio MFCC
                        </span>
                        <p className="text-slate-300 text-[10px] font-mono">{sample.audio_label}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-0.5">
                        <span className="text-slate-400 font-semibold flex items-center gap-1 text-[10px]">
                          <Camera className="h-3 w-3 text-blue-400" /> Vision 48x48
                        </span>
                        <p className="text-slate-300 text-[10px] font-mono">{sample.vision_label}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onLoadSample(sample.text, sample.ground_truth)}
                    className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow transition mt-1"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Load Sample into Analyzer</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: BENCHMARK STANDARDS */}
      {activeTab === 'benchmarks' && (
        <div className="grid md:grid-cols-2 gap-6">
          {benchmarkDatasets.map((ds, idx) => (
            <div key={idx} className="academic-card p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">{ds.name}</h3>
                    <p className="text-xs text-slate-400">{ds.fullName}</p>
                  </div>
                  <a
                    href={ds.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-white p-1.5 bg-slate-900 rounded-lg border border-slate-800 transition"
                    title="External Dataset Source"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-500 font-medium">Modalities:</span>
                    {ds.modalities.map((m, mIdx) => (
                      <span key={mIdx} className="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-300 border border-slate-800">
                        {m}
                      </span>
                    ))}
                  </div>

                  <div className="text-slate-300">
                    <strong className="text-slate-500 font-medium">Corpus Scale: </strong> {ds.size}
                  </div>

                  <div className="text-slate-300">
                    <strong className="text-slate-500 font-medium">Target Labels: </strong> {ds.emotions}
                  </div>
                </div>

                <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  {ds.highlights}
                </p>
              </div>

              <div className="pt-2 text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Compatible with MindSense Encoders</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Split Integrity Guidelines */}
      <div className="academic-card p-6 space-y-2">
        <h4 className="font-bold text-white text-sm flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-400" />
          <span>Subject-Independent Partitioning Protocol</span>
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          To prevent data leakage during multimodal evaluation, partitions are enforced as strictly <strong>Speaker-Independent</strong> and <strong>Actor-Independent</strong>. If an actor is included in the training split, no vocal or visual frames from that individual are permitted in validation or test splits.
        </p>
      </div>

    </div>
  );
};
