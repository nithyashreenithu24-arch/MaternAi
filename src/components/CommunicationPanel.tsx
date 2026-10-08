import React, { useState, useEffect, useRef } from 'react';
import { DirectMessage, User, HealthRecord, PredictionResult } from '../types';
import { api } from '../api';
import {
  MessageSquare,
  Send,
  Stethoscope,
  User as UserIcon,
  AlertTriangle,
  Clock,
  CheckCheck,
  Check,
  Shield,
  Tag,
  Sparkles,
  PhoneCall,
  Calendar,
  X,
  FileText,
  Heart,
  Droplets,
  RefreshCw,
} from 'lucide-react';

interface CommunicationPanelProps {
  currentUser: User | null;
  patientId: string;
  patientName?: string;
  doctorName?: string;
  isDoctorView?: boolean;
  onClose?: () => void;
  patientContext?: {
    age?: number;
    gestationalWeeks?: number;
    gdmRisk?: string;
    cervicalRisk?: string;
    latestSugar?: number;
    latestBP?: string;
  };
}

export const CommunicationPanel: React.FC<CommunicationPanelProps> = ({
  currentUser,
  patientId,
  patientName = 'Priya Patel',
  doctorName = 'Dr. Ananya Sharma',
  isDoctorView = false,
  onClose,
  patientContext,
}) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState<'Symptom Inquiry' | 'Lab Result' | 'Nutrition & Diet' | 'Medication' | 'General Query'>('General Query');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      const msgs = await api.getDirectMessages(patientId);
      setMessages(msgs);
      await api.markMessagesRead(patientId);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    // Initial fetch and mark as read
    api.getDirectMessages(patientId).then(msgs => {
      setMessages(msgs);
      setIsLoading(false);
      api.markMessagesRead(patientId);
    }).catch(err => {
      console.error('Initial load failed:', err);
      setIsLoading(false);
    });

    // Polling for updates every 10 seconds (as Firebase/WebSockets are not used)
    const pollInterval = setInterval(async () => {
      try {
        const msgs = await api.getDirectMessages(patientId);
        setMessages(msgs);
        // Only mark read if messages changed? 
        // For simplicity, just poll and update state
      } catch (err) {
        console.error('Polling messages failed:', err);
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [patientId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (contentToSend?: string) => {
    const text = contentToSend || inputText;
    if (!text.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await api.sendDirectMessage({
        patientId,
        content: text.trim(),
        tag: selectedTag,
        isUrgent,
      });
      setMessages(res.thread);
      setInputText('');
      setIsUrgent(false);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Quick preset templates
  const patientQuickQueries = [
    'My 2h post-meal glucose was 142 mg/dL. Should I adjust dinner?',
    'Experiencing mild nausea with iron supplement. Any advice?',
    'Confirming preparation steps for my upcoming glucose screening test.',
    'Mild ankle swelling noticed after standing. Is this expected?',
  ];

  const doctorQuickReplies = [
    'Please maintain a 3-day fasting & post-meal sugar log for our review.',
    'Take Iron supplement at 11 AM with lemon water, 2h apart from Calcium.',
    'Numbers look reassuring. Continue with the prescribed low-GI meal plan.',
    'If systolic BP exceeds 130 mmHg or you experience visual flashes, visit triage.',
  ];

  const presets = isDoctorView ? doctorQuickReplies : patientQuickQueries;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            {isDoctorView ? <UserIcon className="w-5 h-5 text-rose-300" /> : <Stethoscope className="w-5 h-5 text-indigo-300" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm tracking-tight">
                {isDoctorView ? `Direct Consultation: ${patientName}` : `Direct Messages: ${doctorName}`}
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Verified Channel
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isDoctorView
                ? `Patient ID: ${patientId} • Confidential EMR Thread`
                : 'Maternal-Fetal Medicine Specialist • Apollo Cradle Maternal Centre'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadMessages()}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh thread"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Patient Health Context Summary Ribbon (especially useful for doctors) */}
      {patientContext && (
        <div className="bg-indigo-50/70 border-b border-indigo-100/80 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3 text-slate-700">
            <span className="font-semibold text-slate-900 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              {patientContext.gestationalWeeks ? `Week ${patientContext.gestationalWeeks}` : 'Prenatal Care'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-amber-500" />
              GDM: <strong>{patientContext.gdmRisk || 'Low'}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              Cervical: <strong>{patientContext.cervicalRisk || 'Low'}</strong>
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            BP: {patientContext.latestBP || '120/80'} | Sugar: {patientContext.latestSugar || 118} mg/dL
          </div>
        </div>
      )}

      {/* Messages Thread Container */}
      <div className="flex-1 p-4 space-y-3.5 overflow-y-auto bg-slate-50/50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-xs gap-2">
            <Clock className="w-4 h-4 animate-spin text-indigo-500" />
            <span>Loading encrypted clinical communications...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">No communication messages yet</p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              {isDoctorView
                ? 'Send a clinical follow-up or reassurance to the expectant mother.'
                : 'Ask your obstetrician about symptoms, glucose results, or diet questions.'}
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = (isDoctorView && m.senderRole === 'doctor') || (!isDoctorView && m.senderRole === 'patient');

            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${isMe ? 'items-end flex-row-reverse' : 'items-start flex-row'}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    m.senderRole === 'doctor'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-rose-500 text-white shadow-2xs'
                  }`}
                >
                  {m.senderRole === 'doctor' ? (
                    <Stethoscope className="w-4 h-4" />
                  ) : (
                    <Heart className="w-4 h-4 fill-white" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-3.5 rounded-2xl text-xs max-w-[82%] sm:max-w-[75%] space-y-1.5 shadow-2xs ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                  }`}
                >
                  {/* Sender header & Tag */}
                  <div className="flex items-center justify-between gap-3 text-[10px] pb-1 border-b border-white/15">
                    <span className={`font-bold ${isMe ? 'text-indigo-100' : 'text-slate-900'}`}>
                      {m.senderName}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {m.isUrgent && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white font-extrabold uppercase text-[9px]">
                          Urgent
                        </span>
                      )}
                      {m.tag && (
                        <span
                          className={`px-1.5 py-0.2 rounded font-semibold text-[9px] ${
                            isMe ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {m.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>

                  {/* Timestamp & Read Receipt */}
                  <div
                    className={`flex items-center justify-end gap-1 text-[9px] pt-0.5 ${
                      isMe ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    <span>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                      <span>
                        {m.status === 'read' ? (
                          <span title="Read by physician/patient">
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                          </span>
                        ) : (
                          <span title="Delivered">
                            <Check className="w-3.5 h-3.5 opacity-70" />
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Preset Suggestions */}
      <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          {isDoctorView ? 'Clinical Presets:' : 'Quick Queries:'}
        </span>
        {presets.map((preset, i) => (
          <button
            key={i}
            disabled={isSending}
            onClick={() => handleSend(preset)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 whitespace-nowrap transition-colors border border-slate-200/60"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Message Input & Action Bar */}
      <div className="p-3.5 bg-white border-t border-slate-200 shrink-0 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Category:
            </span>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value as any)}
              className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
            >
              <option value="General Query">General Query</option>
              <option value="Symptom Inquiry">Symptom Inquiry</option>
              <option value="Lab Result">Lab Result Clarification</option>
              <option value="Nutrition & Diet">Nutrition &amp; Meal Inquiry</option>
              <option value="Medication">Medication &amp; Supplements</option>
            </select>
          </div>

          {!isDoctorView && (
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-rose-700 font-semibold">
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
              />
              <span>Mark as High-Priority Clinical Query</span>
            </label>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={
              isDoctorView
                ? `Send clinical instructions or reply to ${patientName}...`
                : `Message ${doctorName} regarding your symptoms or numbers...`
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-40 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
