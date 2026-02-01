// ============================================
// CALORIE TRACKER HELPERS
// Utility functions for nutrition calculations and formatting
// ============================================

import { 
  NutritionPer100g, 
  FoodItemWithNutrition, 
  NutritionTotals,
  CalorieRange,
  PortionUnit,
  FoodFlag,
  MealType
} from './types';

// ============================================
// NUTRITION CALCULATIONS
// ============================================

/**
 * Calculate nutrition for a given amount of food
 */
export function calculateNutrition(
  per100g: NutritionPer100g,
  grams: number
): NutritionPer100g {
  const factor = grams / 100;
  return {
    calories: Math.round(per100g.calories * factor),
    protein_g: Math.round(per100g.protein_g * factor * 10) / 10,
    carbs_g: Math.round(per100g.carbs_g * factor * 10) / 10,
    fat_g: Math.round(per100g.fat_g * factor * 10) / 10,
    fiber_g: per100g.fiber_g ? Math.round(per100g.fiber_g * factor * 10) / 10 : undefined,
    sugar_g: per100g.sugar_g ? Math.round(per100g.sugar_g * factor * 10) / 10 : undefined,
    sodium_mg: per100g.sodium_mg ? Math.round(per100g.sodium_mg * factor) : undefined,
  };
}

/**
 * Calculate totals from an array of food items
 */
export function calculateTotals(items: FoodItemWithNutrition[]): NutritionTotals {
  const includedItems = items.filter(item => item.included);
  
  return {
    calories: Math.round(includedItems.reduce((sum, item) => sum + item.calculatedNutrition.calories, 0)),
    protein_g: Math.round(includedItems.reduce((sum, item) => sum + item.calculatedNutrition.protein_g, 0) * 10) / 10,
    carbs_g: Math.round(includedItems.reduce((sum, item) => sum + item.calculatedNutrition.carbs_g, 0) * 10) / 10,
    fat_g: Math.round(includedItems.reduce((sum, item) => sum + item.calculatedNutrition.fat_g, 0) * 10) / 10,
    fiber_g: Math.round(includedItems.reduce((sum, item) => sum + (item.calculatedNutrition.fiber_g || 0), 0) * 10) / 10,
    sugar_g: Math.round(includedItems.reduce((sum, item) => sum + (item.calculatedNutrition.sugar_g || 0), 0) * 10) / 10,
  };
}

/**
 * Calculate calorie range based on confidence and flags
 */
export function calculateCalorieRange(
  items: FoodItemWithNutrition[],
  answers: Record<string, string> = {}
): CalorieRange {
  const includedItems = items.filter(item => item.included);
  const baseCals = includedItems.reduce((sum, item) => sum + item.calculatedNutrition.calories, 0);
  
  // Start with base uncertainty
  let minMultiplier = 0.85;
  let maxMultiplier = 1.15;
  
  // Widen range based on flags
  const hasOilFlag = includedItems.some(item => item.flags.includes('possible_oil'));
  const hasSauceFlag = includedItems.some(item => item.flags.includes('possible_sauce'));
  const hasMixedDish = includedItems.some(item => item.flags.includes('mixed_dish'));
  const hasRestaurant = includedItems.some(item => item.flags.includes('restaurant_like'));
  const hasFried = includedItems.some(item => item.flags.includes('fried'));
  
  if (hasOilFlag) {
    minMultiplier -= 0.05;
    maxMultiplier += 0.10;
  }
  if (hasSauceFlag) {
    minMultiplier -= 0.03;
    maxMultiplier += 0.08;
  }
  if (hasMixedDish) {
    minMultiplier -= 0.05;
    maxMultiplier += 0.15;
  }
  if (hasRestaurant) {
    minMultiplier -= 0.05;
    maxMultiplier += 0.20;
  }
  if (hasFried) {
    maxMultiplier += 0.15;
  }
  
  // Tighten range based on answers
  if (answers.oil_used === 'none') {
    maxMultiplier -= 0.05;
  } else if (answers.oil_used === 'a lot') {
    maxMultiplier += 0.10;
  }
  
  if (answers.sauce_amount === 'none') {
    maxMultiplier -= 0.03;
  } else if (answers.sauce_amount === 'heavy') {
    maxMultiplier += 0.08;
  }
  
  // Factor in average confidence
  const avgConfidence = includedItems.reduce((sum, item) => sum + item.confidence, 0) / Math.max(includedItems.length, 1);
  if (avgConfidence < 0.6) {
    minMultiplier -= 0.05;
    maxMultiplier += 0.10;
  } else if (avgConfidence > 0.85) {
    minMultiplier += 0.03;
    maxMultiplier -= 0.03;
  }
  
  return {
    min: Math.round(baseCals * Math.max(minMultiplier, 0.7)),
    max: Math.round(baseCals * Math.min(maxMultiplier, 1.5)),
  };
}

/**
 * Calculate overall confidence from items
 */
