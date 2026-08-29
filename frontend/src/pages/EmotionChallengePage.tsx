import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowRight, 
  AlertTriangle,
  Award
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { apiService } from '../services/api';
import type { User } from '../types';

interface Question {
  id: number;
  scenario: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const CHALLENGE_QUESTIONS: Question[] = [
  {
    id: 1,
    scenario: "Upon hearing sudden, unexpected footsteps outside late at night, a participant displays widened eyes, elevated eyebrows, and a tense voice cadence.",
    options: ["Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Neutral"],
    correctAnswer: "Fear",
    explanation: "Ocular widening and vocal acoustic tension are classic sympathetic autonomic indicators associated with fear and threat appraisal."
  },
  {
    id: 2,
    scenario: "After completing a complex 6-month research milestone, a scientist smiles broadly with cheek elevation (Duchenne smile) and steady, energetic speech prosody.",
    options: ["Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Neutral"],
    correctAnswer: "Happy",
    explanation: "Zygomaticus major activation combined with elevated pitch stability indicates genuine positive affect and joy."
  },
  {
    id: 3,
    scenario: "When encountering a sharp, foul odor in a room, an individual wrinkles their nose, lowers their brow, and turns their head away immediately.",
    options: ["Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Neutral"],
    correctAnswer: "Disgust",
    explanation: "Nasal wrinkling and upper lip elevation (levator labii superioris) are primary facial cues for disgust."
  },
  {
    id: 4,
    scenario: "Upon receiving an unexpected award notification in an email inbox, a researcher's mouth opens slightly and eyebrows elevate without tension.",
    options: ["Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Neutral"],
    correctAnswer: "Surprise",
    explanation: "Brief jaw relaxation and brow elevation represent the immediate orienting reflex of surprise prior to cognitive appraisal."
  },
  {
    id: 5,
    scenario: "During a quiet technical reading session, an engineer reads documentation with relaxed facial musculature and steady vocal pitch.",
    options: ["Happy", "Sad", "Angry", "Fear", "Surprise", "Disgust", "Neutral"],
    correctAnswer: "Neutral",
    explanation: "Absence of strong autonomic arousal or facial muscle contraction indicates a baseline neutral affective state."
  }
];

interface EmotionChallengePageProps {
  currentUser?: User | null;
  onBack: () => void;
}

export const EmotionChallengePage: React.FC<EmotionChallengePageProps> = ({
  onBack
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);

  const currentQ = CHALLENGE_QUESTIONS[currentIndex];

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);

    if (option === currentQ.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < CHALLENGE_QUESTIONS.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishChallenge();
    }
  };

  const finishChallenge = async () => {
    setCompleted(true);
    const finalScore = score + (selectedOption === currentQ.correctAnswer ? 1 : 0);
    const total = CHALLENGE_QUESTIONS.length;
    const accuracy = Math.round((finalScore / total) * 100);

    try {
      await apiService.submitChallenge(finalScore, total, accuracy);
    } catch {}
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setCompleted(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto font-sans">
      
      <PageHeader
        title="Emotion Recognition Challenge"
        description="An interactive educational reflection feature testing your perception of facial micro-expressions, vocal acoustics, and situational context."
        onBack={onBack}
        backLabel="Back to Home"
        breadcrumbs={[
          { label: 'Home', onClick: onBack },
          { label: 'Challenge' }
        ]}
      />

      {/* Non-Clinical Disclaimer Banner */}
      <div className="academic-card p-4 border-l-4 border-indigo-500 bg-indigo-950/20 text-xs text-indigo-200 flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-indigo-400 shrink-0" />
        <span>
          <strong>Educational Reflection Notice:</strong> Challenge scores are educational perception exercises and do not constitute clinical psychological evaluation or medical diagnosis.
        </span>
      </div>

      {!completed ? (
        <div className="academic-card p-6 md:p-8 space-y-6">
          
          {/* Progress Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 text-xs font-mono">
            <span className="text-slate-400">
              Question <strong>{currentIndex + 1}</strong> of <strong>{CHALLENGE_QUESTIONS.length}</strong>
            </span>
            <span className="text-brand-400 font-bold">
              Current Score: {score}/{currentIndex}
            </span>
          </div>

          {/* Scenario Text */}
          <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-400 block">Situational Scenario</span>
            <p className="text-base font-semibold text-white leading-relaxed bg-slate-900/80 p-5 rounded-xl border border-slate-800">
              "{currentQ.scenario}"
            </p>
          </div>

          {/* Options Grid */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase font-bold text-slate-400 block">Select Primary Expressed Affect</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {currentQ.options.map((opt) => {
                let btnStyle = "bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:border-slate-700";
                
                if (isAnswered) {
                  if (opt === currentQ.correctAnswer) {
                    btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                  } else if (opt === selectedOption) {
                    btnStyle = "bg-rose-500/20 border-rose-500 text-rose-300";
                  } else {
                    btnStyle = "bg-slate-950 border-slate-900 text-slate-600 opacity-50";
                  }
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectOption(opt)}
                    disabled={isAnswered}
                    className={`p-3 rounded-xl border text-xs font-semibold transition text-center ${btnStyle}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation box after selection */}
          {isAnswered && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 animate-fadeIn text-xs">
              <div className="flex items-center gap-2 font-bold">
                {selectedOption === currentQ.correctAnswer ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Correct Choice
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> Incorrect (Target: {currentQ.correctAnswer})
                  </span>
                )}
              </div>
              <p className="text-slate-300 font-sans leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextQuestion}
                className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-2"
              >
                <span>{currentIndex + 1 < CHALLENGE_QUESTIONS.length ? 'Next Question' : 'View Final Score'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

        </div>
      ) : (
        /* FINAL SCORE SUMMARY CARD */
        <div className="academic-card p-8 text-center space-y-6 animate-fadeIn">
          <div className="inline-flex p-4 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400">
            <Award className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Challenge Completed</h2>
            <p className="text-xs text-slate-300">Your affective perception accuracy results have been calculated.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto font-mono text-xs">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Score</span>
              <span className="text-2xl font-bold text-white">{score}/{CHALLENGE_QUESTIONS.length}</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Accuracy</span>
              <span className="text-2xl font-bold text-emerald-400">{Math.round((score / CHALLENGE_QUESTIONS.length) * 100)}%</span>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={handleRestart}
              className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retry Challenge</span>
            </button>
            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs"
            >
              Return Home
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
