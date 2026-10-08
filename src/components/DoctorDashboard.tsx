import React, { useState } from 'react';
import { User, HealthRecord, PredictionResult, NutritionPlan, DoctorNote } from '../types';
import { RiskGauge, FeatureContributionList, TrendLineChart } from './Charts';
import { CommunicationPanel } from './CommunicationPanel';
import {
  Stethoscope,
  Search,
  User as UserIcon,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Activity,
  FileText,
  Plus,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Edit3,
  Droplets,
  Heart,
  MessageSquare,
} from 'lucide-react';

interface DoctorDashboardProps {
  doctor: User;
  patients: any[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  onAddDoctorNote: (patientId: string, noteText: string, recommendations: string[]) => Promise<void>;
  onApproveNutrition: (patientId: string, status: string, notes?: string) => Promise<void>;
  onOpenReportModal: () => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctor,
  patients,
  selectedPatientId,
  onSelectPatient,
  onAddDoctorNote,
  onApproveNutrition,
  onOpenReportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [newNoteText, setNewNoteText] = useState('');
  const [newRecInput, setNewRecInput] = useState('');
  const [recommendationsList, setRecommendationsList] = useState<string[]>([]);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [activeDrilldownTab, setActiveDrilldownTab] = useState<'chart' | 'communication'>('chart');

  // Selected patient details
  const activePatientData = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const records: HealthRecord[] = activePatientData?.records || (activePatientData?.latestRecord ? [activePatientData.latestRecord] : []);
  const latestRecord: HealthRecord | undefined = activePatientData?.latestRecord || records[records.length - 1];
  const predictions: { gdm: PredictionResult; cervical: PredictionResult } | undefined = activePatientData?.predictions;
  const notes: DoctorNote[] = activePatientData?.notes || [];
  const nutrition: NutritionPlan | undefined = activePatientData?.nutrition;

  // Filtered patients
  const filteredPatients = patients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterRisk === 'all') return true;
    const gdmRisk = p.predictions?.gdm?.riskCategory?.toLowerCase();
    const ccRisk = p.predictions?.cervical?.riskCategory?.toLowerCase();
    return gdmRisk === filterRisk || ccRisk === filterRisk;
  });

  const handleAddRecommendation = () => {
    if (newRecInput.trim()) {
      setRecommendationsList([...recommendationsList, newRecInput.trim()]);
      setNewRecInput('');
    }
  };

  const handleRemoveRecommendation = (index: number) => {
    setRecommendationsList(recommendationsList.filter((_, i) => i !== index));
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !activePatientData) return;
    setIsSubmittingNote(true);
    try {
      await onAddDoctorNote(activePatientData.id, newNoteText.trim(), recommendationsList);
      setNewNoteText('');
      setRecommendationsList([]);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Prepare longitudinal data
  const glucoseData = records.map((r, i) => ({
    label: r.gestationalWeeks ? `Wk ${r.gestationalWeeks}` : `V${i + 1}`,
    value: r.postPrandialBloodSugar,
    secondaryValue: r.fastingBloodSugar,
  }));

  return (
    <div className="space-y-6">
      {/* Clinician Overview Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold text-xs border border-indigo-500/30 uppercase">
              {doctor.id === 'doc-2' ? 'Gynecologic Oncology & Colposcopy' : 'Obstetrics & Maternal-Fetal Medicine'}
            </span>
            <span className="text-xs text-slate-400">{doctor.clinicLocation || 'Apollo Maternal Network'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{doctor.name}</h1>
          <p className="text-xs text-slate-300">
            {doctor.specialty} • Reviewing {patients.length} maternal cohorts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-medium">Model Engine:</span>
            <span className="text-white font-bold">GDM 95.2% • CC 96.8% Acc</span>
          </div>

          <button
            onClick={onOpenReportModal}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-indigo-300" />
            <span>Export Clinical Dossier</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Patient List, Right Clinical Drill-Down */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Patient List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-indigo-600" />
              Patient Cohort ({filteredPatients.length})
            </h3>
          </div>

          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {(['all', 'high', 'medium', 'low'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterRisk(lvl)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                    filterRisk === lvl
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Cards */}
          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
            {filteredPatients.map((p) => {
              const isSelected = p.id === activePatientData?.id;
              const gdmRisk = p.predictions?.gdm?.riskCategory || 'Low';
              const ccRisk = p.predictions?.cervical?.riskCategory || 'Low';
              const isHighRisk = gdmRisk === 'High' || ccRisk === 'High';

              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPatient(p.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        {p.name}
                        {isHighRisk && (
                          <span title="High Risk Alert">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {p.latestRecord?.gestationalWeeks
                          ? `Week ${p.latestRecord.gestationalWeeks}`
                          : 'General Gynae'}{' '}
                        • Age {p.latestRecord?.age || 28}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 mt-1" />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        gdmRisk === 'High'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : gdmRisk === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      GDM: {gdmRisk}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        ccRisk === 'High'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : ccRisk === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      Cervical: {ccRisk}
                    </span>
                    {p.assignedDoctorId === doctor.id && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Assigned
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Patient Clinical Drill-Down (8 cols) */}
        {activePatientData ? (
          <div className="lg:col-span-8 space-y-6">
            {/* Patient Header Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900">{activePatientData.name}</h2>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                      ID: {activePatientData.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activePatientData.email} • Phone: {activePatientData.phone || 'N/A'} • Location: {latestRecord?.location || 'India'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    Gravida {latestRecord?.gravidity || 1} / Para {latestRecord?.parity || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveDrilldownTab(activeDrilldownTab === 'communication' ? 'chart' : 'communication')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                      activeDrilldownTab === 'communication'
                        ? 'bg-slate-900 text-white'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{activeDrilldownTab === 'communication' ? 'Clinical Chart' : 'Direct Message'}</span>
                  </button>
                </div>
              </div>

              {/* Patient Key Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Current Glucose</span>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">
                    {latestRecord?.postPrandialBloodSugar || 110} <span className="text-xs font-normal text-slate-500">mg/dL</span>
                  </p>
                  <span className="text-[10px] text-slate-500">Fasting: {latestRecord?.fastingBloodSugar || 90} mg/dL</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Blood Pressure</span>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">
                    {latestRecord?.bloodPressureSys || 120}/{latestRecord?.bloodPressureDia || 80}{' '}
                    <span className="text-xs font-normal text-slate-500">mmHg</span>
                  </p>
                  <span className="text-[10px] text-slate-500">Pulse: {latestRecord?.heartRate || 78} bpm</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400">BMI / Anthropometry</span>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">
                    {latestRecord?.bmi || 24.2} <span className="text-xs font-normal text-slate-500">kg/m²</span>
                  </p>
                  <span className="text-[10px] text-slate-500">Weight: {latestRecord?.weightKg || 60} kg</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Hemoglobin / Anemia</span>
                  <p className="text-base font-extrabold text-slate-900 mt-0.5">
                    {latestRecord?.hemoglobin || 11.2} <span className="text-xs font-normal text-slate-500">g/dL</span>
                  </p>
                  <span className="text-[10px] text-slate-500">HbA1c: {latestRecord?.hba1c ? `${latestRecord.hba1c}%` : 'Pending'}</span>
                </div>
              </div>
            </div>

            {/* View Mode Switcher Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveDrilldownTab('chart')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeDrilldownTab === 'chart'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Activity className="w-4 h-4 text-rose-500" />
                <span>Clinical Records, AI Risk &amp; Nutrition</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveDrilldownTab('communication')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  activeDrilldownTab === 'communication'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-indigo-700'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Doctor-Patient Communication Panel</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            </div>

            {activeDrilldownTab === 'communication' ? (
              <CommunicationPanel
                currentUser={doctor}
                patientId={activePatientData.id}
                patientName={activePatientData.name}
                doctorName={doctor.name}
                isDoctorView={true}
                patientContext={{
                  age: latestRecord?.age,
                  gestationalWeeks: latestRecord?.gestationalWeeks,
                  gdmRisk: predictions?.gdm?.riskCategory,
                  cervicalRisk: predictions?.cervical?.riskCategory,
                  latestSugar: latestRecord?.postPrandialBloodSugar,
                  latestBP: latestRecord ? `${latestRecord.bloodPressureSys}/${latestRecord.bloodPressureDia}` : undefined,
                }}
              />
            ) : (
              <div className="space-y-6">
                {/* AI Risk Model Explainability Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* GDM Explainability */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-amber-600" />
                    GDM Risk Assessment
                  </h3>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      predictions?.gdm.riskCategory === 'High'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : predictions?.gdm.riskCategory === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {predictions?.gdm.riskCategory || 'Low'} Risk ({predictions?.gdm.scorePercentage || 25}%)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-800 block mb-1">Recommended Clinical Action</span>
                  <p>{predictions?.gdm.clinicalAction}</p>
                </div>

                {predictions?.gdm.topFactors && (
                  <FeatureContributionList
                    factors={predictions.gdm.topFactors}
                    title="Model Feature Contributions (SHAP / Odds Ratios)"
                  />
                )}
              </div>

              {/* Cervical Cancer Explainability */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    Cervical Dysplasia / HPV Risk
                  </h3>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      predictions?.cervical.riskCategory === 'High'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : predictions?.cervical.riskCategory === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {predictions?.cervical.riskCategory || 'Low'} Risk ({predictions?.cervical.scorePercentage || 12}%)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-800 block mb-1">Recommended Cytology Action</span>
                  <p>{predictions?.cervical.clinicalAction}</p>
                </div>

                {predictions?.cervical.topFactors && (
                  <FeatureContributionList
                    factors={predictions.cervical.topFactors}
                    title="Key Risk &amp; Protective Markers"
                  />
                )}
              </div>
            </div>

            {/* Longitudinal Trend Chart - Image Reference Style */}
            <TrendLineChart
              data={glucoseData}
              title={`BLOOD GLUCOSE TREND (LONGITUDINAL)`}
              subtitle={`Fasting vs Post-Prandial Glycemic Progression (${activePatientData.name})`}
              unit="mg/dL"
              primaryLabel="2hr Post-Prandial"
              secondaryLabel="Fasting Glucose"
              primaryColor="#4f46e5"
              secondaryColor="#0d9488"
              targetMax={140}
              summaryStats={[
                {
                  label: 'Current 2hr Sugar',
                  value: `${latestRecord?.postPrandialBloodSugar || 110} mg/dL`,
                  badge: (latestRecord?.postPrandialBloodSugar || 0) <= 140 ? 'Controlled' : 'High',
                  badgeColor: (latestRecord?.postPrandialBloodSugar || 0) <= 140 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
                },
                {
                  label: 'Fasting Value',
                  value: `${latestRecord?.fastingBloodSugar || 90} mg/dL`,
                  badge: 'Normal',
                  badgeColor: 'bg-teal-50 text-teal-700',
                },
                {
                  label: 'Target Limit',
                  value: '≤ 140 mg/dL',
                  badge: 'ACOG Protocol',
                  badgeColor: 'bg-amber-50 text-amber-800',
                },
              ]}
            />



            {/* Clinical Notes & Action Plan Form */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Clinical Note &amp; Recommendations</h3>
                  <p className="text-[11px] text-slate-500">Visible on patient dashboard and medical report</p>
                </div>
              </div>

              <form onSubmit={handleSubmitNote} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Physician Clinical Note / Assessment
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter clinical assessment, lab interpretations, and follow-up guidance..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specific Patient Action Items (e.g. Schedule OGTT, dietary timing)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add an actionable recommendation..."
                      value={newRecInput}
                      onChange={(e) => setNewRecInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRecommendation();
                        }
                      }}
                      className="flex-1 p-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddRecommendation}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {recommendationsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {recommendationsList.map((rec, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200"
                        >
                          <span>{rec}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRecommendation(i)}
                            className="text-indigo-400 hover:text-indigo-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingNote}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                  >
                    {isSubmittingNote ? 'Saving Note...' : 'Save & Update Patient Chart'}
                  </button>
                </div>
              </form>

              {/* Historical Notes */}
              {notes.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Past Clinical Notes</h4>
                  <div className="space-y-2">
                    {notes.map((n) => (
                      <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                          <span>{n.doctorName}</span>
                          <span>{new Date(n.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-800">{n.noteText}</p>
                        {n.recommendations && n.recommendations.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {n.recommendations.map((r, ri) => (
                              <div key={ri} className="flex items-center gap-1 text-[11px] text-slate-600">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>{r}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </div>
          )}
          </div>
        ) : (
          <div className="lg:col-span-8 bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400">
            Select a patient from the list to view clinical drill-down
          </div>
        )}
      </div>
    </div>
  );
};