export function calculateOverallConfidence(items: FoodItemWithNutrition[]): number {
  const includedItems = items.filter(item => item.included);
  if (includedItems.length === 0) return 0;
  
  const avgConfidence = includedItems.reduce((sum, item) => sum + item.confidence, 0) / includedItems.length;
  
  // Penalize for risky flags
  const flagPenalty = includedItems.reduce((penalty, item) => {
    let itemPenalty = 0;
    if (item.flags.includes('mixed_dish')) itemPenalty += 0.1;
    if (item.flags.includes('restaurant_like')) itemPenalty += 0.1;
    if (item.flags.includes('possible_oil')) itemPenalty += 0.05;
    if (item.flags.includes('possible_sauce')) itemPenalty += 0.05;
    return penalty + itemPenalty;
  }, 0) / Math.max(includedItems.length, 1);
  
  return Math.max(0.3, Math.min(1, avgConfidence - flagPenalty));
}

// ============================================
// PORTION CONVERSIONS
// ============================================

const PORTION_TO_GRAMS: Record<PortionUnit, number> = {
  grams: 1,
  cups: 240,
  tbsp: 15,
  tsp: 5,
  pieces: 50, // default, varies by food
  oz: 28.35,
  ml: 1, // for liquids, roughly 1:1 with water
  serving: 100, // default serving
};

export function convertToGrams(quantity: number, unit: PortionUnit, foodGramsPerPiece?: number): number {
  if (unit === 'pieces' && foodGramsPerPiece) {
    return Math.round(quantity * foodGramsPerPiece);
  }
  return Math.round(quantity * PORTION_TO_GRAMS[unit]);
}

export function getAvailableUnits(): { value: PortionUnit; label: string }[] {
  return [
    { value: 'grams', label: 'g' },
    { value: 'oz', label: 'oz' },
    { value: 'cups', label: 'cup' },
    { value: 'tbsp', label: 'tbsp' },
    { value: 'tsp', label: 'tsp' },
    { value: 'pieces', label: 'pc' },
    { value: 'serving', label: 'srv' },
  ];
}

// ============================================
// FORMATTING HELPERS
// ============================================

export function formatCalories(calories: number): string {
  if (calories >= 1000) {
    return `${(calories / 1000).toFixed(1)}k`;
  }
  return calories.toString();
}

export function formatMacro(value: number, unit: string = 'g'): string {
  if (value >= 100) {
    return `${Math.round(value)}${unit}`;
  }
  return `${value.toFixed(1)}${unit}`;
}

export function formatCalorieRange(range: CalorieRange): string {
  return `${range.min} - ${range.max} cal`;
}

export function formatConfidence(confidence: number): string {
  if (confidence >= 0.8) return 'High';
  if (confidence >= 0.6) return 'Medium';
  return 'Low';
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return '#9DB88C'; // success green
  if (confidence >= 0.6) return '#D4B078'; // warning yellow
  return '#C98888'; // error red
}

export function formatMealType(type: MealType): string {
  const labels: Record<MealType, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snack',
  };
  return labels[type];
}

export function getMealTypeEmoji(type: MealType): string {
  const emojis: Record<MealType, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍿',
  };
  return emojis[type];
}

export function suggestMealType(): MealType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snack';
  return 'dinner';
}

// ============================================
// FLAG HELPERS
// ============================================

export function getFlagLabel(flag: FoodFlag): string {
  const labels: Record<FoodFlag, string> = {
    possible_oil: 'May contain oil/butter',
    possible_sauce: 'May have sauce',
    possible_dressing: 'May have dressing',
    mixed_dish: 'Mixed dish',
    restaurant_like: 'Restaurant-style',
    fried: 'Likely fried',
    creamy: 'Creamy/rich',
    cheese_likely: 'May contain cheese',
  };
  return labels[flag];
}

export function shouldShowOilQuestion(items: FoodItemWithNutrition[]): boolean {
  return items.some(item => 
    item.included && 
    (item.flags.includes('possible_oil') || item.flags.includes('fried'))
  );
}

export function shouldShowSauceQuestion(items: FoodItemWithNutrition[]): boolean {
  return items.some(item => 
    item.included && 
    (item.flags.includes('possible_sauce') || 
     item.flags.includes('possible_dressing') ||
     item.flags.includes('creamy'))
  );
}

// ============================================
// PROGRESS HELPERS
// ============================================

export function calculateProgress(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(current / goal, 1);
}

export function getProgressColor(progress: number): string {
  if (progress > 1.1) return '#C98888'; // over goal - red
  if (progress >= 0.9) return '#9DB88C'; // at goal - green
  if (progress >= 0.5) return '#D4B078'; // halfway - yellow
  return '#D4A574'; // under - primary
}

export function formatProgressPercent(current: number, goal: number): string {
  if (goal <= 0) return '0%';
  const percent = Math.round((current / goal) * 100);
  return `${percent}%`;
}

// ============================================
// DATE HELPERS
// ============================================

export function formatMealTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// ============================================
// VALIDATION HELPERS
// ============================================

export function validatePortion(quantity: number, unit: PortionUnit): boolean {
  if (quantity <= 0) return false;
  
  const maxValues: Partial<Record<PortionUnit, number>> = {
    grams: 5000,
    cups: 20,
    tbsp: 100,
    tsp: 300,
    pieces: 50,
    oz: 200,
    serving: 20,
  };
  
  const max = maxValues[unit] || 1000;
  return quantity <= max;
}

export function generateItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
