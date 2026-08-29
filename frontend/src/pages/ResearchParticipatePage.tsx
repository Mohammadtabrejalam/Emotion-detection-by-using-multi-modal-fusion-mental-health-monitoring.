import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Send
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { apiService } from '../services/api';
import type { User } from '../types';

interface ResearchParticipatePageProps {
  currentUser: User | null;
  onBack: () => void;
  onNavigateLogin: () => void;
}

export const ResearchParticipatePage: React.FC<ResearchParticipatePageProps> = ({
  currentUser,
  onBack,
  onNavigateLogin
}) => {
  const [step, setStep] = useState<number>(1);
  const [studies, setStudies] = useState<any[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState<number>(1);
  
  // Step 2 & 3: Eligibility & Consent
  const [ageConfirmed, setAgeConfirmed] = useState<boolean>(false);
  const [voluntaryConfirmed, setVoluntaryConfirmed] = useState<boolean>(false);
  const [consentSigned, setConsentSigned] = useState<boolean>(false);
  
  // Step 4: Demographics
  const [ageGroup, setAgeGroup] = useState<string>('25-34');
  const [genderIdentity, setGenderIdentity] = useState<string>('Prefer not to say');

  // Step 6 & 7: Questionnaire & Contribution
  const [textSample, setTextSample] = useState<string>('');
  const [situationalContext, setSituationalContext] = useState<string>('Academic Study');
  const [baselineMood, setBaselineMood] = useState<number>(3);
  
  // Submission & Result States
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [participantResult, setParticipantResult] = useState<{ participant_code: string; contribution_id: number } | null>(null);

  useEffect(() => {
    const fetchStudies = async () => {
      const res = await apiService.getResearchStudies();
      if (res.success && res.data?.studies) {
        setStudies(res.data.studies);
        if (res.data.studies.length > 0) {
          setSelectedStudyId(res.data.studies[0].id);
        }
      }
    };
    fetchStudies();
  }, []);

  const handleNextStep = () => {
    if (step === 2 && (!ageConfirmed || !voluntaryConfirmed)) {
      setErrorMsg("Please confirm eligibility requirements before proceeding.");
      return;
    }
    if (step === 3 && !consentSigned) {
      setErrorMsg("You must read and agree to the Informed Consent Form to participate.");
      return;
    }
    setErrorMsg(null);
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmitParticipation = async () => {
    if (!currentUser) {
      setErrorMsg("Authentication required. Please sign in to submit research contributions.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // 1. Submit Signed Consent
      await apiService.submitResearchConsent(selectedStudyId, "1.0");

      // 2. Submit Participation Data
      const res = await apiService.submitResearchParticipation({
        study_id: selectedStudyId,
        age_group: ageGroup,
        gender_identity: genderIdentity,
        questionnaire_answers: {
          situational_context: situationalContext,
          baseline_mood_score: baselineMood,
          text_length: textSample.length
        },
        contributed_modalities: textSample ? "text" : "none"
      });

      if (res.success && res.data) {
        setParticipantResult(res.data);
        setStep(5); // Completion step
      } else {
        setErrorMsg(res.error?.message || "Failed to submit research contribution.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error submitting research data.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      
      <PageHeader
        title="Scientific Research Participation"
        description="Contribute to empirical research into multimodal affective signal processing. Your data is protected under strict academic consent protocol."
        onBack={onBack}
        backLabel="Back to Home"
        breadcrumbs={[
          { label: 'Home', onClick: onBack },
          { label: 'Research' },
          { label: 'Participate' }
        ]}
      />

      {!currentUser && (
        <div className="academic-card p-6 border-l-4 border-amber-500 bg-amber-950/20 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <strong className="text-white block font-sans">Research Account Required</strong>
              <span>Sign in or register a free local research account to participate in scientific studies.</span>
            </div>
          </div>
          <button
            onClick={onNavigateLogin}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shrink-0"
          >
            Sign In to Participate
          </button>
        </div>
      )}

      {/* STEP INDICATOR */}
      <div className="academic-card p-4 flex items-center justify-between text-xs font-mono text-slate-400 overflow-x-auto">
        {[
          { num: 1, label: "Study Info" },
          { num: 2, label: "Eligibility" },
          { num: 3, label: "Consent" },
          { num: 4, label: "Contribution" },
          { num: 5, label: "Confirmation" }
        ].map((s) => (
          <div key={s.num} className={`flex items-center gap-2 px-3 py-1 rounded-lg ${step === s.num ? 'bg-brand-500/20 text-brand-300 font-bold border border-brand-500/30' : step > s.num ? 'text-emerald-400' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s.num ? 'bg-brand-500 text-white' : step > s.num ? 'bg-emerald-500 text-white' : 'bg-slate-800'}`}>
              {step > s.num ? '✓' : s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: STUDY INFORMATION */}
      {step === 1 && (
        <div className="academic-card p-6 md:p-8 space-y-6">
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <span className="text-[11px] font-mono uppercase font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
              Active Institutional Protocol
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {studies.length > 0 ? studies[0].title : "Multimodal Affective Baseline Study 2026"}
            </h2>
            <p className="text-xs text-slate-300">
              Principal Investigator: <strong>Dr. Elena Vance</strong> • MindSense Affective Computing Research Group
            </p>
          </div>

          <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
            <h3 className="font-bold text-white text-sm">Study Objective</h3>
            <p>
              This study evaluates how intermediate cross-attention neural networks align textual lexical features, vocal acoustics, and facial micro-expressions to infer affective states across diverse environmental conditions.
            </p>

            <h3 className="font-bold text-white text-sm">What Your Participation Involves</h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 font-sans">
              <li>Completing a brief 2-minute demographic and baseline affect questionnaire.</li>
              <li>Optionally providing short text reflections or vocal/visual sample contributions.</li>
              <li>Viewing your experimental affective alignment results in real time.</li>
            </ul>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Strict Academic Confidentiality</span>
              </h4>
              <p className="text-slate-400 text-[11px]">
                Your contributions are assigned an anonymized participant code (e.g. PAR-49201). Personal account identifiers are never attached to research datasets. You retain the right to withdraw and purge your contributions at any time.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2"
            >
              <span>Check Eligibility</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ELIGIBILITY CHECK */}
      {step === 2 && (
        <div className="academic-card p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Participant Eligibility Criteria</h2>
            <p className="text-xs text-slate-400 mt-1">Please confirm the following requirements before participating in this research study.</p>
          </div>

          <div className="space-y-4 text-xs">
            <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-brand-500 focus:ring-brand-500"
              />
              <div>
                <span className="font-bold text-white block">Age Requirement</span>
                <span className="text-slate-400">I confirm that I am 18 years of age or older.</span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={voluntaryConfirmed}
                onChange={(e) => setVoluntaryConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-brand-500 focus:ring-brand-500"
              />
              <div>
                <span className="font-bold text-white block">Voluntary Participation</span>
                <span className="text-slate-400">I acknowledge that participation is voluntary and I may stop or withdraw my data at any time without penalty.</span>
              </div>
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button onClick={handlePrevStep} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold text-xs flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2"
            >
              <span>Read Informed Consent</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: INFORMED CONSENT FORM */}
      {step === 3 && (
        <div className="academic-card p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Institutional Informed Consent Form</h2>
            <p className="text-xs text-slate-400 mt-1">Document Version 1.0 • MindSense Protocol #2026-MCAL</p>
          </div>

          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 max-h-72 overflow-y-auto space-y-4 text-xs text-slate-300 font-sans leading-relaxed">
            <h4 className="font-bold text-white">1. Purpose & Scope</h4>
            <p>MindSense is designed to evaluate intermediate multimodal fusion neural architectures. Data collected during research participation will be analyzed solely for scientific research and algorithm validation.</p>

            <h4 className="font-bold text-white">2. Voluntary Sample Contributions</h4>
            <p>You may choose which modalities (text, vocal audio, or facial visual images) to contribute. All contributions are voluntary. Raw audio and image files are processed into anonymized feature representations.</p>

            <h4 className="font-bold text-white">3. Data Retention & Deletion Policy</h4>
            <p>Your research contributions are stored securely in encrypted storage. You retain the right to withdraw consent and purge all research samples at any time via your Account Settings (`/settings`).</p>

            <h4 className="font-bold text-white">4. Scientific & Medical Disclaimer</h4>
            <p>MindSense is an experimental research system. Emotion estimates are non-clinical computational predictions and do NOT constitute psychological evaluation, medical diagnosis, or clinical advice.</p>
          </div>

          <label className="flex items-center gap-3 p-4 rounded-xl bg-brand-500/10 border border-brand-500/30 cursor-pointer">
            <input
              type="checkbox"
              checked={consentSigned}
              onChange={(e) => setConsentSigned(e.target.checked)}
              className="rounded border-slate-700 text-brand-500 focus:ring-brand-500"
            />
            <span className="font-bold text-white text-xs">
              I have read, understood, and agree to the Informed Consent Form.
            </span>
          </label>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button onClick={handlePrevStep} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold text-xs flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNextStep}
              className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2"
            >
              <span>Proceed to Questionnaire</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: QUESTIONNAIRE & OPTIONAL CONTRIBUTION */}
      {step === 4 && (
        <div className="academic-card p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Participant Questionnaire & Sample Contribution</h2>
            <p className="text-xs text-slate-400 mt-1">All responses are anonymized under participant code.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Age Group</label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                >
                  <option value="18-24">18–24 years</option>
                  <option value="25-34">25–34 years</option>
                  <option value="35-44">35–44 years</option>
                  <option value="45-54">45–54 years</option>
                  <option value="55+">55+ years</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Gender Identity</label>
                <select
                  value={genderIdentity}
                  onChange={(e) => setGenderIdentity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-brand-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Self-described">Self-described</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Environmental / Situational Context</label>
              <select
                value={situationalContext}
                onChange={(e) => setSituationalContext(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-brand-500"
              >
                <option value="Academic Study">Academic / Workplace Study</option>
                <option value="Rest / Leisure">Rest / Leisure Environment</option>
                <option value="Social Interaction">Social Interaction</option>
                <option value="High Pressure / Deadline">High Pressure / Deadline Tasks</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Baseline Mood Score (1 = Low, 5 = High)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBaselineMood(val)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition font-mono ${baselineMood === val ? 'bg-brand-600 text-white border-brand-500' : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'}`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="font-semibold text-slate-300">Optional Text Sample Contribution</label>
              <textarea
                value={textSample}
                onChange={(e) => setTextSample(e.target.value)}
                rows={3}
                placeholder="Optionally share a short reflection text sample to contribute to lexical dataset analysis..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-brand-500 font-sans"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button onClick={handlePrevStep} className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold text-xs flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            
            <button
              onClick={handleSubmitParticipation}
              disabled={submitting || !currentUser}
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow"
            >
              {submitting ? (
                <span>Submitting Research Contribution...</span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Research Contribution</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: SUBMISSION CONFIRMATION */}
      {step === 5 && participantResult && (
        <div className="academic-card p-8 space-y-6 text-center animate-fadeIn">
          <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Research Contribution Confirmed</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Thank you for advancing research into multimodal affective signal analysis. Your contribution has been successfully cataloged under your anonymized participant code.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 inline-block font-mono text-xs text-slate-300 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Participant Code</span>
            <strong className="text-brand-400 text-base">{participantResult.participant_code}</strong>
            <span className="text-[10px] text-slate-500 block">Contribution ID: #{participantResult.contribution_id}</span>
          </div>

          <div className="pt-4 flex items-center justify-center gap-3">
            <button onClick={onBack} className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs">
              Return to Home
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
