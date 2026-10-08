import { NutritionPlan, DailyMealPlan } from '../src/types.js';

export type DietPlanOutput = NutritionPlan;

export interface PatientInput {
  patient: {
    age: number;
    height_cm: number;
    weight_kg: number;
    bmi: number;
    pregnancy_week: number | null;
    trimester: number;
    diet_type: 'veg' | 'non-veg' | 'eggetarian' | 'vegan';
    allergies: string[];
    language: string;
    region?: 'karnataka' | 'north' | 'south' | 'east' | 'west' | 'central' | string;
    setting?: 'rural' | 'urban' | 'semi-urban';
    access?: 'market' | 'pds' | 'anganwadi' | 'home_garden';
  };
  vitals: {
    fasting_glucose: number;
    postprandial_glucose: number;
    hba1c: number;
    bp_systolic: number;
    bp_diastolic: number;
    hemoglobin: number;
    heart_rate: number;
    weight_trend: string;
  };
  prediction: {
    model: 'gestational_diabetes' | 'cervical_cancer';
    risk_level: 'low' | 'moderate' | 'high';
    risk_score: number;
    treatment_stage: 'screening' | 'pre-treatment' | 'on-treatment' | 'recovery' | 'none';
  };
  location: {
    country: string;
    state: string;
    district: string;
    setting: 'rural' | 'urban' | 'semi-urban';
    season: string;
  };
  resources: {
    monthly_food_budget_inr: number;
    access: 'market' | 'ration shop (PDS)' | 'home garden' | 'anganwadi';
    cooking_fuel: string;
    refrigeration: boolean;
  };
}

export class NutritionModel {
  static generatePlan(input: PatientInput): NutritionPlan {
    const isDiabetes = input.prediction.model === 'gestational_diabetes' || input.vitals.postprandial_glucose >= 140;
    const isAnemic = input.vitals.hemoglobin < 11;
    const bmi = input.patient.bmi || 22;
    const region = (input.patient.region || 'karnataka').toLowerCase();
    
    // Normalize dietary type
    const rawDiet = (input.patient.diet_type || 'veg').toLowerCase();
    const dietType: 'veg' | 'non-veg' | 'eggetarian' | 'vegan' = 
      rawDiet.includes('non') ? 'non-veg' :
      rawDiet.includes('vegan') ? 'vegan' :
      rawDiet.includes('egg') ? 'eggetarian' : 'veg';

    const patientName = (input as any).patientName || 'Patient';
    const patientId = (input as any).patientId || 'pat-1';

    // ICMR-NIN Standards based on BMI category
    let bmiCategory: 'normal' | 'undernourished' | 'overweight' = 'normal';
    let baseCalories = 2260;
    let foodGroupGrams = {
      cerealGrains: 275,
      pulsesLegumes: 60,
      greenLeafyVeg: 150,
      rootsTubers: 100,
      otherVeg: 200,
      nutsOilSeeds: 30,
      fruits: 200,
      milkProducts: 500,
      fatsOils: 30,
      sugar: 10,
    };

    if (bmi < 18.5) {
      bmiCategory = 'undernourished';
      baseCalories = 2410;
      foodGroupGrams = {
        cerealGrains: 275,
        pulsesLegumes: 90,
        greenLeafyVeg: 150,
        rootsTubers: 100,
        otherVeg: 200,
        nutsOilSeeds: 35,
        fruits: 200,
        milkProducts: 500,
        fatsOils: 35,
        sugar: 10,
      };
    } else if (bmi > 23.0) {
      bmiCategory = 'overweight';
      baseCalories = 2120;
      foodGroupGrams = {
        cerealGrains: 250,
        pulsesLegumes: 60,
        greenLeafyVeg: 150,
        rootsTubers: 100,
        otherVeg: 200,
        nutsOilSeeds: 20,
        fruits: 200,
        milkProducts: 500,
        fatsOils: 20,
        sugar: 0,
      };
    }

    // Macro distributions dynamically calibrated by dietary type
    let proteinPct = 18;
    let fatPct = 27;
    let carbsPct = 55;

    if (dietType === 'non-veg') {
      proteinPct = 21;
      fatPct = 25;
      carbsPct = 54;
    } else if (dietType === 'eggetarian') {
      proteinPct = 20;
      fatPct = 26;
      carbsPct = 54;
    } else if (dietType === 'vegan') {
      proteinPct = 18;
      fatPct = 25;
      carbsPct = 57;
    }

    const proteinGrams = Math.round((baseCalories * (proteinPct / 100)) / 4);
    const fatGrams = Math.round((baseCalories * (fatPct / 100)) / 9);
    const carbsGrams = Math.round((baseCalories * (carbsPct / 100)) / 4);

    const sevenDayMealPlan = this.generateICMRMealPlan(region, dietType, isDiabetes, isAnemic, bmiCategory);

    // Diet-specific clinical guidelines
    const keyGuidelines = this.buildKeyGuidelines(dietType, bmiCategory, baseCalories, region, isAnemic, isDiabetes, foodGroupGrams);

    const dietaryPrefString: 'vegetarian' | 'non-vegetarian' | 'vegan' | 'eggetarian' =
      dietType === 'non-veg' ? 'non-vegetarian' :
      dietType === 'vegan' ? 'vegan' :
      dietType === 'eggetarian' ? 'eggetarian' : 'vegetarian';

    const targetedRiskFocus = [
      `ICMR-NIN Maternal Nutrition Protocol (${bmiCategory.toUpperCase()} Profile)`,
      dietType === 'non-veg'
        ? 'Heme Iron Bioavailability & Omega-3 DHA (Fetal Neurogenesis)'
        : dietType === 'eggetarian'
        ? 'Ovo-Lacto Protocol: Choline & Complete Albumin Optimization'
        : dietType === 'vegan'
        ? '100% Plant-Based Protocol: Plant Calcium, Fiber & Vitamin B12 Guidance'
        : 'Lacto-Vegetarian Plant & Dairy Synergy',
      isDiabetes ? 'Gestational Diabetes Glycemic Regulation' : 'Controlled Gestational Weight Gain',
      isAnemic ? 'Iron Deficiency Correction (Vitamin C Synergy)' : 'Standard Micronutrient Balance',
    ];

    return {
      patientId,
      patientName,
      generatedAt: new Date().toISOString(),
      dailyCalorieTarget: baseCalories,
      macroDistribution: {
        carbsPercentage: carbsPct,
        carbsGrams,
        proteinPercentage: proteinPct,
        proteinGrams,
        fatPercentage: fatPct,
        fatGrams,
      },
      dietaryPreference: dietaryPrefString,
      targetedRiskFocus,
      keyGuidelines,
      sevenDayMealPlan,
      doctorApprovalStatus: 'approved',
      doctorNotes: `Personalized 7-day maternal nutrition plan calibrated for ${dietaryPrefString.toUpperCase()} diet in ${region.toUpperCase()} India (${bmiCategory} profile, ${baseCalories} kcal/day).`,
    };
  }

