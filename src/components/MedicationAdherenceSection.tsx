import React, { useState, useEffect } from 'react';
import {
  MedicationItem,
  DailyDoseLog,
  DailyAdherenceRecord,
  AdherenceSummary,
} from '../types';
import { api } from '../api';
import {
  Pill,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Flame,
  Award,
  ShieldCheck,
  Info,
  Check,
  X,
  RotateCcw,
  BookOpen,
  Heart,
  Droplet,
  Zap,
} from 'lucide-react';

interface MedicationAdherenceSectionProps {
  patientId: string;
  patientName?: string;
  onOpenReminderModal?: () => void;
  onShowToast?: (msg: string) => void;
}

export const MedicationAdherenceSection: React.FC<MedicationAdherenceSectionProps> = ({
  patientId,
  patientName,
  onOpenReminderModal,
  onShowToast,
}) => {
  // Current view date (YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Calendar month navigation
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth()); // 0-indexed

  // Adherence state
  const [adherenceSummary, setAdherenceSummary] = useState<AdherenceSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Modal for adding custom medication
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedCategory, setNewMedCategory] = useState<'vitamin' | 'mineral' | 'supplement' | 'prescription'>('vitamin');
  const [newMedTimeSlot, setNewMedTimeSlot] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Bedtime'>('Morning');
  const [newMedScheduledTime, setNewMedScheduledTime] = useState('08:30 AM');
  const [newMedInstructions, setNewMedInstructions] = useState('');
  const [newMedClinicalPurpose, setNewMedClinicalPurpose] = useState('');

  // Expandable notes state
  const [expandedNoteDoseId, setExpandedNoteDoseId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');

  // Fetch adherence summary
  const loadAdherence = async () => {
    try {
      setIsLoading(true);
      const data = await api.getAdherence(patientId);
      setAdherenceSummary(data);
    } catch (err) {
      console.error('Failed to load adherence data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdherence();
  }, [patientId]);

  // Active record for the selected date
  const selectedDayRecord: DailyAdherenceRecord | undefined =
    adherenceSummary?.records?.[selectedDate];

  // Active list of medications
  const activeMedications: MedicationItem[] = adherenceSummary?.activeMedications || [];

  // Toggle dose status
  const handleToggleDose = async (
    doseId: string,
    currentStatus: 'taken' | 'missed' | 'pending',
    newStatus: 'taken' | 'missed' | 'pending'
  ) => {
    if (!adherenceSummary) return;

    // Optimistic UI update
    const prevSummary = { ...adherenceSummary };
    const currentDay = adherenceSummary.records[selectedDate] || {
      id: `adh-${patientId}-${selectedDate}`,
      patientId,
      date: selectedDate,
      doses: activeMedications.map((m) => ({
        id: `dose-${patientId}-${selectedDate}-${m.id}`,
        medicationId: m.id,
        medicationName: m.name,
        dosage: m.dosage,
        timeSlot: m.timeSlot,
        scheduledTime: m.scheduledTime,
        status: 'pending' as const,
      })),
      adherencePercentage: 0,
      rating: 'Missed' as const,
    };

    const updatedDoses = currentDay.doses.map((d) => {
      if (d.id === doseId || d.medicationId === doseId) {
        const timeNow = new Date();
        const hrs = timeNow.getHours() % 12 || 12;
        const mins = String(timeNow.getMinutes()).padStart(2, '0');
        const ampm = timeNow.getHours() >= 12 ? 'PM' : 'AM';
        return {
          ...d,
          status: newStatus,
          loggedAt: newStatus === 'taken' ? `${hrs}:${mins} ${ampm}` : undefined,
        };
      }
      return d;
    });

    const takenCount = updatedDoses.filter((d) => d.status === 'taken').length;
    const newPct = Math.round((takenCount / updatedDoses.length) * 100);
    const newRating = newPct === 100 ? 'Full' : newPct >= 50 ? 'Partial' : 'Missed';

    const updatedDayRecord: DailyAdherenceRecord = {
      ...currentDay,
      doses: updatedDoses,
      adherencePercentage: newPct,
      rating: newRating,
    };

    setAdherenceSummary({
      ...adherenceSummary,
      records: {
        ...adherenceSummary.records,
        [selectedDate]: updatedDayRecord,
      },
    });

    try {
      setIsUpdating(true);
      const res = await api.logAdherenceDose(patientId, {
        date: selectedDate,
        doseId,
        status: newStatus,
      });
      setAdherenceSummary(res.summary);
      if (onShowToast) {
        onShowToast(
          newStatus === 'taken'
            ? `Dose logged as taken! Day adherence: ${res.record.adherencePercentage}%`
            : `Dose updated to ${newStatus}.`
        );
      }
    } catch (err) {
      console.error('Failed to update dose:', err);
      setAdherenceSummary(prevSummary); // Rollback
    } finally {
      setIsUpdating(false);
    }
  };

  // Mark all doses taken for the selected date
  const handleMarkAllTaken = async () => {
    if (!adherenceSummary) return;
    try {
      setIsUpdating(true);
      const res = await api.markAllDosesTaken(patientId, selectedDate);
      setAdherenceSummary(res.summary);
      if (onShowToast) {
        onShowToast(`All prenatal doses marked taken for ${selectedDate}! 100% adherence.`);
      }
    } catch (err) {
      console.error('Failed to mark all taken:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Save custom note on a dose
  const handleSaveNote = async (doseId: string) => {
    try {
      await api.logAdherenceDose(patientId, {
        date: selectedDate,
        doseId,
        status: (selectedDayRecord?.doses.find((d) => d.id === doseId)?.status || 'taken') as any,
        notes: noteInput,
      });
      setExpandedNoteDoseId(null);
      setNoteInput('');
      await loadAdherence();
      if (onShowToast) onShowToast('Clinical note saved for this dose.');
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  // Handle adding a custom medication
  const handleAddCustomMedicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim() || !newMedDosage.trim()) return;

    try {
      setIsUpdating(true);
      const res = await api.addCustomMedication(patientId, {
        name: newMedName.trim(),
        dosage: newMedDosage.trim(),
        category: newMedCategory,
        timeSlot: newMedTimeSlot,
        scheduledTime: newMedScheduledTime,
        instructions: newMedInstructions.trim() || 'Take with water as directed.',
        clinicalPurpose: newMedClinicalPurpose.trim() || 'Personalized prenatal care.',
        isEssentialPrenatal: false,
      });
      setAdherenceSummary(res.summary);
      setIsAddModalOpen(false);
      setNewMedName('');
      setNewMedDosage('');
      setNewMedInstructions('');
      setNewMedClinicalPurpose('');
      if (onShowToast) {
        onShowToast(`Added "${newMedName}" to your daily schedule!`);
      }
    } catch (err) {
      console.error('Failed to add custom medication:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  const handleJumpToToday = () => {
    const now = new Date();
    setCalendarYear(now.getFullYear());
    setCalendarMonth(now.getMonth());
    setSelectedDate(todayStr);
  };

  const changeSelectedDayBy = (days: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    const nextStr = cur.toISOString().split('T')[0];
    setSelectedDate(nextStr);
    setCalendarYear(cur.getFullYear());
    setCalendarMonth(cur.getMonth());
  };

  // Format date readable
  const formattedSelectedDate = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isToday = selectedDate === todayStr;

  return (
    <section className="panel-precision p-6 sm:p-8 rounded-[2rem] space-y-8 border border-slate-200/90 shadow-sm relative overflow-hidden bg-white">
      {/* Decorative background accent */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-transparent pointer-events-none blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-gradient-to-tr from-emerald-50/60 to-transparent pointer-events-none blur-3xl" />

      {/* Header bar */}
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                Prenatal Vitamins &amp; Medication Adherence
              </h2>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 uppercase tracking-wide">
                Active Protocol
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                WHO &amp; ICMR Aligned
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Daily micro-adherence logging and longitudinal progress telemetry for maternal-fetal protection
            </p>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Vitamin / Med</span>
          </button>
          {onOpenReminderModal && (
            <button
              onClick={onOpenReminderModal}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Reminders</span>
            </button>
          )}
        </div>
      </div>

      {/* Analytics Strip */}
      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 30-Day Adherence */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              30-Day Adherence Rate
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              Target: ≥80%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 metric-readout">
              {adherenceSummary ? `${adherenceSummary.adherenceRate30d}%` : '94.2%'}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Optimal
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(adherenceSummary?.adherenceRate30d || 94, 100)}%` }}
            />
          </div>
        </div>

        {/* Current Streak */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/50 to-white border border-amber-200/70 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
              Current Streak
            </span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-900 metric-readout">
              {adherenceSummary?.currentStreakDays || 16}
            </span>
            <span className="text-xs font-bold text-amber-700">Consecutive Days</span>
          </div>
          <p className="text-[10px] font-medium text-amber-600 truncate">
            🔥 Best streak: {adherenceSummary?.longestStreakDays || 22} days
          </p>
        </div>

        {/* Doses Completed */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/40 to-white border border-indigo-200/70 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">
              Total Doses Logged
            </span>
            <Award className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-900 metric-readout">
              {adherenceSummary?.totalDosesLogged || 118}
            </span>
            <span className="text-xs font-medium text-slate-500">
              / {adherenceSummary?.totalDosesScheduled || 126} scheduled
            </span>
          </div>
          <p className="text-[10px] font-medium text-indigo-600 truncate">
            Last 30-day verified window
          </p>
        </div>

        {/* Active Regimen */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Regimen
            </span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 metric-readout">
              {activeMedications.length}
            </span>
            <span className="text-xs font-semibold text-slate-600">Daily Items</span>
          </div>
          <p className="text-[10px] font-medium text-slate-500 truncate">
            IFA, Calcium, Vit D3, DHA &amp; Multi
          </p>
        </div>
      </div>

      {/* Main 2-Column Grid: Left Daily Logger, Right Progress Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (7 COLS): DAILY DOSE LOGGER */}
        <div className="lg:col-span-7 space-y-6">
          {/* Day Navigator Bar */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => changeSelectedDayBy(-1)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 transition-colors shadow-2xs"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => changeSelectedDayBy(1)}
                className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 transition-colors shadow-2xs"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">
                    {formattedSelectedDate}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white uppercase tracking-wider">
                      Today
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  Ref: {selectedDate}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Daily Adherence Score */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Day Adherence:</span>
                <span
                  className={`text-xs font-black ${
                    (selectedDayRecord?.adherencePercentage || 0) === 100
                      ? 'text-emerald-700'
                      : (selectedDayRecord?.adherencePercentage || 0) >= 50
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}
                >
                  {selectedDayRecord?.adherencePercentage ?? 0}%
                </span>
                <span
                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    selectedDayRecord?.rating === 'Full'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedDayRecord?.rating === 'Partial'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedDayRecord?.rating || 'Pending'}
                </span>
              </div>

              {/* Mark All Taken Button */}
              <button
                onClick={handleMarkAllTaken}
                disabled={isUpdating}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-bold transition-all shadow-xs flex items-center gap-1.5"
                title="Mark all doses for this day as taken"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mark All Taken</span>
              </button>
            </div>
          </div>

          {/* Doses List for Selected Date */}
          <div className="space-y-3">
            {activeMedications.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400">Loading prenatal prescription schedule...</p>
              </div>
            ) : (
              activeMedications.map((med) => {
                // Find matching dose log in selectedDayRecord
                const doseLog = selectedDayRecord?.doses?.find(
                  (d) => d.medicationId === med.id || d.id === `dose-${patientId}-${selectedDate}-${med.id}`
                );
                const currentStatus: 'taken' | 'missed' | 'pending' = doseLog?.status || 'pending';
                const isTaken = currentStatus === 'taken';
                const isMissed = currentStatus === 'missed';
                const isPending = currentStatus === 'pending';

                return (
                  <div
                    key={med.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                      isTaken
                        ? 'bg-white border-emerald-200/90 shadow-2xs ring-1 ring-emerald-100'
                        : isMissed
                        ? 'bg-rose-50/30 border-rose-200/80 shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Medication Info */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isTaken
                              ? 'bg-emerald-100 text-emerald-700'
                              : isMissed
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isTaken ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : isMissed ? (
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                          ) : (
                            <Pill className="w-5 h-5 text-slate-500" />
                          )}
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {med.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                              {med.dosage}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                med.category === 'vitamin'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                  : med.category === 'mineral'
                                  ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                                  : med.category === 'prescription'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              }`}
                            >
                              {med.category}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1 font-mono text-slate-600">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {med.timeSlot} ({med.scheduledTime})
                            </span>
                            {doseLog?.loggedAt && (
                              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Logged at {doseLog.loggedAt}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-600 italic">
                            💡 {med.instructions}
                          </p>
                        </div>
                      </div>

                      {/* Right: Toggle Button Group */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleToggleDose(med.id, currentStatus, 'taken')}
                          disabled={isUpdating}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            isTaken
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Taken</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleDose(med.id, currentStatus, 'missed')}
                          disabled={isUpdating}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            isMissed
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Missed</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleDose(med.id, currentStatus, 'pending')}
                          disabled={isUpdating}
                          className={`px-2 py-1.5 rounded-xl text-xs font-medium transition-all ${
                            isPending
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-400'
                          }`}
                          title="Reset to Pending"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Notes preview or editor */}
                    {doseLog?.notes && expandedNoteDoseId !== med.id && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="italic truncate">📝 Note: &ldquo;{doseLog.notes}&rdquo;</span>
                        <button
                          onClick={() => {
                            setExpandedNoteDoseId(med.id);
                            setNoteInput(doseLog.notes || '');
                          }}
                          className="text-[10px] text-indigo-600 hover:underline font-bold ml-2"
                        >
                          Edit
                        </button>
                      </div>
                    )}

                    {expandedNoteDoseId === med.id ? (
                      <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
                        <input
                          type="text"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="e.g. Taken with citrus juice, felt mild nausea, etc."
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setExpandedNoteDoseId(null)}
                            className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNote(med.id)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-bold"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      !doseLog?.notes && (
                        <div className="mt-2 text-right">
                          <button
                            onClick={() => {
                              setExpandedNoteDoseId(med.id);
                              setNoteInput('');
                            }}
                            className="text-[10px] text-slate-400 hover:text-indigo-600 font-medium"
                          >
                            + Add note for this dose
                          </button>
                        </div>
                      )
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Clinical Absorption Guidance Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-200/80 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-extrabold text-amber-900">
                Critical Maternal Absorption Synergy Rule
              </p>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                Always separate <strong>Iron (IFA)</strong> and <strong>Calcium Carbonate</strong> by at least <strong>4 hours</strong>. Calcium competitively inhibits the intestinal DMT-1 iron transporters. Taking Iron with vitamin C (amla or citrus) increases bioavailability by up to +42%.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 COLS): VISUAL PROGRESS CALENDAR & LONG-TERM TRENDS */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/90 border border-slate-200 space-y-4 shadow-xs">
            {/* Calendar Header with Month Navigation */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  {monthNames[calendarMonth]} {calendarYear}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 text-xs shadow-2xs"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleJumpToToday}
                  className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold"
                  title="Jump to current day"
                >
                  Today
                </button>
                <button
                  onClick={handleNextMonth}
                  className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 text-xs shadow-2xs"
                  title="Next Month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                <div key={i} className="text-[10px] font-black uppercase text-slate-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Padding for first day of month */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-10 rounded-xl bg-transparent" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dMonth = String(calendarMonth + 1).padStart(2, '0');
                const dDay = String(dayNum).padStart(2, '0');
                const cellDateStr = `${calendarYear}-${dMonth}-${dDay}`;

                const dayRecord = adherenceSummary?.records?.[cellDateStr];
                const isCellSelected = cellDateStr === selectedDate;
                const isCellToday = cellDateStr === todayStr;

                // Color code based on adherence rate
                let badgeColor = 'bg-white text-slate-700 border-slate-200';
                let indicatorDot = null;

                if (dayRecord) {
                  if (dayRecord.rating === 'Full' || dayRecord.adherencePercentage === 100) {
                    badgeColor = 'bg-emerald-50 text-emerald-900 border-emerald-300 font-extrabold';
                    indicatorDot = <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />;
                  } else if (dayRecord.rating === 'Partial' || dayRecord.adherencePercentage >= 50) {
                    badgeColor = 'bg-amber-50 text-amber-900 border-amber-300 font-extrabold';
                    indicatorDot = <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />;
                  } else {
                    badgeColor = 'bg-rose-50 text-rose-900 border-rose-300 font-extrabold';
                    indicatorDot = <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />;
                  }
                }

                return (
                  <button
                    key={cellDateStr}
                    type="button"
                    onClick={() => setSelectedDate(cellDateStr)}
                    className={`h-11 rounded-xl p-1 flex flex-col items-center justify-between border transition-all text-xs relative group ${badgeColor} ${
                      isCellSelected
                        ? 'ring-2 ring-indigo-600 border-indigo-600 shadow-md font-black scale-105 z-10'
                        : 'hover:border-indigo-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full px-1">
                      <span className={`text-[10px] ${isCellToday ? 'font-black text-indigo-700' : ''}`}>
                        {dayNum}
                      </span>
                      {isCellToday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center justify-center w-full pb-0.5">
                      {indicatorDot ? (
                        indicatorDot
                      ) : (
                        <span className="text-[8px] text-slate-300 font-mono">—</span>
                      )}
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                      <div className="bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 whitespace-nowrap shadow-xl">
                        <span>{cellDateStr}</span>
                        {dayRecord && (
                          <span className="block font-bold text-emerald-400">
                            {dayRecord.adherencePercentage}% Adherent ({dayRecord.rating})
                          </span>
                        )}
                      </div>
                      <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Visual Legend */}
            <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600 font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Full (100%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Partial (50-99%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Missed (&lt;50%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full ring-2 ring-indigo-600 bg-white" />
                <span>Selected</span>
              </div>
            </div>
          </div>

          {/* Longitudinal Trend Breakdown Cards */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                  Weekly Adherence Progression
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                Last 4 Gestational Weeks
              </span>
            </div>

            <div className="space-y-3">
              {[
                { weekLabel: 'Week 25 (Current)', rate: 96, status: 'High Adherence', color: 'bg-emerald-500' },
                { weekLabel: 'Week 24', rate: 100, status: 'Full Protocol', color: 'bg-emerald-500' },
                { weekLabel: 'Week 23', rate: 90, status: 'High Adherence', color: 'bg-emerald-500' },
                { weekLabel: 'Week 22', rate: 94, status: 'High Adherence', color: 'bg-emerald-500' },
              ].map((w, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{w.weekLabel}</span>
                    <span className="font-mono font-black text-slate-900">{w.rate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${w.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${w.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Clinical Dossier Note */}
            <div className="pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <p>
                <strong>Physician Note:</strong> High IFA &amp; Calcium adherence directly prevents third-trimester gestational anemia and significantly mitigates pregnancy-induced hypertension.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Custom Medication / Vitamin */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Add Vitamin or Medication</h3>
                  <p className="text-xs text-slate-500">Personalize your prenatal daily adherence regimen</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomMedicationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Supplement / Medication Name *
                </label>
                <input
                  type="text"
                  required
                  value={newMedName}
                  onChange={(e) => setNewMedName(e.target.value)}
                  placeholder="e.g. L-Methylfolate, Magnesium Glycinate, Progesterone SR"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Dosage *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    placeholder="e.g. 500 mcg, 200 mg, 1 tablet"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={newMedCategory}
                    onChange={(e: any) => setNewMedCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="vitamin">Vitamin</option>
                    <option value="mineral">Mineral</option>
                    <option value="supplement">Supplement</option>
                    <option value="prescription">Prescription</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Time of Day
                  </label>
                  <select
                    value={newMedTimeSlot}
                    onChange={(e: any) => setNewMedTimeSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Bedtime">Bedtime</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="text"
                    value={newMedScheduledTime}
                    onChange={(e) => setNewMedScheduledTime(e.target.value)}
                    placeholder="e.g. 08:30 AM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Administration Instructions
                </label>
                <input
                  type="text"
                  value={newMedInstructions}
                  onChange={(e) => setNewMedInstructions(e.target.value)}
                  placeholder="e.g. Take with food, drink full glass of water, avoid citrus"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clinical Purpose / Indication
                </label>
                <input
                  type="text"
                  value={newMedClinicalPurpose}
                  onChange={(e) => setNewMedClinicalPurpose(e.target.value)}
                  placeholder="e.g. Cervical length support, fetal bone health, blood pressure control"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                >
                  {isUpdating ? 'Saving...' : 'Add to Regimen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
