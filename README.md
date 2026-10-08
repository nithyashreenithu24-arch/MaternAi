# Matern AI: Maternal Health Risk Prediction & Guidance Platform

Production-ready web application for maternal health risk prediction, personalized nutrition recommendations, clinical decision support, and AI-powered patient education.

---

## 1. System Overview & Architecture

Matern AI bridges predictive machine learning with maternal-fetal clinical practice:
- **Gestational Diabetes Mellitus (GDM) Risk Estimator**: Statistical classifier trained on the PIMA Indian Diabetes cohort and antenatal glucose markers (Fasting blood sugar, 2h post-prandial glucose, pre-pregnancy BMI, maternal age, parity, family pedigree).
- **Cervical Dysplasia / Neoplasia Risk Predictor**: Multi-factor model grounded in WHO & Cervical Risk Factor datasets (high-risk HPV DNA status, cytology history, smoking pack-years, sexual history, oral contraceptive duration, STDs).
- **Personalized Nutrition Recommendation Engine**: Calculates daily caloric targets (BMR + trimester adjustments) and 7-day meal plans adhering to low-glycemic index (GI) and high-bioavailable iron protocols.
- **AI Healthcare Chatbot**: Integrated with Google Gemini (`gemini-3.8-flash`) with constrained clinical guardrails, grounding context, and educational disclaimers.
- **Role-Based Portals**:
  - **Patient Dashboard**: Risk gauges, longitudinal glucose & blood pressure trend charts, nutritional schedule, and downloadable clinical health reports (PDF).
  - **Doctor Dashboard**: Patient cohort list with risk stratification, patient drill-downs, model explainability (odds ratios / feature contributions), clinical notes entry, and dietary approval.
  - **Admin & MLOps Portal**: System metrics, model versioning (`v1.2.4-GDM`, `v1.1.8-CC`), online retraining workflow with CSV upload, user role management, and security audit logs.

---

## 2. Tech Stack

- **Frontend**: React 19 (TypeScript), Tailwind CSS, Custom SVG Visualizations & Gauges, jsPDF (client-side PDF generation), Lucide Icons.
- **Backend**: Node.js & Express (TypeScript), RESTful API endpoints.
- **Machine Learning**: Standardized Logistic Regression & Decision Scorer with model versioning, feature contribution weights, and validation metrics (Accuracy, ROC-AUC, Precision, Recall, F1).
- **AI Integration**: Google GenAI SDK (`@google/genai`) accessing `gemini-3.8-flash` with system prompt guardrails.
- **Containerization**: Multi-stage `Dockerfile` and `docker-compose.yml`.

---

## 3. Getting Started & Role-Based Access

The application uses a strict **Role-Based Access Control (RBAC)** system. Unlike early demos, there is no top-level demo switcher; users must register or sign in to access their specific dashboard.

- **Registration**: New patients can register themselves to auto-provision a clinical profile.
- **Pre-Seeded Accounts for Testing**:
  - **Patient**: `patient@matern.org` (Password: `password123`)
  - **Doctor**: `doctor@matern.org` (Password: `password123`)
  - **Admin**: `admin@matern.org` (Password: `password123`)

---

## 4. Running Locally in VS Code (Zero Configuration)

You can run this application locally in Visual Studio Code with **zero code modifications**.

### Prerequisites
* **Node.js**: v18 or v20+ recommended ([Download Node.js](https://nodejs.org/))
* **VS Code**: Visual Studio Code editor

### 3 Simple Steps to Run:

1. **Open the project folder in VS Code**:
   * File ➔ Open Folder... ➔ select this project directory.

2. **Open the Integrated Terminal in VS Code**:
   * Press ``Ctrl + ` `` (Windows/Linux) or ``Cmd + ` `` (Mac).

3. **Install and Start**:
   ```bash
   npm install
   npm run dev
   ```

4. **Open in Browser**:
   * Navigate to **[http://localhost:3000](http://localhost:3000)** in Chrome, Edge, Safari, or Firefox.

> **Note on Environment Variables & API Keys**:
> * **No API Key is required to run**: All Machine Learning models (GDM & Cervical Cancer risk estimators), precision nutrition engines, visual telemetry charts, doctor/patient/admin dashboards, and daily medication adherence progress calendars run **100% locally on your machine**.
> * *(Optional)* If you want to enable live Google Gemini responses for the chat drawer, create a `.env` file in the root directory:
>   ```env
>   GEMINI_API_KEY=your_gemini_api_key_here
>   PORT=3000
>   ```
>   *(If left empty, the chatbot automatically uses intelligent clinical rule-based guidance).*

---

### Pre-Seeded Accounts for Immediate Testing:

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@matern.org` | `password123` | Patient dashboard, GDM & Cervical telemetry, 7-day nutrition chart, daily vitamin adherence logger |
| **Doctor** | `doctor@matern.org` | `password123` | Cohort drill-down, patient clinical notes, dietary approval, direct messaging |
| **Admin** | `admin@matern.org` | `password123` | ML model governance, retraining workflow, audit logs, user management |

*You can also click **"Register Patient"** on the login screen to register any new account.*

---

## 5. Deployment (Production)

### Docker Environment
```bash
docker-compose up --build -d
```

### Manual Build
```bash
npm run build
npm run start
```

---

## 6. API Endpoints

### Authentication
- `POST /api/auth/register`: Create user (email, password, role)
- `POST /api/auth/login`: Authenticate and receive session token
- `GET /api/auth/me`: Retrieve current authenticated profile

### Patients & Clinical Records
- `GET /api/patients`: List assigned patients with risk badges
- `GET /api/patients/:id`: Retrieve patient drill-down
- `POST /api/health-records`: Submit new vitals entry (triggers live model re-calculation)

### AI Risk Predictions & Nutrition
- `GET /api/predictions/:userId`: Retrieve latest saved risk predictions
- `POST /api/nutrition/generate`: Regenerate 7-day meal plan
- `POST /api/chat`: Send query to Matern AI Guide (Powered by `gemini-1.5-flash`)

---

## 7. Clinical & Regulatory Disclaimers

1. **Educational & Decision-Support Only**: All predictions, recommendations, and chatbot outputs are for educational risk stratification and must be confirmed by a licensed medical practitioner.
2. **Guideline Alignment**: Incorporates standard thresholds from the World Health Organization (WHO), American College of Obstetricians and Gynecologists (ACOG), and Federation of Obstetric & Gynaecological Societies of India (FOGSI).
3. **Data Security**: Designed with HIPAA and DISA compliance principles, role-based access control (RBAC), and audit logging.
