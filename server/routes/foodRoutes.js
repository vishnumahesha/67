// ============================================
// FOOD SCAN & NUTRITION ROUTES
// AI-powered food detection and calorie tracking endpoints
// ============================================

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import nutritionDb from '../providers/nutritionDb.js';
import photoQuality from '../providers/photoQuality.js';

const router = express.Router();

// ============================================
// GEMINI FOOD ANALYSIS PROMPT
// ============================================
const FOOD_SCAN_PROMPT = `You are a food detection AI for a calorie tracking app. Analyze this food photo and detect all food items.

OUTPUT STRICT JSON ONLY. No markdown. No extra text.

Return this exact structure:
{
  "photoQuality": {
    "score": 0.0-1.0 (how good is the photo for food detection),
    "issues": ["too_dark", "blurry", "partial_view", "multiple_plates", "shadows", "too_bright"]
  },
  "items": [
    {
      "name": "specific food name (e.g., 'grilled chicken breast' not just 'chicken')",
      "description": "brief description of preparation/appearance",
      "estimatedPortion": {
        "quantity": number,
        "unit": "grams" | "cups" | "tbsp" | "tsp" | "pieces" | "oz" | "serving"
      },
      "grams": estimated grams (required - your best estimate),
      "confidence": 0.0-1.0 (how confident are you in this identification),
      "flags": ["possible_oil", "possible_sauce", "possible_dressing", "mixed_dish", "restaurant_like", "fried", "creamy", "cheese_likely"]
    }
  ],
  "questions": [
    {
      "key": "oil_used",
      "question": "Was oil or butter used in cooking?",
      "options": ["none", "a little", "normal amount", "a lot"]
    },
    {
      "key": "sauce_amount", 
      "question": "How much sauce/dressing is there?",
      "options": ["none", "light", "normal", "heavy"]
    }
  ]
}

RULES:
1. Be SPECIFIC with food names - "grilled chicken breast" not just "meat"
2. Estimate portions realistically - most restaurant portions are larger than people think
3. Add flags for hidden calories:
   - "possible_oil" if food looks sautéed, stir-fried, or glistening
   - "possible_sauce" if there's visible sauce or glaze
   - "fried" if food appears fried or crispy
   - "restaurant_like" if portions/presentation suggest restaurant food
   - "mixed_dish" if it's a complex dish with multiple components
4. Set confidence lower for:
   - Mixed dishes where you can't see all ingredients
   - Foods that could be multiple things
   - Poor photo quality
5. Only include questions that are relevant to visible flags
6. Grams estimation guide:
   - Chicken breast: 120-180g
   - Cup of rice: 150-200g cooked
   - Piece of bread: 25-40g
   - Side of vegetables: 80-150g
   - Restaurant entree: often 300-500g total

Detect ALL visible food items, including sides, garnishes, and condiments.`;

