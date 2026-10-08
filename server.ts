import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, User, HealthRecord } from './server/db.js';
import {
  predictGestationalDiabetes,
  predictCervicalCancer,
  getMLMetrics,
  trainModelsFromData,
  trainEnsembleModels,
  resetMLModels,
  getTrainingHistory,
} from './server/ml_engine.js';
import { NutritionModel } from './server/nutrition_engine.js';
import { KANNADA_MATERNITY_RECIPES } from './server/kannada_recipes.js';
import { generateChatResponse } from './server/chat_service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to simulate JWT session extraction
function getCurrentUser(req: express.Request): User | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return db.users.get(token);
  }
  // Fallback to header
  const userIdHeader = req.headers['x-user-id'] as string;
  if (userIdHeader && db.users.has(userIdHeader)) {
    return db.users.get(userIdHeader);
  }
  return undefined;
}

// ----------------------------------------------------
// AUTH ENDPOINTS
// ----------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role = 'patient', phone, clinicLocation } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // Strong password check
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  // Check existing
  for (const u of db.users.values()) {
    if (u.email.toLowerCase() === email.toLowerCase()) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
  }

  const newId = `user-${Date.now()}`;
  const newUser: User = {
    id: newId,
    name,
    email,
    role: role as 'patient' | 'doctor' | 'admin',
    phone,
    clinicLocation,
    assignedDoctorId: role === 'patient' ? 'doc-1' : undefined,
    createdAt: new Date().toISOString(),
  };

  db.users.set(newId, newUser);
  db.logAction(newId, 'REGISTER', `Registered new ${role} account: ${email}`);

  // Create baseline health record for patients
  if (role === 'patient') {
    const initRecord: HealthRecord = {
      id: `rec-${Date.now()}`,
      patientId: newId,
      recordedAt: new Date().toISOString(),
      age: 26,
      gestationalWeeks: 12,
      location: clinicLocation || 'India',
      heightCm: 160,
      weightKg: 58,
      bmi: 22.7,
      bloodPressureSys: 116,
      bloodPressureDia: 74,
      heartRate: 76,
      fastingBloodSugar: 88,
      postPrandialBloodSugar: 110,
      hba1c: 5.0,
      hemoglobin: 12.0,
      gravidity: 1,
      parity: 0,
      priorGDM: false,
      papSmearHistory: 'never',
      hpvStatus: 'unknown',
      smokingStatus: false,
      smokingYears: 0,
      sexualPartners: 1,
      hormonalContraceptiveYears: 0,
      familyHistoryCervical: false,
      stdsHistory: false,
      chronicDiseases: [],
      medications: ['Folic Acid 5mg'],
      allergies: [],
      notes: 'Initial registration record',
    };
    db.healthRecords.set(newId, [initRecord]);

    const gdmPred = predictGestationalDiabetes({
      age: 26,
      bmi: 22.7,
      pregnancies: 1,
      glucose: 110,
      bloodPressureSys: 116,
      bloodPressureDia: 74,
      familyHistoryDiabetes: false,
    });
    const ccPred = predictCervicalCancer({
      age: 26,
      hpvPositive: false,
      priorAbnormalPap: false,
      smokingStatus: false,
    });
    db.predictions.set(newId, { gdm: gdmPred, cervical: ccPred, calculatedAt: new Date().toISOString() });
    db.nutritionPlans.set(
      newId,
      NutritionModel.generatePersonalizedNutritionPlan({
        patientId: newId,
        patientName: name,
        weightKg: 58,
        heightCm: 160,
        bmi: 22.7,
        gestationalWeeks: 12,
        bloodSugarFasting: 88,
        bloodSugarPostPrandial: 110,
        hemoglobinG_dL: 12.0,
        bloodPressureSys: 116,
        gdmRiskLevel: gdmPred.riskCategory,
        cervicalRiskLevel: ccPred.riskCategory,
      })
    );
  }

  db.save();
  res.status(201).json({
    token: newId,
    user: newUser,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find user by email
  let matchedUser: User | undefined;
  for (const u of db.users.values()) {
    if (u.email.toLowerCase() === email.toLowerCase()) {
      matchedUser = u;
      break;
    }
  }

  if (!matchedUser) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  db.logAction(matchedUser.id, 'LOGIN', `Logged in as ${matchedUser.role}`);
  res.json({
    token: matchedUser.id,
    user: matchedUser,
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    // If not authenticated, we could return 401, but for demo let's be careful
    // However, the requested flow is "login to see dashboard", so 401 is correct
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user });
});

