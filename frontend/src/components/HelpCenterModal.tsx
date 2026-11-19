import { X } from 'lucide-react';
import { HowToUsePage } from '../pages/HowToUsePage';
import type { User } from '../types';
interface HelpCenterModalProps { isOpen: boolean; onClose: () => void; onStartAnalysis: () => void; onExploreResearch: () => void; currentUser?: User | null }
export const HelpCenterModal = ({isOpen,onClose,onStartAnalysis,onExploreResearch}: HelpCenterModalProps) => !isOpen ? null : <div role="dialog" aria-modal="true" aria-label="Help Center" className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"><div className="academic-card p-6 w-full max-w-4xl max-h-[90vh] overflow-auto"><button onClick={onClose} aria-label="Close Help Center" className="float-right text-white"><X/></button><HowToUsePage onBack={onClose} onStartAnalysis={() => {onClose();onStartAnalysis();}}/><button className="btn-secondary mt-4" onClick={() => {onClose();onExploreResearch();}}>Models and measured evaluation</button></div></div>;
