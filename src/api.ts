import {
  User,
  HealthRecord,
  PredictionResult,
  NutritionPlan,
  ChatMessage,
  DoctorNote,
  AdminStats,
  AuditLog,
  ModelMetric,
  DirectMessage,
  Appointment,
  AdherenceSummary,
  DailyAdherenceRecord,
  MedicationItem,
  TrainingRun,
  TrainingOptions,
} from './types';

const getHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const activeToken = token || localStorage.getItem('matern_token');
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
    headers['x-user-id'] = activeToken;
  }
  return headers;
};

export const api = {
  // Auth
  async getCurrentUser(token?: string): Promise<{ user: User }> {
    const res = await fetch('/api/auth/me', { headers: getHeaders(token) });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to login');
    }
    return res.json();
  },

  async register(data: any): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to register');
    }
    return res.json();
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // Patients
  async getPatients(): Promise<any[]> {
    const res = await fetch('/api/patients', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load patients');
    return res.json();
  },

  async getPatientDetails(patientId: string): Promise<{
    patient: User;
    records: HealthRecord[];
    latestRecord?: HealthRecord;
    predictions?: { gdm: PredictionResult; cervical: PredictionResult };
    nutrition?: NutritionPlan;
    notes: DoctorNote[];
  }> {
    const res = await fetch(`/api/patients/${patientId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load patient details');
    return res.json();
  },

  async addDoctorNote(patientId: string, noteText: string, recommendations: string[]): Promise<DoctorNote> {
    const res = await fetch(`/api/patients/${patientId}/notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ noteText, recommendations }),
    });
    if (!res.ok) throw new Error('Failed to save doctor note');
    return res.json();
  },

  // Health Records
  async getHealthRecords(userId: string): Promise<HealthRecord[]> {
    const res = await fetch(`/api/health-records/${userId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load health records');
    return res.json();
  },

  async submitHealthRecord(data: Partial<HealthRecord> & { patientId?: string; familyHistoryDiabetes?: boolean }): Promise<{
    record: HealthRecord;
    predictions: { gdm: PredictionResult; cervical: PredictionResult };
  }> {
    const res = await fetch('/api/health-records', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save health record');
    return res.json();
  },

  // Predictions
  async getPredictions(userId: string): Promise<{ gdm: PredictionResult; cervical: PredictionResult }> {
    const res = await fetch(`/api/predictions/${userId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load predictions');
    return res.json();
  },

  // Nutrition
  async getNutritionPlan(userId: string): Promise<NutritionPlan> {
    console.log('API: Calling getNutritionPlan for user:', userId);
    const res = await fetch(`/api/nutrition/${userId}`, { headers: getHeaders() });
    if (!res.ok) {
        console.error('API Error: Failed to load nutrition plan for user:', userId);
        throw new Error('Failed to load nutrition plan');
    }
    const data = await res.json();
    console.log('API: Received nutrition plan for user:', userId, data);
    return data;
  },

  async generateNutritionPlan(patientId: string, dietaryPreference?: string, region?: string): Promise<NutritionPlan> {
    console.log('API: Calling generateNutritionPlan for patient:', patientId, 'preference:', dietaryPreference, 'region:', region);
    const res = await fetch('/api/nutrition/generate', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ patientId, dietaryPreference, region }),
    });
    if (!res.ok) {
        console.error('API Error: Failed to generate nutrition plan for patient:', patientId);
        throw new Error('Failed to generate nutrition plan');
    }
    const data = await res.json();
    console.log('API: Received generated nutrition plan:', data);
    return data;
  },

  async getKarnatakaRecipes(): Promise<any[]> {
    const res = await fetch('/api/nutrition/recipes/karnataka', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load Karnataka recipes');
    return res.json();
  },

  async updateNutritionApproval(patientId: string, status: string, notes?: string): Promise<NutritionPlan> {
    const res = await fetch(`/api/nutrition/${patientId}/approval`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ doctorApprovalStatus: status, doctorNotes: notes }),
    });
    if (!res.ok) throw new Error('Failed to update nutrition approval');
    return res.json();
  },

  // Chatbot
  async getChatHistory(userId: string): Promise<ChatMessage[]> {
    const res = await fetch(`/api/chat/history/${userId}`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async sendChatMessage(message: string, userId: string): Promise<{ reply: ChatMessage; history: ChatMessage[] }> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, userId }),
    });
    if (!res.ok) throw new Error('Failed to send chat message');
    return res.json();
  },

  // Reports
  async getReportData(userId: string): Promise<any> {
    const res = await fetch(`/api/reports/${userId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load report data');
    return res.json();
  },

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    const res = await fetch('/api/appointments', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load all appointments');
    return res.json();
  },

  async getUserAppointments(userId: string): Promise<Appointment[]> {
    const res = await fetch(`/api/appointments/${userId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load user appointments');
    return res.json();
  },

  async requestAppointment(data: { reason: string; type: string; scheduledDate?: string }): Promise<Appointment> {
    const res = await fetch('/api/appointments/request', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to request appointment');
    return res.json();
  },

  async approveAppointment(aptId: string): Promise<void> {
    const res = await fetch(`/api/appointments/${aptId}/approve`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to approve appointment');
  },

  async rejectAppointment(aptId: string): Promise<void> {
    const res = await fetch(`/api/appointments/${aptId}/reject`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to reject appointment');
  },

  // Doctor-Patient Direct Messaging
  async getDirectMessages(patientId: string): Promise<DirectMessage[]> {
    const res = await fetch(`/api/messages/${patientId}`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async sendDirectMessage(data: {
    patientId: string;
    content: string;
    tag?: string;
    isUrgent?: boolean;
  }): Promise<{ message: DirectMessage; thread: DirectMessage[] }> {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to send clinical direct message');
    return res.json();
  },

  async markMessagesRead(patientId: string): Promise<{ success: boolean; thread: DirectMessage[] }> {
    const res = await fetch(`/api/messages/${patientId}/read`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark messages as read');
    return res.json();
  },

  // Admin & ML
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch('/api/admin/stats', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load admin stats');
    return res.json();
  },

  async getAdminUsers(): Promise<User[]> {
    const res = await fetch('/api/admin/users', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load user list');
    return res.json();
  },

  async updateUserRole(userId: string, role: string): Promise<User> {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to update user role');
    return res.json();
  },

  async getAdminLogs(): Promise<AuditLog[]> {
    const res = await fetch('/api/admin/logs', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load audit logs');
    return res.json();
  },

  async getMLMetrics(): Promise<{
    gdm: ModelMetric;
    cervical: ModelMetric;
    trainingHistory?: TrainingRun[];
    isOptimized?: boolean;
  }> {
    const res = await fetch('/api/ml/metrics', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load ML metrics');
    return res.json();
  },

  async getMLHistory(): Promise<TrainingRun[]> {
    const res = await fetch('/api/ml/history', { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async retrainModels(options?: TrainingOptions | string, cervicalCsv?: string): Promise<{
    message: string;
    metrics: { gdm: ModelMetric; cervical: ModelMetric };
    trainingRun: TrainingRun;
    trainingHistory: TrainingRun[];
  }> {
    let bodyPayload: TrainingOptions = {};
    if (typeof options === 'string') {
      bodyPayload = { gdmCsv: options, cervicalCsv };
    } else if (options) {
      bodyPayload = options;
    }

    const res = await fetch('/api/ml/train', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bodyPayload),
    });
    if (!res.ok) throw new Error('Failed to train and optimize models');
    return res.json();
  },

  async resetModelMetrics(): Promise<{
    message: string;
    metrics: { gdm: ModelMetric; cervical: ModelMetric };
  }> {
    const res = await fetch('/api/ml/reset', {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to reset models');
    return res.json();
  },

  // Prenatal Adherence & Medication Tracking
  async getAdherence(patientId: string): Promise<AdherenceSummary> {
    const res = await fetch(`/api/adherence/${patientId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load adherence records');
    return res.json();
  },

  async logAdherenceDose(
    patientId: string,
    payload: { date: string; doseId: string; status: 'taken' | 'missed' | 'pending'; notes?: string }
  ): Promise<{ record: DailyAdherenceRecord; summary: AdherenceSummary }> {
    const res = await fetch(`/api/adherence/${patientId}/dose`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to log dose adherence');
    return res.json();
  },

  async markAllDosesTaken(
    patientId: string,
    date?: string
  ): Promise<{ record: DailyAdherenceRecord; summary: AdherenceSummary }> {
    const res = await fetch(`/api/adherence/${patientId}/mark-all-taken`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ date }),
    });
    if (!res.ok) throw new Error('Failed to mark all doses as taken');
    return res.json();
  },

  async addCustomMedication(
    patientId: string,
    med: Omit<MedicationItem, 'id'>
  ): Promise<{ medications: MedicationItem[]; summary: AdherenceSummary }> {
    const res = await fetch(`/api/adherence/${patientId}/medications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(med),
    });
    if (!res.ok) throw new Error('Failed to add custom medication');
    return res.json();
  },
};