app.put('/api/auth/profile', (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });

  const updates = req.body;
  const updatedUser = { ...user, ...updates };
  db.users.set(user.id, updatedUser);
  db.save();

  res.json(updatedUser);
});

// ----------------------------------------------------
// PATIENTS & USERS MANAGEMENT
// ----------------------------------------------------
app.get('/api/patients', (req, res) => {
  const patientsList: any[] = [];
  for (const u of db.users.values()) {
    if (u.role === 'patient') {
      const records = db.healthRecords.get(u.id) || [];
      const latestRecord = records[records.length - 1];
      const preds = db.predictions.get(u.id);
      const notes = db.doctorNotes.get(u.id) || [];
      patientsList.push({
        ...u,
        latestRecord,
        predictions: preds,
        recordCount: records.length,
        notesCount: notes.length,
      });
    }
  }
  res.json(patientsList);
});

app.get('/api/patients/:id', (req, res) => {
  const patientId = req.params.id;
  const user = db.users.get(patientId);
  if (!user || user.role !== 'patient') {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const records = db.healthRecords.get(patientId) || [];
  const predictions = db.predictions.get(patientId);
  const nutrition = db.nutritionPlans.get(patientId);
  const notes = db.doctorNotes.get(patientId) || [];

  res.json({
    patient: user,
    records,
    latestRecord: records[records.length - 1],
    predictions,
    nutrition,
    notes,
  });
});

app.post('/api/patients/:id/notes', (req, res) => {
  const patientId = req.params.id;
  const { noteText, recommendations = [] } = req.body;
  const currentUser = getCurrentUser(req);

  if (!noteText) {
    return res.status(400).json({ error: 'Note text is required' });
  }

  const newNote = {
    id: `dn-${Date.now()}`,
    patientId,
    doctorId: currentUser?.id || 'doc-1',
    doctorName: currentUser?.name || 'Dr. Ananya Sharma',
    timestamp: new Date().toISOString(),
    noteText,
    recommendations,
  };

  const existing = db.doctorNotes.get(patientId) || [];
  existing.unshift(newNote);
  db.doctorNotes.set(patientId, existing);

  db.logAction(currentUser?.id || 'doc-1', 'DATA_UPDATE', `Added clinical note for patient ${patientId}`);
  res.status(201).json(newNote);
});

// ----------------------------------------------------
// HEALTH RECORDS (LONGITUDINAL)
// ----------------------------------------------------
app.get('/api/health-records/:userId', (req, res) => {
  const userId = req.params.userId;
  const records = db.healthRecords.get(userId) || [];
  res.json(records);
});

app.post('/api/health-records', (req, res) => {
  const data = req.body;
  const patientId = data.patientId || getCurrentUser(req)?.id || 'pat-1';

  // Calculate BMI if not given
  let bmi = data.bmi;
  if (!bmi && data.heightCm && data.weightKg) {
    const heightM = data.heightCm / 100;
    bmi = +(data.weightKg / (heightM * heightM)).toFixed(1);
  }

  const newRecord: HealthRecord = {
    id: `rec-${Date.now()}`,
    patientId,
    recordedAt: new Date().toISOString(),
    age: Number(data.age) || 28,
    gestationalWeeks: data.gestationalWeeks ? Number(data.gestationalWeeks) : undefined,
    location: data.location || 'India',
    heightCm: Number(data.heightCm) || 160,
    weightKg: Number(data.weightKg) || 60,
    bmi: Number(bmi) || 23.4,
    bloodPressureSys: Number(data.bloodPressureSys) || 120,
    bloodPressureDia: Number(data.bloodPressureDia) || 80,
    heartRate: Number(data.heartRate) || 78,
    fastingBloodSugar: Number(data.fastingBloodSugar) || 92,
    postPrandialBloodSugar: Number(data.postPrandialBloodSugar) || 120,
    hba1c: data.hba1c ? Number(data.hba1c) : undefined,
    hemoglobin: Number(data.hemoglobin) || 11.5,
    gravidity: Number(data.gravidity) || 1,
    parity: Number(data.parity) || 0,
    priorGDM: Boolean(data.priorGDM),
    priorComplications: data.priorComplications || '',
    papSmearHistory: data.papSmearHistory || 'never',
    hpvStatus: data.hpvStatus || 'unknown',
    smokingStatus: Boolean(data.smokingStatus),
    smokingYears: Number(data.smokingYears) || 0,
    sexualPartners: Number(data.sexualPartners) || 1,
    hormonalContraceptiveYears: Number(data.hormonalContraceptiveYears) || 0,
    familyHistoryCervical: Boolean(data.familyHistoryCervical),
    stdsHistory: Boolean(data.stdsHistory),
    chronicDiseases: Array.isArray(data.chronicDiseases) ? data.chronicDiseases : [],
    medications: Array.isArray(data.medications) ? data.medications : [],
    allergies: Array.isArray(data.allergies) ? data.allergies : [],
    notes: data.notes || '',
    supplementAdherence: data.supplementAdherence || undefined,
  };

  const records = db.healthRecords.get(patientId) || [];
  records.push(newRecord);
  db.healthRecords.set(patientId, records);

  // Update user profile supplement reminder preferences if supplied
  const user = db.users.get(patientId);
  if (user && data.supplementReminderEnabled !== undefined) {
    user.supplementReminderEnabled = Boolean(data.supplementReminderEnabled);
    if (data.supplementReminderTime) {
      user.supplementReminderTime = data.supplementReminderTime;
    }
    db.users.set(patientId, user);
    db.logAction(
      patientId,
      'DATA_UPDATE',
      `Updated daily supplement reminder preference to: ${user.supplementReminderEnabled ? 'Active at ' + (user.supplementReminderTime || '09:00 AM') : 'Disabled'}`
    );
  }

  // Automatically recalculate predictions with new health data!
  const gdmPred = predictGestationalDiabetes({
    age: newRecord.age,
    bmi: newRecord.bmi,
    pregnancies: newRecord.gravidity,
    glucose: newRecord.postPrandialBloodSugar,
    bloodPressureSys: newRecord.bloodPressureSys,
    bloodPressureDia: newRecord.bloodPressureDia,
    familyHistoryDiabetes: Boolean(data.familyHistoryDiabetes),
    priorGDM: newRecord.priorGDM,
    hba1c: newRecord.hba1c,
  });

  const ccPred = predictCervicalCancer({
    age: newRecord.age,
    hpvPositive: newRecord.hpvStatus === 'positive_high_risk',
    priorAbnormalPap: newRecord.papSmearHistory === 'abnormal_recent' || newRecord.papSmearHistory === 'abnormal_past',
    smokingStatus: newRecord.smokingStatus,
    smokingYears: newRecord.smokingYears,
    sexualPartners: newRecord.sexualPartners,
    hormonalContraceptiveYears: newRecord.hormonalContraceptiveYears,
    familyHistoryCervical: newRecord.familyHistoryCervical,
    stdsHistory: newRecord.stdsHistory,
  });

  db.predictions.set(patientId, {
    gdm: gdmPred,
    cervical: ccPred,
    calculatedAt: new Date().toISOString(),
  });

  // Regenerate updated nutrition plan
  db.nutritionPlans.set(
    patientId,
    NutritionModel.generatePersonalizedNutritionPlan({
      patientId,
      patientName: user ? user.name : 'Patient',
      weightKg: newRecord.weightKg,
      heightCm: newRecord.heightCm,
      bmi: newRecord.bmi,
      gestationalWeeks: newRecord.gestationalWeeks,
      bloodSugarFasting: newRecord.fastingBloodSugar,
      bloodSugarPostPrandial: newRecord.postPrandialBloodSugar,
      hemoglobinG_dL: newRecord.hemoglobin,
      bloodPressureSys: newRecord.bloodPressureSys,
      gdmRiskLevel: gdmPred.riskCategory,
      cervicalRiskLevel: ccPred.riskCategory,
      dietaryPreference: data.dietaryPreference || 'vegetarian',
    })
  );

  db.logAction(patientId, 'DATA_UPDATE', `Logged health entry: BP ${newRecord.bloodPressureSys}/${newRecord.bloodPressureDia}, Sugar ${newRecord.postPrandialBloodSugar} mg/dL`);
  db.save();

  res.status(201).json({
    record: newRecord,
    predictions: { gdm: gdmPred, cervical: ccPred },
  });
});

// ----------------------------------------------------
// AI RISK PREDICTIONS
// ----------------------------------------------------
app.post('/api/predict/gestational-diabetes', (req, res) => {
  const result = predictGestationalDiabetes(req.body);
  const user = getCurrentUser(req);
  if (user) {
    db.logAction(user.id, 'PREDICTION_RUN', `Executed GDM Prediction: ${result.riskCategory} (${result.scorePercentage}%)`);
  }
  res.json(result);
});

app.post('/api/predict/cervical-cancer', (req, res) => {
  const result = predictCervicalCancer(req.body);
  const user = getCurrentUser(req);
  if (user) {
    db.logAction(user.id, 'PREDICTION_RUN', `Executed Cervical Cancer Prediction: ${result.riskCategory} (${result.scorePercentage}%)`);
  }
  res.json(result);
});

app.get('/api/predictions/:userId', (req, res) => {
  const userId = req.params.userId;
  const preds = db.predictions.get(userId);
  if (!preds) {
    return res.status(404).json({ error: 'No predictions found for user' });
  }
  res.json(preds);
});

// ----------------------------------------------------
// NUTRITION PLAN ENDPOINTS
// ----------------------------------------------------
app.get('/api/nutrition/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log('Fetching nutrition plan for:', userId);
  const plan = db.nutritionPlans.get(userId);
  if (!plan) {
    console.log('Nutrition plan not found for:', userId);
    return res.status(404).json({ error: 'Nutrition plan not found' });
  }
  res.json(plan);
});

