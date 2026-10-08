import fs from 'fs';
import path from 'path';
import { predictGestationalDiabetes, predictCervicalCancer, PredictionResult } from './ml_engine.js';
import { NutritionModel, DietPlanOutput } from './nutrition_engine';
import {
  NutritionPlan,
  MedicationItem,
  DailyDoseLog,
  DailyAdherenceRecord,
  AdherenceSummary,
} from '../src/types';

const STORAGE_FILE = path.join(process.cwd(), 'data', 'clinical_registry.json');

export interface SupplementAdherence {
  ironFolicAcid: boolean;
  calciumVitD: boolean;
  prenatalMultivitamin: boolean;
  dhaOmega3: boolean;
  adherenceRating: 'Full' | 'Partial' | 'Missed';
  reminderEnabled: boolean;
  reminderTime?: string;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  phone?: string;
  avatar?: string;
  assignedDoctorId?: string;
  specialty?: string; // For doctors
  clinicLocation?: string;
  createdAt: string;
  language?: 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'mr';
  supplementReminderEnabled?: boolean;
  supplementReminderTime?: string;
  supplementReminderFrequency?: 'daily' | 'twice_daily';
}

export interface HealthRecord {
  id: string;
  patientId: string;
  recordedAt: string;
  // Demographics
  age: number;
  gestationalWeeks?: number;
  location: string;
  // Anthropometrics
  heightCm: number;
  weightKg: number;
  bmi: number;
  // Vitals
  bloodPressureSys: number;
  bloodPressureDia: number;
  heartRate: number;
  // Lab values
  fastingBloodSugar: number; // mg/dL
  postPrandialBloodSugar: number; // mg/dL
  hba1c?: number; // %
  hemoglobin: number; // g/dL
  // Obstetric
  gravidity: number;
  parity: number;
  priorGDM: boolean;
  familyHistoryDiabetes?: boolean;
  priorComplications?: string;
  // Cervical
  papSmearHistory: 'never' | 'normal_recent' | 'abnormal_past' | 'abnormal_recent';
  hpvStatus: 'negative' | 'positive_high_risk' | 'unknown';
  smokingStatus: boolean;
  smokingYears: number;
  sexualPartners: number;
  hormonalContraceptiveYears: number;
  familyHistoryCervical: boolean;
  stdsHistory: boolean;
  // General
  chronicDiseases: string[];
  medications: string[];
  allergies: string[];
  notes?: string;
  supplementAdherence?: SupplementAdherence;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'LOGIN' | 'LOGOUT' | 'DATA_UPDATE' | 'PREDICTION_RUN' | 'NUTRITION_GENERATE' | 'REPORT_DOWNLOAD' | 'MODEL_RETRAIN' | 'ROLE_CHANGE' | 'REGISTER' | 'APPOINTMENT_REQUEST' | 'APPOINTMENT_APPROVE' | 'APPOINTMENT_REJECT';
  details: string;
  ipAddress?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  requestDate: string;
  scheduledDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
  type: 'routine_checkup' | 'gdm_followup' | 'cervical_screening' | 'emergency';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    conditionTopic?: string;
    clinicalReference?: string;
  };
}

export interface DoctorNote {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  timestamp: string;
  noteText: string;
  recommendations: string[];
}

export interface DirectMessage {
  id: string;
  patientId: string;
  senderId: string;
  senderName: string;
  senderRole: 'patient' | 'doctor';
  recipientId: string;
  recipientName: string;
  timestamp: string;
  content: string;
  tag?: 'Symptom Inquiry' | 'Lab Result' | 'Nutrition & Diet' | 'Medication' | 'General Query';
  isUrgent?: boolean;
  status: 'sent' | 'delivered' | 'read';
}

// In-memory Database state
class Database {
  users: Map<string, User> = new Map();
  healthRecords: Map<string, HealthRecord[]> = new Map(); // patientId -> records array
  predictions: Map<string, { gdm: PredictionResult; cervical: PredictionResult; calculatedAt: string }> = new Map();
  nutritionPlans: Map<string, DietPlanOutput> = new Map();
  doctorNotes: Map<string, DoctorNote[]> = new Map();
  chatHistories: Map<string, ChatMessage[]> = new Map();
  directMessages: Map<string, DirectMessage[]> = new Map(); // patientId -> DirectMessage array
  appointments: Map<string, Appointment[]> = new Map(); // patientId -> Appointment array
  adherenceRecords: Map<string, Record<string, DailyAdherenceRecord>> = new Map(); // patientId -> (date -> DailyAdherenceRecord)
  patientMedications: Map<string, MedicationItem[]> = new Map(); // patientId -> MedicationItem array
  auditLogs: AuditLog[] = [];

  constructor() {
    this.seedInitialData();
    this.loadFromStorage();
    if (this.adherenceRecords.size === 0) {
      this.seedAdherenceData();
      this.saveToStorage();
    }
    this.recalculateAllPredictions();
  }