  private static buildKeyGuidelines(
    dietType: 'veg' | 'non-veg' | 'eggetarian' | 'vegan',
    bmiCategory: string,
    baseCalories: number,
    region: string,
    isAnemic: boolean,
    isDiabetes: boolean,
    foodGroupGrams: any
  ) {
    const guidelines = [
      {
        title: `ICMR-NIN Targets (${bmiCategory.toUpperCase()} Profile - ${baseCalories} kcal/day)`,
        description: `Aligned with Government of India ICMR-NIN standards for maternal health in Karnataka. Raw group targets: Cereals & Millets (${foodGroupGrams.cerealGrains}g), Pulses & Legumes (${foodGroupGrams.pulsesLegumes}g), Green Leafy Vegetables (${foodGroupGrams.greenLeafyVeg}g), Seasonal Vegetables (${foodGroupGrams.otherVeg}g).`,
        foodExamples: ['Sprouted Ragi (Finger Millet)', 'Jolada (Sorghum)', 'Double Fortified Salt', 'Seasonal Greens (Basale/Methi)'],
        foodsToAvoid: ['Refined Flour (Maida)', 'Excess Free Sugar', 'Trans Fats']
      }
    ];

    if (dietType === 'non-veg') {
      guidelines.push({
        title: '🐟 Omega-3 DHA Fish Selection & Fetal Neurogenesis',
        description: 'Incorporate 2 servings weekly of low-mercury regional fish (Bangude / Mackerel, Sardines, Rohu, Pomfret). Rich in DHA and EPA essential for fetal cortical and retinal development. Avoid predatory large fish (shark, swordfish).',
        foodExamples: ['Fresh Bangude (Mackerel) Curry', 'Steamed Sardines', 'Freshwater Rohu'],
        foodsToAvoid: ['High-mercury fish (Shark, King Mackerel, Swordfish)', 'Raw or undercooked seafood']
      });
      guidelines.push({
        title: '🍗 Heme Iron & Thermal Cooking Safety',
        description: 'Country chicken (Nati Koli) and mutton bone broth offer organic heme iron with 25-30% bioabsorption. Always ensure poultry and meat are cooked thoroughly (above 75°C) to prevent Salmonella and Toxoplasmosis.',
        foodExamples: ['Karnataka Nati Koli Saaru (Country Chicken Broth)', 'Mutton Bone Broth / Marag', 'Well-cooked chicken breast'],
        foodsToAvoid: ['Raw or rare meat', 'Street-vended non-veg snacks', 'Reheated stale meat dishes']
      });
    } else if (dietType === 'eggetarian') {
      guidelines.push({
        title: '🥚 Choline & Complete Albumin Optimization',
        description: '2 whole eggs daily supply 12g of first-class protein and 250mg Choline (over 50% of the maternal daily allowance). Choline is critical for fetal neural tube closure and memory center development in the hippocampus.',
        foodExamples: ['Hard-boiled eggs', 'Karnataka Egg Burji (with jeera & curry leaves)', 'Egg Palya with Jolada Rotti'],
        foodsToAvoid: ['Soft-boiled eggs with runny yolks', 'Raw egg preparations (mayonnaise)', 'Unpasteurized egg products']
      });
      guidelines.push({
        title: '🥛 Lacto-Ovo Bone & Skeletal Mineralization',
        description: 'Pair whole eggs with calcium-rich dairy (fresh curd, buttermilk) and sprouted ragi to achieve optimal calcium-to-phosphorus ratio for fetal skeletal formation.',
        foodExamples: ['Fresh Curd (Mosaru)', 'Traditional Buttermilk (Majjige)', 'Sprouted Ragi Malt'],
        foodsToAvoid: ['Excess salt in omelettes', 'Deep-fried egg bonda']
      });
    } else if (dietType === 'vegan') {
      guidelines.push({
        title: '🌱 100% Plant-Based Dairy-Free Calcium Protocol',
        description: 'Achieve the 1000mg ICMR daily calcium target without dairy by emphasizing Sprouted Ragi (344mg/100g), White Sesame seeds (Til / Ellu: 975mg/100g), fortified Soy Milk, homemade Peanut Curd (Kadalekai Mosaru), and dark leafy greens (Agathi/Basale).',
        foodExamples: ['Sesame (Til) Chikki & Laddu', 'Sprouted Ragi Ganji', 'Fortified Soy Milk', 'Peanut Curd (Kadalekai Mosaru)'],
        foodsToAvoid: ['Cow milk and all dairy products', 'Ghee and butter', 'Commercial processed vegan junk foods']
      });
      guidelines.push({
        title: '💊 Mandatory Vitamin B12 & Vitamin D Supplementation',
        description: 'Vitamin B12 is absent in unfortified plant foods. Vegan expectant mothers must ensure daily sublingual B12 supplementation (1.2–2.6 mcg/day) under clinician guidance, alongside 15 minutes of direct morning sunlight for Vitamin D3.',
        foodExamples: ['Clinician-prescribed Vitamin B12', 'Nutritional Yeast (B12 fortified)', 'Fortified plant milk'],
        foodsToAvoid: ['Relying solely on spirulina or unfortified grains for B12 needs']
      });
    } else {
      // Vegetarian
      guidelines.push({
        title: '🥛 Lacto-Vegetarian Protein & Probiotic Harmony',
        description: 'Synergize legumes, dals, and millets with fresh dairy (curd, buttermilk, paneer) to achieve complete amino acid profiles and bioavailable calcium. Homemade curd supports gut microbiota and eases digestive heartburn.',
        foodExamples: ['Fresh Homemade Curd (Mosaru)', 'Buttermilk (Majjige)', 'Paneer', 'Toor Dal Huli'],
        foodsToAvoid: ['Packaged flavored yogurts with high sugar', 'Excessively spicy curries']
      });
      guidelines.push({
        title: '🌾 Millet Synergy for Sustained Glycemic Control',
        description: 'Traditional Karnataka millets (Ragi, Jolada, Sajje) have low glycemic indices and abundant soluble fiber, releasing glucose gradually into the bloodstream to safeguard against gestational insulin resistance.',
        foodExamples: ['Ragi Mudde', 'Jolada Rotti', 'Akki Rotti with dill greens', 'Avalakki Upma'],
        foodsToAvoid: ['Polished white rice in large single portions', 'Deep-fried snacks (Bajjis/Bonda)']
      });
    }

    // Iron / Vitamin C synergy
    guidelines.push({
      title: isAnemic ? '🚨 ICMR Iron & Vitamin C Absorption Protocol' : 'Iron & Folic Acid Synergy',
      description: 'Combine iron-rich plant foods (Basale, Drumstick greens, Sprouted Moong, Poha) with Vitamin C fruits (Amla, Guava, Orange, Lemon). Never drink tea or coffee within 1 hour of meals, as tannins inhibit iron absorption by up to 60%.',
      foodExamples: ['Amla (Indian Gooseberry)', 'Fresh Guava', 'Drumstick (Nuggekai) leaves', 'Sprouted Hesaru Kalu'],
      foodsToAvoid: ['Tea or coffee consumed immediately with or after meals']
    });

    if (isDiabetes) {
      guidelines.push({
        title: '⚠️ Gestational Diabetes Glycemic Regulation',
        description: 'Maintain 5–6 small, frequent meals rather than 2 large meals to prevent postprandial glucose excursions. Emphasize low glycemic index millets and fiber-rich greens.',
        foodExamples: ['Jolada Rotti', 'Ragi Ganji without sugar', 'Bitter Gourd (Hagalakayi)', 'Methi (Menthya) Dal'],
        foodsToAvoid: ['Refined white rice', 'Fruit juices with added sugar', 'Bakery sweets']
      });
    }

    return guidelines;
  }