app.post('/api/nutrition/generate', (req, res) => {
  const { patientId, dietaryPreference, region = 'karnataka' } = req.body;
  console.log('Generating nutrition plan for:', patientId, 'with data:', req.body);
  const targetId = patientId || getCurrentUser(req)?.id || 'pat-1';
  const user = db.users.get(targetId);
  const records = db.healthRecords.get(targetId) || [];
  const latest = records[records.length - 1];
  const preds = db.predictions.get(targetId);

  const plan = NutritionModel.generatePlan({
    patient: {
      age: latest ? latest.age : 26,
      height_cm: latest ? latest.heightCm : 160,
      weight_kg: latest ? latest.weightKg : 62,
      bmi: latest ? latest.bmi : 24.2,
      pregnancy_week: latest ? (latest.gestationalWeeks || null) : null,
      trimester: 2,
      diet_type: dietaryPreference === 'non-vegetarian' ? 'non-veg' : dietaryPreference === 'vegan' ? 'vegan' : dietaryPreference === 'eggetarian' ? 'eggetarian' : 'veg',
      allergies: [],
      language: 'en',
      region,
      setting: 'rural',
      access: 'pds',
    },
    vitals: {
      fasting_glucose: latest ? latest.fastingBloodSugar : 92,
      postprandial_glucose: latest ? latest.postPrandialBloodSugar : 120,
      hba1c: latest ? (latest.hba1c || 5.0) : 5.0,
      bp_systolic: latest ? latest.bloodPressureSys : 118,
      bp_diastolic: latest ? latest.bloodPressureDia : 78,
      hemoglobin: latest ? latest.hemoglobin : 11.2,
      heart_rate: 75,
      weight_trend: 'stable'
    },
    prediction: {
      model: 'gestational_diabetes',
      risk_level: preds?.gdm.riskCategory.toLowerCase() as any || 'low',
      risk_score: 50,
      treatment_stage: 'none'
    },
    location: { country: 'India', state: '', district: '', setting: 'rural', season: 'normal' },
    resources: { monthly_food_budget_inr: 4000, access: 'ration shop (PDS)', cooking_fuel: 'clean', refrigeration: true }
  });
  
  if (!plan) {
    console.error('Failed to generate nutrition plan for:', targetId);
    return res.status(500).json({ error: 'Failed to generate nutrition plan' });
  }

  db.nutritionPlans.set(targetId, plan);
  db.logAction(targetId, 'NUTRITION_GENERATE', `Regenerated 7-day personalized meal plan (${plan.dailyCalorieTarget} kcal/day)`);
  db.save();
  res.json(plan);
});

