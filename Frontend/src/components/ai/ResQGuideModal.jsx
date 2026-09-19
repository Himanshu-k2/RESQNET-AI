import React, { useState } from 'react';
import {
  Bot,
  X,
  Send,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';

export const ResQGuideModal = ({ isOpen, onClose, onApplyDraft }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello, I am ResQGuide AI. Tell me what happened, or write in English, Hindi, or Hinglish (e.g., "Building gir gaya hai" or "Flood water entered hostel"). If you are unsure of anything, you can just say "I don\'t know".',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentDraft, setCurrentDraft] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const quickChips = [
    "I don't know",
    "Flooding in ground floor",
    "We are safe for now",
    "Need drinking water & food",
    "People are trapped inside",
  ];

  const handleSendMessage = async (textToSend) => {
    const msg = textToSend || input;
    if (!msg.trim() || loading) return;

    setError('');
    const newMessages = [...messages, { role: 'user', text: msg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = newMessages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await api.post('/ai/guide', {
        message: msg,
        history: historyPayload,
      });

      if (res.data?.success) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', text: res.data.reply },
        ]);
        if (res.data.draft) {
          setCurrentDraft(res.data.draft);
        }
      }
    } catch (err) {
      setError(err.message || 'ResQGuide AI encountered an issue.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'I had trouble connecting to the network. You can continue typing, or enter your details manually on the form.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToForm = () => {
    if (currentDraft) {
      onApplyDraft(currentDraft);
      onClose();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: 'Hello, I am ResQGuide AI. Tell me what happened, or write in English, Hindi, or Hinglish. If you don\'t know exact details, just say "I don\'t know".',
      },
    ]);
    setCurrentDraft(null);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-soft-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-primary-800 to-navy-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight">ResQGuide AI Assistant</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-900/80 text-teal-300 border border-teal-700">
                  Multilingual
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Calm, non-hallucinating emergency intake in English, Hindi & Hinglish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 text-xs flex items-center gap-1"
              title="Reset conversation"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-background-light">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 max-w-[85%] ${
                m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {m.role === 'assistant' ? (
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-navy-900 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  You
                </div>
              )}
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary-700 text-white shadow-soft rounded-tr-xs'
                    : 'bg-white border border-slate-200 text-navy-900 shadow-soft rounded-tl-xs'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic bg-white p-3 rounded-2xl border border-slate-200 w-fit">
              <Bot className="w-4 h-4 text-teal-600 animate-spin" />
              <span>ResQGuide is analyzing your response...</span>
            </div>
          )}

          {/* Real-time Draft Card Preview if generated */}
          {currentDraft && (
            <div className="mt-4 p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  AI Structured Report Draft
                </span>
                <span className="text-[10px] font-semibold text-teal-700">
                  Type: {currentDraft.incidentType || 'Not specified'}
                </span>
              </div>
              <p className="text-slate-700">
                <strong>Description:</strong> {currentDraft.description || 'Pending details'}
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                <span>Safety: <strong className="text-navy-900">{currentDraft.safetyStatus}</strong></span>
                <span>People: <strong className="text-navy-900">{currentDraft.affectedPeople}</strong></span>
                <span>Resources: <strong className="text-navy-900">{currentDraft.requiredResources?.join(', ') || 'None specified'}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Answer Chips */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase">Quick:</span>
          {quickChips.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(chip)}
              disabled={loading}
              className="text-xs whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar & Actions */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0 space-y-2">
          {error && (
            <div className="text-[11px] text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type in English, Hindi, or Hinglish..."
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-background-light focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-primary-700 hover:bg-primary-800 text-white disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {currentDraft && (
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Ready to review and submit this report?
              </span>
              <button
                onClick={handleApplyToForm}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Transfer Draft to Form</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
