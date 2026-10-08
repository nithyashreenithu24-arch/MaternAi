import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { User, HealthRecord, PredictionResult, NutritionPlan, DoctorNote } from '../types';
import {
  X,
  FileDown,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Heart,
  Droplets,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: User;
  latestRecord?: HealthRecord;
  predictions?: { gdm: PredictionResult; cervical: PredictionResult };
  nutritionPlan?: NutritionPlan;
  doctorNotes?: DoctorNote[];
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  patient,
  latestRecord,
  predictions,
  nutritionPlan,
  doctorNotes = [],
}) => {
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const margin = 15;
      let y = 20;

      // Header Banner
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Matern AI - Comprehensive Maternal Health Report', margin, 12);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()} | Confidential Medical Summary`, margin, 20);

      y = 36;

      // Patient Demographics
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('1. PATIENT DEMOGRAPHICS & CLINICAL BOOKING', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Patient Name: ${patient.name}`, margin, y);
      doc.text(`Patient ID: ${patient.id}`, 110, y);
      y += 5;
      doc.text(`Maternal Age: ${latestRecord?.age || 28} years`, margin, y);
      doc.text(`Gestational Age: ${latestRecord?.gestationalWeeks ? `${latestRecord.gestationalWeeks} weeks` : 'N/A'}`, 110, y);
      y += 5;
      doc.text(`Obstetric History: Gravida ${latestRecord?.gravidity || 1}, Para ${latestRecord?.parity || 0}`, margin, y);
      doc.text(`Facility: ${latestRecord?.location || 'New Delhi, India'}`, 110, y);
      y += 9;

      // Baseline Vitals & Labs
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('2. LATEST CLINICAL VITALS & METABOLIC BIOMARKERS', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Blood Pressure: ${latestRecord?.bloodPressureSys || 120}/${latestRecord?.bloodPressureDia || 80} mmHg`, margin, y);
      doc.text(`Heart Rate: ${latestRecord?.heartRate || 78} bpm`, 110, y);
      y += 5;
      doc.text(`Post-Prandial Glucose (2h): ${latestRecord?.postPrandialBloodSugar || 118} mg/dL`, margin, y);
      doc.text(`Fasting Glucose: ${latestRecord?.fastingBloodSugar || 90} mg/dL`, 110, y);
      y += 5;
      doc.text(`Hemoglobin (Hb): ${latestRecord?.hemoglobin || 11.2} g/dL`, margin, y);
      doc.text(`HbA1c: ${latestRecord?.hba1c ? `${latestRecord.hba1c}%` : 'Not recorded'}`, 110, y);
      y += 5;
      doc.text(`Body Mass Index (BMI): ${latestRecord?.bmi || 24.5} kg/m²`, margin, y);
      doc.text(`Weight: ${latestRecord?.weightKg || 60} kg`, 110, y);
      y += 9;

      // AI Risk Predictions
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('3. AI PREDICTIVE RISK STRATIFICATION', margin, y);
      y += 6;

      // GDM Box
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, 85, 34, 'F');
      doc.rect(margin, y, 85, 34, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Gestational Diabetes (GDM) Risk', margin + 3, y + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      const gdmCategory = predictions?.gdm.riskCategory || 'Low';
      doc.text(`${gdmCategory} Risk (${predictions?.gdm.scorePercentage || 25}%)`, margin + 3, y + 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Action: ${predictions?.gdm.clinicalAction.slice(0, 50) || 'Routine surveillance'}...`, margin + 3, y + 21, { maxWidth: 78 });
      doc.text(`Model: ${predictions?.gdm.modelVersion || 'v1.2.4'}`, margin + 3, y + 31);

      // Cervical Box
      doc.setFillColor(248, 250, 252);
      doc.rect(105, y, 85, 34, 'F');
      doc.rect(105, y, 85, 34, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Cervical Cancer / HPV Risk', 108, y + 6);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      const ccCategory = predictions?.cervical.riskCategory || 'Low';
      doc.text(`${ccCategory} Risk (${predictions?.cervical.scorePercentage || 12}%)`, 108, y + 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Action: ${predictions?.cervical.clinicalAction.slice(0, 50) || 'Routine surveillance'}...`, 108, y + 21, { maxWidth: 78 });
      doc.text(`Model: ${predictions?.cervical.modelVersion || 'v1.1.8'}`, 108, y + 31);

      y += 42;

      // Personalized Nutrition Plan
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('4. PERSONALIZED NUTRITIONAL PROTOCOL', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Caloric Target: ${nutritionPlan?.dailyCalorieTarget || 1800} kcal/day | Diet: ${nutritionPlan?.dietaryPreference || 'Vegetarian'}`, margin, y);
      y += 5;
      doc.text(`Macro Split: Carbs: ${nutritionPlan?.macroDistribution.carbsGrams || 195}g (${nutritionPlan?.macroDistribution.carbsPercentage || 45}%) | Protein: ${nutritionPlan?.macroDistribution.proteinGrams || 110}g | Fat: ${nutritionPlan?.macroDistribution.fatGrams || 60}g`, margin, y);
      y += 5;
      doc.text('Key Dietary Directives: Low Glycemic Index (oats, ragi, pulses) + Iron paired with Vit C.', margin, y);
      y += 5;
      doc.text(`Supplement Adherence: ${latestRecord?.supplementAdherence?.adherenceRating || 'Fully Adherent'} (IFA, Calcium+D3, Multi, DHA) | Reminder: ${patient.supplementReminderEnabled ? 'Active at ' + (patient.supplementReminderTime || '09:00 AM') : 'Disabled'}`, margin, y);
      y += 9;

      // Obstetrician Notes
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('5. CLINICIAN ASSESSMENT & RECOMMENDATIONS', margin, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const docNote = doctorNotes[0]?.noteText || 'Patient instructed to monitor blood glucose, maintain steady prenatal vitamin adherence, and report any sudden swelling, visual disturbances, or headaches.';
      doc.text(docNote, margin, y, { maxWidth: 180 });
      y += 18;

      // Warning Signs
      doc.setFillColor(254, 242, 242);
      doc.rect(margin, y, 180, 18, 'F');
      doc.rect(margin, y, 180, 18, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(185, 28, 28);
      doc.text('RED-FLAG PRENATAL WARNING SIGNS (Seek Emergency Medical Evaluation):', margin + 3, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Severe persistent headache, sudden visual blurring/flashing lights, sudden facial/hand edema, vaginal bleeding, decreased fetal movement, or persistent abdominal pain.', margin + 3, y + 10, { maxWidth: 174 });

      y += 24;

      // Mandatory Legal Disclaimer
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.text('DISCLAIMER: This report is generated for informational monitoring purposes and must be reviewed by a qualified healthcare professional. Risk assessments reflect statistical probability models and do not constitute a definitive medical diagnosis.', margin, y, { maxWidth: 180 });

      // Save PDF
      doc.save(`Matern_Health_Report_${patient.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200 my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <FileDown className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Clinical Health Dossier &amp; Summary Report</h3>
              <p className="text-[11px] text-slate-400">Standardized Maternal-Fetal Evaluation Summary</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Preview Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs bg-slate-50/50">
          {/* Patient Header Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">{patient.name}</h4>
                <p className="text-slate-500 text-[11px]">
                  ID: {patient.id} • Age: {latestRecord?.age || 28} • {latestRecord?.location || 'India'}
                </p>
              </div>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                {latestRecord?.gestationalWeeks ? `Gestational Week ${latestRecord.gestationalWeeks}` : 'Prenatal Record'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block font-medium">Blood Pressure</span>
                <span className="font-bold text-slate-800">{latestRecord?.bloodPressureSys || 120}/{latestRecord?.bloodPressureDia || 80} mmHg</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Post-Prandial Glucose</span>
                <span className="font-bold text-slate-800">{latestRecord?.postPrandialBloodSugar || 118} mg/dL</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Hemoglobin</span>
                <span className="font-bold text-slate-800">{latestRecord?.hemoglobin || 11.2} g/dL</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Maternal BMI</span>
                <span className="font-bold text-slate-800">{latestRecord?.bmi || 24.5} kg/m²</span>
              </div>
            </div>
          </div>

          {/* Dual AI Predictions Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-amber-500" />
                  Gestational Diabetes Risk
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    predictions?.gdm.riskCategory === 'High'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : predictions?.gdm.riskCategory === 'Medium'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {predictions?.gdm.riskCategory || 'Low'} ({predictions?.gdm.scorePercentage || 25}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {predictions?.gdm.clinicalAction}
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Cervical Neoplasia / HPV Risk
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    predictions?.cervical.riskCategory === 'High'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : predictions?.cervical.riskCategory === 'Medium'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {predictions?.cervical.riskCategory || 'Low'} ({predictions?.cervical.scorePercentage || 12}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {predictions?.cervical.clinicalAction}
              </p>
            </div>
          </div>

          {/* Nutrition & Supplement Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <h5 className="font-bold text-slate-900">Personalized Dietary Summary</h5>
              <p className="text-[11px] text-slate-600">
                Calorie Target: <strong>{nutritionPlan?.dailyCalorieTarget || 1800} kcal/day</strong> ({nutritionPlan?.dietaryPreference || 'vegetarian'}). Carbs: {nutritionPlan?.macroDistribution.carbsGrams || 195}g (Low GI), Protein: {nutritionPlan?.macroDistribution.proteinGrams || 110}g, Healthy Fats: {nutritionPlan?.macroDistribution.fatGrams || 60}g.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-slate-900">Prenatal Supplement Adherence</h5>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {latestRecord?.supplementAdherence?.adherenceRating || 'Full'} Adherence
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Iron &amp; Folic Acid (60mg/400mcg), Calcium &amp; D3 (500mg), Prenatal Multivitamin, Omega-3 DHA.
              </p>
              <div className="flex items-center justify-between text-[10px] text-indigo-700 bg-indigo-50/70 px-2.5 py-1 rounded-lg border border-indigo-100 font-medium">
                <span>🔔 Daily Profile Reminder:</span>
                <span>{patient.supplementReminderEnabled ? `Active at ${patient.supplementReminderTime || '09:00 AM'}` : 'Disabled'}</span>
              </div>
            </div>
          </div>

          {/* Red Flag Warning Box */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1 text-[11px]">
            <span className="font-bold flex items-center gap-1.5 text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Emergency Red-Flag Symptoms:
            </span>
            <p className="leading-relaxed">
              Contact your emergency maternity hospital if you experience severe persistent headaches, blurred vision, sudden edema of hands/face, acute abdominal pain, vaginal bleeding, or noticeable decrease in fetal movement.
            </p>
          </div>

          {/* Legal Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-[10px] text-slate-500 italic leading-snug">
            “This report is for informational purposes and must be reviewed by a qualified healthcare professional.”
          </div>
        </div>

        {/* Footer with Download PDF button */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Preview</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{isExporting ? 'Generating PDF...' : 'Download Official PDF Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