  private saveToStorage() {
    try {
      const dataDir = path.dirname(STORAGE_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const data = {
        users: Array.from(this.users.entries()),
        healthRecords: Array.from(this.healthRecords.entries()),
        predictions: Array.from(this.predictions.entries()),
        nutritionPlans: Array.from(this.nutritionPlans.entries()),
        doctorNotes: Array.from(this.doctorNotes.entries()),
        chatHistories: Array.from(this.chatHistories.entries()),
        directMessages: Array.from(this.directMessages.entries()),
        appointments: Array.from(this.appointments.entries()),
        adherenceRecords: Array.from(this.adherenceRecords.entries()),
        patientMedications: Array.from(this.patientMedications.entries()),
        auditLogs: this.auditLogs,
      };
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Failed to save to permanent storage:', err);
    }
  }

  private loadFromStorage() {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
        const data = JSON.parse(raw);
        
        if (data.users) this.users = new Map(data.users);
        if (data.healthRecords) this.healthRecords = new Map(data.healthRecords);
        if (data.predictions) this.predictions = new Map(data.predictions);
        if (data.nutritionPlans) this.nutritionPlans = new Map(data.nutritionPlans);
        if (data.doctorNotes) this.doctorNotes = new Map(data.doctorNotes);
        if (data.chatHistories) this.chatHistories = new Map(data.chatHistories);
        if (data.directMessages) this.directMessages = new Map(data.directMessages);
        if (data.appointments) this.appointments = new Map(data.appointments);
        if (data.adherenceRecords) this.adherenceRecords = new Map(data.adherenceRecords);
        if (data.patientMedications) this.patientMedications = new Map(data.patientMedications);
        if (data.auditLogs) this.auditLogs = data.auditLogs;
      }
    } catch (err) {
      console.error('Failed to load from permanent storage:', err);
    }
  }

  public save() {
    this.saveToStorage();
  }

  public recalculateAllPredictions() {
    for (const [patientId, records] of this.healthRecords.entries()) {
      if (records && records.length > 0) {
        const latest = records[records.length - 1];
        const gdmPred = predictGestationalDiabetes({
          age: latest.age,
          bmi: latest.bmi,
          pregnancies: latest.gravidity,
          glucose: latest.postPrandialBloodSugar,
          bloodPressureSys: latest.bloodPressureSys,
          bloodPressureDia: latest.bloodPressureDia,
          familyHistoryDiabetes: Boolean(latest.familyHistoryDiabetes ?? true),
          priorGDM: latest.priorGDM,
          hba1c: latest.hba1c,
        });

        const ccPred = predictCervicalCancer({
          age: latest.age,
          hpvPositive: latest.hpvStatus === 'positive_high_risk',
          priorAbnormalPap:
            latest.papSmearHistory === 'abnormal_recent' ||
            latest.papSmearHistory === 'abnormal_past',
          smokingStatus: latest.smokingStatus,
          smokingYears: latest.smokingYears,
          sexualPartners: latest.sexualPartners,
          hormonalContraceptiveYears: latest.hormonalContraceptiveYears,
          familyHistoryCervical: latest.familyHistoryCervical,
          stdsHistory: latest.stdsHistory,
        });

        this.predictions.set(patientId, {
          gdm: gdmPred,
          cervical: ccPred,
          calculatedAt: new Date().toISOString(),
        });
      }
    }
  }

  seedInitialData() {
    // 1. Doctor 1 (Maternal-Fetal Medicine)
    const docId = 'doc-1';
    this.users.set(docId, {
      id: docId,
      name: 'Dr. Ananya Sharma, MD',
      email: 'doctor@matern.org',
      role: 'doctor',
      phone: '+91 98201 54321',
      specialty: 'Maternal-Fetal Medicine & Obstetrics',
      clinicLocation: 'Apollo Cradle Maternal Centre, New Delhi',
      createdAt: new Date('2025-01-10').toISOString(),
    });

    // 1b. Doctor 2 (Gynecologic Oncology & Cervical Prevention)
    const doc2Id = 'doc-2';
    this.users.set(doc2Id, {
      id: doc2Id,
      name: 'Dr. Rajesh Varma, MD, DGO',
      email: 'rajesh.varma@matern.org',
      role: 'doctor',
      phone: '+91 98112 34567',
      specialty: 'Gynecologic Oncology & Preventive Colposcopy',
      clinicLocation: 'Apollo Comprehensive Cancer Centre, Mumbai',
      createdAt: new Date('2025-01-15').toISOString(),
    });

    // 2. Admin
    const adminId = 'admin-1';
    this.users.set(adminId, {
      id: adminId,
      name: 'Dr. Vikram Malhotra (Clinical Admin)',
      email: 'admin@matern.org',
      role: 'admin',
      phone: '+91 99100 87654',
      clinicLocation: 'National Maternal Registry HQ',
      createdAt: new Date('2025-01-01').toISOString(),
    });

    // 3. Patient 1: Priya Patel (GDM Risk Watch)
    const pat1Id = 'pat-1';
    this.users.set(pat1Id, {
      id: pat1Id,
      name: 'Priya Patel',
      email: 'patient@matern.org',
      role: 'patient',
      phone: '+91 97123 45678',
      assignedDoctorId: docId,
      clinicLocation: 'New Delhi, India',
      createdAt: new Date('2025-02-14').toISOString(),
      supplementReminderEnabled: true,
      supplementReminderTime: '09:00 AM',
      supplementReminderFrequency: 'daily',
    });

    // Patient 1 Longitudinal Records
    const pat1Records: HealthRecord[] = [
      {
        id: 'rec-1a',
        patientId: pat1Id,
        recordedAt: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString(),
        age: 28,
        gestationalWeeks: 18,
        location: 'New Delhi',
        heightCm: 161,
        weightKg: 64,
        bmi: 24.7,
        bloodPressureSys: 118,
        bloodPressureDia: 76,
        heartRate: 78,
        fastingBloodSugar: 92,
        postPrandialBloodSugar: 122,
        hba1c: 5.3,
        hemoglobin: 11.4,
        gravidity: 2,
        parity: 1,
        priorGDM: false,
        priorComplications: 'Uncomplicated first pregnancy (delivered 2022)',
        papSmearHistory: 'normal_recent',
        hpvStatus: 'negative',
        smokingStatus: false,
        smokingYears: 0,
        sexualPartners: 1,
        hormonalContraceptiveYears: 2,
        familyHistoryCervical: false,
        stdsHistory: false,
        chronicDiseases: [],
        medications: ['Prenatal Multivitamin', 'Iron-Folic Acid'],
        allergies: ['Penicillin'],
        notes: 'Initial second trimester booking visit. Vitals stable.',
      },
      {
        id: 'rec-1b',
        patientId: pat1Id,
        recordedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        age: 28,
        gestationalWeeks: 22,
        location: 'New Delhi',
        heightCm: 161,
        weightKg: 66.5,
        bmi: 25.6,
        bloodPressureSys: 122,
        bloodPressureDia: 78,
        heartRate: 80,
        fastingBloodSugar: 104,
        postPrandialBloodSugar: 138,
        hba1c: 5.6,
        hemoglobin: 11.1,
        gravidity: 2,
        parity: 1,
        priorGDM: false,
        papSmearHistory: 'normal_recent',
        hpvStatus: 'negative',
        smokingStatus: false,
        smokingYears: 0,
        sexualPartners: 1,
        hormonalContraceptiveYears: 2,
        familyHistoryCervical: false,
        stdsHistory: false,
        chronicDiseases: [],
        medications: ['Prenatal Multivitamin', 'Iron-Folic Acid'],
        allergies: ['Penicillin'],
        notes: 'Follow-up visit. Mild post-prandial blood sugar rise noted (138 mg/dL).',
      },
      {
        id: 'rec-1c',
        patientId: pat1Id,
        recordedAt: new Date().toISOString(),
        age: 28,
        gestationalWeeks: 24,
        location: 'New Delhi',
        heightCm: 161,
        weightKg: 67.2,
        bmi: 25.9,
        bloodPressureSys: 124,
        bloodPressureDia: 80,
        heartRate: 82,
        fastingBloodSugar: 108,
        postPrandialBloodSugar: 142,
        hba1c: 5.7,
        hemoglobin: 10.9,
        gravidity: 2,
        parity: 1,
        priorGDM: false,
        papSmearHistory: 'normal_recent',
        hpvStatus: 'negative',
        smokingStatus: false,
        smokingYears: 0,
        sexualPartners: 1,
        hormonalContraceptiveYears: 2,
        familyHistoryCervical: false,
        stdsHistory: false,
        chronicDiseases: [],
        medications: ['Prenatal Multivitamin', 'Iron-Folic Acid'],
        allergies: ['Penicillin'],
        notes: '24-week glucose screening shows borderline GDM elevation. Nutrition and self-monitoring advised.',
      },
    ];
    this.healthRecords.set(pat1Id, pat1Records);

    // Initial predictions for pat-1
    const pat1Gdm = predictGestationalDiabetes({
      age: 28,
      bmi: 25.9,
      pregnancies: 2,
      glucose: 142,
      bloodPressureSys: 124,
      bloodPressureDia: 80,
      familyHistoryDiabetes: true,
      priorGDM: false,
      hba1c: 5.7,
    });
    const pat1Cervical = predictCervicalCancer({
      age: 28,
      hpvPositive: false,
      priorAbnormalPap: false,
      smokingStatus: false,
      sexualPartners: 1,
      hormonalContraceptiveYears: 2,
      familyHistoryCervical: false,
      stdsHistory: false,
    });
    this.predictions.set(pat1Id, {
      gdm: pat1Gdm,
      cervical: pat1Cervical,
      calculatedAt: new Date().toISOString(),
    });

    // Nutrition plan for pat-1
    this.nutritionPlans.set(
      pat1Id,
      NutritionModel.generatePersonalizedNutritionPlan({
        patientId: pat1Id,
        patientName: 'Priya Patel',
        weightKg: 67.2,
        heightCm: 161,
        bmi: 25.9,
        gestationalWeeks: 24,
        bloodSugarFasting: 108,
        bloodSugarPostPrandial: 142,
        hemoglobinG_dL: 10.9,
        bloodPressureSys: 124,
        gdmRiskLevel: pat1Gdm.riskCategory,
        cervicalRiskLevel: pat1Cervical.riskCategory,
        dietaryPreference: 'vegetarian',
      })
    );

    // 4. Patient 2: Meera Krishnan (High GDM Risk)
    const pat2Id = 'pat-2';
    this.users.set(pat2Id, {
      id: pat2Id,
      name: 'Meera Krishnan',
      email: 'meera.krishnan@example.com',
      role: 'patient',
      phone: '+91 98450 12345',
      assignedDoctorId: docId,
      clinicLocation: 'Bengaluru, India',
      createdAt: new Date('2025-01-20').toISOString(),
    });

    const pat2Records: HealthRecord[] = [
      {
        id: 'rec-2a',
        patientId: pat2Id,
        recordedAt: new Date().toISOString(),
        age: 34,
        gestationalWeeks: 26,
        location: 'Bengaluru',
        heightCm: 156,
        weightKg: 78,
        bmi: 32.1,
        bloodPressureSys: 134,
        bloodPressureDia: 88,
        heartRate: 86,
        fastingBloodSugar: 126,
        postPrandialBloodSugar: 178,
        hba1c: 6.2,
        hemoglobin: 10.4,
        gravidity: 3,
        parity: 2,
        priorGDM: true,
        priorComplications: 'Gestational Diabetes in 2nd pregnancy requiring dietary restriction',
        papSmearHistory: 'normal_recent',
        hpvStatus: 'negative',
        smokingStatus: false,
        smokingYears: 0,
        sexualPartners: 1,
        hormonalContraceptiveYears: 3,
        familyHistoryCervical: false,
        stdsHistory: false,
        chronicDiseases: ['Mild gestational hypertension'],
        medications: ['Labetalol 100mg', 'Prenatal Vitamin', 'Calcium D3'],
        allergies: ['Sulfa drugs'],
        notes: 'High risk profile. Prior GDM history, elevated BMI 32.1, fasting glucose 126.',
      },
    ];
    this.healthRecords.set(pat2Id, pat2Records);
    const pat2Gdm = predictGestationalDiabetes({
      age: 34,
      bmi: 32.1,
      pregnancies: 3,
      glucose: 178,
      bloodPressureSys: 134,
      bloodPressureDia: 88,
      familyHistoryDiabetes: true,
      priorGDM: true,
      hba1c: 6.2,
    });
    const pat2Cervical = predictCervicalCancer({
      age: 34,
      hpvPositive: false,
      priorAbnormalPap: false,
      smokingStatus: false,
      sexualPartners: 1,
    });
    this.predictions.set(pat2Id, { gdm: pat2Gdm, cervical: pat2Cervical, calculatedAt: new Date().toISOString() });
    this.nutritionPlans.set(
      pat2Id,
      NutritionModel.generatePersonalizedNutritionPlan({
        patientId: pat2Id,
        patientName: 'Meera Krishnan',
        weightKg: 78,
        heightCm: 156,
        bmi: 32.1,
        gestationalWeeks: 26,
        bloodSugarFasting: 126,
        bloodSugarPostPrandial: 178,
        hemoglobinG_dL: 10.4,
        bloodPressureSys: 134,
        gdmRiskLevel: 'High',
        cervicalRiskLevel: 'Low',
        dietaryPreference: 'vegetarian',
      })
    );

    // 5. Patient 3: Sunita Rao (Cervical Cancer Screening Follow-up)
    const pat3Id = 'pat-3';
    this.users.set(pat3Id, {
      id: pat3Id,
      name: 'Sunita Rao',
      email: 'sunita.rao@example.com',
      role: 'patient',
      phone: '+91 94220 98765',
      assignedDoctorId: doc2Id,
      clinicLocation: 'Mumbai, India',
      createdAt: new Date('2025-02-01').toISOString(),
    });

    const pat3Records: HealthRecord[] = [
      {
        id: 'rec-3a',
        patientId: pat3Id,
        recordedAt: new Date().toISOString(),
        age: 39,
        location: 'Mumbai',
        heightCm: 164,
        weightKg: 62,
        bmi: 23.1,
        bloodPressureSys: 120,
        bloodPressureDia: 78,
        heartRate: 74,
        fastingBloodSugar: 90,
        postPrandialBloodSugar: 112,
        hba1c: 5.1,
        hemoglobin: 12.2,
        gravidity: 2,
        parity: 2,
        priorGDM: false,
        papSmearHistory: 'abnormal_recent',
        hpvStatus: 'positive_high_risk',
        smokingStatus: true,
        smokingYears: 8,
        sexualPartners: 3,
        hormonalContraceptiveYears: 6,
        familyHistoryCervical: true,
        stdsHistory: true,
        chronicDiseases: [],
        medications: ['Iron supplement'],
        allergies: [],
        notes: 'Referred following abnormal Pap showing low-grade squamous intraepithelial lesion (LSIL) and positive HPV 16.',
      },
    ];
    this.healthRecords.set(pat3Id, pat3Records);
    const pat3Gdm = predictGestationalDiabetes({
      age: 39,
      bmi: 23.1,
      pregnancies: 2,
      glucose: 112,
      bloodPressureSys: 120,
      bloodPressureDia: 78,
      familyHistoryDiabetes: false,
    });
    const pat3Cervical = predictCervicalCancer({
      age: 39,
      hpvPositive: true,
      priorAbnormalPap: true,
      smokingStatus: true,
      smokingYears: 8,
      sexualPartners: 3,
      hormonalContraceptiveYears: 6,
      familyHistoryCervical: true,
      stdsHistory: true,
    });
    this.predictions.set(pat3Id, { gdm: pat3Gdm, cervical: pat3Cervical, calculatedAt: new Date().toISOString() });
    this.nutritionPlans.set(
      pat3Id,
      NutritionModel.generatePersonalizedNutritionPlan({
        patientId: pat3Id,
        patientName: 'Sunita Rao',
        weightKg: 62,
        heightCm: 164,
        bmi: 23.1,
        bloodSugarFasting: 90,
        bloodSugarPostPrandial: 112,
        hemoglobinG_dL: 12.2,
        bloodPressureSys: 120,
        gdmRiskLevel: 'Low',
        cervicalRiskLevel: 'High',
        dietaryPreference: 'non-vegetarian',
      })
    );

    // Initial doctor notes
    this.doctorNotes.set(pat1Id, [
      {
        id: 'dn-1',
        patientId: pat1Id,
        doctorId: docId,
        doctorName: 'Dr. Ananya Sharma',
        timestamp: new Date().toISOString(),
        noteText: 'Reviewed 24-week glucose values. Post-prandial reading 142 mg/dL warrants strict adherence to the Low-GI meal plan. Maintain active daily walking for 20-30 minutes post meals.',
        recommendations: [
          'Perform 75g OGTT confirmation test within 7 days',
          'Follow 6-meal daily split (3 main + 3 protein-rich snacks)',
          'Avoid sweet beverages and white rice at dinner',
        ],
      },
    ]);

    this.doctorNotes.set(pat3Id, [
      {
        id: 'dn-301',
        patientId: pat3Id,
        doctorId: doc2Id,
        doctorName: 'Dr. Rajesh Varma',
        timestamp: new Date().toISOString(),
        noteText: 'Referred for cytology abnormalities (LSIL) with positive HPV 16 typing. Colposcopic magnification and cervical surface evaluation arranged for next week. Patient reassured regarding low immediate neoplastic progression when monitored promptly.',
        recommendations: [
          'Undergo colposcopic assessment with Lugol iodine wash',
          'Repeat HPV-DNA typing and triage cytology at 6-month interval',
          'Dietary antioxidant optimization (rich in folate and Vitamin C)',
        ],
      },
    ]);

    // Initial audit logs
    this.auditLogs.push(
      {
        id: 'log-1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        userId: 'doc-1',
        userName: 'Dr. Ananya Sharma',
        userRole: 'doctor',
        action: 'LOGIN',
        details: 'Clinician authenticated via JWT session',
      },
      {
        id: 'log-2',
        timestamp: new Date(Date.now() - 2400000).toISOString(),
        userId: 'pat-1',
        userName: 'Priya Patel',
        userRole: 'patient',
        action: 'DATA_UPDATE',
        details: 'Patient submitted 24-week vitals and glucose records',
      },
      {
        id: 'log-3',
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        userId: 'pat-1',
        userName: 'Priya Patel',
        userRole: 'patient',
        action: 'PREDICTION_RUN',
        details: 'Evaluated GDM Risk (Medium: 48%) and Cervical Cancer Risk (Low: 8%)',
      }
    );

    // Initial Chat history
    this.chatHistories.set(pat1Id, [
      {
        id: 'm1',
        sender: 'assistant',
        content: 'Namaste Priya! I am your Matern Health Companion. I can provide evidence-based educational guidance regarding gestational diabetes, prenatal nutrition, cervical screening, and your test results. What would you like to explore today?',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
      },
    ]);

    // Seed Doctor-Patient Communication Messages for Priya Patel (pat-1)
    this.directMessages.set(pat1Id, [
      {
        id: 'dm-1',
        patientId: pat1Id,
        senderId: pat1Id,
        senderName: 'Priya Patel',
        senderRole: 'patient',
        recipientId: docId,
        recipientName: 'Dr. Ananya Sharma',
        timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        content: 'Namaste Dr. Ananya, my 2-hour post-meal blood sugar came out to 138 mg/dL today after lunch. I felt slightly dizzy around 3 PM. Should I modify my dinner plan?',
        tag: 'Lab Result',
        status: 'read',
      },
      {
        id: 'dm-2',
        patientId: pat1Id,
        senderId: docId,
        senderName: 'Dr. Ananya Sharma',
        senderRole: 'doctor',
        recipientId: pat1Id,
        recipientName: 'Priya Patel',
        timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
        content: 'Hello Priya. A reading of 138 mg/dL is slightly above our optimal prenatal ceiling of 120-130 mg/dL, which explains the mild sluggishness. Please replace any refined grain with ragi or bajra roti for dinner, take a gentle 15-minute post-meal stroll, and check your fasting glucose tomorrow at 7:30 AM. If you notice visual flashes or headache, contact our triage immediately.',
        tag: 'Nutrition & Diet',
        status: 'read',
      },
      {
        id: 'dm-3',
        patientId: pat1Id,
        senderId: pat1Id,
        senderName: 'Priya Patel',
        senderRole: 'patient',
        recipientId: docId,
        recipientName: 'Dr. Ananya Sharma',
        timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        content: 'Understood Doctor! I followed the low-GI dinner plan and took a 20-minute walk. Fasting sugar this morning was 92 mg/dL. Also set my daily supplement reminder for 09:00 AM. Thank you!',
        tag: 'Symptom Inquiry',
        status: 'read',
      },
      {
        id: 'dm-4',
        patientId: pat1Id,
        senderId: docId,
        senderName: 'Dr. Ananya Sharma',
        senderRole: 'doctor',
        recipientId: pat1Id,
        recipientName: 'Priya Patel',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        content: 'Excellent progress, Priya! 92 mg/dL fasting is right in our target zone (<95 mg/dL). Keep up the steady hydration and supplement adherence. See you for the scheduled 26-week scan on Thursday.',
        tag: 'General Query',
        status: 'delivered',
      },
    ]);

    // Seed Doctor-Patient Communication Messages for Sunita Rao (pat-3)
    this.directMessages.set(pat3Id, [
      {
        id: 'dm-301',
        patientId: pat3Id,
        senderId: pat3Id,
        senderName: 'Sunita Rao',
        senderRole: 'patient',
        recipientId: doc2Id,
        recipientName: 'Dr. Rajesh Varma',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        content: 'Doctor, I received my Pap smear report showing LSIL and positive HPV 16. I am feeling very anxious about what this means for cancer risk. What are the next steps?',
        tag: 'Lab Result',
        isUrgent: true,
        status: 'read',
      },
      {
        id: 'dm-302',
        patientId: pat3Id,
        senderId: doc2Id,
        senderName: 'Dr. Rajesh Varma',
        senderRole: 'doctor',
        recipientId: pat3Id,
        recipientName: 'Sunita Rao',
        timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        content: 'Sunita, please take a deep breath. Having positive HPV with LSIL indicates early surface cellular changes, NOT cancer. The majority of these changes are reversible or easily managed when detected early. I have scheduled a colposcopy review for you next Tuesday where we will examine the cervical surface under magnification. Please avoid douching or intercourse 48 hours prior.',
        tag: 'Lab Result',
        status: 'read',
      },
    ]);

    // Seed Appointments
    this.appointments.set(pat1Id, [
      {
        id: 'apt-1',
        patientId: pat1Id,
        patientName: 'Priya Patel',
        doctorId: docId,
        doctorName: 'Dr. Ananya Sharma',
        requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        reason: '26-week routine growth scan and glucose review',
        status: 'approved',
        type: 'routine_checkup',
      },
    ]);

    this.appointments.set('pat-2', [
      {
        id: 'apt-2',
        patientId: 'pat-2',
        patientName: 'Meera Krishnan',
        doctorId: docId,
        doctorName: 'Dr. Ananya Sharma',
        requestDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Follow-up for elevated fasting sugar readings',
        status: 'pending',
        type: 'gdm_followup',
      },
    ]);

    this.seedAdherenceData();
  }

  seedAdherenceData() {
    const defaultMeds: MedicationItem[] = [
      {
        id: 'med-ifa',
        name: 'IFA (Iron + Folic Acid)',
        dosage: '60mg Elemental Iron + 500mcg Folic Acid',
        category: 'vitamin',
        timeSlot: 'Morning',
        scheduledTime: '08:30 AM',
        instructions: 'Take with citrus juice or water after breakfast. Avoid tea, coffee, or milk for 2 hours.',
        clinicalPurpose: 'Prevents maternal microcytic anemia & fetal neural tube defects (WHO Anemia Mukt Bharat Protocol).',
        isEssentialPrenatal: true,
      },
      {
        id: 'med-calcium',
        name: 'Calcium Carbonate + Vit D3',
        dosage: '500mg Calcium + 250 IU Vit D3',
        category: 'mineral',
        timeSlot: 'Afternoon',
        scheduledTime: '01:30 PM',
        instructions: 'Take with lunch. Separate from Iron supplements by ≥4 hours to avoid competitive GI inhibition.',
        clinicalPurpose: 'Fetal skeletal mineralization and maternal preeclampsia risk reduction.',
        isEssentialPrenatal: true,
      },
      {
        id: 'med-dha',
        name: 'Prenatal DHA / Omega-3',
        dosage: '200mg Plant Microalgae DHA',
        category: 'supplement',
        timeSlot: 'Evening',
        scheduledTime: '07:30 PM',
        instructions: 'Take with evening meal for optimal lipid bioavailability.',
        clinicalPurpose: 'Supports fetal retinal maturation, cortical synaptogenesis, and cognitive trajectory.',
        isEssentialPrenatal: true,
      },
      {
        id: 'med-multi',
        name: 'Prenatal Multivitamin + Choline',
        dosage: '1 Tablet (Zinc, Iodine, B-Complex, 100mg Choline)',
        category: 'vitamin',
        timeSlot: 'Morning',
        scheduledTime: '09:00 AM',
        instructions: 'Take with morning breakfast.',
        clinicalPurpose: 'Placental vascular health, thyroid hormone synthesis, and cellular methylation.',
        isEssentialPrenatal: true,
      },
      {
        id: 'med-metformin',
        name: 'Metformin Hydrochloride (SR)',
        dosage: '500mg Sustained Release',
        category: 'prescription',
        timeSlot: 'Bedtime',
        scheduledTime: '09:30 PM',
        instructions: 'Take with light snack as prescribed by Dr. Ananya Sharma for GDM glycemic stabilization.',
        clinicalPurpose: 'Maintains nocturnal and fasting blood sugar within target threshold (<95 mg/dL).',
        isEssentialPrenatal: false,
      },
    ];

    const patients = ['pat-1', 'pat-2', 'pat-3'];
    const now = new Date();

    for (const patId of patients) {
      this.patientMedications.set(patId, [...defaultMeds]);
      const recordsMap: Record<string, DailyAdherenceRecord> = {};

      // Seed 35 past days leading up to today
      for (let offset = 35; offset >= 0; offset--) {
        const d = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split('T')[0];

        const doses: DailyDoseLog[] = defaultMeds.map((med) => {
          let status: 'taken' | 'missed' | 'pending' = 'taken';
          let loggedAt: string | undefined = `${med.scheduledTime.split(' ')[0].replace(/^0/, '')}:${Math.floor(10 + Math.random() * 40)} ${med.scheduledTime.split(' ')[1]}`;
          let notes: string | undefined = undefined;

          if (offset === 0) {
            // Today
            if (med.timeSlot === 'Morning') {
              status = 'taken';
              loggedAt = '08:42 AM';
            } else if (med.timeSlot === 'Afternoon') {
              status = 'taken';
              loggedAt = '01:40 PM';
            } else {
              status = 'pending';
              loggedAt = undefined;
            }
          } else {
            // Historical days: mostly 100% adherence, with occasional partial
            if (offset === 7 || offset === 19) {
              if (med.id === 'med-dha') {
                status = 'missed';
                loggedAt = undefined;
                notes = 'Missed during evening travel';
              }
            } else if (offset === 26) {
              if (med.id === 'med-metformin') {
                status = 'missed';
                loggedAt = undefined;
                notes = 'Fell asleep early';
              }
            }
          }

          return {
            id: `dose-${patId}-${dateStr}-${med.id}`,
            medicationId: med.id,
            medicationName: med.name,
            dosage: med.dosage,
            timeSlot: med.timeSlot,
            scheduledTime: med.scheduledTime,
            status,
            loggedAt,
            notes,
          };
        });

        const totalDoses = doses.length;
        const takenDoses = doses.filter((ds) => ds.status === 'taken').length;
        const pct = Math.round((takenDoses / totalDoses) * 100);
        const rating: 'Full' | 'Partial' | 'Missed' =
          pct === 100 ? 'Full' : pct >= 50 ? 'Partial' : 'Missed';

        recordsMap[dateStr] = {
          id: `adh-${patId}-${dateStr}`,
          patientId: patId,
          date: dateStr,
          doses,
          adherencePercentage: pct,
          rating,
          verifiedByClinician: offset > 3,
        };
      }

      this.adherenceRecords.set(patId, recordsMap);
    }
  }

  getPatientAdherenceSummary(patientId: string): AdherenceSummary {
    const recordsMap = this.adherenceRecords.get(patientId) || {};
    let meds = this.patientMedications.get(patientId);
    if (!meds || meds.length === 0) {
      this.seedAdherenceData();
      meds = this.patientMedications.get(patientId) || [];
    }

    // Ensure today's record exists
    const todayStr = new Date().toISOString().split('T')[0];
    if (!recordsMap[todayStr]) {
      const todayDoses: DailyDoseLog[] = meds.map((med) => ({
        id: `dose-${patientId}-${todayStr}-${med.id}`,
        medicationId: med.id,
        medicationName: med.name,
        dosage: med.dosage,
        timeSlot: med.timeSlot,
        scheduledTime: med.scheduledTime,
        status: 'pending',
      }));
      recordsMap[todayStr] = {
        id: `adh-${patientId}-${todayStr}`,
        patientId,
        date: todayStr,
        doses: todayDoses,
        adherencePercentage: 0,
        rating: 'Missed',
      };
      this.adherenceRecords.set(patientId, recordsMap);
    }

    // Calculate streaks and 30-day adherence
    const now = new Date();
    let totalDosesLogged = 0;
    let totalDosesScheduled = 0;
    let daysAnalyzed = 0;
    let totalPercentageSum = 0;

    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const ds = d.toISOString().split('T')[0];
      const rec = recordsMap[ds];
      if (rec) {
        daysAnalyzed++;
        totalPercentageSum += rec.adherencePercentage;
        totalDosesScheduled += rec.doses.length;
        totalDosesLogged += rec.doses.filter((dose) => dose.status === 'taken').length;
      }
    }

    const adherenceRate30d = daysAnalyzed > 0 ? Number((totalPercentageSum / daysAnalyzed).toFixed(1)) : 92.5;

    // Calculate current streak
    let currentStreakDays = 0;
    for (let i = 0; i < 60; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const ds = d.toISOString().split('T')[0];
      const rec = recordsMap[ds];
      if (i === 0) {
        if (rec && rec.doses.some(d => d.status === 'taken')) {
          currentStreakDays++;
        }
        continue;
      }
      if (rec && (rec.rating === 'Full' || rec.rating === 'Partial')) {
        currentStreakDays++;
      } else {
        break;
      }
    }

    return {
      adherenceRate30d,
      currentStreakDays: Math.max(currentStreakDays, 1),
      longestStreakDays: Math.max(currentStreakDays + 4, 22),
      totalDosesLogged,
      totalDosesScheduled,
      records: recordsMap,
      activeMedications: meds,
    };
  }

  recordDoseStatus(
    patientId: string,
    date: string,
    doseId: string,
    status: 'taken' | 'missed' | 'pending',
    notes?: string
  ): DailyAdherenceRecord {
    let recordsMap = this.adherenceRecords.get(patientId);
    if (!recordsMap) {
      recordsMap = {};
      this.adherenceRecords.set(patientId, recordsMap);
    }

    const meds = this.patientMedications.get(patientId) || [];
    if (!recordsMap[date]) {
      recordsMap[date] = {
        id: `adh-${patientId}-${date}`,
        patientId,
        date,
        doses: meds.map((med) => ({
          id: `dose-${patientId}-${date}-${med.id}`,
          medicationId: med.id,
          medicationName: med.name,
          dosage: med.dosage,
          timeSlot: med.timeSlot,
          scheduledTime: med.scheduledTime,
          status: 'pending',
        })),
        adherencePercentage: 0,
        rating: 'Missed',
      };
    }

    const dayRecord = recordsMap[date];
    const dose = dayRecord.doses.find((d) => d.id === doseId || d.medicationId === doseId);
    if (dose) {
      dose.status = status;
      if (status === 'taken') {
        const timeNow = new Date();
        const hrs = timeNow.getHours();
        const mins = String(timeNow.getMinutes()).padStart(2, '0');
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        const formattedHrs = hrs % 12 || 12;
        dose.loggedAt = `${formattedHrs}:${mins} ${ampm}`;
      } else {
        dose.loggedAt = undefined;
      }
      if (notes !== undefined) {
        dose.notes = notes;
      }
    }

    // Recalculate daily percentage
    const takenCount = dayRecord.doses.filter((d) => d.status === 'taken').length;
    dayRecord.adherencePercentage = Math.round((takenCount / dayRecord.doses.length) * 100);
    dayRecord.rating =
      dayRecord.adherencePercentage === 100
        ? 'Full'
        : dayRecord.adherencePercentage >= 50
        ? 'Partial'
        : 'Missed';

    this.saveToStorage();
    return dayRecord;
  }

  markAllDayDosesTaken(patientId: string, date: string): DailyAdherenceRecord {
    let recordsMap = this.adherenceRecords.get(patientId);
    if (!recordsMap) {
      recordsMap = {};
      this.adherenceRecords.set(patientId, recordsMap);
    }
    const meds = this.patientMedications.get(patientId) || [];
    if (!recordsMap[date]) {
      recordsMap[date] = {
        id: `adh-${patientId}-${date}`,
        patientId,
        date,
        doses: meds.map((med) => ({
          id: `dose-${patientId}-${date}-${med.id}`,
          medicationId: med.id,
          medicationName: med.name,
          dosage: med.dosage,
          timeSlot: med.timeSlot,
          scheduledTime: med.scheduledTime,
          status: 'pending',
        })),
        adherencePercentage: 0,
        rating: 'Missed',
      };
    }

    const dayRecord = recordsMap[date];
    const timeNow = new Date();
    const hrs = timeNow.getHours();
    const mins = String(timeNow.getMinutes()).padStart(2, '0');
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    const formattedHrs = hrs % 12 || 12;
    const nowStr = `${formattedHrs}:${mins} ${ampm}`;

    dayRecord.doses.forEach((d) => {
      d.status = 'taken';
      if (!d.loggedAt) {
        d.loggedAt = nowStr;
      }
    });
    dayRecord.adherencePercentage = 100;
    dayRecord.rating = 'Full';

    this.saveToStorage();
    return dayRecord;
  }

  addPatientMedication(patientId: string, med: Omit<MedicationItem, 'id'>): MedicationItem[] {
    const meds = this.patientMedications.get(patientId) || [];
    const newMed: MedicationItem = {
      ...med,
      id: `med-${Date.now()}`,
    };
    meds.push(newMed);
    this.patientMedications.set(patientId, meds);

    const todayStr = new Date().toISOString().split('T')[0];
    const recordsMap = this.adherenceRecords.get(patientId);
    if (recordsMap && recordsMap[todayStr]) {
      recordsMap[todayStr].doses.push({
        id: `dose-${patientId}-${todayStr}-${newMed.id}`,
        medicationId: newMed.id,
        medicationName: newMed.name,
        dosage: newMed.dosage,
        timeSlot: newMed.timeSlot,
        scheduledTime: newMed.scheduledTime,
        status: 'pending',
      });
      const taken = recordsMap[todayStr].doses.filter((d) => d.status === 'taken').length;
      recordsMap[todayStr].adherencePercentage = Math.round(
        (taken / recordsMap[todayStr].doses.length) * 100
      );
    }

    this.saveToStorage();
    return meds;
  }

  logAction(userId: string, action: AuditLog['action'], details: string) {
    const user = this.users.get(userId);
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName: user ? user.name : 'Unknown User',
      userRole: user ? user.role : 'guest',
      action,
      details,
    };
    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    this.saveToStorage();
  }
}

export const db = new Database();
try {
  // Seeding logic here
} catch (error) {
  console.error("Failed to seed initial data:", error);
}