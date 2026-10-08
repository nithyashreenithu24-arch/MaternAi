export interface KannadaRecipe {
  id: string;
  name: string;
  kannadaName: string;
  category: 'breakfast' | 'lunch_dinner' | 'snack_drink';
  dietarySuitability: ('vegetarian' | 'non-vegetarian' | 'vegan' | 'eggetarian')[];
  maternityBenefit: string;
  preparationTimeMinutes: number;
  ingredients: string[];
  preparationSteps: string[];
  nutritionalHighlight: string;
}

export const KANNADA_MATERNITY_RECIPES: KannadaRecipe[] = [
  {
    id: 'rec-ragi-malt',
    name: 'Traditional Ragi Malt (Ragi Ganji / Sajjige)',
    kannadaName: 'ರಾಗಿ ಮಾಲ್ಟ್ (ರಾಗಿ ಗಂಜಿ)',
    category: 'breakfast',
    dietarySuitability: ['vegetarian', 'vegan', 'eggetarian', 'non-vegetarian'],
    maternityBenefit: 'Powerhouse of calcium for fetal skeletal formation and iron for preventing gestational anemia. Can be prepared with buttermilk or water/plant milk for vegan mothers.',
    preparationTimeMinutes: 15,
    ingredients: [
      '2 tbsp Sprouted Ragi (Finger Millet) Flour',
      '1 cup Water (or Buttermilk / Fortified Soy Milk for vegans)',
      '1/2 tsp Cumin powder (Jeera)',
      'Pinch of Pink Salt or Organic Jaggery'
    ],
    preparationSteps: [
      'Mix 2 tablespoons of ragi flour in half a cup of room-temperature water without any lumps.',
      'Boil remaining water in a heavy-bottomed pan, pour the ragi batter slowly while stirring continuously.',
      'Simmer on low flame for 5-7 minutes until the mixture thickens and turns glossy.',
      'Allow it to cool slightly, then blend with buttermilk or warm soy milk and a pinch of roasted cumin.'
    ],
    nutritionalHighlight: 'Calcium (344mg per 100g), Iron, Dietary Fiber'
  },
  {
    id: 'rec-nati-koli-saaru',
    name: 'Karnataka Nati Koli Saaru (Country Chicken Broth)',
    kannadaName: 'ನಾಟಿ ಕೋಳಿ ಸಾರು',
    category: 'lunch_dinner',
    dietarySuitability: ['non-vegetarian'],
    maternityBenefit: 'Concentrated source of bioavailable heme iron, zinc, and high-biological value protein. Strengthens maternal hemoglobin levels rapidly and supports fetal tissue formation.',
    preparationTimeMinutes: 35,
    ingredients: [
      '150g Fresh Country Chicken (Nati Koli), bone-in & thoroughly cleaned',
      '1 tbsp Cold-pressed Groundnut oil',
      '1 tsp Ginger-Garlic paste, fresh turmeric & cumin seeds',
      '1/2 cup Chopped onions, tomato & fresh coriander leaves',
      '1 tbsp Homemade Kannada spice mix (Dhaniya, Jeera, Pepper, Cinnamon, Cloves)'
    ],
    preparationSteps: [
      'Heat oil in a pressure cooker; splutter cumin seeds, curry leaves, and sauté finely sliced onions until golden.',
      'Add ginger-garlic paste and turmeric; sauté until aromatic.',
      'Add cleaned country chicken pieces and sauté on high heat for 3-4 minutes to seal juices.',
      'Add ground spices, tomatoes, salt, and 2.5 cups of water.',
      'Pressure cook on medium flame for 4-5 whistles until chicken is tender, well-cooked, and bone broth is rich and fragrant.',
      'Garnish with fresh coriander; serve piping hot with Ragi Mudde or Sona Masoori rice.'
    ],
    nutritionalHighlight: 'Heme Iron (25-30% absorption), Complete Protein (22g), Zinc & Collagen'
  },
  {
    id: 'rec-meenu-saaru',
    name: 'Coastal Karnataka Meenu Saaru (Omega-3 DHA Fish Curry)',
    kannadaName: 'ಕರಾವಳಿ ಮೀನು ಸಾರು',
    category: 'lunch_dinner',
    dietarySuitability: ['non-vegetarian'],
    maternityBenefit: 'Rich in marine Docosahexaenoic Acid (DHA Omega-3) and EPA, essential for optimal fetal brain cortex and retinal development. Uses low-mercury regional fish (Bangude / Mackerel or Sardines).',
    preparationTimeMinutes: 25,
    ingredients: [
      '150g Fresh Bangude (Mackerel) or Steamed Sardines, cleaned thoroughly',
      '3 tbsp Fresh grated coconut ground with 1 tsp coriander seeds, cumin & mild red chilli',
      '1 small piece of Kokum (Punarpuli) or Tamarind extract',
      '1/2 tsp Turmeric & fresh curry leaves',
      '1 Green chilli slit & pinch of salt'
    ],
    preparationSteps: [
      'Grind grated coconut, cumin, coriander seeds, and turmeric into a silky smooth paste.',
      'In an earthen pot, bring the coconut paste with 1.5 cups of water, slit green chillies, and kokum extract to a gentle boil.',
      'Slide the cleaned fish pieces gently into the simmering gravy.',
      'Simmer on low-medium heat for 7-8 minutes until fish is completely cooked through (opaque and flaky). Avoid vigorous stirring.',
      'Finish with fresh curry leaves and allow to rest for 10 minutes before serving with hot Matta rice.'
    ],
    nutritionalHighlight: 'Omega-3 DHA & EPA, Vitamin D, High Bioavailable Protein'
  },
  {
    id: 'rec-kannada-egg-burji',
    name: 'Traditional Karnataka Egg Burji (Muttai Palya)',
    kannadaName: 'ಮೊಟ್ಟೆ ಪಲ್ಯ (ಎಗ್ ಬುರ್ಜಿ)',
    category: 'lunch_dinner',
    dietarySuitability: ['eggetarian', 'non-vegetarian'],
    maternityBenefit: 'Eggs supply 250mg Choline per 2 eggs—essential for maternal placental function and fetal neural tube closure. Sautéed with digestive jeera, turmeric, and fresh curry leaves.',
    preparationTimeMinutes: 15,
    ingredients: [
      '2 Fresh Farm Eggs, well-beaten',
      '1 medium Onion, finely chopped',
      '1 Green chilli & 8-10 Curry leaves',
      '1/2 tsp Cumin seeds & 1/4 tsp Turmeric powder',
      '1 tsp Cold-pressed oil & chopped coriander'
    ],
    preparationSteps: [
      'Heat oil in an iron skillet; splutter cumin seeds, chopped green chilli, and fresh curry leaves.',
      'Add onions and sauté until translucent and soft.',
      'Add turmeric and salt; pour in the whisked eggs.',
      'Scramble gently over medium flame until eggs are thoroughly cooked and fluffy (no runny portions).',
      'Garnish with fresh coriander leaves and serve warm with Jolada Rotti or Akki Rotti.'
    ],
    nutritionalHighlight: 'Choline (250mg), Albumin Protein (12g), Vitamin B12, Lutein'
  },
  {
    id: 'rec-kadalekai-mosaru',
    name: 'Homemade Kadalekai Mosaru (Vegan Peanut Curd)',
    kannadaName: 'ಕಡಲೆಕಾಯಿ ಮೊಸರು (ಡೈರಿ-ಮುಕ್ತ)',
    category: 'snack_drink',
    dietarySuitability: ['vegan'],
    maternityBenefit: '100% dairy-free probiotic alternative for vegan mothers. Provides plant-based healthy monounsaturated fats, protein, and friendly lactic cultures for maternal gut flora.',
    preparationTimeMinutes: 20,
    ingredients: [
      '1 cup Raw Peanuts, soaked overnight',
      '3 cups Filtered Water',
      '1 tsp Lemon juice or live plant-based starter culture',
      'Pinch of Rock salt'
    ],
    preparationSteps: [
      'Drain soaked peanuts, blend with 3 cups of water in a high-speed blender until silky smooth.',
      'Strain through a muslin cloth into a pot to extract fresh peanut milk.',
      'Boil the peanut milk on low-medium flame while stirring occasionally, then cool until lukewarm (approx 40°C).',
      'Whisk in starter culture or lemon drops, cover with a lid, and leave in a warm spot for 6-8 hours to set into thick, creamy curd.',
      'Refrigerate and use as curd or majjige with Sona Masoori rice or ragi meals.'
    ],
    nutritionalHighlight: 'Dairy-Free Probiotics, Plant Protein, Healthy Monounsaturated Fats'
  },
  {
    id: 'rec-huruli-saaru',
    name: 'Sprouted Horse Gram (Huruli) Saaru',
    kannadaName: 'ಹುರುಳಿ ಕಾಳು ಸಾರು',
    category: 'lunch_dinner',
    dietarySuitability: ['vegan', 'vegetarian'],
    maternityBenefit: 'Horse gram is a renowned Karnataka superfood with the highest iron content among Indian pulses. Sprouting reduces phytates and boosts bioavailable non-heme iron and folate.',
    preparationTimeMinutes: 30,
    ingredients: [
      '1 cup Sprouted Horse Gram (Huruli Kalu)',
      '1 tbsp Karnataka Sambar Powder or Saaru Pudi',
      'Small piece of Tamarind & 1 tsp Jaggery',
      '1 tsp Mustard seeds, Cumin & Hing',
      '2 cloves Garlic & fresh curry leaves'
    ],
    preparationSteps: [
      'Boil sprouted horse gram in 3 cups of water with a pinch of turmeric and salt until tender.',
      'Drain the nutrient-rich brown broth into a separate bowl, keeping aside 2 tbsp of boiled gram.',
      'Grind the 2 tbsp boiled gram with saaru powder and a little broth into a fine paste for thickening.',
      'Combine the broth, ground paste, tamarind extract, and jaggery; boil for 8-10 minutes.',
      'Prepare tempering with mustard seeds, cumin, crushed garlic, and curry leaves in oil; pour sizzling into the saaru.',
      'Serve hot with Sona Masoori brown rice or Ragi Mudde.'
    ],
    nutritionalHighlight: 'Iron (7.1mg/100g), Plant Protein (22%), Dietary Fiber'
  },
  {
    id: 'rec-jolada-rotti',
    name: 'Jolada Rotti (Sorghum Flatbread)',
    kannadaName: 'ಜೋಳದ ರೊಟ್ಟಿ',
    category: 'lunch_dinner',
    dietarySuitability: ['vegetarian', 'vegan', 'eggetarian', 'non-vegetarian'],
    maternityBenefit: 'Low glycemic index complex carbohydrate that prevents rapid blood sugar spikes in Gestational Diabetes.',
    preparationTimeMinutes: 25,
    ingredients: [
      '1 cup Sorghum (Jowar / Jolada) Flour',
      '1/2 cup Warm Water',
      'Pinch of Salt',
      'Dry Jowar flour for dusting'
    ],
    preparationSteps: [
      'Boil water with a pinch of salt. Slowly add jowar flour and mix with a wooden spatula.',
      'Knead the warm dough vigorously with your palm until smooth and pliable.',
      'Divide into equal balls. Flatten using traditional palm-patting technique (Thattu rotti) on a clean cloth or banana leaf.',
      'Transfer gently onto a hot clay or iron tawa, dab a little water on top, flip once cooked on one side, and roast until golden spots appear.'
    ],
    nutritionalHighlight: 'Magnesium, B-Complex Vitamins, Slow-release Carbs'
  },
  {
    id: 'rec-akki-rotti',
    name: 'Akki Rotti with Dill Leaves (Sabbasige Soppu)',
    kannadaName: 'ಅಕ್ಕಿ ರೊಟ್ಟಿ (ಸಬ್ಬಸಿಗೆ ಸೊಪ್ಪು)',
    category: 'breakfast',
    dietarySuitability: ['vegetarian', 'vegan', 'eggetarian', 'non-vegetarian'],
    maternityBenefit: 'Dill leaves are rich in calcium, iron, and essential oils that support maternal digestion and lactation preparation.',
    preparationTimeMinutes: 20,
    ingredients: [
      '1 cup Rice Flour',
      '1/2 cup Finely chopped Sabbasige Soppu (Dill leaves) or Palak',
      '1 Green Chilli & 1 tsp Cumin seeds',
      '2 tbsp Grated Coconut',
      'Warm water and Ghee or Cold-pressed oil'
    ],
    preparationSteps: [
      'In a large bowl, combine rice flour, chopped dill greens, cumin, green chillies, grated coconut, and salt.',
      'Gradually add warm water and knead into a soft, non-sticky dough.',
      'Take a lemon-sized ball, pat it flat directly on a greased banana leaf or damp cotton cloth into a thin circle.',
      'Invert onto a hot tawa, peel off the leaf, drizzle a few drops of oil or ghee, and roast until crisp on both sides.'
    ],
    nutritionalHighlight: 'Iron, Vitamin A, Calcium, Dietary Fiber'
  },
  {
    id: 'rec-basale-palya',
    name: 'Basale Soppu & Moong Dal Palya',
    kannadaName: 'ಬಸಳೆ ಸೊಪ್ಪು ಮತ್ತು ಹೆಸರುಕಾಳು ಪಲ್ಯ',
    category: 'lunch_dinner',
    dietarySuitability: ['vegetarian', 'vegan', 'eggetarian', 'non-vegetarian'],
    maternityBenefit: 'Malabar spinach (Basale) combined with sprouted green gram provides high bioavailable iron and folic acid.',
    preparationTimeMinutes: 20,
    ingredients: [
      '2 cups Chopped Basale Soppu (Malabar Spinach)',
      '1/2 cup Boiled Moong Dal (Green Gram)',
      '1 tsp Mustard seeds, Cumin & Turmeric',
      '2 cloves Garlic & 2 dry red chillies',
      '2 tbsp Fresh Grated Coconut'
    ],
    preparationSteps: [
      'Heat oil in a pan, splutter mustard seeds, cumin, crushed garlic, and curry leaves.',
      'Add chopped basale greens and turmeric; sauté until greens shrink and water evaporates.',
      'Mix in the boiled moong dal and a pinch of salt; cook for 3 minutes.',
      'Garnish with freshly grated coconut before serving.'
    ],
    nutritionalHighlight: 'Folic Acid, Iron, Vitamin C'
  },
  {
    id: 'rec-nuggekai-huli',
    name: 'Nuggekai (Drumstick) Huli',
    kannadaName: 'ನುಗ್ಗೆಕಾಯಿ ಹುಳಿ (ಸಾಂಬಾರ್)',
    category: 'lunch_dinner',
    dietarySuitability: ['vegetarian', 'vegan', 'eggetarian', 'non-vegetarian'],
    maternityBenefit: 'Drumstick pods and leaves are legendary in Karnataka Ayurveda for purifying blood and boosting maternal immunity.',
    preparationTimeMinutes: 30,
    ingredients: [
      '6-8 Drumstick pieces (Nuggekai)',
      '1/2 cup Toor Dal (cooked)',
      'Small lemon-sized Tamarind pulp extract',
      '2 tbsp Karnataka Sambar Powder',
      '1 tsp Jaggery, Mustard seeds, Curry leaves & Hing'
    ],
    preparationSteps: [
      'Boil drumstick pieces in water with turmeric and salt until tender.',
      'Add cooked toor dal, tamarind extract, sambar powder, and jaggery; boil for 10 minutes.',
      'Prepare tempering with mustard seeds, curry leaves, and hing in oil; pour over the boiling sambar.',
      'Serve hot with brown or Sona Masoori rice.'
    ],
    nutritionalHighlight: 'Vitamin C, Iron, Antioxidants, Minerals'
  },
  {
    id: 'rec-hesaru-kalu-usli',
    name: 'Hesaru Kalu Usli (Sprouted Green Gram Salad)',
    kannadaName: 'ಹೆಸರುಕಾಳು ಉಸಿಳಿ',
    category: 'snack_drink',
    dietarySuitability: ['vegetarian', 'vegan', 'eggetarian', 'non-vegetarian'],
    maternityBenefit: 'Sprouted mung beans offer live enzymes and easily digestible plant protein for fetal tissue growth.',
    preparationTimeMinutes: 15,
    ingredients: [
      '1 cup Sprouted Green Gram (Hesaru Kalu)',
      '1 tsp Mustard seeds & Green Chillies',
      '2 tbsp Grated Coconut',
      'Fresh Lemon Juice & Coriander leaves'
    ],
    preparationSteps: [
      'Lightly steam sprouted green gram for 3 minutes so they remain crunchy yet digestible.',
      'In a pan, temper mustard seeds, green chillies, and curry leaves in oil.',
      'Toss the sprouted moong with tempering, salt, and freshly grated coconut.',
      'Turn off heat, squeeze fresh lemon juice, and garnish with coriander.'
    ],
    nutritionalHighlight: 'High Protein, Vitamin C, Live Enzymes'
  }
];
