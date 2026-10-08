import { GoogleGenAI } from '@google/genai';

// Initialize Gemini SDK with process.env.GEMINI_API_KEY
const getGenAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err);
    return null;
  }
};

const SYSTEM_INSTRUCTION = `
You are Matern AI, a compassionate, maternal-fetal health educational assistant grounded in WHO, ACOG (American College of Obstetricians and Gynecologists), and FOGSI guidelines.

Your mission:
1. Explain maternal health risks (Gestational Diabetes Mellitus and Cervical Cancer Screening/HPV) in clear, empathetic, easy-to-understand language.
2. Provide practical, evidence-based guidance on prenatal nutrition, physical activity, warning signs, and lab test interpretations.
3. Help users understand what factors influence risk scores (e.g. glucose levels, BMI, maternal age, HPV persistence, cytology results).

STRICT SAFETY & ETHICAL GUARDRAILS:
- You DO NOT provide specific drug dosages (e.g., do not calculate units of insulin or prescribe medications).
- You DO NOT provide definitive diagnoses or replace clinical examinations.
- Emphasize proactive follow-up with the patient's obstetrician or gynecologist.
- In every response, include this exact statement or a clear equivalent:
  "ℹ️ Educational Disclaimer: This information is for educational guidance only and is not a substitute for professional clinical diagnosis or medical treatment. Please consult your healthcare provider for personalized medical decisions."
- Tone: Calming, culturally respectful, empowering, and scientifically accurate.
`;

export async function generateChatResponse(params: {
  userMessage: string;
  language?: string;
  patientContext?: {
    name?: string;
    age?: number;
    gestationalWeeks?: number;
    gdmRisk?: string;
    cervicalRisk?: string;
    latestGlucose?: number;
    latestBP?: string;
  };
  conversationHistory?: { sender: 'user' | 'assistant'; content: string }[];
}): Promise<string> {
  const { userMessage, language = 'en', patientContext, conversationHistory = [] } = params;

  const langMap: Record<string, string> = {
    en: 'English',
    hi: 'Hindi (हिन्दी)',
    ta: 'Tamil (தமிழ்)',
    te: 'Telugu (తెలుగు)',
    kn: 'Kannada (ಕನ್ನಡ)',
    mr: 'Marathi (मराठी)',
  };

  const selectedLanguage = langMap[language] || 'English';

  // Build context prompt
  let contextSnippet = '';
  if (patientContext) {
    contextSnippet = `\nPatient Health Context:
- Name: ${patientContext.name || 'Patient'}
- Maternal Age: ${patientContext.age || 'N/A'}
- Gestational Weeks: ${patientContext.gestationalWeeks ? `${patientContext.gestationalWeeks} weeks` : 'Non-pregnant / Postnatal'}
- Current GDM Risk Category: ${patientContext.gdmRisk || 'Not evaluated'}
- Current Cervical Cancer Risk: ${patientContext.cervicalRisk || 'Not evaluated'}
- Latest Blood Glucose: ${patientContext.latestGlucose ? `${patientContext.latestGlucose} mg/dL` : 'Not recorded'}
- Latest Blood Pressure: ${patientContext.latestBP || 'Normal'}
`;
  }

  const ai = getGenAI();
  if (ai) {
    try {
      const messagesFormatted = conversationHistory.slice(-4).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      // Append current user message with context and language instruction
      const fullUserPrompt = `${contextSnippet}\nUser Preferred Language: ${selectedLanguage}\nSTRICT REQUIREMENT: Respond entirely in ${selectedLanguage} language.\nUser Question: ${userMessage}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          ...messagesFormatted,
          {
            role: 'user',
            parts: [{ text: fullUserPrompt }],
          },
        ],
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION}\n\nYou must respond in ${selectedLanguage}. Use culturally appropriate terminology while maintaining medical accuracy.`,
          temperature: 0.4,
        },
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (apiError) {
      console.error('Gemini API call failed, using intelligent clinical fallback:', apiError);
    }
  }

  // Fallback intelligent responder based on clinical rules
  return generateClinicalFallback(userMessage, patientContext);
}

