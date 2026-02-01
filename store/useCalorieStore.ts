// ============================================
// CALORIE TRACKER STORE
// Zustand store for calorie tracking state management
// ============================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { 
  Meal, 
  MealItem, 
  DailyTotals, 
  NutritionGoals,
  FoodItemWithNutrition,
  ScanResponse,
  MealType,
  CalorieRange,
  NutritionTotals,
  FollowUpQuestion
} from '@/src/calorieTracker/types';

interface CalorieState {
  // Goals
  goals: NutritionGoals;
  setGoals: (goals: NutritionGoals) => Promise<void>;
  loadGoals: () => Promise<void>;
  
  // Today's data
  todayMeals: Meal[];
  todayTotals: DailyTotals;
  setTodayMeals: (meals: Meal[]) => void;
  refreshTodayData: () => Promise<void>;
  
  // Scan state
  scanPhotoUri: string | null;
  setScanPhotoUri: (uri: string | null) => void;
  scanResult: ScanResponse | null;
  setScanResult: (result: ScanResponse | null) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
  scanError: string | null;
  setScanError: (error: string | null) => void;
  
  // Confirm meal state
  pendingItems: FoodItemWithNutrition[];
  setPendingItems: (items: FoodItemWithNutrition[]) => void;
  updatePendingItem: (id: string, updates: Partial<FoodItemWithNutrition>) => void;
  removePendingItem: (id: string) => void;
  addPendingItem: (item: FoodItemWithNutrition) => void;
  
  pendingAnswers: Record<string, string>;
  setPendingAnswer: (key: string, value: string) => void;
  
  pendingMealType: MealType;
  setPendingMealType: (type: MealType) => void;
  
  pendingTotals: NutritionTotals;
  pendingCalorieRange: CalorieRange;
  pendingConfidence: number;
  pendingQuestions: FollowUpQuestion[];
  
  recalculatePendingTotals: () => void;
  
  // Logging
  isLogging: boolean;
  setIsLogging: (logging: boolean) => void;
  logMeal: () => Promise<string | null>;
  
  // Clear state
  clearScanState: () => void;
  clearPendingMeal: () => void;
  
  // Meal history (local cache)
  mealHistory: Meal[];
  loadMealHistory: () => Promise<void>;
  addMealToHistory: (meal: Meal) => Promise<void>;
}

// Helper to suggest meal type based on time
function suggestMealType(): MealType {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 18) return 'snack';
  return 'dinner';
}

// Calculate totals from items
function calculateTotals(items: FoodItemWithNutrition[]): NutritionTotals {
  const included = items.filter(i => i.included);
  return {
    calories: Math.round(included.reduce((sum, i) => sum + i.calculatedNutrition.calories, 0)),
    protein_g: Math.round(included.reduce((sum, i) => sum + i.calculatedNutrition.protein_g, 0) * 10) / 10,
    carbs_g: Math.round(included.reduce((sum, i) => sum + i.calculatedNutrition.carbs_g, 0) * 10) / 10,
    fat_g: Math.round(included.reduce((sum, i) => sum + i.calculatedNutrition.fat_g, 0) * 10) / 10,
  };
}

// Calculate calorie range
function calculateCalorieRange(items: FoodItemWithNutrition[], baseCals: number): CalorieRange {
  let minMult = 0.85;
  let maxMult = 1.15;
  
  for (const item of items.filter(i => i.included)) {
    if (item.flags?.includes('possible_oil')) maxMult += 0.05;
    if (item.flags?.includes('possible_sauce')) maxMult += 0.05;
    if (item.flags?.includes('mixed_dish')) { minMult -= 0.05; maxMult += 0.1; }
    if (item.flags?.includes('restaurant_like')) { minMult -= 0.05; maxMult += 0.15; }
  }
  
  return {
    min: Math.round(baseCals * Math.max(minMult, 0.7)),
    max: Math.round(baseCals * Math.min(maxMult, 1.6)),
  };
}

