import React, { useState } from 'react';
import { HealthRecord } from '../types';
import {
  X,
  Activity,
  Heart,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Pill,
  Bell,
  Clock,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface HealthDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  patientId: string;
  initialData?: Partial<HealthRecord>;
}

export const HealthDataModal: React.FC<HealthDataModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patientId,
  initialData,
}) => {
  const [tab, setTab] = useState<'vitals' | 'obstetric' | 'cervical' | 'supplements' | 'medical'>('vitals');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [age, setAge] = useState(initialData?.age || 28);
  const [gestationalWeeks, setGestationalWeeks] = useState(initialData?.gestationalWeeks || 24);
  const [location, setLocation] = useState(initialData?.location || 'New Delhi, India');
  const [heightCm, setHeightCm] = useState(initialData?.heightCm || 161);
  const [weightKg, setWeightKg] = useState(initialData?.weightKg || 65);
  const [bloodPressureSys, setBloodPressureSys] = useState(initialData?.bloodPressureSys || 120);
  const [bloodPressureDia, setBloodPressureDia] = useState(initialData?.bloodPressureDia || 80);
  const [heartRate, setHeartRate] = useState(initialData?.heartRate || 78);

  // Labs
  const [fastingBloodSugar, setFastingBloodSugar] = useState(initialData?.fastingBloodSugar || 92);
  const [postPrandialBloodSugar, setPostPrandialBloodSugar] = useState(initialData?.postPrandialBloodSugar || 126);
  const [hba1c, setHba1c] = useState(initialData?.hba1c || 5.4);
  const [hemoglobin, setHemoglobin] = useState(initialData?.hemoglobin || 11.2);

  // Obstetric
  const [gravidity, setGravidity] = useState(initialData?.gravidity || 2);
  const [parity, setParity] = useState(initialData?.parity || 1);
  const [priorGDM, setPriorGDM] = useState(initialData?.priorGDM || false);
  const [familyHistoryDiabetes, setFamilyHistoryDiabetes] = useState(true);
  const [priorComplications, setPriorComplications] = useState(initialData?.priorComplications || '');

  // Cervical
  const [papSmearHistory, setPapSmearHistory] = useState(initialData?.papSmearHistory || 'normal_recent');
  const [hpvStatus, setHpvStatus] = useState(initialData?.hpvStatus || 'negative');
  const [smokingStatus, setSmokingStatus] = useState(initialData?.smokingStatus || false);
  const [smokingYears, setSmokingYears] = useState(initialData?.smokingYears || 0);
  const [sexualPartners, setSexualPartners] = useState(initialData?.sexualPartners || 1);
  const [hormonalContraceptiveYears, setHormonalContraceptiveYears] = useState(initialData?.hormonalContraceptiveYears || 2);
  const [familyHistoryCervical, setFamilyHistoryCervical] = useState(initialData?.familyHistoryCervical || false);
  const [stdsHistory, setStdsHistory] = useState(initialData?.stdsHistory || false);

  // Prenatal Supplements & Reminder Preference
  const [tookIronFolicAcid, setTookIronFolicAcid] = useState(initialData?.supplementAdherence?.ironFolicAcid ?? true);
  const [tookCalciumVitD, setTookCalciumVitD] = useState(initialData?.supplementAdherence?.calciumVitD ?? true);
  const [tookPrenatalMulti, setTookPrenatalMulti] = useState(initialData?.supplementAdherence?.prenatalMultivitamin ?? true);
  const [tookDhaOmega3, setTookDhaOmega3] = useState(initialData?.supplementAdherence?.dhaOmega3 ?? true);
  const [adherenceRating, setAdherenceRating] = useState<'Full' | 'Partial' | 'Missed'>(initialData?.supplementAdherence?.adherenceRating || 'Full');
  const [supplementNotes, setSupplementNotes] = useState(initialData?.supplementAdherence?.notes || '');
  const [dietaryPreference, setDietaryPreference] = useState<'vegetarian' | 'non-vegetarian' | 'vegan' | 'eggetarian'>('vegetarian');
  
  // Daily Reminder Toggle (Saves directly to user profile)
  const [reminderEnabled, setReminderEnabled] = useState(initialData?.supplementAdherence?.reminderEnabled ?? true);
  const [reminderTime, setReminderTime] = useState(initialData?.supplementAdherence?.reminderTime || '09:00 AM');
  const [reminderFrequency, setReminderFrequency] = useState<'daily' | 'twice_daily'>('daily');

  // Medical
  const [chronicDiseasesInput, setChronicDiseasesInput] = useState('');
  const [medicationsInput, setMedicationsInput] = useState('Prenatal multivitamin, Iron-Folic acid');
  const [allergiesInput, setAllergiesInput] = useState('None');
  const [notes, setNotes] = useState('');

  // Auto calculate BMI
  const heightM = heightCm / 100;
  const calculatedBmi = +(weightKg / (heightM * heightM)).toFixed(1);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await onSubmit({
        patientId,
        age: Number(age),
        gestationalWeeks: Number(gestationalWeeks),
        location,
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        bmi: calculatedBmi,
        bloodPressureSys: Number(bloodPressureSys),
        bloodPressureDia: Number(bloodPressureDia),
        heartRate: Number(heartRate),
        fastingBloodSugar: Number(fastingBloodSugar),
        postPrandialBloodSugar: Number(postPrandialBloodSugar),
        hba1c: Number(hba1c),
        hemoglobin: Number(hemoglobin),
        gravidity: Number(gravidity),
        parity: Number(parity),
        priorGDM: Boolean(priorGDM),
        familyHistoryDiabetes: Boolean(familyHistoryDiabetes),
        priorComplications,
        papSmearHistory,
        hpvStatus,
        smokingStatus: Boolean(smokingStatus),
        smokingYears: Number(smokingYears),
        sexualPartners: Number(sexualPartners),
        hormonalContraceptiveYears: Number(hormonalContraceptiveYears),
        familyHistoryCervical: Boolean(familyHistoryCervical),
        stdsHistory: Boolean(stdsHistory),
        supplementAdherence: {
          ironFolicAcid: Boolean(tookIronFolicAcid),
          calciumVitD: Boolean(tookCalciumVitD),
          prenatalMultivitamin: Boolean(tookPrenatalMulti),
          dhaOmega3: Boolean(tookDhaOmega3),
          adherenceRating,
          reminderEnabled: Boolean(reminderEnabled),
          reminderTime,
          notes: supplementNotes,
        },
        supplementReminderEnabled: Boolean(reminderEnabled),
        supplementReminderTime: reminderTime,
        supplementReminderFrequency: reminderFrequency,
        chronicDiseases: chronicDiseasesInput.split(',').map((s) => s.trim()).filter(Boolean),
        medications: medicationsInput.split(',').map((s) => s.trim()).filter(Boolean),
        allergies: allergiesInput.split(',').map((s) => s.trim()).filter(Boolean),
        dietaryPreference,
        notes,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit health record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Log Maternal Health Data</h3>
              <p className="text-[11px] text-rose-100">Updates live AI risk predictions and nutrition requirements</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setTab('vitals')}
            className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
              tab === 'vitals'
                ? 'border-rose-600 text-rose-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            1. Vitals &amp; Labs
          </button>
          <button
            type="button"
            onClick={() => setTab('obstetric')}
            className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
              tab === 'obstetric'
                ? 'border-rose-600 text-rose-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            2. Obstetric &amp; GDM
          </button>
          <button
            type="button"
            onClick={() => setTab('cervical')}
            className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
              tab === 'cervical'
                ? 'border-rose-600 text-rose-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            3. Cervical Screening
          </button>
          <button
            type="button"
            onClick={() => setTab('supplements')}
            className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
              tab === 'supplements'
                ? 'border-rose-600 text-rose-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Pill className="w-3.5 h-3.5 text-rose-500" />
            <span>4. Supplements &amp; Reminder</span>
            {reminderEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Daily Reminder Active" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab('medical')}
            className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
              tab === 'medical'
                ? 'border-rose-600 text-rose-700 bg-white font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            5. Medical &amp; Notes
          </button>
        </div>

        {errorMessage && (
          <div className="m-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* TAB 1: Vitals & Labs */}
          {tab === 'vitals' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Maternal Age (years)</label>
                  <input
                    type="number"
                    min="15"
                    max="60"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gestational Age (weeks)</label>
                  <input
                    type="number"
                    min="1"
                    max="42"
                    value={gestationalWeeks}
                    onChange={(e) => setGestationalWeeks(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Clinic / Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Calculated BMI</label>
                  <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-center">
                    {calculatedBmi} kg/m²
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
                <label className="block font-bold text-slate-800 text-[11px] uppercase tracking-wider">Clinical Dietary Preference</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['vegetarian', 'non-vegetarian', 'vegan', 'eggetarian'] as const).map((pref) => (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setDietaryPreference(pref)}
                      className={`py-2 px-2 rounded-xl font-bold text-[10px] capitalize transition-all border ${
                        dietaryPreference === pref
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 italic">This selection will instantly recalibrate your 7-day clinical meal plan upon submission.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={bloodPressureSys}
                    onChange={(e) => setBloodPressureSys(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                    placeholder="120"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={bloodPressureDia}
                    onChange={(e) => setBloodPressureDia(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                    placeholder="80"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Metabolic &amp; Hematology Lab Values
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Fasting Sugar (mg/dL)</label>
                    <input
                      type="number"
                      value={fastingBloodSugar}
                      onChange={(e) => setFastingBloodSugar(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Post-Prandial (mg/dL)</label>
                    <input
                      type="number"
                      value={postPrandialBloodSugar}
                      onChange={(e) => setPostPrandialBloodSugar(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">HbA1c (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={hba1c}
                      onChange={(e) => setHba1c(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">Hemoglobin (g/dL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={hemoglobin}
                      onChange={(e) => setHemoglobin(Number(e.target.value))}
                      className="w-full p-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Obstetric & GDM */}
          {tab === 'obstetric' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gravidity (Total Pregnancies)</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={gravidity}
                    onChange={(e) => setGravidity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parity (Delivered Deliveries)</label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={parity}
                    onChange={(e) => setParity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={priorGDM}
                    onChange={(e) => setPriorGDM(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-semibold text-slate-800">
                    Patient had Gestational Diabetes in a prior pregnancy
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={familyHistoryDiabetes}
                    onChange={(e) => setFamilyHistoryDiabetes(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-semibold text-slate-800">
                    First-degree family history of Type 2 Diabetes (Parents / Siblings)
                  </span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prior Pregnancy Complications (if any)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Mild preeclampsia, macrosomic infant (>4kg), polyhydramnios..."
                  value={priorComplications}
                  onChange={(e) => setPriorComplications(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Cervical Screening & HPV */}
          {tab === 'cervical' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pap Smear (Cytology) History</label>
                  <select
                    value={papSmearHistory}
                    onChange={(e) => setPapSmearHistory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="never">Never screened</option>
                    <option value="normal_recent">Normal result within last 3 years</option>
                    <option value="abnormal_past">Abnormal result in the past (&gt;3 years ago)</option>
                    <option value="abnormal_recent">Recent abnormal result (ASC-US / LSIL / HSIL)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">High-Risk HPV DNA Status</label>
                  <select
                    value={hpvStatus}
                    onChange={(e) => setHpvStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="negative">Negative / Normal</option>
                    <option value="positive_high_risk">Positive (High-risk strains 16/18/45)</option>
                    <option value="unknown">Not tested / Unknown</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Number of Sexual Partners</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={sexualPartners}
                    onChange={(e) => setSexualPartners(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hormonal Contraceptive Use (years)</label>
                  <input
                    type="number"
                    min="0"
                    max="25"
                    value={hormonalContraceptiveYears}
                    onChange={(e) => setHormonalContraceptiveYears(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-2.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smokingStatus}
                    onChange={(e) => setSmokingStatus(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span className="font-semibold text-slate-800">Current or past tobacco smoker</span>
                </label>
                {smokingStatus && (
                  <div className="pl-6 pt-1">
                    <label className="block text-[11px] text-slate-600 mb-1">Smoking duration (years)</label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={smokingYears}
                      onChange={(e) => setSmokingYears(Number(e.target.value))}
                      className="w-32 p-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stdsHistory}
                    onChange={(e) => setStdsHistory(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span className="font-semibold text-slate-800">History of STDs / Genital Warts / Condyloma</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={familyHistoryCervical}
                    onChange={(e) => setFamilyHistoryCervical(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span className="font-semibold text-slate-800">Family history of Cervical Cancer</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: Prenatal Supplements & Reminder */}
          {tab === 'supplements' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Daily Prenatal Micronutrient Adherence</h4>
                    <p className="text-[11px] text-slate-500">Record supplements consumed today as prescribed by your obstetrician</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-rose-700 bg-white px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs">
                  WHO &amp; FOGSI Protocol
                </span>
              </div>

              {/* Supplements checkboxes grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Iron & Folic Acid */}
                <div
                  onClick={() => setTookIronFolicAcid(!tookIronFolicAcid)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    tookIronFolicAcid
                      ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={tookIronFolicAcid}
                    onChange={(e) => setTookIronFolicAcid(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Iron &amp; Folic Acid (IFA)</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                        Daily
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      60mg elemental iron + 400mcg folic acid for maternal anemia prevention.
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">💡 Best taken with lemon/water, not milk.</p>
                  </div>
                </div>

                {/* Calcium & Vit D3 */}
                <div
                  onClick={() => setTookCalciumVitD(!tookCalciumVitD)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    tookCalciumVitD
                      ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={tookCalciumVitD}
                    onChange={(e) => setTookCalciumVitD(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Calcium &amp; Vitamin D3</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                        500mg
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Fetal skeletal ossification &amp; preeclampsia risk mitigation.
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">💡 Separate by ≥2 hours from Iron dose.</p>
                  </div>
                </div>

                {/* Prenatal Multivitamin */}
                <div
                  onClick={() => setTookPrenatalMulti(!tookPrenatalMulti)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    tookPrenatalMulti
                      ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={tookPrenatalMulti}
                    onChange={(e) => setTookPrenatalMulti(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Prenatal Multivitamin</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                        Multi-micronutrient
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Zinc, Iodine, Vitamin B-Complex, Vitamin C, and Selenium.
                    </p>
                  </div>
                </div>

                {/* DHA / Omega-3 */}
                <div
                  onClick={() => setTookDhaOmega3(!tookDhaOmega3)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    tookDhaOmega3
                      ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={tookDhaOmega3}
                    onChange={(e) => setTookDhaOmega3(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Omega-3 / DHA</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                        200mg DHA
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Fetal neuro-cognitive wiring &amp; retinal photoreceptor maturation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Overall Adherence Rating */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block font-bold text-slate-800">Today&apos;s Supplement Adherence Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Full', 'Partial', 'Missed'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setAdherenceRating(lvl)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs transition-all border ${
                        adherenceRating === lvl
                          ? lvl === 'Full'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : lvl === 'Partial'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lvl === 'Full' ? '✓ Fully Adherent' : lvl === 'Partial' ? '⚠️ Partially Taken' : '✕ Missed Today'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Small Reminder Toggle that Saves Preference to User Profile */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">Daily Supplement Reminder</span>
                      <span className="text-[11px] text-slate-500">
                        Saves notification preference directly to your patient profile
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderEnabled}
                      onChange={(e) => setReminderEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Conditional Reminder Settings */}
                {reminderEnabled && (
                  <div className="pt-2 border-t border-indigo-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Scheduled Reminder Time
                      </label>
                      <select
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      >
                        <option value="08:00 AM">08:00 AM (Breakfast Time)</option>
                        <option value="09:00 AM">09:00 AM (Morning Standard)</option>
                        <option value="01:00 PM">01:00 PM (After Lunch)</option>
                        <option value="06:00 PM">06:00 PM (Early Evening)</option>
                        <option value="09:00 PM">09:00 PM (Bedtime / Calcium)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Alert Frequency
                      </label>
                      <select
                        value={reminderFrequency}
                        onChange={(e) => setReminderFrequency(e.target.value as any)}
                        className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      >
                        <option value="daily">Once Daily (Standard)</option>
                        <option value="twice_daily">Twice Daily (Iron morning + Calcium night)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 text-[10px] text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Preference confirmed: Active reminders will notify you at {reminderTime} ({reminderFrequency}).</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tolerance / Nausea Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Took with orange juice; no metallic taste or constipation noted"
                  value={supplementNotes}
                  onChange={(e) => setSupplementNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>
          )}

          {/* TAB 5: General Medical */}
          {tab === 'medical' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chronic Diseases (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Hypothyroidism, Hypertension, PCOS..."
                  value={chronicDiseasesInput}
                  onChange={(e) => setChronicDiseasesInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Medications (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Iron supplement, Folic acid 5mg, L-Thyroxine..."
                  value={medicationsInput}
                  onChange={(e) => setMedicationsInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Allergies (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa drugs, Peanuts..."
                  value={allergiesInput}
                  onChange={(e) => setAllergiesInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Visit Notes</label>
                <textarea
                  rows={3}
                  placeholder="Additional patient observations, dietary notes, or symptoms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>

            <div className="flex gap-2">
              {tab !== 'medical' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (tab === 'vitals') setTab('obstetric');
                    else if (tab === 'obstetric') setTab('cervical');
                    else if (tab === 'cervical') setTab('supplements');
                    else if (tab === 'supplements') setTab('medical');
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
                >
                  Continue Next Tab →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Evaluating Risks...' : 'Save & Calculate Risks'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
