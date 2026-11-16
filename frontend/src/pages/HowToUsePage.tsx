import { PageHeader } from '../components/PageHeader';
export const HowToUsePage = ({ onBack, onStartAnalysis }: { onBack: () => void; onStartAnalysis: () => void }) => <section className="space-y-6 max-w-4xl mx-auto">
  <PageHeader title="Get started with MindSense" description="A local-model demonstration for expression analysis and private reflection." onBack={onBack}/>
  <ol className="academic-card p-8 list-decimal pl-12 space-y-5 text-slate-300 text-sm">
    <li>Check the model badges in Analyze. The server operator must install the published checkpoints before inference can run.</li>
    <li>Add English text, 0.1–30 seconds of audible speech, or a clear photo of one consenting adult. For combined analysis, use inputs describing the same moment.</li>
    <li>Confirm permission and select Start Analysis. Camera and microphone access need browser permission and localhost or HTTPS.</li>
    <li>Read each modality's label, the combined scores, and disagreement warnings. Scores are uncalibrated; expressions do not establish internal feelings or a diagnosis.</li>
    <li>Sign in to save results, write journal entries, and record check-ins. Guests can analyze without saving results.</li>
    <li>Use an expiring share link only when you want a result to be public. Revoke it afterward. Export or delete account data in Settings.</li>
  </ol><button className="btn-primary" onClick={onStartAnalysis}>Start an Analysis</button>
</section>;
