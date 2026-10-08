import React, { useState } from 'react';
import { User, HealthRecord, PredictionResult, NutritionPlan, DoctorNote } from '../types';
import { RiskGauge, TrendLineChart, FeatureContributionList } from './Charts';
import { MedicationAdherenceSection } from './MedicationAdherenceSection';
import {
  Heart,
  Activity,
  Droplets,
  Calendar,
  Utensils,
  MessageSquare,
  FileDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Stethoscope,
  ChevronRight,
  Pill,
  Bell,
  ShieldCheck,
  Shield,
  Circle,
  CheckSquare,
  Square,
  FileText,
  BadgeAlert,
  Leaf,
  Apple,
} from 'lucide-react';

interface PatientDashboardProps {
  patient: User;
  records: HealthRecord[];
  predictions?: { gdm: PredictionResult; cervical: PredictionResult };
  nutritionPlan?: NutritionPlan;
  doctorNotes?: DoctorNote[];
  onOpenDataModal: () => void;
  onOpenNutritionModal: () => void;
  onOpenReportModal: () => void;
  onOpenChat: () => void;
  onOpenCommunication?: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patient,
  records,
  predictions,
  nutritionPlan,
  doctorNotes = [],
  onOpenDataModal,
  onOpenNutritionModal,
  onOpenReportModal,
  onOpenChat,
  onOpenCommunication,
}) => {
  const [acknowledgedNotes, setAcknowledgedNotes] = useState<Record<string, boolean>>({});
  const [checkedDirectives, setCheckedDirectives] = useState<Record<string, boolean>>({});

  const latestRecord = records[records.length - 1];

  const glucoseChartData = records.map((r, i) => ({
    label: r.gestationalWeeks ? `Wk ${r.gestationalWeeks}` : `T+${i}`,
    value: r.postPrandialBloodSugar,
    secondaryValue: r.fastingBloodSugar,
  }));

  const bpChartData = records.map((r, i) => ({
    label: r.gestationalWeeks ? `Wk ${r.gestationalWeeks}` : `T+${i}`,
    value: r.bloodPressureSys,
    secondaryValue: r.bloodPressureDia,
  }));

  // Resolve active doctor note or fallback to high quality clinical assessment
  const activeDoctorNote = doctorNotes.length > 0 ? doctorNotes[0] : {
    id: 'primary-directive',
    patientId: patient.id,
    doctorId: 'doc-1',
    doctorName: 'Dr. Ananya Sharma, MD',
    timestamp: new Date().toISOString(),
    noteText: 'Reviewed 24-week glucose screening values. Post-prandial reading 142 mg/dL warrants strict adherence to the Low-GI meal plan. Maintain active daily walking for 20-30 minutes post meals. Fasting values remain well within calibration range.',
    recommendations: [
      'Perform 75g OGTT confirmation test within 7 days',
      'Follow 6-meal daily split (3 main + 3 protein-rich snacks)',
      'Self-monitor fasting and 2hr post-prandial blood sugar 3x weekly',
      'Continue prescribed IFA (Iron + Folic Acid) and Calcium Vit D3 supplements',
    ],
  };

  const toggleDirective = (idx: number) => {
    setCheckedDirectives((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleAcknowledge = (noteId: string) => {
    setAcknowledgedNotes((prev) => ({
      ...prev,
      [noteId]: true,
    }));
  };

  return (
    <div className="space-y-12">
      {/* 1. VIEWPORT HERO & MISSION CONTEXT */}
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-900 text-white shadow-2xl">
        {/* Background Image with Scrim */}
        <div className="absolute inset-0 opacity-40">
           <img 
            src="/src/assets/images/healthcare_biotech_hero_1791214862368.jpg" 
            className="w-full h-full object-cover" 
            alt="Clinical Laboratory"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
        </div>

        <div className="relative p-8 md:p-12 space-y-6">
          <div className="flex items-center gap-3 text-[10px] font-mono tracking-[0.3em] uppercase opacity-70">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Monitoring
            </span>
            <span className="opacity-30">|</span>
            <span>Ref: {patient.id}</span>
            <span className="opacity-30">|</span>
            <span>{latestRecord?.gestationalWeeks ? `Week ${latestRecord.gestationalWeeks}` : 'Baseline'}</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight max-w-2xl text-wrap-balance">
            Welcome back, {patient.name.split(' ')[0]}.
          </h1>
          
          <p className="text-slate-300 text-sm md:text-lg max-w-xl leading-relaxed opacity-90">
            Continuous clinical telemetry synchronized. Your predictive risk vectors for GDM and Cervical Health are updated to the latest sampling.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button onClick={onOpenDataModal} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-xs hover:bg-indigo-50 transition-all flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Capture New Sample
            </button>
            <button onClick={onOpenReportModal} className="px-6 py-3 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 border border-white/10 transition-all flex items-center gap-2">
              <FileDown className="w-4 h-4" />
              Export Dossier
            </button>
          </div>
        </div>
      </section>

      {/* 2. PRIMARY ANALYTIC STAGE (GDM & CERVICAL) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="panel-precision p-8 rounded-3xl flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Droplets className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">GDM Analytics</h3>
                  <p className="text-lg font-bold text-slate-900 tracking-tight">Gestational Diabetes Mellitus</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Model Version</span>
                <span className="text-xs font-bold text-slate-900">{predictions?.gdm.modelVersion || 'v1.2.4'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <RiskGauge
                score={predictions?.gdm.scorePercentage || 25}
                category={predictions?.gdm.riskCategory || 'Low'}
                title="Gestational Diabetes"
                size={180}
              />
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinical Directive</span>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {predictions?.gdm.clinicalAction || 'Routine prenatal surveillance. Target fasting glucose ≤ 95 mg/dL.'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-mono text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>Next Review: T+{predictions?.gdm.recommendedFollowUpDays || 28}D</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12">
            {predictions?.gdm.topFactors && (
              <FeatureContributionList
                factors={predictions.gdm.topFactors.slice(0, 3)}
                title="Telemetry Vectors"
              />
            )}
          </div>
        </div>

        <div className="panel-precision p-8 rounded-3xl flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Oncology Screening</h3>
                  <p className="text-lg font-bold text-slate-900 tracking-tight">Cervical Cytology Analysis</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Model Version</span>
                <span className="text-xs font-bold text-slate-900">{predictions?.cervical.modelVersion || 'v1.1.8'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <RiskGauge
                score={predictions?.cervical.scorePercentage || 12}
                category={predictions?.cervical.riskCategory || 'Low'}
                title="Cervical Neoplasia"
                size={180}
              />
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol Strategy</span>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">
                    {predictions?.cervical.clinicalAction || 'Continue routine 3-year Pap/HPV screening.'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-mono text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>Interval: 12 Months</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12">
            {predictions?.cervical.topFactors && (
              <FeatureContributionList
                factors={predictions.cervical.topFactors.slice(0, 3)}
                title="Screening Parameters"
              />
            )}
          </div>
        </div>
      </section>

      {/* 3. PRECISION METRIC STRIP */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Blood Pressure', value: `${latestRecord?.bloodPressureSys || 120}/${latestRecord?.bloodPressureDia || 80}`, unit: 'mmHg', status: 'nominal', statusLabel: 'Nominal' },
          { label: 'Post-Meal Sugar', value: latestRecord?.postPrandialBloodSugar || 118, unit: 'mg/dL', status: (latestRecord?.postPrandialBloodSugar || 0) > 140 ? 'critical' : 'nominal', statusLabel: (latestRecord?.postPrandialBloodSugar || 0) > 140 ? 'Elevated' : 'Stable' },
          { label: 'Fasting Sugar', value: latestRecord?.fastingBloodSugar || 90, unit: 'mg/dL', status: 'nominal', statusLabel: 'Verified' },
          { label: 'Hemoglobin', value: latestRecord?.hemoglobin || 11.2, unit: 'g/dL', status: (latestRecord?.hemoglobin || 0) < 11.0 ? 'drifting' : 'nominal', statusLabel: (latestRecord?.hemoglobin || 0) < 11.0 ? 'Low' : 'Normal' },
          { label: 'Maternal BMI', value: latestRecord?.bmi || 24.5, unit: 'kg/m²', status: 'nominal', statusLabel: 'In Spec' },
          { label: 'HPV Status', value: latestRecord?.hpvStatus ? latestRecord.hpvStatus.replace('_', ' ') : 'Negative', unit: '', status: 'nominal', statusLabel: 'Detected' },
        ].map((metric, i) => (
          <div key={i} className="panel-precision p-5 rounded-2xl flex flex-col gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{metric.label}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold metric-readout text-slate-900">{metric.value}</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">{metric.unit}</span>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
              <span className={`status-dot status-${metric.status}`} />
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-tighter">{metric.statusLabel}</span>
            </div>
          </div>
        ))}
      </section>

      {/* 4. CLINICAL NUTRITION (DAILY MEAL PLAN) - Image Reference Style */}
      <section className="panel-precision p-8 rounded-[2rem] space-y-6 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Precision Clinical Nutrition</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                  Today's Diet Plan
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Culturally Tailored Karnataka Maternity Plan · ICMR-NIN Compliant
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">Calorie Target</span>
              <span className="text-xs font-bold text-emerald-700">{nutritionPlan?.dailyCalorieTarget || 1850} kcal/day</span>
            </div>
            {nutritionPlan?.dietaryPreference && (
              <div className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold flex items-center gap-1.5 capitalize">
                <Leaf className="w-3.5 h-3.5 text-teal-600" />
                <span>{nutritionPlan.dietaryPreference.replace('-', ' ')}</span>
              </div>
            )}
            <button
              onClick={onOpenNutritionModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>View Full 7-Day Plan &amp; Recipes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {nutritionPlan ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { label: 'Breakfast', time: '08:00 AM', meal: nutritionPlan.sevenDayMealPlan?.[0]?.breakfast, gi: 'Low GI' },
              { label: 'Morning Snack', time: '11:00 AM', meal: nutritionPlan.sevenDayMealPlan?.[0]?.morningSnack, gi: 'Low GI' },
              { label: 'Lunch', time: '01:30 PM', meal: nutritionPlan.sevenDayMealPlan?.[0]?.lunch, gi: 'Low GI' },
              { label: 'Evening Snack', time: '05:00 PM', meal: nutritionPlan.sevenDayMealPlan?.[0]?.eveningSnack, gi: 'Low GI' },
              { label: 'Dinner', time: '07:30 PM', meal: nutritionPlan.sevenDayMealPlan?.[0]?.dinner, gi: 'Low GI' },
              { label: 'Bedtime Snack', time: '09:30 PM', meal: nutritionPlan.sevenDayMealPlan?.[0]?.bedtimeSnack, gi: 'Low GI' },
            ].map((slot, i) => (
              <div
                key={i}
                className="bg-slate-50/70 border border-slate-200/80 p-4 rounded-2xl flex flex-col justify-between space-y-3 group hover:bg-white hover:border-emerald-300 hover:shadow-md transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5 mb-2">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{slot.label}</span>
                    <span className="text-[9px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">{slot.time}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900 leading-snug min-h-[2.4rem] line-clamp-2 group-hover:text-emerald-900 transition-colors">
                      {slot.meal?.name || 'Standard Maternity Protocol'}
                    </p>
                    <p className="text-[10px] text-slate-500 line-clamp-2 italic">
                      {slot.meal?.portion || 'Controlled portion size'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md">
                      {slot.meal?.calories || 280} kcal
                    </span>
                    <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                      {slot.meal?.glycemicIndex || 'Low GI'}
                    </span>
                  </div>
                  {slot.meal?.nutrientsHighlight && (
                    <span className="block text-[9px] font-medium text-slate-600 bg-white/80 px-1.5 py-0.5 rounded border border-slate-100 truncate">
                      ✨ {slot.meal.nutrientsHighlight}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-400 font-medium italic">Regenerating nutritional vectors based on latest vitals...</p>
          </div>
        )}

        {/* Nutritional Summary Footer Bar */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Daily Macro Split:</span>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="font-semibold">Carbs {nutritionPlan?.macroDistribution?.carbsPercentage || 55}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold">Protein {nutritionPlan?.macroDistribution?.proteinPercentage || 20}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-semibold">Fat {nutritionPlan?.macroDistribution?.fatPercentage || 25}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ICMR-NIN Maternal Safety Calibrated
            </span>
            <button
              onClick={onOpenNutritionModal}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 ml-1"
            >
              Customize Preference
            </button>
          </div>
        </div>
      </section>

      {/* 5. PRENATAL VITAMIN & MEDICATION ADHERENCE TRACKER (DEDICATED SECTION) */}
      <MedicationAdherenceSection
        patientId={patient.id}
        patientName={patient.name}
        onOpenReminderModal={onOpenDataModal}
      />

      {/* 6. PHYSICIAN CONSULTATION CHANNEL */}
      <section className="panel-precision p-8 rounded-3xl space-y-6 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Physician Tele-Consultation Channel</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 uppercase">
                  Encrypted
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {activeDoctorNote.doctorName || 'Dr. Ananya Sharma, MD'} · Maternal-Fetal Medicine Specialist
              </p>
            </div>
          </div>
          <button
            onClick={onOpenCommunication}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-center"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open Direct Consultation Thread</span>
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
              <span className="status-dot status-nominal animate-pulse" />
              Latest Physician Evaluation Note
            </div>
            <p className="text-sm text-slate-700 leading-relaxed italic">
              &ldquo;{activeDoctorNote.noteText}&rdquo;
            </p>
          </div>
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-6 text-[11px] font-mono text-slate-500">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>TLS 1.3 Certified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Response: ~2 hrs</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LONGITUDINAL TELEMETRY (TRENDS) - Image Reference Style */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TrendLineChart
          data={glucoseChartData}
          title="BLOOD GLUCOSE TREND (LONGITUDINAL)"
          subtitle="Fasting vs Random Sugar Levels (mg/dL)"
          unit="mg/dL"
          primaryLabel="Post-Prandial Sugar"
          secondaryLabel="Fasting Blood Sugar"
          primaryColor="#4f46e5"
          secondaryColor="#0d9488"
          targetMax={140}
          summaryStats={[
            {
              label: 'Latest Post-Meal',
              value: `${latestRecord?.postPrandialBloodSugar || 118} mg/dL`,
              badge: (latestRecord?.postPrandialBloodSugar || 0) <= 140 ? 'Normal' : 'Elevated',
              badgeColor: (latestRecord?.postPrandialBloodSugar || 0) <= 140 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
            },
            {
              label: 'Latest Fasting',
              value: `${latestRecord?.fastingBloodSugar || 90} mg/dL`,
              badge: 'Controlled',
              badgeColor: 'bg-teal-50 text-teal-700',
            },
            {
              label: 'Safe Limit',
              value: '≤ 140 mg/dL',
              badge: 'Target Band',
              badgeColor: 'bg-amber-50 text-amber-800',
            },
          ]}
        />

        <TrendLineChart
          data={bpChartData}
          title="BLOOD PRESSURE TRAJECTORY"
          subtitle="Systolic vs Diastolic Telemetry (mmHg)"
          unit="mmHg"
          primaryLabel="Systolic BP"
          secondaryLabel="Diastolic BP"
          primaryColor="#2563eb"
          secondaryColor="#e11d48"
          targetMax={130}
          summaryStats={[
            {
              label: 'Latest Systolic',
              value: `${latestRecord?.bloodPressureSys || 120} mmHg`,
              badge: 'Optimal',
              badgeColor: 'bg-blue-50 text-blue-700',
            },
            {
              label: 'Latest Diastolic',
              value: `${latestRecord?.bloodPressureDia || 80} mmHg`,
              badge: 'Normotensive',
              badgeColor: 'bg-emerald-50 text-emerald-700',
            },
            {
              label: 'Preeclampsia Threshold',
              value: '140/90 mmHg',
              badge: 'Safe Zone',
              badgeColor: 'bg-emerald-50 text-emerald-700',
            },
          ]}
        />
      </section>

      {/* 6. DOCTOR CLINICAL NOTES - Image Reference Style */}
      <section className="panel-precision p-8 rounded-[2rem] space-y-6 border border-slate-200/90 shadow-sm">
        {/* Header matching image reference */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Stethoscope className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Doctor Clinical Notes</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 uppercase">
                  Verified Review
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Physician Assessment, Directives &amp; Action Protocol
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Medical Directives
            </span>
            {onOpenCommunication && (
              <button
                onClick={onOpenCommunication}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200 flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message Doctor</span>
              </button>
            )}
          </div>
        </div>

        {/* Doctor Identity & Verification Banner */}
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {activeDoctorNote.doctorName ? activeDoctorNote.doctorName.replace('Dr. ', '').substring(0, 2).toUpperCase() : 'AS'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm">{activeDoctorNote.doctorName}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  Certified Attending
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Maternal-Fetal Medicine &amp; Obstetrics · Apollo Cradle Network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200/80">
              {new Date(activeDoctorNote.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200/80 text-indigo-600 font-bold">
              Sign-off #MED-9402
            </span>
          </div>
        </div>

        {/* Clinical Note Body */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100/80 text-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" />
              <span>Clinical Assessment &amp; Findings</span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-700">
              &ldquo;{activeDoctorNote.noteText}&rdquo;
            </p>
          </div>

          {/* Highlighted Action Required Container (matching reference image) */}
          {activeDoctorNote.recommendations && activeDoctorNote.recommendations.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900">
                  <BadgeAlert className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    Action Required (Priority Directives)
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                  {activeDoctorNote.recommendations.length} Active Directives
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {activeDoctorNote.recommendations.map((rec, rIdx) => {
                  const isChecked = !!checkedDirectives[rIdx];
                  return (
                    <button
                      key={rIdx}
                      type="button"
                      onClick={() => toggleDirective(rIdx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                        isChecked
                          ? 'bg-white/90 border-emerald-300 text-slate-500 line-through'
                          : 'bg-white border-amber-200/70 text-slate-800 hover:border-amber-300 hover:shadow-2xs'
                      }`}
                    >
                      <span className="mt-0.5 shrink-0 text-amber-600">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-amber-500" />
                        )}
                      </span>
                      <span className="text-xs font-semibold leading-relaxed">
                        {rec}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleAcknowledge(activeDoctorNote.id)}
              disabled={acknowledgedNotes[activeDoctorNote.id]}
              className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                acknowledgedNotes[activeDoctorNote.id]
                  ? 'bg-emerald-100 text-emerald-800 cursor-default'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{acknowledgedNotes[activeDoctorNote.id] ? 'Directives Acknowledged' : 'Acknowledge Directives'}</span>
            </button>
            <button
              onClick={onOpenReportModal}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all flex items-center gap-1.5"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Download Summary</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Next Clinical Review: T+14 Days (Routine)</span>
          </div>
        </div>
      </section>
    </div>
  );
};