  static generatePersonalizedNutritionPlan(params: any): NutritionPlan {
    const rawPref = (params.dietaryPreference || 'vegetarian').toLowerCase();
    const dietType = rawPref.includes('non') ? 'non-veg' : rawPref.includes('vegan') ? 'vegan' : rawPref.includes('egg') ? 'eggetarian' : 'veg';

    const input: PatientInput = {
      patient: {
        age: params.age || 26,
        height_cm: params.heightCm || 160,
        weight_kg: params.weightKg || 62,
        bmi: params.bmi || 24,
        pregnancy_week: params.gestationalWeeks || 24,
        trimester: 2,
        diet_type: dietType,
        allergies: params.allergies || [],
        language: 'en',
        region: params.region || 'karnataka',
        setting: 'rural',
        access: 'pds',
      },
      vitals: {
        fasting_glucose: params.bloodSugarFasting || 95,
        postprandial_glucose: params.bloodSugarPostPrandial || 135,
        hba1c: params.hba1c || 5.4,
        bp_systolic: params.bloodPressureSys || 120,
        bp_diastolic: params.bloodPressureDia || 80,
        hemoglobin: params.hemoglobinG_dL || 11.0,
        heart_rate: 76,
        weight_trend: 'stable',
      },
      prediction: {
        model: 'gestational_diabetes',
        risk_level: (params.gdmRiskLevel || 'low').toLowerCase(),
        risk_score: 40,
        treatment_stage: 'screening',
      },
      location: { country: 'India', state: params.state || 'Karnataka', district: '', setting: 'rural', season: 'normal' },
      resources: { monthly_food_budget_inr: 4000, access: 'ration shop (PDS)', cooking_fuel: 'clean', refrigeration: true }
    };
    return NutritionModel.generatePlan(input);
  }