function generateClinicalFallback(message: string, context?: any): string {
  const lower = message.toLowerCase();

  if (lower.includes('gestational diabetes') || lower.includes('gdm') || lower.includes('sugar') || lower.includes('glucose')) {
    return `### Understanding Gestational Diabetes Mellitus (GDM)

Gestational Diabetes is a condition where pregnancy hormones produced by the placenta create temporary insulin resistance, causing maternal blood glucose levels to rise above target thresholds.

**Key Clinical Highlights:**
1. **Target Glucose Numbers (ACOG/WHO Standards):**
   - Fasting blood sugar: ≤ 95 mg/dL
   - 1 hour after meals (post-prandial): ≤ 140 mg/dL
   - 2 hours after meals: ≤ 120 mg/dL
2. **Impact on Baby & Mother:** High maternal glucose crosses the placenta, which can cause excessive fetal weight gain (macrosomia) or neonatal hypoglycemia. Keeping blood sugars balanced protects both maternal and fetal well-being.
3. **Primary Management:** 70–85% of expectant mothers successfully manage GDM through medical nutrition therapy (low glycemic index foods) and 20–30 minutes of gentle post-meal walking.

*What to do next:* Monitor your blood sugar as advised by your obstetrician, focus on high-fiber whole grains, and keep your regular prenatal appointments.

---
ℹ️ **Educational Disclaimer:** This information is for educational guidance only and is not a substitute for professional clinical diagnosis or medical treatment. Please consult your healthcare provider for personalized medical decisions.`;
  }

  if (lower.includes('cervical') || lower.includes('pap') || lower.includes('hpv') || lower.includes('cancer') || lower.includes('smear')) {
    return `### Cervical Health & Screening Guidance

Cervical cancer is one of the most preventable gynecological conditions when caught early through routine screening and HPV vaccination.

**Key Clinical Highlights:**
1. **The Role of HPV:** Almost all cervical cancers are initiated by persistent infection with high-risk strains of the Human Papillomavirus (chiefly HPV 16 and 18). Having HPV does **not** mean you have cancer; in over 85% of women, the immune system clears the virus spontaneously.
2. **Screening Modalities:**
   - **Pap Smear (Cytology):** Examines cervical cells under a microscope for early abnormalities (dysplasia/CIN).
   - **HPV DNA Test:** Directly detects genetic material of high-risk HPV types.
   - **Visual Inspection with Acetic Acid (VIA):** Often used in low-resource settings.
3. **If your result is abnormal:** An abnormal Pap is often an early warning signal (such as ASC-US or LSIL). Your gynecologist may recommend a repeat test in 6–12 months or a closer examination called a **colposcopy**.

---
ℹ️ **Educational Disclaimer:** This information is for educational guidance only and is not a substitute for professional clinical diagnosis or medical treatment. Please consult your healthcare provider for personalized medical decisions.`;
  }

  if (lower.includes('diet') || lower.includes('food') || lower.includes('nutrition') || lower.includes('eat') || lower.includes('meal')) {
    return `### Maternal Nutrition & Dietary Guidance

Nutritional choices during pregnancy directly support maternal placental perfusion, fetal organogenesis, and maternal metabolic harmony.

**Core Nutrition Recommendations:**
- **Carbohydrate Quality:** Favor complex carbohydrates with low Glycemic Index (steel-cut oats, ragi/millets, lentils, brown rice) over refined flours and sugary beverages.
- **Protein Target:** Aim for 70–80 grams of quality protein daily (dal, paneer, tofu, eggs, well-cooked poultry, Greek yogurt).
- **Iron & Folate Synergy:** Consume dark leafy greens (spinach, methi) paired with Vitamin C (lemon juice, oranges) to enhance iron bioavailability.
- **Hydration:** Aim for 2.5 to 3 liters of water or healthy fluids (buttermilk, tender coconut water) daily.

---
ℹ️ **Educational Disclaimer:** This information is for educational guidance only and is not a substitute for professional clinical diagnosis or medical treatment. Please consult your healthcare provider for personalized medical decisions.`;
  }

  return `### Matern Maternal Health Guidance

Thank you for your question. Maintaining proactive maternal health through regular antenatal checkups, routine screening, and personalized nutrition is the safest way to ensure a healthy pregnancy.

**Recommended Antenatal Schedule:**
- Early booking visit (Weeks 6–10)
- First trimester nuchal translucency & double marker screening (Weeks 11–13)
- Anomaly scan (Weeks 18–20)
- Gestational Diabetes oral glucose screening (Weeks 24–28)
- Third trimester growth and fetal Doppler surveillance (Weeks 32–36)

Feel free to ask specific questions about your risk assessment scores, meal planning, or lab tests!

---
ℹ️ **Educational Disclaimer:** This information is for educational guidance only and is not a substitute for professional clinical diagnosis or medical treatment. Please consult your healthcare provider for personalized medical decisions.`;
}
