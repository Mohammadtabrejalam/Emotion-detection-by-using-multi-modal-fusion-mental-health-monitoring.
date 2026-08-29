import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, ShieldAlert, ChevronRight } from 'lucide-react';
import { apiService } from '../services/api';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  isCrisis?: boolean;
  suggestedActions?: string[];
  timestamp: string;
}

interface MindSenseAssistantProps {
  onNavigate: (pillar: 'home' | 'analyze' | 'insights' | 'research' | 'resources', subTab?: string) => void;
  onOpenHelp: () => void;
}

export const MindSenseAssistant: React.FC<MindSenseAssistantProps> = ({
  onNavigate,
  onOpenHelp
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! I am the **MindSense Assistant**. Ask me about our multimodal fusion architecture, dataset benchmarks, platform features, or how to interpret analysis confidence scores.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: ['How do I start an analysis?', 'What is multimodal fusion?', 'Which datasets are used?', 'Is this a medical diagnosis?']
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const res = await apiService.askAssistant(textToSend, window.location.pathname);
      if (res.success && res.data) {
        const assistantMsg: Message = {
          id: `ast-${Date.now()}`,
          sender: 'assistant',
          text: res.data.response,
          isCrisis: res.data.is_crisis,
          suggestedActions: res.data.suggested_actions,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'I apologize, but I am currently unable to process your inquiry. Please try again or refer to the Help Center.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Connection error while communicating with the assistant service.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedAction = (action: string) => {
    if (action === 'How do I start an analysis?' || action === 'Start Analysis' || action === 'How to Analyze') {
      onNavigate('analyze', 'live');
    } else if (action === 'Explore Research' || action === 'Explain Cross-Attention') {
      onNavigate('research', 'architecture');
    } else if (action === 'Open Help Center' || action === 'Privacy Info') {
      onOpenHelp();
    } else if (action === 'Call 988' || action === 'Open Crisis Resources') {
      onNavigate('resources', 'awareness');
    } else {
      handleSend(action);
    }
  };

  return (
    <>
      {/* Subtle Floating Trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-3.5 py-2 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-lg transition flex items-center gap-2 text-xs font-mono"
          title="Open MindSense Assistant"
          aria-label="Open MindSense Assistant"
        >
          <Bot className="h-4 w-4 text-brand-400" />
          <span>assistant</span>
        </button>
      )}

      {/* Floating Assistant Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-md bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[580px] h-[85vh] animate-fadeIn font-sans">
          
          {/* Header */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-white tracking-tight flex items-center gap-1.5">
                  MindSense Assistant
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Research Guide
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">Multimodal AI & Platform Assistant</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close Assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/90 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1 font-mono">
                  <span>{msg.sender === 'user' ? 'You' : 'MindSense AI'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl max-w-[90%] leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-tr-none shadow'
                      : msg.isCrisis
                      ? 'bg-rose-950/80 border border-rose-800 text-rose-100 rounded-tl-none space-y-2'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.isCrisis && (
                    <div className="flex items-center gap-1.5 font-bold text-rose-300 text-xs">
                      <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
                      <span>Crisis Support Information</span>
                    </div>
                  )}

                  <div className="space-y-2 whitespace-pre-line">
                    {msg.text}
                  </div>

                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestedAction(action)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-brand-500/20 text-slate-300 hover:text-brand-300 border border-slate-700 text-[11px] transition flex items-center gap-1"
                        >
                          <span>{action}</span>
                          <ChevronRight className="h-3 w-3 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 p-2">
                <Sparkles className="h-4 w-4 animate-spin text-brand-400" />
                <span className="text-[11px]">Searching research knowledgebase...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Non-medical Disclaimer Footer */}
          <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-mono">
            <span>Research & wellness platform helper only. Not medical advice.</span>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about MindSense..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white transition shadow"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
};