app.get('/api/nutrition/recipes/karnataka', (req, res) => {
  res.json(KANNADA_MATERNITY_RECIPES);
});

app.put('/api/nutrition/:userId/approval', (req, res) => {
  const userId = req.params.userId;
  const { doctorApprovalStatus, doctorNotes } = req.body;
  const plan = db.nutritionPlans.get(userId);
  if (!plan) {
    return res.status(404).json({ error: 'Nutrition plan not found' });
  }

  const currentUser = getCurrentUser(req);
  // @ts-ignore - Adding dynamic fields to the plan for compatibility
  plan.doctorApprovalStatus = doctorApprovalStatus || 'approved';
  // @ts-ignore
  if (doctorNotes) plan.doctorNotes = doctorNotes;
  // @ts-ignore
  plan.approvedByDoctorId = currentUser?.id || 'doc-1';

  db.nutritionPlans.set(userId, plan);
  // @ts-ignore
  db.logAction(currentUser?.id || 'doc-1', 'DATA_UPDATE', `Doctor updated nutrition approval status: ${plan.doctorApprovalStatus}`);
  res.json(plan);
});

// ----------------------------------------------------
// PRENATAL VITAMIN & MEDICATION ADHERENCE TRACKING
// ----------------------------------------------------
app.get('/api/adherence/:patientId', (req, res) => {
  const patientId = req.params.patientId;
  const summary = db.getPatientAdherenceSummary(patientId);
  res.json(summary);
});

