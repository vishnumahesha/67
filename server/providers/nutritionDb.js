// ============================================
// NUTRITION DATABASE PROVIDER
// Fuzzy search and nutrition lookup from local food database
// ============================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load food database
let foodDatabase = { foods: [] };

function loadFoodDatabase() {
  try {
    const dbPath = path.join(__dirname, '../data/food_db_seed.json');
    const data = fs.readFileSync(dbPath, 'utf-8');
    foodDatabase = JSON.parse(data);
    console.log(`✓ Loaded ${foodDatabase.foods.length} foods from database`);
  } catch (error) {
    console.error('Failed to load food database:', error.message);
  }
}

// Load on module init
loadFoodDatabase();

/**
 * Simple string similarity score (0-1)
 */
function similarity(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Word overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const overlap = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
  
  if (overlap.length > 0) {
    return 0.5 + (overlap.length / Math.max(words1.length, words2.length)) * 0.4;
  }
  
  // Levenshtein-ish distance for short strings
  if (s1.length < 20 && s2.length < 20) {
    let matches = 0;
    const shorter = s1.length < s2.length ? s1 : s2;
    const longer = s1.length < s2.length ? s2 : s1;
    
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) matches++;
    }
    return matches / longer.length * 0.5;
  }
  
  return 0;
}

/**
 * Search foods by name with fuzzy matching
 * @param {string} query - Search query
 * @param {number} limit - Max results
 * @returns {Array} Matching foods sorted by relevance
 */
export function searchFoods(query, limit = 10) {
  if (!query || query.length < 2) return [];
  
  const q = query.toLowerCase().trim();
  const results = [];
  
  for (const food of foodDatabase.foods) {
    let score = similarity(food.name, q);
    
    // Check aliases
    if (food.aliases) {
      for (const alias of food.aliases) {
        const aliasScore = similarity(alias, q);
        if (aliasScore > score) score = aliasScore;
      }
    }
    
    if (score > 0.3) {
      results.push({ ...food, relevance: score });
    }
  }
  
  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance);
  
  return results.slice(0, limit);
}

/**
 * Get nutrition data for a specific food by name
 * @param {string} name - Food name
 * @returns {Object|null} Food entry or null
 */
export function getNutritionByName(name) {
  const results = searchFoods(name, 1);
  
  if (results.length > 0 && results[0].relevance > 0.6) {
    return results[0];
  }
  
  return null;
}

/**
 * Get food by exact ID
 * @param {string} id - Food ID
 * @returns {Object|null} Food entry or null
 */
export function getFoodById(id) {
  return foodDatabase.foods.find(f => f.id === id) || null;
}

/**
 * Map AI-detected food name to database entry
 * @param {string} aiName - Name from AI detection
 * @returns {Object} { match: Food|null, confidence: number }
 */
export function mapAIFoodToDatabase(aiName) {
  const results = searchFoods(aiName, 3);
  
  if (results.length === 0) {
    return { match: null, confidence: 0 };
  }
  
  const best = results[0];
  
  // High confidence if good match
  if (best.relevance > 0.85) {
    return { match: best, confidence: 0.95 };
  }
  
  // Medium confidence
  if (best.relevance > 0.6) {
    return { match: best, confidence: 0.7 };
  }
  
  // Low confidence but still return
  if (best.relevance > 0.4) {
    return { match: best, confidence: 0.5 };
  }
  
  return { match: null, confidence: 0 };
}

/**
 * Calculate nutrition for given grams
 * @param {Object} per100g - Nutrition per 100g
 * @param {number} grams - Amount in grams
 * @returns {Object} Calculated nutrition
 */
export function calculateNutrition(per100g, grams) {
  const factor = grams / 100;
  return {
    calories: Math.round(per100g.calories * factor),
    protein_g: Math.round(per100g.protein_g * factor * 10) / 10,
    carbs_g: Math.round(per100g.carbs_g * factor * 10) / 10,
    fat_g: Math.round(per100g.fat_g * factor * 10) / 10,
    fiber_g: per100g.fiber_g ? Math.round(per100g.fiber_g * factor * 10) / 10 : null,
    sugar_g: per100g.sugar_g ? Math.round(per100g.sugar_g * factor * 10) / 10 : null,
    sodium_mg: per100g.sodium_mg ? Math.round(per100g.sodium_mg * factor) : null,
  };
}

/**
 * Get all foods in a category
 * @param {string} category - Category name
 * @returns {Array} Foods in category
 */
export function getFoodsByCategory(category) {
  return foodDatabase.foods.filter(f => f.category === category);
}

/**
 * Get popular/common foods (for quick add)
 * @param {number} limit - Max results
 * @returns {Array} Common foods
 */
export function getCommonFoods(limit = 20) {
  const common = [
    'chicken_breast', 'eggs', 'white_rice', 'banana', 'apple',
    'bread_white', 'milk_whole', 'yogurt_greek', 'salmon', 'pasta',
    'broccoli', 'spinach', 'olive_oil', 'cheese_cheddar', 'potato',
    'coffee_black', 'oatmeal', 'almonds', 'avocado', 'chicken_thigh'
  ];
  
  return common
    .map(id => getFoodById(id))
    .filter(Boolean)
    .slice(0, limit);
}

/**
 * Reload database (useful for development)
 */
export function reloadDatabase() {
  loadFoodDatabase();
}

export default {
  searchFoods,
  getNutritionByName,
  getFoodById,
  mapAIFoodToDatabase,
  calculateNutrition,
  getFoodsByCategory,
  getCommonFoods,
  reloadDatabase
};
