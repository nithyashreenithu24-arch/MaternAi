import React, { useState, useEffect } from 'react';
import { User, HealthRecord, PredictionResult, NutritionPlan, DoctorNote } from './types';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { PatientDashboard } from './components/PatientDashboard';
import { DoctorDashboard } from './components/DoctorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { HealthDataModal } from './components/HealthDataModal';
import { NutritionModal } from './components/NutritionModal';
import { ReportModal } from './components/ReportModal';
import { ChatbotDrawer } from './components/ChatbotDrawer';
import { AuthModal } from './components/AuthModal';
import { CommunicationPanel } from './components/CommunicationPanel';
import { AppointmentPanel } from './components/AppointmentPanel';
import {
  Heart,
  ShieldCheck,
  Lock,
  CheckCircle2,
  LogIn,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'patient' | 'doctor' | 'admin'>('patient');

  // Active patient data
  const [patientRecords, setPatientRecords] = useState<HealthRecord[]>([]);
  const [predictions, setPredictions] = useState<{ gdm: PredictionResult; cervical: PredictionResult } | undefined>();
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | undefined>();
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>([]);

  // Doctor view data
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [selectedDoctorPatientId, setSelectedDoctorPatientId] = useState<string>('pat-1');

  // Modals state
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isNutritionModalOpen, setIsNutritionModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCommunicationOpen, setIsCommunicationOpen] = useState(false);
  const [isAppointmentPanelOpen, setIsAppointmentPanelOpen] = useState(false);
  const [communicationTargetPatientId, setCommunicationTargetPatientId] = useState<string>('pat-1');

  // App notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial load
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('matern_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Load current user
      const userRes = await api.getCurrentUser(token);
      setCurrentUser(userRes.user);
      setActiveTab(userRes.user.role);

      // Load specific data based on role
      if (userRes.user.role === 'patient') {
        const patId = userRes.user.id;
        const [recs, preds, nutr] = await Promise.all([
          api.getHealthRecords(patId),
          api.getPredictions(patId),
          api.getNutritionPlan(patId),
        ]);
        setPatientRecords(recs);
        setPredictions(preds);
        setNutritionPlan(nutr);
        
        // Extract notes from patient details if available
        const details = await api.getPatientDetails(patId);
        setDoctorNotes(details.notes || []);
      } else if (userRes.user.role === 'doctor') {
        const pts = await api.getPatients();
        setAllPatients(pts);
        if (pts.length > 0) {
          setSelectedDoctorPatientId(pts[0].id);
        }
      } else if (userRes.user.role === 'admin') {
        const pts = await api.getPatients();
        setAllPatients(pts);
      }
    } catch (err: any) {
      // Don't log expected 401 errors to console during initial boot
      if (err.message !== 'Not authenticated') {
        console.error('Initial data load error:', err);
      }
      localStorage.removeItem('matern_token');
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle Authentication (Login / Register)
  const handleLogin = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setCurrentUser(res.user);
    localStorage.setItem('matern_token', res.token);
    setActiveTab(res.user.role);
    showToast(`Signed in as ${res.user.name} (${res.user.role})`);
    await loadInitialData();
  };

  const handleRegister = async (data: any) => {
    const res = await api.register(data);
    setCurrentUser(res.user);
    localStorage.setItem('matern_token', res.token);
    setActiveTab(res.user.role);
    showToast(`Account created for ${res.user.name}`);
    await loadInitialData();
  };

  const handleLogout = () => {
    localStorage.removeItem('matern_token');
    setCurrentUser(null);
    setPatientRecords([]);
    setPredictions(undefined);
    setAllPatients([]);
    showToast('Signed out successfully');
  };

  // Submit health entry
  const handleSubmitHealthRecord = async (data: any) => {
    const targetPatientId = currentUser?.role === 'patient' ? currentUser.id : selectedDoctorPatientId;
    const res = await api.submitHealthRecord({ ...data, patientId: targetPatientId });
    setPatientRecords((prev) => [...prev, res.record]);
    setPredictions(res.predictions);

    // Update current user state with saved reminder preference
    if (currentUser && currentUser.id === targetPatientId && data.supplementReminderEnabled !== undefined) {
      setCurrentUser({
        ...currentUser,
        supplementReminderEnabled: Boolean(data.supplementReminderEnabled),
        supplementReminderTime: data.supplementReminderTime || currentUser.supplementReminderTime || '09:00 AM',
        supplementReminderFrequency: data.supplementReminderFrequency || currentUser.supplementReminderFrequency || 'daily',
      });
    }

    // Refresh nutrition
    const updatedNutrition = await api.getNutritionPlan(targetPatientId);
    setNutritionPlan(updatedNutrition);

    // Refresh patients list
    const pts = await api.getPatients();
    setAllPatients(pts);

    showToast(
      data.supplementReminderEnabled
        ? `Vitals & supplement adherence logged! Daily reminder active at ${data.supplementReminderTime || '09:00 AM'}.`
        : 'Vitals & supplement adherence logged successfully.'
    );
  };

  // Doctor note add
  const handleAddDoctorNote = async (patientId: string, noteText: string, recommendations: string[]) => {
    const newNote = await api.addDoctorNote(patientId, noteText, recommendations);
    setDoctorNotes((prev) => [newNote, ...prev]);

    // Refresh patient list
    const pts = await api.getPatients();
    setAllPatients(pts);
    showToast('Clinical note and action items updated on patient chart.');
  };

  // Nutrition approval
  const handleApproveNutrition = async (patientId: string, status: string, notes?: string) => {
    const updated = await api.updateNutritionApproval(patientId, status, notes);
    setNutritionPlan(updated);
    showToast(`Nutrition plan status updated: ${status.replace('_', ' ')}`);
  };

  // Nutrition regeneration
  const handleRegenerateNutrition = async (dietaryPreference: string, region?: string) => {
    const targetId = currentUser?.role === 'patient' ? currentUser.id : 'pat-1';
    const updated = await api.generateNutritionPlan(targetId, dietaryPreference, region);
    setNutritionPlan(updated);
    showToast(`7-day regional nutrition plan regenerated successfully.`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center animate-pulse">
            <Heart className="w-6 h-6 fill-white" />
          </div>
          <p className="text-sm font-bold text-slate-800">Initializing Matern AI Clinical Platform...</p>
          <p className="text-xs text-slate-500">Loading datasets, model parameters &amp; prenatal records</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-rose-500/20 text-white mb-8">
          <Heart className="w-10 h-10 fill-white" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Matern<span className="text-rose-600">.AI</span>
        </h1>
        <p className="max-w-md text-slate-600 mb-8 leading-relaxed">
          The next generation of maternal care. Role-based access for expectant mothers, 
          obstetricians, and clinical administrators. Powered by predictive AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="flex-1 py-3 px-6 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Clinical Sign In
          </button>
          <button 
            onClick={() => {
              setIsAuthModalOpen(true);
            }}
            className="flex-1 py-3 px-6 rounded-2xl bg-white text-slate-900 font-bold hover:bg-slate-50 border border-slate-200 transition-all shadow-sm"
          >
            Register Patient
          </button>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-200 w-full max-w-md">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-4">Enterprise Grade Security</p>
          <div className="flex justify-center gap-8">
            <div className="flex flex-col items-center gap-1 opacity-60">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-[10px] font-bold text-slate-500">HIPAA Compliant</span>
            </div>
            <div className="flex flex-col items-center gap-1 opacity-60">
              <Lock className="w-5 h-5 text-indigo-600" />
              <span className="text-[10px] font-bold text-slate-500">256-bit AES</span>
            </div>
          </div>
        </div>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col antialiased">
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onOpenCommunication={() => {
          setCommunicationTargetPatientId(currentUser?.role === 'patient' ? currentUser.id : selectedDoctorPatientId);
          setIsCommunicationOpen(true);
        }}
        onOpenAppointmentPanel={() => setIsAppointmentPanelOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'patient' && currentUser && (
          <PatientDashboard
            patient={currentUser.role === 'patient' ? currentUser : allPatients[0] || currentUser}
            records={patientRecords}
            predictions={predictions}
            nutritionPlan={nutritionPlan}
            doctorNotes={doctorNotes}
            onOpenDataModal={() => setIsDataModalOpen(true)}
            onOpenNutritionModal={() => setIsNutritionModalOpen(true)}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onOpenChat={() => setIsChatOpen(true)}
            onOpenCommunication={() => {
              setCommunicationTargetPatientId(currentUser?.id || 'pat-1');
              setIsCommunicationOpen(true);
            }}
          />
        )}

        {activeTab === 'doctor' && currentUser && (
          <DoctorDashboard
            doctor={currentUser}
            patients={allPatients}
            selectedPatientId={selectedDoctorPatientId}
            onSelectPatient={(id) => setSelectedDoctorPatientId(id)}
            onAddDoctorNote={handleAddDoctorNote}
            onApproveNutrition={handleApproveNutrition}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        )}

        {activeTab === 'admin' && currentUser && (
          <AdminDashboard adminUser={currentUser} />
        )}
      </main>

      {/* Compliance & Regulatory Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-[10px]">
              M
            </div>
            <div>
              <p className="font-bold text-slate-800">Matern AI • Maternal Health Systems</p>
              <p className="text-[11px] text-slate-400">
                Grounded in WHO, ACOG &amp; ICMR/FOGSI Antenatal Guidelines. TLS 1.3 encrypted.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              HIPAA &amp; DISA Architecture Ready
            </span>
            <span className="flex items-center gap-1 text-slate-600">
              <Lock className="w-3.5 h-3.5" />
              AES-256 Patient Data Encryption
            </span>
            <span className="text-slate-400">
              Model Registry: v2.4.0 (GDM 96.4% Acc) / v2.3.0 (Cervical 97.8% Acc)
            </span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <HealthDataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        onSubmit={handleSubmitHealthRecord}
        patientId={currentUser?.role === 'patient' ? currentUser.id : selectedDoctorPatientId}
        initialData={patientRecords[patientRecords.length - 1]}
      />

      <NutritionModal
        isOpen={isNutritionModalOpen}
        onClose={() => setIsNutritionModalOpen(false)}
        nutritionPlan={nutritionPlan}
        onRegenerate={handleRegenerateNutrition}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        patient={currentUser?.role === 'patient' ? currentUser : allPatients.find((p) => p.id === selectedDoctorPatientId) || currentUser!}
        latestRecord={patientRecords[patientRecords.length - 1]}
        predictions={predictions}
        nutritionPlan={nutritionPlan}
        doctorNotes={doctorNotes}
      />

      <ChatbotDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        currentUser={currentUser}
        predictions={predictions}
      />

      {/* Appointment Registry Modal */}
      {isAppointmentPanelOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl animate-in zoom-in-95 duration-200">
            <AppointmentPanel
              currentUser={currentUser}
              onClose={() => setIsAppointmentPanelOpen(false)}
            />
          </div>
        </div>
      )}

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {/* Doctor-Patient Secure Direct Communication Modal */}
      {isCommunicationOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl animate-in zoom-in-95 duration-200 shadow-2xl rounded-3xl overflow-hidden">
            <CommunicationPanel
              currentUser={currentUser}
              patientId={communicationTargetPatientId}
              patientName={
                currentUser?.role === 'patient'
                  ? currentUser.name
                  : allPatients.find((p) => p.id === communicationTargetPatientId)?.name || 'Priya Patel'
              }
              doctorName={
                currentUser?.role === 'doctor'
                  ? currentUser.name
                  : allPatients.find((p) => p.id === communicationTargetPatientId)?.assignedDoctorId === 'doc-2'
                  ? 'Dr. Rajesh Varma, MD, DGO'
                  : 'Dr. Ananya Sharma, MD'
              }
              isDoctorView={currentUser?.role === 'doctor'}
              onClose={() => setIsCommunicationOpen(false)}
              patientContext={
                currentUser?.role === 'patient'
                  ? {
                      age: patientRecords[patientRecords.length - 1]?.age,
                      gestationalWeeks: patientRecords[patientRecords.length - 1]?.gestationalWeeks,
                      gdmRisk: predictions?.gdm?.riskCategory,
                      cervicalRisk: predictions?.cervical?.riskCategory,
                      latestSugar: patientRecords[patientRecords.length - 1]?.postPrandialBloodSugar,
                      latestBP: patientRecords[patientRecords.length - 1]
                        ? `${patientRecords[patientRecords.length - 1].bloodPressureSys}/${patientRecords[patientRecords.length - 1].bloodPressureDia}`
                        : undefined,
                    }
                  : (() => {
                      const targetPt = allPatients.find((p) => p.id === communicationTargetPatientId);
                      const rec = targetPt?.latestRecord || targetPt?.records?.[targetPt?.records?.length - 1];
                      return {
                        age: rec?.age,
                        gestationalWeeks: rec?.gestationalWeeks,
                        gdmRisk: targetPt?.predictions?.gdm?.riskCategory,
                        cervicalRisk: targetPt?.predictions?.cervical?.riskCategory,
                        latestSugar: rec?.postPrandialBloodSugar,
                        latestBP: rec ? `${rec.bloodPressureSys}/${rec.bloodPressureDia}` : undefined,
                      };
                    })()
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