// ============================================
// POST /api/food/scan
// Main food scanning endpoint
// ============================================
router.post('/scan', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ 
        error: 'Image required',
        message: 'Please provide a base64 encoded image'
      });
    }
    
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'API not configured',
        message: 'GEMINI_API_KEY not set. Food scanning unavailable.'
      });
    }
    
    // Analyze photo quality heuristically
    const heuristicQuality = photoQuality.analyzePhotoQuality(image);
    console.log(`📸 Food scan - Photo size: ${heuristicQuality.sizeBytes} bytes`);
    
    // Call Gemini for food detection
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const imagePart = {
      inlineData: {
        data: image,
        mimeType: 'image/jpeg',
      },
    };
    
    console.log('🍽️ Analyzing food photo with AI...');
    const result = await model.generateContent([FOOD_SCAN_PROMPT, imagePart]);
    const response = await result.response;
    let text = response.text();
    
    // Clean up response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let aiResponse;
    try {
      aiResponse = JSON.parse(text);
    } catch (parseError) {
      console.error('AI response parse error:', parseError);
      console.error('Raw:', text.substring(0, 500));
      
      // Return fallback response for manual entry
      return res.json({
        photoUrl: null,
        photoQuality: heuristicQuality,
        items: [],
        totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
        calorieRange: { min: 0, max: 0 },
        confidence: 0,
        followUpQuestions: [],
        suggestedEdits: ['Could not detect foods. Please add items manually.'],
        error: 'AI parsing failed',
        fallbackMode: true
      });
    }
    
    // Combine photo quality assessments
    const finalQuality = photoQuality.combineQualityAssessments(
      aiResponse.photoQuality,
      heuristicQuality
    );
    
    // Process items - map to nutrition database and calculate macros
    const processedItems = [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    for (const item of aiResponse.items || []) {
      // Look up nutrition in database
      const { match, confidence: dbConfidence } = nutritionDb.mapAIFoodToDatabase(item.name);
      
      let nutrition;
      let source = 'ai';
      
      if (match) {
        // Use database nutrition
        nutrition = match.per_100g;
        source = 'usda'; // Using our local DB as proxy for USDA
      } else {
        // Estimate nutrition (fallback)
        nutrition = estimateNutrition(item.name, item.flags);
        source = 'ai';
      }
      
      // Calculate macros for this portion
      const grams = item.grams || 100;
      const calculated = nutritionDb.calculateNutrition(nutrition, grams);
      
      // Combine AI confidence with DB confidence
      const finalConfidence = match 
        ? Math.min(item.confidence, dbConfidence)
        : item.confidence * 0.7; // Lower confidence for estimated nutrition
      
      const processedItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: match?.name || item.name,
        description: item.description,
        estimatedPortion: item.estimatedPortion,
        grams,
        confidence: Math.round(finalConfidence * 100) / 100,
        flags: item.flags || [],
        included: true,
        nutrition, // per 100g
        calculatedNutrition: calculated,
        source,
        dbMatch: match?.id || null,
      };
      
      processedItems.push(processedItem);
      
      // Sum totals
      totalCalories += calculated.calories;
      totalProtein += calculated.protein_g;
      totalCarbs += calculated.carbs_g;
      totalFat += calculated.fat_g;
    }
    
    // Calculate calorie range based on confidence and flags
    const calorieRange = calculateCalorieRange(processedItems, totalCalories);
    
    // Calculate overall confidence
    const overallConfidence = calculateOverallConfidence(processedItems, finalQuality.score);
    
    // Filter questions to only relevant ones
    const relevantQuestions = filterRelevantQuestions(
      aiResponse.questions || [],
      processedItems
    );
    
    // Generate suggested edits
    const suggestedEdits = generateSuggestedEdits(processedItems, finalQuality);
    
    const processingTime = Date.now() - startTime;
    console.log(`✓ Food scan complete - ${processedItems.length} items, ${totalCalories} cal, ${processingTime}ms`);
    
    res.json({
      photoUrl: null, // Would be set if storing image
      photoQuality: finalQuality,
      items: processedItems,
      totals: {
        calories: Math.round(totalCalories),
        protein_g: Math.round(totalProtein * 10) / 10,
        carbs_g: Math.round(totalCarbs * 10) / 10,
        fat_g: Math.round(totalFat * 10) / 10,
      },
      calorieRange,
      confidence: overallConfidence,
      followUpQuestions: relevantQuestions,
      suggestedEdits,
      processingTimeMs: processingTime,
    });
    
  } catch (error) {
    console.error('Food scan error:', error);
    res.status(500).json({
      error: 'Scan failed',
      message: error.message,
      fallbackMode: true,
    });
  }
});

// ============================================
// POST /api/food/recompute
// Recompute totals after user edits
// ============================================
router.post('/recompute', async (req, res) => {
  try {
    const { items, answers } = req.body;
    
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Items array required'
      });
    }
    
    // Recalculate each item's nutrition based on current grams
    const updatedItems = items.map(item => {
      const grams = item.grams || 100;
      const calculated = nutritionDb.calculateNutrition(item.nutrition, grams);
      
      return {
        ...item,
        calculatedNutrition: calculated,
      };
    });
    
    // Sum totals for included items only
    const includedItems = updatedItems.filter(i => i.included);
    
    const totals = {
      calories: Math.round(includedItems.reduce((sum, i) => sum + i.calculatedNutrition.calories, 0)),
      protein_g: Math.round(includedItems.reduce((sum, i) => sum + i.calculatedNutrition.protein_g, 0) * 10) / 10,
      carbs_g: Math.round(includedItems.reduce((sum, i) => sum + i.calculatedNutrition.carbs_g, 0) * 10) / 10,
      fat_g: Math.round(includedItems.reduce((sum, i) => sum + i.calculatedNutrition.fat_g, 0) * 10) / 10,
    };
    
    // Adjust calorie range based on answers
    const calorieRange = calculateCalorieRangeWithAnswers(
      includedItems,
      totals.calories,
      answers || {}
    );
    
    // Recalculate confidence
    const confidence = calculateOverallConfidence(includedItems, 0.8);
    
    res.json({
      items: updatedItems,
      totals,
      calorieRange,
      confidence,
    });
    
  } catch (error) {
    console.error('Recompute error:', error);
    res.status(500).json({
      error: 'Recompute failed',
      message: error.message
    });
  }
});

