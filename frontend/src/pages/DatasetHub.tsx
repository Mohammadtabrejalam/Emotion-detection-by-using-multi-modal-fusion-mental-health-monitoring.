import { useState, useEffect } from 'react';
import { 
  Database, 
  ExternalLink, 
  Play, 
  CheckCircle2, 
  FileText, 
  Mic, 
  Camera, 
  Layers 
} from 'lucide-react';
import { apiService } from '../services/api';

interface DatasetHubProps {
  onLoadSample: (text: string, groundTruth: string) => void;
}

export const DatasetHub: React.FC<DatasetHubProps> = ({ onLoadSample }) => {
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'benchmarks' | 'samples'>('samples');

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
      highlights: "Diverse ethnicities, crowd-annotated by 2,445 raters with 4 intensity levels.",
      link: "https://github.com/CheyneyComputerScience/CREMA-D"
    },
    {
      name: "RAVDESS",
      fullName: "Ryerson Audio-Visual Database of Emotional Speech and Song",
      modalities: ["Audio", "Video", "Speech & Song"],
      size: "7,356 validated multimodal files across 24 professional actors",
      emotions: "Calm, Happy, Sad, Angry, Fearful, Surprise, Disgust",
      highlights: "Gold-standard test benchmark recorded in North American accent with validated inter-rater reliability.",
      link: "https://zenodo.org/record/1188976"
    },
    {
      name: "FER-2013",
      fullName: "Facial Expression Recognition 2013 Dataset",
      modalities: ["Vision (Grayscale Faces)"],
      size: "35,887 in-the-wild web crawled facial images (48x48)",
      emotions: "Angry, Disgust, Fear, Happy, Sad, Surprise, Neutral",
      highlights: "Standard benchmark for unconstrained facial emotion classification under varying lighting and pose conditions.",
      link: "https://www.kaggle.com/c/challenges-in-representation-learning-facial-expression-recognition-challenge"
    },
    {
      name: "GoEmotions",
      fullName: "Google Reddit Emotion Corpus",
      modalities: ["Text (Social Media Comments)"],
      size: "58,000 Reddit comments annotated by trained crowd workers",
      emotions: "27 fine-grained emotion labels mapped into 7 primary categories",
      highlights: "Captures natural internet language, idioms, slang, and modern informal communication.",
      link: "https://github.com/google-research/google-research/tree/master/goemotions"
    }
  ];

  return (
    <div className="space-y-12 py-4 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold uppercase tracking-wider">
          <Database className="h-3.5 w-3.5 text-brand-400" /> Real-World Academic Benchmarks
        </div>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
          Real-Life Datasets & Live Samples
        </h2>
        <p className="text-slate-400 text-sm">
          Explore validated multimodal emotion corpora and test authentic real-world dataset samples with 1-click in the live analyzer.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('samples')}
            className={`px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'samples' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="h-3.5 w-3.5" /> Interactive Real-World Samples
          </button>
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === 'benchmarks' ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="h-3.5 w-3.5" /> Benchmark Dataset Standards
          </button>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE REAL-WORLD SAMPLES */}
      {activeTab === 'samples' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Live Benchmark Sample Loader</h3>
              <p className="text-xs text-slate-400">Click any real dataset clip below to load its prompt into the live analyzer.</p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading dataset sample library...</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {samples.map((sample) => (
                <div key={sample.id} className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between hover:border-slate-700 transition">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-400 px-2.5 py-1 rounded-lg bg-brand-500/10 border border-brand-500/20">
                        {sample.dataset}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Ground Truth: {sample.ground_truth}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white">{sample.title}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">Source: {sample.speaker}</p>
                    </div>

                    {/* Text preview */}
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-850 space-y-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Spoken / Written Transcript
                      </span>
                      <p className="text-xs text-slate-200 italic">&ldquo;{sample.text}&rdquo;</p>
                    </div>

                    {/* Modality feature notes */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-0.5">
                        <span className="text-slate-400 font-semibold flex items-center gap-1 text-[10px]">
                          <Mic className="h-3 w-3 text-emerald-400" /> Audio MFCC
                        </span>
                        <p className="text-slate-300 text-[10px]">{sample.audio_label}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-0.5">
                        <span className="text-slate-400 font-semibold flex items-center gap-1 text-[10px]">
                          <Camera className="h-3 w-3 text-blue-400" /> Vision 48x48
                        </span>
                        <p className="text-slate-300 text-[10px]">{sample.vision_label}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onLoadSample(sample.text, sample.ground_truth)}
                    className="w-full py-2.5 rounded-xl bg-brand-600/90 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <Play className="h-3.5 w-3.5" /> Test Sample in Live Analyzer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: BENCHMARK DATASET STANDARDS */}
      {activeTab === 'benchmarks' && (
        <div className="grid md:grid-cols-2 gap-6">
          {benchmarkDatasets.map((ds, idx) => (
            <div key={idx} className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-white">{ds.name}</h3>
                    <p className="text-xs text-slate-400">{ds.fullName}</p>
                  </div>
                  <a
                    href={ds.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-brand-400 p-1.5 bg-slate-900 rounded-lg border border-slate-800 transition"
                    title="External Dataset Source"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-500">Modalities:</span>
                    {ds.modalities.map((m, mIdx) => (
                      <span key={mIdx} className="bg-slate-900 px-2 py-0.5 rounded text-[10px] text-slate-300 border border-slate-800">
                        {m}
                      </span>
                    ))}
                  </div>

                  <div className="text-slate-300">
                    <strong className="text-slate-500">Corpus Scale: </strong> {ds.size}
                  </div>

                  <div className="text-slate-300">
                    <strong className="text-slate-500">Target Labels: </strong> {ds.emotions}
                  </div>
                </div>

                <p className="text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-850 leading-relaxed">
                  {ds.highlights}
                </p>
              </div>

              <div className="pt-2 text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="h-3 w-3" /> Compatible with MindSense Unimodal Encoders
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dataset Leakage Prevention Guidelines */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4">
        <h4 className="font-bold text-white text-base flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-400" />
          Academic Subject-Independent Split Integrity
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          To prevent data leakage during multimodal training, splits must strictly be <strong>Speaker-Independent</strong> and <strong>Actor-Independent</strong>. If Actor #03 is in the training split, zero audio or visual frames of Actor #03 may exist in the validation or test splits.
        </p>
      </div>

    </div>
  );
};
