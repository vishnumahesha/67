// ============================================
// CALORIE TRACKER TYPES
// Shared types for the AI nutrition tracking feature
// ============================================

// ============================================
// SCAN REQUEST/RESPONSE TYPES
// ============================================

export interface PhotoQuality {
  score: number; // 0-1
  issues: PhotoIssue[];
}

export type PhotoIssue = 
  | 'too_dark'
  | 'too_bright'
  | 'blurry'
  | 'too_small'
  | 'shadows'
  | 'partial_view'
  | 'multiple_plates';

export interface EstimatedPortion {
  quantity: number;
  unit: PortionUnit;
}

export type PortionUnit = 'grams' | 'cups' | 'tbsp' | 'tsp' | 'pieces' | 'oz' | 'ml' | 'serving';

export type FoodFlag = 
  | 'possible_oil'
  | 'possible_sauce'
  | 'possible_dressing'
  | 'mixed_dish'
  | 'restaurant_like'
  | 'fried'
  | 'creamy'
  | 'cheese_likely';

export interface DetectedFoodItem {
  name: string;
  description?: string;
  estimatedPortion: EstimatedPortion;
  grams: number;
  confidence: number; // 0-1
  flags: FoodFlag[];
}

export interface FollowUpQuestion {
  key: string;
  question: string;
  options: string[];
  selectedOption?: string;
}

export interface ScanRequest {
  image: string; // base64
}

export interface AIScanResponse {
  photoQuality: PhotoQuality;
  items: DetectedFoodItem[];
  questions: FollowUpQuestion[];
}

// ============================================
// NUTRITION DATA TYPES
// ============================================

export interface NutritionPer100g {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
}

export interface FoodItemWithNutrition extends DetectedFoodItem {
  id: string;
  included: boolean;
  nutrition: NutritionPer100g;
  calculatedNutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g?: number;
    sugar_g?: number;
    sodium_mg?: number;
  };
  source: 'ai' | 'usda' | 'manual' | 'custom';
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ScanResponse {
  photoUrl?: string;
  photoQuality: PhotoQuality;
  items: FoodItemWithNutrition[];
  totals: NutritionTotals;
  calorieRange: CalorieRange;
  confidence: number;
  followUpQuestions: FollowUpQuestion[];
  suggestedEdits: string[];
}

export interface NutritionTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
}

export interface CalorieRange {
  min: number;
  max: number;
}

export interface RecomputeRequest {
  items: FoodItemWithNutrition[];
  answers: Record<string, string>; // question key -> selected option
}

export interface RecomputeResponse {
  items: FoodItemWithNutrition[];
  totals: NutritionTotals;
  calorieRange: CalorieRange;
  confidence: number;
}

// ============================================
// DATABASE/MEAL TYPES
// ============================================

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealItem {
  id: string;
  meal_id: string;
  name: string;
  quantity: number;
  unit: string;
  grams?: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  confidence?: number;
  source: 'ai' | 'usda' | 'manual' | 'custom';
}

export interface Meal {
  id: string;
  user_id: string;
  created_at: string;
  eaten_at: string;
  meal_type: MealType;
  photo_url?: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  confidence?: number;
  calorie_min?: number;
  calorie_max?: number;
  notes?: string;
  items?: MealItem[];
}

export interface DailyTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  meal_count: number;
}

export interface NutritionGoals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface ScanState {
  status: 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';
  progress: number;
  error?: string;
  result?: ScanResponse;
}

export interface ConfirmMealState {
  items: FoodItemWithNutrition[];
  answers: Record<string, string>;
  totals: NutritionTotals;
  calorieRange: CalorieRange;
  confidence: number;
  mealType: MealType;
  isRecomputing: boolean;
}

// ============================================
// FOOD DATABASE TYPES
// ============================================

export interface FoodDatabaseEntry {
  id: string;
  name: string;
  aliases?: string[];
  category: FoodCategory;
  per_100g: NutritionPer100g;
  common_portions?: {
    name: string;
    grams: number;
  }[];
}

export type FoodCategory = 
  | 'protein'
  | 'carbs'
  | 'vegetables'
  | 'fruits'
  | 'dairy'
  | 'fats_oils'
  | 'beverages'
  | 'snacks'
  | 'condiments'
  | 'mixed_dishes'
  | 'desserts'
  | 'grains';