app.post('/api/adherence/:patientId/dose', (req, res) => {
  const patientId = req.params.patientId;
  const { date, doseId, status, notes } = req.body;
  if (!date || !doseId || !status) {
    return res.status(400).json({ error: 'Date, doseId, and status are required' });
  }

  const updatedRecord = db.recordDoseStatus(patientId, date, doseId, status, notes);
  const summary = db.getPatientAdherenceSummary(patientId);
  db.logAction(
    patientId,
    'DATA_UPDATE',
    `Logged dose ${doseId} as ${status} on ${date} (Day Adherence: ${updatedRecord.adherencePercentage}%)`
  );

  res.json({ record: updatedRecord, summary });
});

app.post('/api/adherence/:patientId/mark-all-taken', (req, res) => {
  const patientId = req.params.patientId;
  const { date } = req.body;
  const dateStr = date || new Date().toISOString().split('T')[0];

  const updatedRecord = db.markAllDayDosesTaken(patientId, dateStr);
  const summary = db.getPatientAdherenceSummary(patientId);
  db.logAction(
    patientId,
    'DATA_UPDATE',
    `Marked all scheduled prenatal vitamins & medications as taken for ${dateStr}`
  );

  res.json({ record: updatedRecord, summary });
});

app.post('/api/adherence/:patientId/medications', (req, res) => {
  const patientId = req.params.patientId;
  const { name, dosage, category, timeSlot, scheduledTime, instructions, clinicalPurpose, isEssentialPrenatal } = req.body;
  if (!name || !dosage) {
    return res.status(400).json({ error: 'Medication name and dosage are required' });
  }

  const updatedMeds = db.addPatientMedication(patientId, {
    name,
    dosage,
    category: category || 'supplement',
    timeSlot: timeSlot || 'Morning',
    scheduledTime: scheduledTime || '09:00 AM',
    instructions: instructions || 'Take with water after meals',
    clinicalPurpose: clinicalPurpose || 'Nutritional support & maternal wellbeing',
    isEssentialPrenatal: Boolean(isEssentialPrenatal),
  });
  const summary = db.getPatientAdherenceSummary(patientId);
  db.logAction(patientId, 'DATA_UPDATE', `Added customized supplement/medication: ${name} (${dosage})`);

  res.status(201).json({ medications: updatedMeds, summary });
});

// ----------------------------------------------------
// AI HEALTHCARE CHATBOT
// ----------------------------------------------------
app.get('/api/chat/history/:userId', (req, res) => {
  const userId = req.params.userId;
  const history = db.chatHistories.get(userId) || [];
  res.json(history);
});

app.post('/api/chat', async (req, res) => {
  const { message, userId } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const patientId = userId || getCurrentUser(req)?.id || 'pat-1';
  const patient = db.users.get(patientId);
  const records = db.healthRecords.get(patientId) || [];
  const latest = records[records.length - 1];
  const preds = db.predictions.get(patientId);
  const history = db.chatHistories.get(patientId) || [];

  // Add user message
  const userMsg = {
    id: `msg-${Date.now()}-u`,
    sender: 'user' as const,
    content: message,
    timestamp: new Date().toISOString(),
  };
  history.push(userMsg);

  try {
    const aiResponseText = await generateChatResponse({
      userMessage: message,
      language: patient?.language,
      patientContext: {
        name: patient?.name,
        age: latest?.age,
        gestationalWeeks: latest?.gestationalWeeks,
        gdmRisk: preds?.gdm.riskCategory,
        cervicalRisk: preds?.cervical.riskCategory,
        latestGlucose: latest?.postPrandialBloodSugar,
        latestBP: latest ? `${latest.bloodPressureSys}/${latest.bloodPressureDia}` : undefined,
      },
      conversationHistory: history,
    });

    const botMsg = {
      id: `msg-${Date.now()}-a`,
      sender: 'assistant' as const,
      content: aiResponseText,
      timestamp: new Date().toISOString(),
    };
    history.push(botMsg);
    db.chatHistories.set(patientId, history);
    db.save();

    res.json({ reply: botMsg, history });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate chat response' });
  }
});

