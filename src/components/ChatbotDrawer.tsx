import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User, PredictionResult } from '../types';
import { api } from '../api';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  RefreshCw,
  Droplets,
  Heart,
} from 'lucide-react';

interface ChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  predictions?: { gdm: PredictionResult; cervical: PredictionResult };
}

export const ChatbotDrawer: React.FC<ChatbotDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  predictions,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadHistory();
    }
  }, [isOpen, currentUser]);

  const loadHistory = async () => {
    if (!currentUser) return;
    try {
      const history = await api.getChatHistory(currentUser.id);
      if (history.length > 0) {
        setMessages(history);
      } else {
        setMessages([
          {
            id: 'init-1',
            sender: 'assistant',
            content: `Namaste ${currentUser.name}! I am your Matern Health Companion. I can provide evidence-based educational guidance regarding gestational diabetes, prenatal nutrition, cervical screening, and your test results. What would you like to explore today?`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || !currentUser || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await api.sendChatMessage(text.trim(), currentUser.id);
      setMessages(res.history);
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          sender: 'assistant',
          content: 'I apologize, but I encountered an issue connecting to the clinical knowledge base. Please check your connectivity or ask your healthcare provider.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const quickPrompts = [
    'Explain my current Gestational Diabetes risk factors',
    'What foods boost hemoglobin without spiking glucose?',
    'What should my blood sugar be 2 hours after meals?',
    'Why is routine Pap and HPV screening important?',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-white shadow-2xl border-l border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-indigo-700 via-purple-700 to-rose-600 text-white flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-sm tracking-tight">Matern AI Assistant</h3>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-200 px-1.5 py-0.2 rounded font-medium border border-emerald-400/30">
                Online
              </span>
            </div>
            <p className="text-[11px] text-purple-100">Grounded in WHO &amp; ACOG Clinical Guidelines</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mandatory Clinical Disclaimer Banner */}
      <div className="bg-amber-50/90 border-b border-amber-200/80 px-3.5 py-2 text-[11px] text-amber-900 flex items-start gap-2 shrink-0">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="leading-snug">
          <strong>Educational information only.</strong> Not a substitute for professional clinical medical advice or diagnosis. Always consult your obstetrician.
        </p>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50/50">
        {messages.map((m) => {
          const isBot = m.sender === 'assistant';
          return (
            <div key={m.id} className={`flex gap-2.5 ${isBot ? 'items-start' : 'items-start flex-row-reverse'}`}>
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isBot
                    ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-2xs'
                    : 'bg-slate-800 text-white'
                }`}
              >
                {isBot ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
              </div>

              <div
                className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                  isBot
                    ? 'bg-white text-slate-800 border border-slate-200/80 shadow-2xs space-y-1.5'
                    : 'bg-indigo-600 text-white shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>
                <div
                  className={`text-[9px] mt-1 ${isBot ? 'text-slate-400' : 'text-indigo-200 text-right'}`}
                >
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100 w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Matern AI is consulting medical guidelines...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            disabled={isLoading}
            onClick={() => handleSendMessage(qp)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 whitespace-nowrap transition-colors border border-slate-200/60"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about maternal risks, sugar levels, or diet..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors shadow-2xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