// Calculate overall confidence
function calculateConfidence(items: FoodItemWithNutrition[]): number {
  const included = items.filter(i => i.included);
  if (included.length === 0) return 0;
  
  const avg = included.reduce((sum, i) => sum + i.confidence, 0) / included.length;
  let penalty = 0;
  for (const item of included) {
    if (item.flags?.includes('mixed_dish')) penalty += 0.05;
    if (item.flags?.includes('restaurant_like')) penalty += 0.05;
  }
  
  return Math.max(0.3, Math.round((avg - Math.min(penalty, 0.2)) * 100) / 100);
}

export const useCalorieStore = create<CalorieState>((set, get) => ({
  // Goals - default values
  goals: {
    calories: 2000,
    protein_g: 150,
    carbs_g: 200,
    fat_g: 65,
  },
  
  setGoals: async (goals) => {
    set({ goals });
    await AsyncStorage.setItem('calorieGoals', JSON.stringify(goals));
  },
  
  loadGoals: async () => {
    try {
      const stored = await AsyncStorage.getItem('calorieGoals');
      if (stored) {
        set({ goals: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load goals:', e);
    }
  },
  
  // Today's data
  todayMeals: [],
  todayTotals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, meal_count: 0 },
  
  setTodayMeals: (meals) => {
    const totals: DailyTotals = {
      calories: meals.reduce((sum, m) => sum + m.total_calories, 0),
      protein_g: meals.reduce((sum, m) => sum + m.total_protein_g, 0),
      carbs_g: meals.reduce((sum, m) => sum + m.total_carbs_g, 0),
      fat_g: meals.reduce((sum, m) => sum + m.total_fat_g, 0),
      meal_count: meals.length,
    };
    set({ todayMeals: meals, todayTotals: totals });
  },
  
  refreshTodayData: async () => {
    // Load from local storage for demo
    // In production, would fetch from Supabase
    const { mealHistory } = get();
    const today = new Date().toDateString();
    const todayMeals = mealHistory.filter(m => 
      new Date(m.eaten_at).toDateString() === today
    );
    get().setTodayMeals(todayMeals);
  },
  
  // Scan state
  scanPhotoUri: null,
  setScanPhotoUri: (uri) => set({ scanPhotoUri: uri }),
  scanResult: null,
  setScanResult: (result) => set({ scanResult: result }),
  isScanning: false,
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  scanError: null,
  setScanError: (error) => set({ scanError: error }),
  
  // Pending meal state
  pendingItems: [],
  setPendingItems: (items) => {
    set({ pendingItems: items });
    get().recalculatePendingTotals();
  },
  
  updatePendingItem: (id, updates) => {
    const { pendingItems } = get();
    const updated = pendingItems.map(item => {
      if (item.id === id) {
        const newItem = { ...item, ...updates };
        // Recalculate nutrition if grams changed
        if (updates.grams !== undefined && item.nutrition) {
          const factor = updates.grams / 100;
          newItem.calculatedNutrition = {
            calories: Math.round(item.nutrition.calories * factor),
            protein_g: Math.round(item.nutrition.protein_g * factor * 10) / 10,
            carbs_g: Math.round(item.nutrition.carbs_g * factor * 10) / 10,
            fat_g: Math.round(item.nutrition.fat_g * factor * 10) / 10,
          };
        }
        return newItem;
      }
      return item;
    });
    set({ pendingItems: updated });
    get().recalculatePendingTotals();
  },
  
  removePendingItem: (id) => {
    const { pendingItems } = get();
    set({ pendingItems: pendingItems.filter(i => i.id !== id) });
    get().recalculatePendingTotals();
  },
  
  addPendingItem: (item) => {
    const { pendingItems } = get();
    set({ pendingItems: [...pendingItems, item] });
    get().recalculatePendingTotals();
  },
  
  pendingAnswers: {},
  setPendingAnswer: (key, value) => {
    const { pendingAnswers } = get();
    set({ pendingAnswers: { ...pendingAnswers, [key]: value } });
    get().recalculatePendingTotals();
  },
  
  pendingMealType: suggestMealType(),
  setPendingMealType: (type) => set({ pendingMealType: type }),
  
  pendingTotals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  pendingCalorieRange: { min: 0, max: 0 },
  pendingConfidence: 0,
  pendingQuestions: [],
  
  recalculatePendingTotals: () => {
    const { pendingItems, pendingAnswers } = get();
    const totals = calculateTotals(pendingItems);
    let range = calculateCalorieRange(pendingItems, totals.calories);
    
    // Adjust range based on answers
    if (pendingAnswers.oil_used === 'none') {
      range.max = Math.round(range.max * 0.95);
    } else if (pendingAnswers.oil_used === 'a lot') {
      range.max = Math.round(range.max * 1.1);
    }
    if (pendingAnswers.sauce_amount === 'none') {
      range.max = Math.round(range.max * 0.97);
    } else if (pendingAnswers.sauce_amount === 'heavy') {
      range.max = Math.round(range.max * 1.08);
    }
    
    const confidence = calculateConfidence(pendingItems);
    
    set({
      pendingTotals: totals,
      pendingCalorieRange: range,
      pendingConfidence: confidence,
    });
  },
  
  // Logging
  isLogging: false,
  setIsLogging: (logging) => set({ isLogging: logging }),
  
  logMeal: async () => {
    const { 
      pendingItems, 
      pendingMealType, 
      pendingTotals, 
      pendingCalorieRange,
      pendingConfidence,
      scanPhotoUri 
    } = get();
    
    const includedItems = pendingItems.filter(i => i.included);
    if (includedItems.length === 0) return null;
    
    set({ isLogging: true });
    
    try {
      const mealId = `meal_${Date.now()}`;
      const now = new Date().toISOString();
      
      const meal: Meal = {
        id: mealId,
        user_id: 'local_user', // Would be real user ID with auth
        created_at: now,
        eaten_at: now,
        meal_type: pendingMealType,
        photo_url: scanPhotoUri || undefined,
        total_calories: pendingTotals.calories,
        total_protein_g: pendingTotals.protein_g,
        total_carbs_g: pendingTotals.carbs_g,
        total_fat_g: pendingTotals.fat_g,
        confidence: pendingConfidence,
        calorie_min: pendingCalorieRange.min,
        calorie_max: pendingCalorieRange.max,
        items: includedItems.map(item => ({
          id: item.id,
          meal_id: mealId,
          name: item.name,
          quantity: item.estimatedPortion?.quantity || 1,
          unit: item.estimatedPortion?.unit || 'serving',
          grams: item.grams,
          calories: item.calculatedNutrition.calories,
          protein_g: item.calculatedNutrition.protein_g,
          carbs_g: item.calculatedNutrition.carbs_g,
          fat_g: item.calculatedNutrition.fat_g,
          confidence: item.confidence,
          source: item.source,
        })),
      };
      
      // Add to history
      await get().addMealToHistory(meal);
      
      // Refresh today's data
      await get().refreshTodayData();
      
      // Clear pending state
      get().clearPendingMeal();
      
      return mealId;
    } catch (error) {
      console.error('Failed to log meal:', error);
      return null;
    } finally {
      set({ isLogging: false });
    }
  },
  
  // Clear functions
  clearScanState: () => {
    set({
      scanPhotoUri: null,
      scanResult: null,
      isScanning: false,
      scanError: null,
    });
  },
  
  clearPendingMeal: () => {
    set({
      pendingItems: [],
      pendingAnswers: {},
      pendingMealType: suggestMealType(),
      pendingTotals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      pendingCalorieRange: { min: 0, max: 0 },
      pendingConfidence: 0,
      pendingQuestions: [],
      scanPhotoUri: null,
      scanResult: null,
    });
  },
  
  // Meal history (local storage for demo)
  mealHistory: [],
  
  loadMealHistory: async () => {
    try {
      const stored = await AsyncStorage.getItem('mealHistory');
      if (stored) {
        const history = JSON.parse(stored);
        set({ mealHistory: history });
        
        // Also refresh today's data
        get().refreshTodayData();
      }
    } catch (e) {
      console.error('Failed to load meal history:', e);
    }
  },
  
  addMealToHistory: async (meal) => {
    const { mealHistory } = get();
    const newHistory = [meal, ...mealHistory].slice(0, 100); // Keep last 100 meals
    
    await AsyncStorage.setItem('mealHistory', JSON.stringify(newHistory));
    set({ mealHistory: newHistory });
  },
}));