// ----------------------------------------------------
// DOCTOR-PATIENT SECURE COMMUNICATION
// ----------------------------------------------------
app.get('/api/messages/:patientId', (req, res) => {
  const patientId = req.params.patientId;
  const messages = db.directMessages.get(patientId) || [];
  res.json(messages);
});

app.post('/api/messages', (req, res) => {
  const { patientId, content, tag, isUrgent } = req.body;
  if (!patientId || !content) {
    return res.status(400).json({ error: 'Patient ID and message content are required' });
  }

  const currentUser = getCurrentUser(req);
  const patient = db.users.get(patientId);
  const doctor = db.users.get(patient?.assignedDoctorId || 'doc-1') || db.users.get('doc-1');

  const isDoctor = currentUser?.role === 'doctor';
  const senderId = currentUser ? currentUser.id : isDoctor ? 'doc-1' : patientId;
  const senderName = currentUser ? currentUser.name : isDoctor ? 'Dr. Ananya Sharma' : (patient?.name || 'Patient');
  const senderRole = (isDoctor ? 'doctor' : 'patient') as 'doctor' | 'patient';
  const recipientId = isDoctor ? patientId : (doctor?.id || 'doc-1');
  const recipientName = isDoctor ? (patient?.name || 'Patient') : (doctor?.name || 'Dr. Ananya Sharma');

  const newMsg = {
    id: `dm-${Date.now()}`,
    patientId,
    senderId,
    senderName,
    senderRole,
    recipientId,
    recipientName,
    timestamp: new Date().toISOString(),
    content: content.trim(),
    tag: tag || 'General Query',
    isUrgent: Boolean(isUrgent),
    status: 'delivered' as const,
  };

  const thread = db.directMessages.get(patientId) || [];
  thread.push(newMsg);
  db.directMessages.set(patientId, thread);

  db.logAction(
    senderId,
    'DATA_UPDATE',
    `Sent clinical direct message (${tag || 'General'}): ${content.slice(0, 45)}...`
  );

  res.status(201).json({ message: newMsg, thread });
});

app.put('/api/messages/:patientId/read', (req, res) => {
  const patientId = req.params.patientId;
  const currentUser = getCurrentUser(req);
  const thread = db.directMessages.get(patientId) || [];

  thread.forEach((msg) => {
    if (msg.recipientId === currentUser?.id || (!currentUser && msg.senderRole === 'doctor')) {
      msg.status = 'read';
    }
  });

  res.json({ success: true, thread });
});

// ----------------------------------------------------
// APPOINTMENT MANAGEMENT
// ----------------------------------------------------
app.get('/api/appointments', (req, res) => {
  const allAppointments: any[] = [];
  for (const list of db.appointments.values()) {
    allAppointments.push(...list);
  }
  // Sort by date descending
  allAppointments.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());
  res.json(allAppointments);
});

app.get('/api/appointments/:userId', (req, res) => {
  const userId = req.params.userId;
  const user = db.users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.role === 'patient') {
    res.json(db.appointments.get(userId) || []);
  } else if (user.role === 'doctor') {
    const docApts: any[] = [];
    for (const list of db.appointments.values()) {
      docApts.push(...list.filter(a => a.doctorId === userId));
    }
    res.json(docApts);
  } else {
    res.status(403).json({ error: 'Admins should use the global endpoint' });
  }
});

