import React, { useState, useEffect } from 'react';
import { User, Appointment } from '../types';
import { api } from '../api';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  ChevronRight,
  Stethoscope,
  User as UserIcon,
  Filter,
} from 'lucide-react';

interface AppointmentPanelProps {
  currentUser: User | null;
  onClose?: () => void;
}

export const AppointmentPanel: React.FC<AppointmentPanelProps> = ({ currentUser, onClose }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  
  // New Appointment Form
  const [reason, setReason] = useState('');
  const [type, setType] = useState<Appointment['type']>('routine_checkup');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAppointments = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      let data: Appointment[] = [];
      if (currentUser.role === 'admin') {
        data = await api.getAppointments();
      } else {
        data = await api.getUserAppointments(currentUser.id);
      }
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [currentUser]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.requestAppointment({ reason, type, scheduledDate });
      setReason('');
      setIsRequesting(false);
      loadAppointments();
    } catch (err) {
      console.error('Failed to request appointment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (aptId: string, status: 'approved' | 'rejected') => {
    try {
      if (status === 'approved') {
        await api.approveAppointment(aptId);
      } else {
        await api.rejectAppointment(aptId);
      }
      loadAppointments();
    } catch (err) {
      console.error(`Failed to ${status} appointment:`, err);
    }
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold">Approved</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold">Pending Approval</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold capitalize">{status}</span>;
    }
  };

  const getTypeIcon = (type: Appointment['type']) => {
    switch (type) {
      case 'routine_checkup': return <Calendar className="w-4 h-4 text-indigo-500" />;
      case 'gdm_followup': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'cervical_screening': return <Stethoscope className="w-4 h-4 text-rose-500" />;
      case 'emergency': return <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />;
      default: return <Calendar className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl flex flex-col h-full overflow-hidden max-h-[700px]">
      {/* Header */}
      <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm tracking-tight">Clinical Appointment Registry</h3>
            <p className="text-[11px] text-slate-400">
              {currentUser?.role === 'admin' ? 'System-wide scheduling governance' : 'Personal prenatal consultation log'}
            </p>
          </div>
        </div>
        {currentUser?.role === 'patient' && !isRequesting && (
          <button
            onClick={() => setIsRequesting(true)}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Request New
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
        {isRequesting ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
            <h4 className="font-bold text-slate-900 text-sm mb-4">Request New Consultation</h4>
            <form onSubmit={handleRequest} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Consultation Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="routine_checkup">Routine Prenatal Checkup</option>
                  <option value="gdm_followup">GDM Risk Follow-up</option>
                  <option value="cervical_screening">Cervical Screening / PAP Review</option>
                  <option value="emergency">Emergency Urgent Consultation</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Preferred Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reason for Visit</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Briefly describe your symptoms or reason for scheduling..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs min-h-[80px] focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Request...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRequesting(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Clock className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs font-semibold">Synchronizing registry...</span>
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <Calendar className="w-12 h-12 text-slate-200" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-600">No scheduled appointments</p>
              <p className="text-xs text-slate-400">Registry is currently empty for this cohort.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      {getTypeIcon(apt.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-xs text-slate-900">{apt.reason}</h5>
                        {getStatusBadge(apt.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(apt.scheduledDate).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        <span className="flex items-center gap-1">
                          {currentUser?.role === 'patient' ? (
                            <>
                              <Stethoscope className="w-3 h-3" />
                              {apt.doctorName}
                            </>
                          ) : (
                            <>
                              <UserIcon className="w-3 h-3" />
                              {apt.patientName}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {currentUser?.role === 'admin' && apt.status === 'pending' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'approved')}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="Approve Appointment"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(apt.id, 'rejected')}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                        title="Reject Appointment"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                {apt.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 italic">
                    Note: {apt.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {onClose && (
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            Close Registry
          </button>
        </div>
      )}
    </div>
  );
};
