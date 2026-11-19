import { PageHeader } from '../components/PageHeader';
export const PrivacyPage = ({ onBack }: { onBack: () => void }) => <section className="space-y-6 max-w-4xl mx-auto">
  <PageHeader title="Privacy and your data" description="What this application processes, stores, and shares." onBack={onBack}/>
  <div className="academic-card p-6 space-y-5 text-sm text-slate-300">
    <h2 className="text-xl font-bold text-white">Analysis inputs</h2>
    <p>Text, photos, and recordings are sent to the application server for local model inference. They are not saved in the application database or sent to model providers. Media decoding may create temporary files that are deleted afterward. The server operator controls hosting, logs, and backups.</p>
    <h2 className="text-xl font-bold text-white">Private records</h2>
    <p>Guest results are not saved. Signed-in results, model scores, account details, journal entries, and self-reported check-ins persist in SQLite. Passwords use salted PBKDF2 hashes. Database contents are not encrypted by the application; use encrypted storage and HTTPS when hosting. Sessions are stored in this browser until logout or expiry.</p>
    <h2 className="text-xl font-bold text-white">Sharing, export, and deletion</h2>
    <p>Results are private until you create a share link. Anyone with that link can read the shared result until expiry or revocation. Journal text and raw analysis inputs are not part of shared results. Export or delete your account in Settings. Clearing analysis history preserves your journal and check-ins. Account deletion removes associated application records; a server operator must separately manage backup retention.</p>
    <h2 className="text-xl font-bold text-white">Research and limits</h2>
    <p>No human-subject research study is offered by default. Any future study requires an independently approved protocol and explicit consent. Participant codes are pseudonyms, not anonymization. Emotion labels are uncertain estimates of expression patterns and are not clinical diagnoses.</p>
  </div>
</section>;
