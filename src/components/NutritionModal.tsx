import React, { useState, useEffect } from 'react';
import { NutritionPlan, DailyMealPlan } from '../types';
import { MacroDonutChart } from './Charts';
import { api } from '../api';
import {
  X,
  Utensils,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ChefHat,
  Heart,
} from 'lucide-react';

interface NutritionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nutritionPlan?: NutritionPlan;
  onRegenerate: (dietaryPreference: string, region: string) => Promise<void>;
}

export const NutritionModal: React.FC<NutritionModalProps> = ({
  isOpen,
  onClose,
  nutritionPlan,
  onRegenerate,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [preference, setPreference] = useState(nutritionPlan?.dietaryPreference || 'vegetarian');
  const [region, setRegion] = useState('karnataka');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [recipeFilter, setRecipeFilter] = useState<string>(nutritionPlan?.dietaryPreference || 'all');
  const [showRecipes, setShowRecipes] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);

  useEffect(() => {
    if (nutritionPlan?.dietaryPreference) {
      setPreference(nutritionPlan.dietaryPreference);
      setRecipeFilter(nutritionPlan.dietaryPreference);
    }
  }, [nutritionPlan?.dietaryPreference]);

  useEffect(() => {
    if (isOpen) {
      api.getKarnatakaRecipes().then((data) => {
        setRecipes(data);
        if (data.length > 0) setSelectedRecipe(data[0]);
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen || !nutritionPlan) return null;

  const currentDay: DailyMealPlan = nutritionPlan.sevenDayMealPlan?.[selectedDayIndex] || nutritionPlan.sevenDayMealPlan?.[0];
  
  if (!currentDay) return null;

  const handleRegenerateTrigger = async (newPref: string, newRegion: string) => {
    setPreference(newPref as any);
    setRegion(newRegion);
    setIsRegenerating(true);
    try {
      await onRegenerate(newPref, newRegion);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200 my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg tracking-tight">Personalized 7-Day Maternal Nutrition Plan</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 text-xs font-semibold">
                  {nutritionPlan.dailyCalorieTarget} kcal/day
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Clinical protocol tailored for maternal insulin sensitivity &amp; optimal fetal growth
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Top Controls: Preference Selector, Region, Setting & Doctor Approval Status */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Dietary Style:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {(['vegetarian', 'non-vegetarian', 'vegan', 'eggetarian'] as const).map((pref) => (
                    <button
                      key={pref}
                      disabled={isRegenerating}
                      onClick={() => handleRegenerateTrigger(pref, region)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                        preference === pref
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-500">Clinical Review:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {nutritionPlan.doctorApprovalStatus?.replace('_', ' ') || 'Approved'}
                </span>
              </div>
            </div>

            {/* Geographic Region */}
            <div className="pt-2 border-t border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Geographic Region:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 text-white font-bold text-xs shadow-xs">
                  🌿 Karnataka (Ragi / Jolada / Huli)
                </span>
              </div>
              <span className="text-[11px] text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 font-semibold">
                Traditional Kannada Maternity Nutrition (ICMR-NIN Protocol)
              </span>
            </div>

            {/* Active Dietary Style Guidance Banner */}
            <div className="pt-2 border-t border-slate-200 text-xs">
              {preference === 'vegan' && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-2.5">
                  <span className="text-base leading-none">🌱</span>
                  <div>
                    <span className="font-extrabold text-emerald-900 block">100% Plant-Based Vegan Maternity Diet (ಡೈರಿ-ಮುಕ್ತ ಸಸ್ಯಾಹಾರ)</span>
                    <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                      Dairy-free and animal-free protocol. Powered by fortified soy milk, homemade peanut curd (Kadalekai Mosaru), sprouted legumes (Huruli &amp; Hesaru kalu), sesame (Til) seeds for plant calcium, and clinician-guided sublingual Vitamin B12 support.
                    </p>
                  </div>
                </div>
              )}
              {preference === 'non-vegetarian' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-2.5">
                  <span className="text-base leading-none">🍗</span>
                  <div>
                    <span className="font-extrabold text-amber-900 block">Karnataka Non-Vegetarian Maternity Diet (ಮಾಂಸಾಹಾರ ಪೋಷಣೆ)</span>
                    <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                      Enriched with Karnataka Country Chicken (Nati Koli Saaru), safe low-mercury fish (Coastal Bangude Meenu Saaru for fetal brain Omega-3 DHA), boiled eggs, and organic heme iron to rapidly optimize maternal hemoglobin.
                    </p>
                  </div>
                </div>
              )}
              {preference === 'eggetarian' && (
                <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-950 flex items-start gap-2.5">
                  <span className="text-base leading-none">🥚</span>
                  <div>
                    <span className="font-extrabold text-yellow-900 block">Karnataka Eggetarian Maternity Diet (ಮೊಟ್ಟೆ ಆಧಾರಿತ ಪೋಷಣೆ)</span>
                    <p className="text-[11px] text-yellow-800 leading-relaxed mt-0.5">
                      100% Meat &amp; fish-free. Features daily whole eggs (Muttai Saaru, Karnataka Egg Burji, boiled eggs) delivering 250mg Choline for fetal neural tube closure and complete albumin protein, complemented by fresh curd, millets, and greens.
                    </p>
                  </div>
                </div>
              )}
              {preference === 'vegetarian' && (
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-950 flex items-start gap-2.5">
                  <span className="text-base leading-none">🥬</span>
                  <div>
                    <span className="font-extrabold text-teal-900 block">Karnataka Lacto-Vegetarian Maternity Diet (ಶುದ್ಧ ಸಸ್ಯಾಹಾರ ಪೋಷಣೆ)</span>
                    <p className="text-[11px] text-teal-800 leading-relaxed mt-0.5">
                      100% Meat-free and egg-free. Enriched with traditional millets (Ragi Mudde, Jolada Rotti), toor dal huli, fresh curd (Mosaru), paneer, sprouted pulses, and local greens (Basale, Menthe, Dill) for complete lacto-plant protein synergy.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Macro Breakdown & Calorie Target Component */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Daily Caloric &amp; Macronutrient Target
            </h4>
            <MacroDonutChart
              carbs={{
                pct: nutritionPlan.macroDistribution?.carbsPercentage || 0,
                grams: nutritionPlan.macroDistribution?.carbsGrams || 0,
              }}
              protein={{
                pct: nutritionPlan.macroDistribution?.proteinPercentage || 0,
                grams: nutritionPlan.macroDistribution?.proteinGrams || 0,
              }}
              fat={{
                pct: nutritionPlan.macroDistribution?.fatPercentage || 0,
                grams: nutritionPlan.macroDistribution?.fatGrams || 0,
              }}
              calories={nutritionPlan.dailyCalorieTarget}
            />
          </div>

          {/* Day Navigation Tabs */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Day of the Week
            </h4>
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {nutritionPlan.sevenDayMealPlan.map((d, i) => (
                <button
                  key={d.day}
                  onClick={() => setSelectedDayIndex(i)}
                  className={`p-2.5 rounded-2xl text-center border transition-all ${
                    selectedDayIndex === i
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-bold'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200 text-xs font-medium'
                  }`}
                >
                  <span className="text-[10px] uppercase block opacity-80">Day {d.day}</span>
                  <span className="text-xs font-bold block">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Day Meals Grid */}
          <div className="bg-slate-50/60 rounded-3xl p-5 border border-slate-200/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                {currentDay.dayName}
              </h4>
              <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                Daily Sum: {currentDay.dailyTotalCalories} kcal
              </span>
            </div>

            {/* Meal Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Breakfast */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                    🍳 Breakfast (8:00 AM)
                  </span>
                  <span className="text-xs font-bold text-slate-700">{currentDay.breakfast.calories} kcal</span>
                </div>
                <p className="font-bold text-xs text-slate-900 mt-1">{currentDay.breakfast.name}</p>
                <p className="text-[11px] text-slate-500">Portion: {currentDay.breakfast.portion}</p>
                <p className="text-[11px] text-emerald-700 font-medium">✨ {currentDay.breakfast.nutrientsHighlight}</p>
              </div>

              {/* Mid-Morning Snack */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                    🍎 Mid-Morning Snack (11:00 AM)
                  </span>
                  <span className="text-xs font-bold text-slate-700">{currentDay.morningSnack.calories} kcal</span>
                </div>
                <p className="font-bold text-xs text-slate-900 mt-1">{currentDay.morningSnack.name}</p>
                <p className="text-[11px] text-slate-500">Portion: {currentDay.morningSnack.portion}</p>
                <p className="text-[11px] text-indigo-700 font-medium">✨ {currentDay.morningSnack.nutrientsHighlight}</p>
              </div>

              {/* Lunch */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                    🥗 Balanced Lunch (1:30 PM)
                  </span>
                  <span className="text-xs font-bold text-slate-700">{currentDay.lunch.calories} kcal</span>
                </div>
                <p className="font-bold text-xs text-slate-900 mt-1">{currentDay.lunch.name}</p>
                <p className="text-[11px] text-slate-500">Portion: {currentDay.lunch.portion}</p>
                <p className="text-[11px] text-blue-700 font-medium">✨ {currentDay.lunch.nutrientsHighlight}</p>
              </div>

              {/* Evening Snack */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                    🍵 Evening Sustenance (5:00 PM)
                  </span>
                  <span className="text-xs font-bold text-slate-700">{currentDay.eveningSnack.calories} kcal</span>
                </div>
                <p className="font-bold text-xs text-slate-900 mt-1">{currentDay.eveningSnack.name}</p>
                <p className="text-[11px] text-slate-500">Portion: {currentDay.eveningSnack.portion}</p>
                <p className="text-[11px] text-emerald-700 font-medium">✨ {currentDay.eveningSnack.nutrientsHighlight}</p>
              </div>

              {/* Dinner */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                    🍲 Light Dinner (7:30 PM)
                  </span>
                  <span className="text-xs font-bold text-slate-700">{currentDay.dinner.calories} kcal</span>
                </div>
                <p className="font-bold text-xs text-slate-900 mt-1">{currentDay.dinner.name}</p>
                <p className="text-[11px] text-slate-500">Portion: {currentDay.dinner.portion}</p>
                <p className="text-[11px] text-rose-700 font-medium">✨ {currentDay.dinner.nutrientsHighlight}</p>
              </div>

              {/* Bedtime Snack */}
              {currentDay.bedtimeSnack && (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md uppercase tracking-wide">
                      🌙 Bedtime Drink (9:30 PM)
                    </span>
                    <span className="text-xs font-bold text-slate-700">{currentDay.bedtimeSnack.calories} kcal</span>
                  </div>
                  <p className="font-bold text-xs text-slate-900 mt-1">{currentDay.bedtimeSnack.name}</p>
                  <p className="text-[11px] text-slate-500">Portion: {currentDay.bedtimeSnack.portion}</p>
                  <p className="text-[11px] text-purple-700 font-medium">✨ {currentDay.bedtimeSnack.nutrientsHighlight}</p>
                </div>
              )}
            </div>

            {/* Target Nutrients tags */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">Focus Nutrients for Today:</span>
              {currentDay.keyTargetNutrients?.map((kn, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full text-[11px] bg-white font-medium text-slate-700 border border-slate-200"
                >
                  {kn}
                </span>
              ))}
            </div>
          </div>

          {/* Clinical Dietary Principles */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Clinical Guidelines &amp; Food Pairings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {nutritionPlan.keyGuidelines?.map((g, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h5 className="font-bold text-slate-900">{g.title}</h5>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{g.description}</p>
                  <div className="text-[11px]">
                    <span className="font-semibold text-emerald-700 block">Recommended Foods:</span>
                    <p className="text-slate-600">{g.foodExamples?.join(', ')}</p>
                  </div>
                  <div className="text-[11px]">
                    <span className="font-semibold text-rose-700 block">Foods to Limit:</span>
                    <p className="text-slate-500">{g.foodsToAvoid?.join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Traditional Kannada Maternity Recipes Library */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-teal-600" />
                Traditional Kannada Maternity Recipes Library (ಸಾಂಪ್ರದಾಯಿಕ ಪಾಕವಿಧಾನಗಳು)
              </h4>
              <button
                onClick={() => setShowRecipes(!showRecipes)}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{showRecipes ? 'Hide Recipe Guide' : 'View Step-by-Step Recipes'}</span>
                {showRecipes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showRecipes && (
              <div className="space-y-4 pt-2">
                {/* Recipe Dietary Category Filter */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-bold text-slate-500 mr-1 text-[11px]">Filter by Diet:</span>
                  {[
                    { id: 'all', label: 'All Recipes' },
                    { id: 'vegetarian', label: '🥬 Vegetarian' },
                    { id: 'non-vegetarian', label: '🍗 Non-Veg' },
                    { id: 'eggetarian', label: '🥚 Eggetarian' },
                    { id: 'vegan', label: '🌱 Vegan' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setRecipeFilter(cat.id);
                        const filtered = recipes.filter(
                          (r) => cat.id === 'all' || !r.dietarySuitability || r.dietarySuitability.includes(cat.id)
                        );
                        if (filtered.length > 0) setSelectedRecipe(filtered[0]);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all border ${
                        recipeFilter === cat.id
                          ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Recipe selection pills */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {recipes
                    .filter(
                      (rec) =>
                        recipeFilter === 'all' ||
                        !rec.dietarySuitability ||
                        rec.dietarySuitability.includes(recipeFilter)
                    )
                    .map((rec) => (
                      <button
                        key={rec.id}
                        onClick={() => setSelectedRecipe(rec)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border shrink-0 ${
                          selectedRecipe?.id === rec.id
                            ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{rec.name}</span>
                          {rec.dietarySuitability?.includes('non-vegetarian') && !rec.dietarySuitability?.includes('vegetarian') && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-100 text-amber-800 font-extrabold">Non-Veg</span>
                          )}
                          {rec.dietarySuitability?.includes('eggetarian') && !rec.dietarySuitability?.includes('vegetarian') && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-yellow-100 text-yellow-800 font-extrabold">Egg</span>
                          )}
                          {rec.dietarySuitability?.includes('vegan') && rec.dietarySuitability?.length === 1 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-800 font-extrabold">Vegan</span>
                          )}
                        </div>
                        <span className="block text-[10px] opacity-80 font-normal">{rec.kannadaName}</span>
                      </button>
                    ))}
                </div>

                {/* Selected recipe details card */}
                {selectedRecipe && (
                  <div className="bg-gradient-to-br from-teal-50/70 via-emerald-50/40 to-white p-5 rounded-2xl border border-teal-200 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-sm text-teal-900">{selectedRecipe.name}</h5>
                          {selectedRecipe.dietarySuitability && (
                            <div className="flex gap-1">
                              {selectedRecipe.dietarySuitability.map((ds: string) => (
                                <span key={ds} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white text-teal-800 border border-teal-200 capitalize">
                                  {ds}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-bold text-teal-700">{selectedRecipe.kannadaName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-teal-800 text-xs font-bold border border-teal-200 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-teal-600" />
                          {selectedRecipe.preparationTimeMinutes} mins
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 text-white text-xs font-bold shadow-2xs">
                          <Heart className="w-3.5 h-3.5 fill-white" />
                          Maternity Benefit
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-white/80 rounded-xl border border-teal-100 text-xs text-slate-700 space-y-1">
                      <span className="font-bold text-teal-800 block">🌿 Why it's recommended for pregnancy:</span>
                      <p className="leading-relaxed">{selectedRecipe.maternityBenefit}</p>
                      <p className="text-[11px] text-teal-700 font-semibold mt-1">Nutritional Highlight: {selectedRecipe.nutritionalHighlight}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <h6 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-teal-800">
                          🛒 Ingredients
                        </h6>
                        <ul className="space-y-1.5 text-slate-700">
                          {selectedRecipe.ingredients.map((ing: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                              <span>{ing}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                        <h6 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider text-teal-800">
                          👩‍🍳 Step-by-Step Preparation
                        </h6>
                        <ol className="space-y-2 text-slate-700">
                          {selectedRecipe.preparationSteps.map((step: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500 italic">
            * Medical nutrition therapy is an adjunct to clinical management.
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