// ============================================
// GET /api/food/search
// Search food database
// ============================================
router.get('/search', (req, res) => {
  const { q, limit = 15 } = req.query;
  
  if (!q || q.length < 2) {
    return res.json([]);
  }
  
  const results = nutritionDb.searchFoods(q, parseInt(limit));
  res.json(results);
});

// ============================================
// GET /api/food/nutrition
// Get nutrition for specific food
// ============================================
router.get('/nutrition', (req, res) => {
  const { name, id } = req.query;
  
  if (id) {
    const food = nutritionDb.getFoodById(id);
    if (food) {
      return res.json(food);
    }
    return res.status(404).json({ error: 'Food not found' });
  }
  
  if (name) {
    const food = nutritionDb.getNutritionByName(name);
    if (food) {
      return res.json(food);
    }
    return res.status(404).json({ error: 'Food not found' });
  }
  
  res.status(400).json({ error: 'Name or ID required' });
});

// ============================================
// GET /api/food/common
// Get common foods for quick add
// ============================================
router.get('/common', (req, res) => {
  const { limit = 20 } = req.query;
  const foods = nutritionDb.getCommonFoods(parseInt(limit));
  res.json(foods);
});

// ============================================
// POST /api/food/log
// Log meal (placeholder - would integrate with Supabase)
// ============================================
router.post('/log', (req, res) => {
  const { items, mealType, photoUrl, confidence, calorieMin, calorieMax, eatenAt } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items required' });
  }
  
  // In production, this would save to Supabase
  // For demo, just return success
  const mealId = `meal_${Date.now()}`;
  
  console.log(`📝 Logged meal: ${mealType} with ${items.length} items`);
  
  res.json({
    mealId,
    success: true,
    message: 'Meal logged successfully',
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function estimateNutrition(foodName, flags) {
  // Fallback nutrition estimation when no DB match
  const name = foodName.toLowerCase();
  
  // Default moderate values
  let nutrition = {
    calories: 150,
    protein_g: 10,
    carbs_g: 15,
    fat_g: 5,
  };
  
  // Adjust based on food name keywords
  if (name.includes('chicken') || name.includes('turkey') || name.includes('fish')) {
    nutrition = { calories: 165, protein_g: 25, carbs_g: 0, fat_g: 5 };
  } else if (name.includes('beef') || name.includes('steak') || name.includes('pork')) {
    nutrition = { calories: 250, protein_g: 26, carbs_g: 0, fat_g: 15 };
  } else if (name.includes('rice') || name.includes('pasta') || name.includes('noodle')) {
    nutrition = { calories: 130, protein_g: 3, carbs_g: 28, fat_g: 1 };
  } else if (name.includes('bread') || name.includes('toast')) {
    nutrition = { calories: 265, protein_g: 9, carbs_g: 49, fat_g: 3 };
  } else if (name.includes('salad') && !name.includes('chicken') && !name.includes('tuna')) {
    nutrition = { calories: 25, protein_g: 2, carbs_g: 5, fat_g: 0 };
  } else if (name.includes('egg')) {
    nutrition = { calories: 155, protein_g: 13, carbs_g: 1, fat_g: 11 };
  } else if (name.includes('vegetable') || name.includes('broccoli') || name.includes('spinach')) {
    nutrition = { calories: 35, protein_g: 3, carbs_g: 6, fat_g: 0 };
  }
  
  // Adjust for flags
  if (flags?.includes('fried')) {
    nutrition.calories *= 1.4;
    nutrition.fat_g *= 2;
  }
  if (flags?.includes('creamy')) {
    nutrition.calories *= 1.2;
    nutrition.fat_g *= 1.5;
  }
  
  return nutrition;
}

function calculateCalorieRange(items, baseCals) {
  let minMultiplier = 0.85;
  let maxMultiplier = 1.15;
  
  // Widen based on flags
  for (const item of items) {
    if (item.flags?.includes('possible_oil')) maxMultiplier += 0.05;
    if (item.flags?.includes('possible_sauce')) maxMultiplier += 0.05;
    if (item.flags?.includes('mixed_dish')) { minMultiplier -= 0.05; maxMultiplier += 0.1; }
    if (item.flags?.includes('restaurant_like')) { minMultiplier -= 0.05; maxMultiplier += 0.15; }
    if (item.flags?.includes('fried')) maxMultiplier += 0.1;
  }
  
  // Widen based on low confidence
  const avgConfidence = items.reduce((sum, i) => sum + i.confidence, 0) / Math.max(items.length, 1);
  if (avgConfidence < 0.6) {
    minMultiplier -= 0.1;
    maxMultiplier += 0.15;
  }
  
  return {
    min: Math.round(baseCals * Math.max(minMultiplier, 0.7)),
    max: Math.round(baseCals * Math.min(maxMultiplier, 1.6)),
  };
}

function calculateCalorieRangeWithAnswers(items, baseCals, answers) {
  const range = calculateCalorieRange(items, baseCals);
  
  // Tighten range based on answers
  if (answers.oil_used === 'none') {
    range.max = Math.round(range.max * 0.95);
  } else if (answers.oil_used === 'a lot') {
    range.min = Math.round(range.min * 1.05);
    range.max = Math.round(range.max * 1.1);
  }
  
  if (answers.sauce_amount === 'none') {
    range.max = Math.round(range.max * 0.97);
  } else if (answers.sauce_amount === 'heavy') {
    range.min = Math.round(range.min * 1.03);
    range.max = Math.round(range.max * 1.08);
  }
  
  return range;
}

function calculateOverallConfidence(items, photoQualityScore) {
  if (items.length === 0) return 0;
  
  const avgItemConfidence = items.reduce((sum, i) => sum + i.confidence, 0) / items.length;
  
  // Factor in photo quality
  const photoFactor = Math.max(0.5, photoQualityScore);
  
  // Penalize for risky flags
  let flagPenalty = 0;
  for (const item of items) {
    if (item.flags?.includes('mixed_dish')) flagPenalty += 0.05;
    if (item.flags?.includes('restaurant_like')) flagPenalty += 0.05;
  }
  flagPenalty = Math.min(flagPenalty, 0.2);
  
  return Math.round(Math.max(0.3, avgItemConfidence * photoFactor - flagPenalty) * 100) / 100;
}

function filterRelevantQuestions(questions, items) {
  const hasOilFlag = items.some(i => 
    i.flags?.includes('possible_oil') || i.flags?.includes('fried')
  );
  const hasSauceFlag = items.some(i => 
    i.flags?.includes('possible_sauce') || 
    i.flags?.includes('possible_dressing') ||
    i.flags?.includes('creamy')
  );
  
  return questions.filter(q => {
    if (q.key === 'oil_used' && !hasOilFlag) return false;
    if (q.key === 'sauce_amount' && !hasSauceFlag) return false;
    return true;
  });
}

function generateSuggestedEdits(items, quality) {
  const suggestions = [];
  
  // Confidence-based suggestions
  const lowConfidenceItems = items.filter(i => i.confidence < 0.6);
  if (lowConfidenceItems.length > 0) {
    suggestions.push(`Verify: ${lowConfidenceItems.map(i => i.name).join(', ')}`);
  }
  
  // Flag-based suggestions
  const mixedDishes = items.filter(i => i.flags?.includes('mixed_dish'));
  if (mixedDishes.length > 0) {
    suggestions.push('Mixed dishes may have hidden ingredients - consider adjusting portions');
  }
  
  const restaurantItems = items.filter(i => i.flags?.includes('restaurant_like'));
  if (restaurantItems.length > 0) {
    suggestions.push('Restaurant portions tend to be larger - verify amounts');
  }
  
  // Quality-based suggestions
  if (quality.score < 0.6) {
    suggestions.push('Photo quality affected detection - review all items');
  }
  
  return suggestions;
}

export default router;
