// ============================================
// CALORIE TRACKER API CLIENT
// Client-side API calls for food scanning and logging
// ============================================

import { 
  ScanResponse, 
  RecomputeRequest, 
  RecomputeResponse,
  FoodItemWithNutrition,
  FoodDatabaseEntry
} from './types';

// Get server URL from environment or default to localhost
const getServerUrl = () => {
  // In production, this would come from environment
  return 'http://localhost:3002';
};

// ============================================
// SCAN API
// ============================================

export async function scanFood(imageBase64: string): Promise<ScanResponse> {
  const response = await fetch(`${getServerUrl()}/api/food/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageBase64 }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Scan failed' }));
    throw new Error(error.message || 'Failed to scan food');
  }

  return response.json();
}

// ============================================
// RECOMPUTE API
// ============================================

export async function recomputeNutrition(
  request: RecomputeRequest
): Promise<RecomputeResponse> {
  const response = await fetch(`${getServerUrl()}/api/food/recompute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Recompute failed' }));
    throw new Error(error.message || 'Failed to recompute nutrition');
  }

  return response.json();
}

// ============================================
// FOOD SEARCH API
// ============================================

export async function searchFoods(query: string): Promise<FoodDatabaseEntry[]> {
  const response = await fetch(
    `${getServerUrl()}/api/food/search?q=${encodeURIComponent(query)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Search failed' }));
    throw new Error(error.message || 'Failed to search foods');
  }

  return response.json();
}

// ============================================
// NUTRITION LOOKUP API
// ============================================

export async function getNutrition(
  foodName: string
): Promise<FoodDatabaseEntry | null> {
  const response = await fetch(
    `${getServerUrl()}/api/food/nutrition?name=${encodeURIComponent(foodName)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.json().catch(() => ({ message: 'Lookup failed' }));
    throw new Error(error.message || 'Failed to get nutrition');
  }

  return response.json();
}

// ============================================
// LOG MEAL API (for Supabase integration)
// ============================================

export interface LogMealRequest {
  items: FoodItemWithNutrition[];
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  photoUrl?: string;
  confidence: number;
  calorieMin: number;
  calorieMax: number;
  eatenAt?: string;
}

export async function logMeal(request: LogMealRequest): Promise<{ mealId: string }> {
  const response = await fetch(`${getServerUrl()}/api/food/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Log failed' }));
    throw new Error(error.message || 'Failed to log meal');
  }

  return response.json();
}

// ============================================
// HEALTH CHECK
// ============================================

export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getServerUrl()}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}
