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

## 4. Local Setup & VS Code Execution

### Prerequisites
- **Node.js (v20 or higher)**: [Download here](https://nodejs.org/)
- **NPM (included with Node.js)**
- **Git** (optional, for cloning)

*Note: If you just installed Node.js, you may need to **restart VS Code** or your computer for the `npm` command to be recognized in your terminal.*

### Setup Instructions
To run this project in **VS Code**:

1.  **Clone/Download** the repository to your local machine.
2.  **Open Folder**: Open the project folder in VS Code.
3.  **Install Dependencies**: Open a new terminal (`Ctrl+` `) and run:
    ```bash
    npm install
    ```
    *If you get an error saying 'npm' is not recognized, please ensure Node.js is installed from the link above.*
4.  **Environment Setup**: Create a `.env` file in the root directory (based on `.env.example`) and add your Gemini API Key:
    ```env
    GEMINI_API_KEY="your_google_gemini_api_key"
    ```
5.  **Run Development Server**:
    ```bash
    npm run dev
    ```
6.  **Access the App**: Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

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