  private static generateICMRMealPlan(
    region: string,
    dietType: 'veg' | 'non-veg' | 'eggetarian' | 'vegan',
    isDiabetes: boolean,
    isAnemic: boolean,
    bmiCategory: string
  ): DailyMealPlan[] {
    const days = [
      { day: 1, name: 'Monday (ICMR Day 1: High Iron & Folate)' },
      { day: 2, name: 'Tuesday (ICMR Day 2: Millet & Calcium / DHA)' },
      { day: 3, name: 'Wednesday (ICMR Day 3: Protein & Sprouts)' },
      { day: 4, name: 'Thursday (ICMR Day 4: Vegetable & Glycemic Fiber)' },
      { day: 5, name: 'Friday (ICMR Day 5: Immunity & Citrus Synergy)' },
      { day: 6, name: 'Saturday (ICMR Day 6: Balanced Energy & Vitality)' },
      { day: 7, name: 'Sunday (ICMR Day 7: Wholesome Traditional Heritage)' },
    ];

    return days.map((d, index) => {
      let earlyMorning, bFast, mSnack, lunch, eSnack, dinner, bed;

      // Day 1
      if (index === 0) {
        if (dietType === 'non-veg') {
          earlyMorning = { name: 'Early Morning Milk (200 ml) + Soaked Almonds (5 pcs)', portion: '200 ml + 5 nuts', calories: 150, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Healthy Fats' };
          bFast = { name: 'Ragi Malt (Ragi Ganji) + 2 Boiled Eggs & Roasted Chana', portion: '1 bowl + 2 eggs', calories: 360, glycemicIndex: 'Low' as const, nutrientsHighlight: 'High Bioavailable Calcium & Complete Egg Protein' };
          mSnack = { name: 'Fresh Seasonal Guava (1 medium)', portion: '1 guava', calories: 90, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Vitamin C (126mg) for Iron Absorption' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Karnataka Nati Koli Saaru (Country Chicken Curry, 60g) + Basale Soppu Palya + Cucumber Salad + Curd', portion: '2 Katori Rice + Chicken + Greens', calories: 570, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Heme Iron, Folate & High-Grade Protein' };
          eSnack = { name: 'Huruli (Horse Gram) Sundal + Roasted Peanuts (30g)', portion: '1 bowl + nuts', calories: 240, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Plant Protein & Dietary Fiber' };
          dinner = { name: 'Jolada Rotti (2 pcs) with Steamed Chicken Keema / Egg Palya & Menthe Soppu Dal + Curd', portion: '2 rotis + chicken/egg + curd', calories: 500, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Slow-Release Magnesium & Lean Protein' };
          bed = { name: 'Warm Cardamom Milk (100 ml)', portion: '100 ml', calories: 75, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Tryptophan & Restful Sleep' };
        } else if (dietType === 'eggetarian') {
          earlyMorning = { name: 'Early Morning Milk (200 ml) + Soaked Almonds (5 pcs)', portion: '200 ml + 5 nuts', calories: 150, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Healthy Fats' };
          bFast = { name: 'Ragi Malt (Ragi Sajjige) + 2 Hard-Boiled Eggs with Jeera Salt', portion: '1 bowl + 2 eggs', calories: 360, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium, Iron & Choline (250mg) for Fetal Brain' };
          mSnack = { name: 'Fresh Seasonal Guava (1 medium)', portion: '1 guava', calories: 90, glycemicIndex: 'Low' as const, nutrientsHighlight: 'High Vitamin C for Non-Heme Iron Uptake' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Karnataka Muttai Saaru (Egg Curry, 2 eggs in coconut gravy) + Basale Soppu Palya + Curd', portion: '2 Katori Rice + Egg Curry + Greens', calories: 550, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Egg Albumin, Folic Acid & Probiotics' };
          eSnack = { name: 'Huruli (Horse Gram) Sundal + Roasted Peanuts (30g)', portion: '1 bowl + nuts', calories: 240, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Plant Protein & Healthy Fats' };
          dinner = { name: 'Jolada Rotti (2 pcs) with Karnataka Egg Burji (scrambled with onions & curry leaves) + Menthe Soppu Dal + Curd', portion: '2 rotis + burji + curd', calories: 490, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Complex Carbs, Choline & Iron' };
          bed = { name: 'Warm Cardamom Milk (100 ml)', portion: '100 ml', calories: 75, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Sleep Quality' };
        } else if (dietType === 'vegan') {
          earlyMorning = { name: 'Warm Calcium-Fortified Soy Milk (200 ml) + Soaked Almonds & Walnuts', portion: '200 ml + nuts', calories: 145, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Dairy-Free Calcium & Plant Omega-3 (ALA)' };
          bFast = { name: 'Traditional Ragi Ganji (prepared with water, cumin & pink salt) + Roasted Bengal Gram (Pori Kadale)', portion: '1 large bowl + 30g chana', calories: 320, glycemicIndex: 'Low' as const, nutrientsHighlight: '100% Plant Calcium (344mg) & Slow Digestion' };
          mSnack = { name: 'Fresh Seasonal Guava (1 medium - rich in Vitamin C)', portion: '1 guava', calories: 90, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Vitamin C to boost plant iron absorption 3x' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Toor Dal Huli, Basale Soppu Palya, Cucumber Kosambari & Homemade Peanut Curd (100ml)', portion: '2 Katori Rice + Dal + Peanut Curd', calories: 530, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Plant Iron, Folate & Dairy-Free Probiotics' };
          eSnack = { name: 'Huruli (Horse Gram) Sundal with Grated Coconut + Sesame (Til) Laddu (30g)', portion: '1 bowl + til laddu', calories: 260, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Plant Iron Powerhouse & Sesame Calcium' };
          dinner = { name: 'Jolada Rotti (2 pcs) with Menthe Soppu Palya, Thick Sprouted Hesaru Usli & Tomato Saaru', portion: '2 rotis + usli + saaru', calories: 470, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Magnesium, Live Sprout Enzymes & Fiber' };
          bed = { name: 'Warm Turmeric Soy / Almond Milk (100 ml) with Nutmeg', portion: '100 ml', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Curcumin Anti-Inflammatory & Soothing Sleep' };
        } else {
          // Vegetarian
          earlyMorning = { name: 'Early Morning Milk (200 ml) + Soaked Almonds (5 pcs)', portion: '200 ml + 5 nuts', calories: 140, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Morning Satiety' };
          bFast = { name: 'Ragi Malt (Ragi Sajjige) with Fresh Buttermilk & Roasted Chana', portion: '1 large bowl', calories: 320, glycemicIndex: 'Low' as const, nutrientsHighlight: 'High Calcium, Iron & Probiotics' };
          mSnack = { name: 'Fresh Seasonal Guava (1 medium)', portion: '1 guava', calories: 90, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Vitamin C for non-heme iron absorption' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Toor Dal Huli, Basale Soppu Palya, Cucumber Salad & Fresh Curd (100ml)', portion: '2 Katori Rice + Dal + Curd', calories: 520, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Iron, Folate, Bioavailable Calcium' };
          eSnack = { name: 'Huruli (Horse Gram) Sundal + Roasted Peanuts (30g)', portion: '1 bowl + nuts', calories: 240, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Plant Protein & Healthy Lipids' };
          dinner = { name: 'Jolada Rotti (2 pcs) with Menthe Soppu Palya, Toor Saaru & Fresh Curd', portion: '2 rotis + dal + curd', calories: 480, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Magnesium, Soluble Fiber & Low GI' };
          bed = { name: 'Warm Cardamom Milk (100 ml)', portion: '100 ml', calories: 75, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Restful Sleep' };
        }
      }

      // Day 2
      else if (index === 1) {
        if (dietType === 'non-veg') {
          earlyMorning = { name: 'Warm Milk (200 ml) + Soaked Walnuts', portion: '200 ml + nuts', calories: 145, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Omega-3 ALA' };
          bFast = { name: 'Akki Rotti with Dill Leaves (Sabbasige Soppu) + 1 Boiled Egg + Coconut Chutney', portion: '2 rotis + 1 egg', calories: 370, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Iron from Dill Greens & Complete Egg Protein' };
          mSnack = { name: 'Tender Coconut Water (1 glass)', portion: '250 ml', calories: 55, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Natural Electrolytes & Potassium' };
          lunch = { name: 'Karnataka Matta Rice (2 Katori) with Coastal Karnataka Meenu Saaru (Mackerel / Bangude Fish Curry, 60g) + French Beans Palya + Curd', portion: '2 Katori Rice + Fish Curry + Curd', calories: 560, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Essential Omega-3 DHA for Fetal Brain & Retina' };
          eSnack = { name: 'Seasonal Papaya / Orange + Til (Sesame) Chikki (30g)', portion: '1 bowl + chikki', calories: 230, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Vitamin A, Calcium & Iron' };
          dinner = { name: 'Ragi Mudde (1 medium ball) with Country Chicken Broth (Nati Koli Saaru) & Steamed Greens + Curd', portion: '1 mudde + chicken saaru + curd', calories: 490, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium Powerhouse & Heme Iron' };
          bed = { name: 'Warm Turmeric Milk (100 ml)', portion: '100 ml', calories: 75, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Immunity & Bone Health' };
        } else if (dietType === 'eggetarian') {
          earlyMorning = { name: 'Warm Milk (200 ml) + Soaked Walnuts', portion: '200 ml + nuts', calories: 145, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Fatty Acids' };
          bFast = { name: 'Akki Rotti with Dill Leaves + Karnataka Egg Burji (1 egg scrambled with onions) & Coconut Chutney', portion: '2 rotis + burji', calories: 370, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Dill Iron, Choline & Satiety' };
          mSnack = { name: 'Tender Coconut Water (1 glass)', portion: '250 ml', calories: 55, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Hydration & Magnesium' };
          lunch = { name: 'Karnataka Matta Rice (2 Katori) with Tomato Rasam, 2 Hard-Boiled Eggs in Spiced Onion Gravy, French Beans Palya & Curd', portion: '2 Katori Rice + 2 Eggs + Curd', calories: 540, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Egg Protein, Probiotics & Fiber' };
          eSnack = { name: 'Seasonal Papaya / Orange + Til (Sesame) Chikki (30g)', portion: '1 bowl + chikki', calories: 230, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Antioxidants' };
          dinner = { name: 'Ragi Mudde (1 medium ball) with Bassaru Greens & 1 Sliced Boiled Egg + Curd', portion: '1 mudde + bassaru + egg + curd', calories: 480, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Traditional Calcium & Complete Protein' };
          bed = { name: 'Warm Turmeric Milk (100 ml)', portion: '100 ml', calories: 75, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Bone Strength & Recovery' };
        } else if (dietType === 'vegan') {
          earlyMorning = { name: 'Tender Coconut Water (200 ml) + Soaked Walnuts & Pumpkin Seeds', portion: '200 ml + nuts', calories: 140, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Natural Electrolytes & Zinc' };
          bFast = { name: 'Akki Rotti with Dill Leaves (Sabbasige Soppu) & Fresh Coconut Chutney + Sautéed Tofu Cubes (40g)', portion: '2 rotis + tofu + chutney', calories: 350, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Dill Leaf Iron & Plant Protein' };
          mSnack = { name: 'Fresh Sweet Orange / Sweet Lime', portion: '1 fruit', calories: 80, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Vitamin C & Folate' };
          lunch = { name: 'Karnataka Matta Rice (2 Katori) with Tomato Rasam, Soya Chunks & French Beans Palya, Sprouted Moong Salad & Peanut Curd (100ml)', portion: '2 Katori Rice + Soya + Peanut Curd', calories: 520, glycemicIndex: 'Low' as const, nutrientsHighlight: 'High Plant Protein, Fiber & Probiotics' };
          eSnack = { name: 'Seasonal Papaya / Fruit + Sesame (Til) Chikki (30g)', portion: 'Fruit + Til Chikki', calories: 220, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Sesame Calcium (975mg/100g) & Carotenoids' };
          dinner = { name: 'Ragi Mudde (1 medium ball) with Bassaru (Greens & Lentil Soup) & Sprouted Moong Usli', portion: '1 mudde + bassaru greens + usli', calories: 460, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Finger Millet Calcium & Sprout Enzymes' };
          bed = { name: 'Warm Calcium-Fortified Soy Milk (100 ml) with Cardamom', portion: '100 ml', calories: 65, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Fortified Calcium & Serene Sleep' };
        } else {
          // Vegetarian
          earlyMorning = { name: 'Warm Milk (200 ml) + Soaked Walnuts', portion: '200 ml + nuts', calories: 140, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Brain Fats' };
          bFast = { name: 'Akki Rotti with Dill Leaves (Sabbasige Soppu) & Fresh Coconut Chutney', portion: '2 rotis + chutney', calories: 330, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Iron from Dill Greens & Healthy Fats' };
          mSnack = { name: 'Tender Coconut Water (1 glass)', portion: '250 ml', calories: 55, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Natural Hydration & Potassium' };
          lunch = { name: 'Karnataka Matta Rice (2 Katori) with Tomato Rasam, French Beans & Carrot Palya, Sprouted Moong Salad & Curd', portion: '2 Katori Rice + Rasam + Curd', calories: 510, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Fiber, Probiotics & Micronutrients' };
          eSnack = { name: 'Seasonal Papaya / Orange + Til (Sesame) Chikki (30g)', portion: 'Fruit + chikki', calories: 220, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium, Vitamin A & Iron' };
          dinner = { name: 'Ragi Mudde (1 medium ball) with Bassaru (Greens & Lentil Soup) & Fresh Curd', portion: '1 mudde + bassaru + curd', calories: 460, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Traditional Calcium Powerhouse' };
          bed = { name: 'Warm Turmeric Milk (100 ml)', portion: '100 ml', calories: 75, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Immunity & Bone Mineralization' };
        }
      }

      // Day 3
      else if (index === 2) {
        if (dietType === 'non-veg') {
          earlyMorning = { name: 'Early Morning Milk (200 ml) + Soaked Almonds', portion: '200 ml + nuts', calories: 145, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Protein' };
          bFast = { name: 'Avalakki Upma (Poha with peanuts, carrots & peas) + 2 Boiled Eggs', portion: '1.5 bowl + 2 eggs', calories: 390, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Poha Iron, B-Complex & Complete Egg Protein' };
          mSnack = { name: 'Fresh Pomegranate (1 cup)', portion: '100g', calories: 85, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Iron Boosting Polyphenols & Antioxidants' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Karnataka Style Mutton Bone Broth / Keema (50g) + Beetroot Palya + Curd', portion: '2 Katori Rice + Mutton Keema + Curd', calories: 560, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Heme Iron, Collagen & Folate' };
          eSnack = { name: 'Roasted Pori Kadale (Roasted Bengal Gram) with Almonds (30g)', portion: '1 bowl + nuts', calories: 230, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Crunchy Protein & Vitamin E' };
          dinner = { name: 'Whole Wheat Chapati (3 pcs) with Karnataka Chicken Kurma (60g) & Cucumber Kosambari + Curd', portion: '3 rotis + chicken kurma + curd', calories: 510, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Slow-Release Complex Carbs & Lean Protein' };
          bed = { name: 'Warm Bed Time Milk (100 ml)', portion: '100 ml', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium for Fetal Bones' };
        } else if (dietType === 'eggetarian') {
          earlyMorning = { name: 'Early Morning Milk (200 ml) + Soaked Almonds', portion: '200 ml + nuts', calories: 145, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Protein' };
          bFast = { name: 'Avalakki Upma with Peanuts + 2 Soft Boiled Eggs', portion: '1.5 bowl + 2 eggs', calories: 390, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Easily Digestible Iron & Choline' };
          mSnack = { name: 'Fresh Pomegranate (1 cup)', portion: '100g', calories: 85, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Hemoglobin Support & Vitamin K' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Menthya Dal, Karnataka Egg Roast (2 eggs in spicy onion tomato roast), Beetroot Palya & Curd', portion: '2 Katori Rice + 2 Eggs + Curd', calories: 540, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Egg Albumin, Fenugreek Folate & Probiotics' };
          eSnack = { name: 'Roasted Pori Kadale with Almonds (30g)', portion: '1 bowl + nuts', calories: 230, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Snack Protein & Minerals' };
          dinner = { name: 'Whole Wheat Chapati (3 pcs) with Karnataka Egg Pepper Masala & Ennegai (Brinjal) Gravy + Curd', portion: '3 rotis + egg masala + curd', calories: 500, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Dietary Fiber, Choline & Magnesium' };
          bed = { name: 'Warm Bed Time Milk (100 ml)', portion: '100 ml', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Restful Sleep' };
        } else if (dietType === 'vegan') {
          earlyMorning = { name: 'Warm Calcium-Fortified Soy Milk (200 ml) + Soaked Almonds', portion: '200 ml + nuts', calories: 140, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Plant Calcium & Magnesium' };
          bFast = { name: 'Avalakki Upma (Poha with peanuts, carrots, peas & sautéed high-protein Tofu 40g)', portion: '1.5 bowl + tofu', calories: 360, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Poha Plant Iron & Tofu Isoflavone Protein' };
          mSnack = { name: 'Fresh Pomegranate (1 cup)', portion: '100g', calories: 85, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Polyphenols & Natural Folate' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Menthya Toor Dal, Soya Chunks & Beetroot Palya, Cucumber Kosambari & Peanut Curd', portion: '2 Katori Rice + Dal + Soya + Curd', calories: 520, glycemicIndex: 'Low' as const, nutrientsHighlight: 'High Plant Iron, Folate & Peanut Probiotics' };
          eSnack = { name: 'Roasted Pori Kadale with Roasted Flaxseeds & Almonds (30g)', portion: '1 bowl + seeds', calories: 240, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Plant Omega-3 & Fiber' };
          dinner = { name: 'Whole Wheat Chapati (3 pcs) with Traditional Ennegai (Peanut-Sesame stuffed brinjal) & Thick Yellow Dal', portion: '3 rotis + ennegai + dal', calories: 490, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Peanut-Sesame Plant Calcium & Fiber' };
          bed = { name: 'Warm Fortified Soy Milk (100 ml) with Cardamom', portion: '100 ml', calories: 65, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Fortified Calcium & Night Recovery' };
        } else {
          // Vegetarian
          earlyMorning = { name: 'Early Morning Milk (200 ml)', portion: '200 ml', calories: 130, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Calcium & Protein' };
          bFast = { name: 'Avalakki Upma (Poha with peanuts, green peas & grated paneer 30g)', portion: '1.5 bowl + paneer', calories: 360, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Iron from Poha & Dairy Protein' };
          mSnack = { name: 'Fresh Pomegranate (1 cup)', portion: '100g', calories: 85, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Antioxidants & Iron Booster' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Menthya (Fenugreek) Toor Dal, Beetroot Palya, Cucumber Kosambari & Curd', portion: '2 Katori Rice + Dal + Curd', calories: 510, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Folate, Iron & Probiotics' };
          eSnack = { name: 'Roasted Pori Kadale (Roasted Bengal Gram) with Almonds (30g)', portion: '1 bowl + nuts', calories: 230, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Plant Protein & Minerals' };
          dinner = { name: 'Whole Wheat Chapati (3 pcs) with North Karnataka Ennegai (Stuffed Brinjal with Peanut Masala) & Thick Dal + Curd', portion: '3 rotis + dal + curd', calories: 500, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Complex Carbs, Healthy Fats & Fiber' };
          bed = { name: 'Warm Bed Time Milk (100 ml)', portion: '100 ml', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Restful Sleep' };
        }
      }

      // Day 4
      else if (index === 3) {
        if (dietType === 'non-veg') {
          earlyMorning = { name: 'Early Morning Milk (200 ml) + Soaked Nuts', portion: '200 ml', calories: 140, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Sustained Energy' };
          bFast = { name: 'Steamed Idli (3 pcs) with Karnataka Drumstick Sambar + 2 Boiled Eggs & Coconut Chutney', portion: '3 idlis + sambar + 2 eggs', calories: 390, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Fermented Bioavailability & High Albumin' };
          mSnack = { name: 'Seasonal Ripe Banana or Sweet Lime', portion: '1 fruit', calories: 95, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Potassium & Vitamin C' };
          lunch = { name: 'Traditional Bisi Bele Bath with 1 Sliced Boiled Egg + Cucumber Raita & Fresh Salad', portion: '2 Katori + 1 egg + raita', calories: 550, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Complete Lentil-Rice-Egg Amino Acid Profile' };
          eSnack = { name: 'Sprouted Hesaru Kalu (Green Gram) Chaat with Lemon & Peanuts', portion: '1 bowl + nuts', calories: 230, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Sprout Enzymes, Vitamin C & Plant Zinc' };
          dinner = { name: 'Jolada Rotti (3 pcs) with Pan-Seared Bangude (Mackerel) / Rohu Fish (60g) + Heerekai (Ridge Gourd) Palya & Curd', portion: '3 rotis + fish + curd', calories: 500, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Slow-Release Grain & Omega-3 DHA' };
          bed = { name: 'Warm Bed Time Milk (100 ml)', portion: '100 ml', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium for Skeletal Growth' };
        } else if (dietType === 'eggetarian') {
          earlyMorning = { name: 'Early Morning Milk (200 ml) + Soaked Nuts', portion: '200 ml', calories: 140, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Micronutrients' };
          bFast = { name: 'Steamed Idli (3 pcs) with Drumstick Sambar + 2 Boiled Eggs & Coconut Chutney', portion: '3 idlis + sambar + 2 eggs', calories: 390, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Fermented Gut Support & 250mg Choline' };
          mSnack = { name: 'Seasonal Ripe Banana or Sweet Lime', portion: '1 fruit', calories: 95, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Potassium & Energy' };
          lunch = { name: 'Traditional Bisi Bele Bath with 2 Hard-Boiled Eggs + Cucumber Raita & Fresh Salad', portion: '2 Katori + 2 eggs + raita', calories: 550, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Lentil Protein, Egg Albumin & Probiotics' };
          eSnack = { name: 'Sprouted Hesaru Kalu Chaat with 1 Chopped Boiled Egg & Lemon', portion: '1 bowl + egg', calories: 240, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Live Enzymes & Dual Protein' };
          dinner = { name: 'Jolada Rotti (3 pcs) with Karnataka Egg Usli (Eggs sautéed with onions & jeera) + Heerekai Palya & Curd', portion: '3 rotis + egg usli + curd', calories: 490, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Sorghum Fiber, Magnesium & Choline' };
          bed = { name: 'Warm Bed Time Milk (100 ml)', portion: '100 ml', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Calming Sleep' };
        } else if (dietType === 'vegan') {
          earlyMorning = { name: 'Herbal Jeera & Coriander Warm Infusion or Fortified Soy Milk (200 ml)', portion: '200 ml', calories: 130, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Digestive Comfort & Plant Calcium' };
          bFast = { name: 'Steamed Idli (3 pcs) with Drumstick Toor Dal Sambar & Coconut Mint Chutney + Sprouted Moong', portion: '3 idlis + sambar + chutney', calories: 340, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Fermented Rice-Urad Synergy & Vitamin C' };
          mSnack = { name: 'Seasonal Ripe Banana or Sweet Lime', portion: '1 fruit', calories: 95, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Potassium & Natural Electrolytes' };
          lunch = { name: 'Vegan Bisi Bele Bath (Brown rice, toor dal & assorted veggies) with Homemade Peanut Curd Pachadi & Kosambari', portion: '2 Katori + peanut curd', calories: 520, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Complete Plant Protein & Healthy Fats' };
          eSnack = { name: 'Sprouted Hesaru Kalu Chaat with Lemon, Cucumber & Roasted Peanuts', portion: '1 bowl + nuts', calories: 240, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Enzymes, Folate & Vitamin C' };
          dinner = { name: 'Jolada Rotti (3 pcs) with Sprouted Green Gram Usli, Heerekai (Ridge Gourd) Palya & Tomato Saaru', portion: '3 rotis + usli + saaru', calories: 470, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Sorghum Low GI Carbs & High Fiber' };
          bed = { name: 'Warm Sesame / Soy Milk (100 ml) with Pinch of Nutmeg', portion: '100 ml', calories: 65, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Sesame Plant Calcium & Soothing Minerals' };
        } else {
          // Vegetarian
          earlyMorning = { name: 'Early Morning Milk (200 ml)', portion: '200 ml', calories: 130, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Calcium' };
          bFast = { name: 'Steamed Idli (3 pcs) with Karnataka Drumstick Sambar & Coconut Chutney', portion: '3 idlis + sambar + chutney', calories: 340, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Fermented Protein & Probiotic Flora' };
          mSnack = { name: 'Seasonal Ripe Banana or Sweet Lime', portion: '1 fruit', calories: 95, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Potassium & Vitamin C' };
          lunch = { name: 'Traditional Bisi Bele Bath with Boondi-free Cucumber Raita & Fresh Salad', portion: '2 Katori + raita', calories: 520, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Lentil-Grain Complete Protein' };
          eSnack = { name: 'Sprouted Hesaru Kalu (Green Gram) Chaat with Lemon & Roasted Peanuts (30g)', portion: '1 bowl + nuts', calories: 240, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Live Enzymes & Vitamin C' };
          dinner = { name: 'Jolada Rotti (3 pcs) with Sprouted Green Gram Usli, Heerekai Palya & Fresh Curd', portion: '3 rotis + usli + curd', calories: 490, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Magnesium, Fiber & Low Glycemic Load' };
          bed = { name: 'Warm Bed Time Milk (100 ml)', portion: '100 ml', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium for Bones' };
        }
      }

      // Day 5
      else if (index === 4) {
        if (dietType === 'non-veg') {
          earlyMorning = { name: 'Warm Milk (200 ml) + Soaked Almonds', portion: '200 ml + nuts', calories: 145, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Healthy Lipids' };
          bFast = { name: 'Fermented Ragi Dosa (2 pcs) with Vegetable Egg Omlette (1 egg with onions & dill) & Tomato Chutney', portion: '2 dosas + omlette', calories: 370, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Finger Millet Calcium & Egg Protein' };
          mSnack = { name: 'Fresh Amla (Indian Gooseberry) Juice or Guava', portion: '100g', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'High Vitamin C to maximize Iron uptake' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Coastal Meenu Saaru (Steamed Sardine / Mackerel Curry rich in DHA, 60g) + Lemon Rasam + Curd', portion: '2 Katori Rice + Fish Curry + Curd', calories: 550, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Fetal Brain DHA & Iron Synergy' };
          eSnack = { name: 'Boiled Sweet Corn + Roasted Peanuts (30g)', portion: '1 cup + nuts', calories: 250, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Dietary Fiber & Healthy Fats' };
          dinner = { name: 'Broken Wheat (Daliya) Khichdi with Tender Chicken Keema (40g) & Spinach + Curd', portion: '2 Katori + curd', calories: 490, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Digestive Comfort, Heme Iron & Fiber' };
          bed = { name: 'Warm Turmeric Milk (100 ml)', portion: '100 ml', calories: 75, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Immune Protection & Rest' };
        } else if (dietType === 'eggetarian') {
          earlyMorning = { name: 'Warm Milk (200 ml) + Soaked Almonds', portion: '200 ml + nuts', calories: 145, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Protein' };
          bFast = { name: 'Fermented Ragi Dosa (2 pcs) with Vegetable Egg Omlette (2 eggs with spinach & onions) & Tomato Chutney', portion: '2 dosas + omlette', calories: 380, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Ragi Calcium, Choline & Spinach Iron' };
          mSnack = { name: 'Fresh Amla Juice or Guava', portion: '100g', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Vitamin C Triple Absorption Power' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Karnataka Egg Korma (2 boiled eggs in mild poppy-seed coconut gravy) + Lemon Rasam + Curd', portion: '2 Katori Rice + 2 Eggs + Curd', calories: 540, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Egg Protein, Calcium & Probiotics' };
          eSnack = { name: 'Boiled Sweet Corn + Roasted Peanuts (30g)', portion: '1 cup + nuts', calories: 250, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Fiber & Healthy Lipids' };
          dinner = { name: 'Broken Wheat Khichdi with 1 Sliced Boiled Egg, Yellow Moong Dal & Spinach + Curd', portion: '2 Katori + 1 egg + curd', calories: 480, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Gentle Digestion & Complete Protein' };
          bed = { name: 'Warm Turmeric Milk (100 ml)', portion: '100 ml', calories: 75, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Bone Mineralization' };
        } else if (dietType === 'vegan') {
          earlyMorning = { name: 'Warm Calcium-Fortified Soy Milk (200 ml) + Soaked Nuts', portion: '200 ml', calories: 140, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Dairy-Free Calcium & Magnesium' };
          bFast = { name: 'Fermented Ragi Dosa (2 dosas) with Sautéed Sprouted Moong / Tofu & Fresh Tomato Chutney', portion: '2 dosas + tofu/moong', calories: 350, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Ragi Calcium (344mg) & Plant Protein' };
          mSnack = { name: 'Fresh Amla Juice with rock salt or Fresh Guava', portion: '100g', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Vitamin C to boost plant non-heme iron 3x' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Vegetable Kootu, Lemon Rasam, Sprouted Kosambari & Homemade Peanut Curd', portion: '2 Katori Rice + Kootu + Peanut Curd', calories: 510, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Lentil Folate, Vitamin C & Plant Probiotics' };
          eSnack = { name: 'Boiled Sweet Corn + Roasted Peanuts & Pumpkin Seeds (30g)', portion: '1 cup + seeds', calories: 250, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Plant Zinc, Fiber & Healthy Fats' };
          dinner = { name: 'Broken Wheat (Daliya) Khichdi with Moong Dal, Palak, Cold-pressed Til Oil & Peanut Curd', portion: '2 Katori + peanut curd', calories: 460, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Digestive Ease, Plant Iron & Fiber' };
          bed = { name: 'Warm Almond / Soy Milk (100 ml) with Cardamom', portion: '100 ml', calories: 65, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Fortified Calcium & Peaceful Sleep' };
        } else {
          // Vegetarian
          earlyMorning = { name: 'Early Morning Milk (200 ml)', portion: '200 ml', calories: 130, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Calcium' };
          bFast = { name: 'Fermented Ragi Dosa (2 pcs) with Tomato Chutney & Homemade Fresh Paneer (30g)', portion: '2 dosas + paneer', calories: 360, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Ragi Calcium & Dairy Protein' };
          mSnack = { name: 'Fresh Amla Juice or Guava', portion: '100g', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'High Vitamin C for Iron uptake' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Vegetable Kootu, Lemon Rasam, Kosambari & Curd', portion: '2 Katori Rice + Rasam + Curd', calories: 500, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Protein, Vitamin C & Probiotics' };
          eSnack = { name: 'Boiled Sweet Corn + Roasted Peanuts & Pumpkin Seeds (30g)', portion: '1 cup + nuts', calories: 250, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Fiber & Healthy Lipids' };
          dinner = { name: 'Broken Wheat (Daliya) Khichdi with Moong Dal, Spinach & Fresh Curd', portion: '2 Katori + curd', calories: 450, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Digestive Comfort & Folate' };
          bed = { name: 'Warm Bed Time Milk (100 ml) with Turmeric', portion: '100 ml', calories: 75, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Restful Sleep' };
        }
      }

      // Day 6
      else if (index === 5) {
        if (dietType === 'non-veg') {
          earlyMorning = { name: 'Early Morning Milk (200 ml) + Soaked Almonds', portion: '200 ml', calories: 140, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Sustained Energy' };
          bFast = { name: 'Rava Vegetable Upma (with carrots, beans & peanuts) + 2 Boiled Eggs', portion: '1.5 bowl + 2 eggs', calories: 390, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'B-Vitamins & Complete Bioavailable Protein' };
          mSnack = { name: 'Fresh Sweet Lime (Mosambi) / Orange', portion: '1 fruit', calories: 85, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Hydration & Vitamin C' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Karnataka Nati Koli (Country Chicken) Curry (60g) + Cabbage Palya + Curd', portion: '2 Katori Rice + Chicken + Curd', calories: 560, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Heme Iron, High Biological Value Protein' };
          eSnack = { name: 'Sprouted Green Gram Chaat with Roasted Peanuts (30g)', portion: '1 bowl + nuts', calories: 240, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Live Enzymes & Plant Minerals' };
          dinner = { name: 'Multigrain Chapati (3 pcs) with Chicken & Vegetable Kurma (50g) + Fresh Curd', portion: '3 rotis + kurma + curd', calories: 510, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Whole Grain Carbs & Lean Protein' };
          bed = { name: 'Warm Bed Time Milk (100 ml)', portion: '100 ml', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium for Bones' };
        } else if (dietType === 'eggetarian') {
          earlyMorning = { name: 'Early Morning Milk (200 ml) + Soaked Almonds', portion: '200 ml', calories: 140, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Protein' };
          bFast = { name: 'Rava Vegetable Upma + 2 Boiled Eggs & Coconut Chutney', portion: '1.5 bowl + 2 eggs', calories: 390, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Choline, Egg Albumin & Fiber' };
          mSnack = { name: 'Fresh Sweet Lime (Mosambi) / Orange', portion: '1 fruit', calories: 85, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Vitamin C & Antioxidants' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Karnataka Egg Masala (2 eggs in roasted onion gravy) + Cabbage Palya + Curd', portion: '2 Katori Rice + 2 Eggs + Curd', calories: 540, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Egg Protein, Folate & Probiotics' };
          eSnack = { name: 'Sprouted Green Gram Chaat with Peanuts (30g)', portion: '1 bowl + nuts', calories: 240, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Digestive Enzymes & Minerals' };
          dinner = { name: 'Multigrain Chapati (3 pcs) with Karnataka Egg Kurma + Curd', portion: '3 rotis + kurma + curd', calories: 500, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Whole Grain Fiber & Choline' };
          bed = { name: 'Warm Bed Time Milk (100 ml)', portion: '100 ml', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Sleep' };
        } else if (dietType === 'vegan') {
          earlyMorning = { name: 'Tender Coconut Water (200 ml) + Soaked Almonds & Pumpkin Seeds', portion: '200 ml + nuts', calories: 140, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Natural Electrolytes, Zinc & ALA' };
          bFast = { name: 'Rava Vegetable Upma (with carrots, green peas, cashews & peanuts)', portion: '1.5 bowl', calories: 340, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Sustained Energy & Healthy Fats' };
          mSnack = { name: 'Fresh Sweet Lime (Mosambi) / Orange', portion: '1 fruit', calories: 85, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Natural Vitamin C & Bioflavonoids' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Soya Chunks Curry, Cabbage & Chana Dal Palya, Tomato Rasam & Peanut Curd', portion: '2 Katori Rice + Soya + Peanut Curd', calories: 520, glycemicIndex: 'Low' as const, nutrientsHighlight: 'High Plant Protein, Fiber & Dairy-Free Calcium' };
          eSnack = { name: 'Sprouted Green Gram Chaat with Roasted Kadale (30g)', portion: '1 bowl + chana', calories: 240, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Sprout Enzymes & Plant Iron' };
          dinner = { name: 'Multigrain Chapati (3 pcs) with Coconut-Based Mixed Vegetable Kurma & Thick Dal', portion: '3 rotis + kurma + dal', calories: 480, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Complex Carbs & Complete Plant Aminos' };
          bed = { name: 'Warm Fortified Soy Milk (100 ml) with Nutmeg', portion: '100 ml', calories: 65, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium Fortification & Peaceful Sleep' };
        } else {
          // Vegetarian
          earlyMorning = { name: 'Early Morning Milk (200 ml)', portion: '200 ml', calories: 130, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Calcium' };
          bFast = { name: 'Rava Vegetable Upma (with carrots, beans & roasted peanuts) + Coconut Chutney', portion: '1.5 bowl', calories: 330, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Iron, Energy & Healthy Fats' };
          mSnack = { name: 'Fresh Sweet Lime (Mosambi) / Orange', portion: '1 fruit', calories: 85, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Vitamin C & Hydration' };
          lunch = { name: 'Sona Masoori Rice (2 Katori) with Cabbage & Chana Dal Palya, Tomato Rasam, Salad & Curd', portion: '2 Katori Rice + Curd', calories: 510, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Probiotics, Fiber & Minerals' };
          eSnack = { name: 'Sprouted Green Gram Chaat with Roasted Kadale (30g)', portion: '1 bowl + chana', calories: 240, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Enzymes & Protein' };
          dinner = { name: 'Multigrain Chapati (3 pcs) with Mixed Vegetable Kurma & Fresh Curd', portion: '3 rotis + kurma + curd', calories: 500, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Complex Carbs & Gut Satiety' };
          bed = { name: 'Warm Bed Time Milk (100 ml)', portion: '100 ml', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium' };
        }
      }

      // Day 7
      else {
        if (dietType === 'non-veg') {
          earlyMorning = { name: 'Early Morning Milk (200 ml) + Soaked Almonds', portion: '200 ml', calories: 140, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Morning Protein' };
          bFast = { name: 'Whole Wheat Vegetable Parantha (2 pcs) + 2 Boiled Eggs & Mint Chutney', portion: '2 paranthas + 2 eggs', calories: 410, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Sustained Carbs, Albumin & Choline' };
          mSnack = { name: 'Tender Coconut Water & Malai', portion: '1 glass', calories: 65, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Electrolytes & Medium Chain Fatty Acids' };
          lunch = { name: 'Karnataka Low-Oil Country Chicken Pulao / Biryani (60g chicken) with Cucumber Kosambari Raita & Boiled Egg', portion: '2 Katori Pulao + Raita + Egg', calories: 580, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Celebratory Heritage Nutrition & Heme Iron' };
          eSnack = { name: 'Roasted Peanuts & Til (Sesame) Chikki (30g)', portion: '1 bar + nuts', calories: 190, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Iron, Calcium & Healthy Fats' };
          dinner = { name: 'Ragi Rotti (3 pcs) with Coastal Steamed Fish Curry (Meenu Saaru - 60g) + Capsicum Palya', portion: '3 rotis + fish curry', calories: 490, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Ragi Calcium (344mg) & Brain DHA' };
          bed = { name: 'Warm Bed Time Milk (100 ml)', portion: '100 ml', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium for Fetal Skeleton' };
        } else if (dietType === 'eggetarian') {
          earlyMorning = { name: 'Early Morning Milk (200 ml) + Soaked Almonds', portion: '200 ml', calories: 140, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Satiety' };
          bFast = { name: 'Whole Wheat Parantha (2 pcs) with Scrambled Egg Burji (2 eggs with herbs) & Mint Chutney', portion: '2 paranthas + burji', calories: 410, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Sustained Energy, Choline & B12' };
          mSnack = { name: 'Tender Coconut Water & Malai', portion: '1 glass', calories: 65, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Electrolytes & Hydration' };
          lunch = { name: 'Traditional Puliyogare (Tamarind Rice) with Egg Kosambari Salad (2 chopped boiled eggs) + Fresh Curd', portion: '2 Katori + 2 eggs + curd', calories: 550, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Tamarind Iron, Egg Albumin & Probiotics' };
          eSnack = { name: 'Roasted Peanuts & Til (Sesame) Chikki (30g)', portion: '1 bar + nuts', calories: 190, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium & Minerals' };
          dinner = { name: 'Ragi Rotti (3 pcs) with Karnataka Egg Curry (2 eggs) + Capsicum Palya & Curd', portion: '3 rotis + egg curry + curd', calories: 500, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Ragi Calcium, Magnesium & Choline' };
          bed = { name: 'Warm Bed Time Milk (100 ml)', portion: '100 ml', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Bone Mineralization' };
        } else if (dietType === 'vegan') {
          earlyMorning = { name: 'Warm Calcium-Fortified Soy Milk (200 ml) + Soaked Almonds', portion: '200 ml', calories: 140, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Dairy-Free Calcium & Plant Protein' };
          bFast = { name: 'Whole Wheat Vegetable Parantha (2 pcs) with Fresh Coconut Mint Chutney & Roasted Flaxseed Powder', portion: '2 paranthas + chutney', calories: 370, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Complex Carbs & Plant ALA Omega-3' };
          mSnack = { name: 'Tender Coconut Water & Malai', portion: '1 glass', calories: 65, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Electrolytes & Healthy Medium-Chain Fats' };
          lunch = { name: 'Traditional Puliyogare with Sprouted Moong Kosambari Salad & Homemade Peanut Curd', portion: '2 Katori + kosambari + curd', calories: 530, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Plant Iron, Enzymes & Probiotic Cultures' };
          eSnack = { name: 'Roasted Peanuts & Sesame (Til) Chikki (30g)', portion: '1 bar + nuts', calories: 190, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Plant Calcium (Til) & Iron' };
          dinner = { name: 'Ragi Rotti (3 pcs) with Capsicum Palya, Thick Toor Dal & Tomato Onion Salad', portion: '3 rotis + dal + salad', calories: 470, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Finger Millet Calcium & Plant Protein' };
          bed = { name: 'Warm Soy Milk (100 ml) with Nutmeg & Cardamom', portion: '100 ml', calories: 65, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium Fortification & Deep Sleep' };
        } else {
          // Vegetarian
          earlyMorning = { name: 'Early Morning Milk (200 ml)', portion: '200 ml', calories: 130, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Calcium' };
          bFast = { name: 'Vegetable Stuffed Parantha (2 pcs) with Fresh Curd & Mint Chutney', portion: '2 paranthas + curd', calories: 390, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Sustained Energy & Probiotics' };
          mSnack = { name: 'Tender Coconut Water & Malai', portion: '1 glass', calories: 65, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Electrolytes & Hydration' };
          lunch = { name: 'Traditional Puliyogare (Tamarind Rice with peanuts) with Kosambhari Salad & Fresh Curd', portion: '2 Katori + curd', calories: 530, glycemicIndex: 'Medium' as const, nutrientsHighlight: 'Raw Protein Salad & Probiotics' };
          eSnack = { name: 'Roasted Peanuts & Til (Sesame) Chikki (30g)', portion: '1 bar', calories: 180, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Iron & Calcium' };
          dinner = { name: 'Ragi Rotti (3 pcs) with Capsicum Palya, Thick Toor Dal & Fresh Curd', portion: '3 rotis + dal + curd', calories: 480, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium, Magnesium & Low GI' };
          bed = { name: 'Warm Bed Time Milk (100 ml)', portion: '100 ml', calories: 70, glycemicIndex: 'Low' as const, nutrientsHighlight: 'Calcium for Bones' };
        }
      }

      const dailyTotalCalories =
        earlyMorning.calories +
        bFast.calories +
        mSnack.calories +
        lunch.calories +
        eSnack.calories +
        dinner.calories +
        bed.calories;

      const targetNutrients = [
        'ICMR-NIN Guidelines',
        dietType === 'non-veg'
          ? 'Heme Iron & DHA'
          : dietType === 'eggetarian'
          ? 'Choline & Albumin'
          : dietType === 'vegan'
          ? 'Plant Calcium & B12'
          : 'Lacto-Calcium & Greens',
        isDiabetes ? 'Low Glycemic Fiber' : 'Balanced Carbs',
        isAnemic ? 'Hemoglobin Booster' : 'Micronutrient Density',
      ];

      return {
        day: d.day,
        dayName: d.name,
        breakfast: bFast,
        morningSnack: mSnack,
        lunch,
        eveningSnack: eSnack,
        dinner,
        bedtimeSnack: bed,
        dailyTotalCalories,
        keyTargetNutrients: targetNutrients,
      };
    });
  }
}

export function generatePersonalizedNutritionPlan(params: any): NutritionPlan {
  return NutritionModel.generatePersonalizedNutritionPlan(params);
}