app.post('/api/appointments/request', (req, res) => {
  const { reason, type, scheduledDate } = req.body;
  const currentUser = getCurrentUser(req);
  if (!currentUser || currentUser.role !== 'patient') {
    return res.status(403).json({ error: 'Only patients can request appointments' });
  }

  const doctorId = currentUser.assignedDoctorId || 'doc-1';
  const doctor = db.users.get(doctorId);

  const newAppointment = {
    id: `apt-${Date.now()}`,
    patientId: currentUser.id,
    patientName: currentUser.name,
    doctorId,
    doctorName: doctor?.name || 'Assigned Physician',
    requestDate: new Date().toISOString(),
    scheduledDate: scheduledDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    reason: reason || 'Routine Prenatal Consultation',
    status: 'pending' as const,
    type: type || 'routine_checkup',
  };

  const existing = db.appointments.get(currentUser.id) || [];
  existing.push(newAppointment);
  db.appointments.set(currentUser.id, existing);

  db.logAction(currentUser.id, 'APPOINTMENT_REQUEST', `Requested ${type} for ${newAppointment.scheduledDate}`);
  db.save();

  res.status(201).json(newAppointment);
});

app.put('/api/appointments/:id/approve', (req, res) => {
  const aptId = req.params.id;
  const admin = getCurrentUser(req);
  if (!admin || admin.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can approve appointments' });
  }

  let found = false;
  for (const [pid, list] of db.appointments.entries()) {
    const idx = list.findIndex(a => a.id === aptId);
    if (idx !== -1) {
      list[idx].status = 'approved';
      db.appointments.set(pid, list);
      db.logAction(admin.id, 'APPOINTMENT_APPROVE', `Approved appointment ${aptId} for patient ${pid}`);
      found = true;
      break;
    }
  }

  if (!found) return res.status(404).json({ error: 'Appointment not found' });
  db.save();
  res.json({ success: true });
});

app.put('/api/appointments/:id/reject', (req, res) => {
  const aptId = req.params.id;
  const admin = getCurrentUser(req);
  if (!admin || admin.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can reject appointments' });
  }

  let found = false;
  for (const [pid, list] of db.appointments.entries()) {
    const idx = list.findIndex(a => a.id === aptId);
    if (idx !== -1) {
      list[idx].status = 'rejected';
      db.appointments.set(pid, list);
      db.logAction(admin.id, 'APPOINTMENT_REJECT', `Rejected appointment ${aptId} for patient ${pid}`);
      found = true;
      break;
    }
  }

  if (!found) return res.status(404).json({ error: 'Appointment not found' });
  db.save();
  res.json({ success: true });
});

// ----------------------------------------------------
// HEALTH REPORTS DATA ENDPOINT
// ----------------------------------------------------
app.get('/api/reports/:userId', (req, res) => {
  const userId = req.params.userId;
  const user = db.users.get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const records = db.healthRecords.get(userId) || [];
  const latestRecord = records[records.length - 1];
  const predictions = db.predictions.get(userId);
  const nutrition = db.nutritionPlans.get(userId);
  const notes = db.doctorNotes.get(userId) || [];

  db.logAction(user.id, 'REPORT_DOWNLOAD', 'Prepared clinical report summary for export/PDF');

  res.json({
    reportGeneratedAt: new Date().toISOString(),
    disclaimer: 'This health summary report is generated for informational and educational monitoring purposes. All findings, risk probabilities, and dietary guidance must be reviewed and confirmed by a qualified maternal healthcare professional.',
    patient: user,
    latestRecord,
    historicalRecordCount: records.length,
    predictions,
    nutrition,
    doctorNotes: notes,
  });
});

// ----------------------------------------------------
// ML MANAGEMENT & RETRAINING (ADMIN)
// ----------------------------------------------------
app.get('/api/ml/metrics', (req, res) => {
  res.json(getMLMetrics());
});

app.get('/api/ml/history', (req, res) => {
  res.json(getTrainingHistory());
});

