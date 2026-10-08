export interface UserProfile {
  age: number;
  region: string;
  isUrban: boolean;
  dietaryPreference: 'veg' | 'non-veg' | 'egg' | 'vegan';
  culturalRestrictions?: string[];
  allergies?: string[];
  budgetLevel: 'low' | 'medium' | 'high';
  cookingFacilities: boolean;
}

export interface PregnancyInfo {
  trimester: 1 | 2 | 3;
  gestationalWeek: number;
  expectedDeliveryDate: string;
  isMultiple: boolean;
  isLactating: boolean;
}

export interface Vitals {
  heightCm: number;
  prePregnancyWeightKg: number;
  currentWeightKg: number;
  bmi: number;
  bloodPressureSys: number;
  bloodPressureDia: number;
  hemoglobinGdl: number;
  bloodSugarFasting?: number;
  bloodSugarPostMeal?: number;
  hba1c?: number;
  pulse?: number;
  temperature?: number;
  muacCm?: number;
}

export interface NutritionRiskPrediction {
  riskClassification: {
    underweight: boolean;
    normalWeight: boolean;
    overweight: boolean;
    anemiaSeverity: 'none' | 'mild' | 'moderate' | 'severe';
    gdmRisk: 'low' | 'medium' | 'high';
    hypertensionRisk: 'low' | 'medium' | 'high';
  };
  confidenceScore: number;
  urgentAlert: boolean;
  alertMessage?: string;
}

export interface DietPlan {
  dailyTargets: {
    calories: number;
    proteinG: number;
    ironMg: number;
    folateMcg: number;
  };
  weeklyPlan: {
    day: string;
    meals: {
      breakfast: string;
      midMorning: string;
      lunch: string;
      eveningSnack: string;
      dinner: string;
      bedtime: string;
    };
    cheaperSubstitutes: string[];
    minimalCookOptions: string[];
  }[];
}
