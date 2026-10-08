export interface AdherenceLog {
  id: string;
  patientId: string;
  date: string;
  medicationsTaken: string[];
  isFullyAdherent: boolean;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  category: 'vitamin' | 'mineral' | 'prescription' | 'supplement';
  timeSlot: 'Morning' | 'Afternoon' | 'Evening' | 'Bedtime';
  scheduledTime: string;
  instructions: string;
  clinicalPurpose: string;
  isEssentialPrenatal?: boolean;
}

export interface DailyDoseLog {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  timeSlot: 'Morning' | 'Afternoon' | 'Evening' | 'Bedtime';
  scheduledTime: string;
  status: 'taken' | 'missed' | 'pending';
  loggedAt?: string;
  notes?: string;
}

export interface DailyAdherenceRecord {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  doses: DailyDoseLog[];
  adherencePercentage: number;
  rating: 'Full' | 'Partial' | 'Missed';
  notes?: string;
  verifiedByClinician?: boolean;
}

export interface AdherenceSummary {
  adherenceRate30d: number;
  currentStreakDays: number;
  longestStreakDays: number;
  totalDosesLogged: number;
  totalDosesScheduled: number;
  records: Record<string, DailyAdherenceRecord>;
  activeMedications: MedicationItem[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  phone?: string;
  avatar?: string;
  assignedDoctorId?: string;
  specialty?: string;
  clinicLocation?: string;
  createdAt: string;
  supplementReminderEnabled?: boolean;
  supplementReminderTime?: string;
  supplementReminderFrequency?: 'daily' | 'twice_daily';
}

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

export interface HealthRecord {
  id: string;
  patientId: string;
  recordedAt: string;
  age: number;
  gestationalWeeks?: number;
  location: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  bloodPressureSys: number;
  bloodPressureDia: number;
  heartRate: number;
  fastingBloodSugar: number;
  postPrandialBloodSugar: number;
  hba1c?: number;
  hemoglobin: number;
  gravidity: number;
  parity: number;
  priorGDM: boolean;
  familyHistoryDiabetes?: boolean;
  priorComplications?: string;
  papSmearHistory: 'never' | 'normal_recent' | 'abnormal_past' | 'abnormal_recent';
  hpvStatus: 'negative' | 'positive_high_risk' | 'unknown';
  smokingStatus: boolean;
  smokingYears: number;
  sexualPartners: number;
  hormonalContraceptiveYears: number;
  familyHistoryCervical: boolean;
  stdsHistory: boolean;
  chronicDiseases: string[];
  medications: string[];
  allergies: string[];
  notes?: string;
  supplementAdherence?: SupplementAdherence;
}

export interface PredictionResult {
  condition: 'Gestational Diabetes' | 'Cervical Cancer';
  riskCategory: 'Low' | 'Medium' | 'High';
  probability: number;
  scorePercentage: number;
  topFactors: {
    feature: string;
    impact: 'risk_increasing' | 'protective' | 'neutral';
    contribution: number;
    patientValue: string | number;
    explanation: string;
  }[];
  modelVersion: string;
  clinicalAction: string;
  recommendedFollowUpDays: number;
}

export interface MealItem {
  name: string;
  portion: string;
  calories: number;
  glycemicIndex: 'Low' | 'Medium' | 'High';
  nutrientsHighlight: string;
  notes?: string;
}

export interface DailyMealPlan {
  day: number;
  dayName: string;
  breakfast: MealItem;
  morningSnack: MealItem;
  lunch: MealItem;
  eveningSnack: MealItem;
  dinner: MealItem;
  bedtimeSnack?: MealItem;
  dailyTotalCalories: number;
  keyTargetNutrients: string[];
}

export interface NutritionPlan {
  patientId: string;
  patientName: string;
  generatedAt: string;
  dailyCalorieTarget: number;
  macroDistribution: {
    carbsPercentage: number;
    carbsGrams: number;
    proteinPercentage: number;
    proteinGrams: number;
    fatPercentage: number;
    fatGrams: number;
  };
  dietaryPreference: 'vegetarian' | 'non-vegetarian' | 'vegan' | 'eggetarian';
  targetedRiskFocus: string[];
  keyGuidelines: {
    title: string;
    description: string;
    foodExamples: string[];
    foodsToAvoid: string[];
  }[];
  sevenDayMealPlan: DailyMealPlan[];
  doctorApprovalStatus: 'approved' | 'pending_review' | 'modified_by_clinician';
  doctorNotes?: string;
  approvedByDoctorId?: string;
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

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ModelMetric {
  version: string;
  name: string;
  trainedAt: string;
  samples: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  featureWeights: { feature: string; weight: number; description: string }[];
}

export interface AdminStats {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalAdmins: number;
  modelUsageCount: number;
  totalReportsGenerated: number;
  gdmModelVersion: string;
  cervicalModelVersion: string;
  gdmAccuracy: number;
  cervicalAccuracy: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'LOGIN' | 'LOGOUT' | 'DATA_UPDATE' | 'PREDICTION_RUN' | 'NUTRITION_GENERATE' | 'REPORT_DOWNLOAD' | 'MODEL_RETRAIN' | 'ROLE_CHANGE' | 'REGISTER' | 'APPOINTMENT_REQUEST' | 'APPOINTMENT_APPROVE' | 'APPOINTMENT_REJECT';
  details: string;
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