app.post('/api/ml/train', (req, res) => {
  const {
    gdmCsv,
    cervicalCsv,
    targetModel,
    technique,
    cvFolds,
    estimators,
    learningRate,
    smoteBalancing,
  } = req.body;
  const user = getCurrentUser(req);
  const result = trainEnsembleModels({
    gdmCsv,
    cervicalCsv,
    targetModel,
    technique,
    cvFolds,
    estimators,
    learningRate,
    smoteBalancing,
  });

  // Re-evaluate existing patient predictions using newly trained ensemble weights
  for (const [userId, records] of db.healthRecords.entries()) {
    if (records.length > 0) {
      const latest = records[records.length - 1];
      const gdm = predictGestationalDiabetes({
        age: latest.age,
        bmi: latest.bmi,
        pregnancies: latest.gravidity || 1,
        glucose: latest.postPrandialBloodSugar,
        bloodPressureSys: latest.bloodPressureSys,
        bloodPressureDia: latest.bloodPressureDia,
        familyHistoryDiabetes: latest.chronicDiseases?.includes('Family Diabetes') || false,
        priorGDM: latest.priorGDM,
        hba1c: latest.hba1c,
        gestationalWeeks: latest.gestationalWeeks,
      });
      const cervical = predictCervicalCancer({
        age: latest.age,
        hpvPositive: latest.hpvStatus === 'positive_high_risk',
        priorAbnormalPap: latest.papSmearHistory === 'abnormal_recent' || latest.papSmearHistory === 'abnormal_past',
        smokingStatus: latest.smokingStatus,
        smokingYears: latest.smokingYears,
        sexualPartners: latest.sexualPartners,
        hormonalContraceptiveYears: latest.hormonalContraceptiveYears,
        familyHistoryCervical: latest.familyHistoryCervical,
        stdsHistory: latest.stdsHistory,
      });
      db.predictions.set(userId, { gdm, cervical, calculatedAt: new Date().toISOString() });
    }
  }

  db.logAction(
    user?.id || 'admin-1',
    'MODEL_RETRAIN',
    `Triggered model training & optimization. GDM: ${(result.gdm.accuracy * 100).toFixed(1)}% (+${((result.gdm.accuracy - (result.gdm.baselineAccuracy || 0.842)) * 100).toFixed(1)}%), Cervical: ${(result.cervical.accuracy * 100).toFixed(1)}% (+${((result.cervical.accuracy - (result.cervical.baselineAccuracy || 0.889)) * 100).toFixed(1)}%)`
  );

  res.json({
    message: 'Models successfully trained and validated with increased accuracy',
    metrics: { gdm: result.gdm, cervical: result.cervical },
    trainingRun: result.trainingRun,
    trainingHistory: result.trainingHistory,
  });
});

app.post('/api/ml/reset', (req, res) => {
  const user = getCurrentUser(req);
  const resetMetrics = resetMLModels();
  db.logAction(user?.id || 'admin-1', 'MODEL_RETRAIN', 'Reset ML model metrics to baseline benchmarks');
  res.json({
    message: 'Models reset to baseline benchmark metrics',
    metrics: resetMetrics,
  });
});

// ----------------------------------------------------
// ADMIN DASHBOARD
// ----------------------------------------------------
app.get('/api/admin/stats', (req, res) => {
  let totalPatients = 0;
  let totalDoctors = 0;
  let totalAdmins = 0;

  for (const u of db.users.values()) {
    if (u.role === 'patient') totalPatients++;
    else if (u.role === 'doctor') totalDoctors++;
    else if (u.role === 'admin') totalAdmins++;
  }

  const ml = getMLMetrics();
  res.json({
    totalUsers: db.users.size,
    totalPatients,
    totalDoctors,
    totalAdmins,
    modelUsageCount: db.auditLogs.filter((l) => l.action === 'PREDICTION_RUN').length,
    totalReportsGenerated: db.auditLogs.filter((l) => l.action === 'REPORT_DOWNLOAD').length,
    gdmModelVersion: ml.gdm.version,
    cervicalModelVersion: ml.cervical.version,
    gdmAccuracy: ml.gdm.accuracy,
    cervicalAccuracy: ml.cervical.accuracy,
  });
});

app.get('/api/admin/users', (req, res) => {
  const userList = Array.from(db.users.values()).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone,
    clinicLocation: u.clinicLocation,
    createdAt: u.createdAt,
  }));
  res.json(userList);
});

app.put('/api/admin/users/:id/role', (req, res) => {
  const targetId = req.params.id;
  const { role } = req.body;
  const user = db.users.get(targetId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.role = role;
  db.users.set(targetId, user);
  db.logAction(getCurrentUser(req)?.id || 'admin-1', 'ROLE_CHANGE', `Changed role of ${user.name} to ${role}`);
  res.json(user);
});

app.get('/api/admin/logs', (req, res) => {
  res.json(db.auditLogs.slice(0, 100));
});

// ----------------------------------------------------
// VITE DEV MIDDLEWARE / STATIC FILES
// ----------------------------------------------------
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Matern AI Platform running on http://localhost:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
});
