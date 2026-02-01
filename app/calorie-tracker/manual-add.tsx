// ============================================
// MANUAL ADD SCREEN
// Search and add foods manually
// ============================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { Button } from '@/components';
import { useCalorieStore } from '@/store/useCalorieStore';
import { searchFoods } from '@/src/calorieTracker/api';
import { generateItemId, formatMacro } from '@/src/calorieTracker/helpers';
import type { FoodDatabaseEntry, FoodItemWithNutrition } from '@/src/calorieTracker/types';

export default function ManualAddScreen() {
  const router = useRouter();
  const { addPendingItem, pendingItems } = useCalorieStore();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodDatabaseEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodDatabaseEntry | null>(null);
  const [grams, setGrams] = useState('100');
  
  // Debounced search
  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    
    if (text.length < 2) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const foods = await searchFoods(text);
      setResults(foods);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const handleSelectFood = (food: FoodDatabaseEntry) => {
    setSelectedFood(food);
    setQuery(food.name);
    setResults([]);
    
    // Set default portion if available
    if (food.common_portions && food.common_portions[0]) {
      setGrams(food.common_portions[0].grams.toString());
    }
  };
  
  const handleAddFood = () => {
    if (!selectedFood) {
      Alert.alert('Select a food', 'Please search and select a food item first.');
      return;
    }
    
    const gramsNum = parseInt(grams) || 100;
    const factor = gramsNum / 100;
    
    const item: FoodItemWithNutrition = {
      id: generateItemId(),
      name: selectedFood.name,
      description: '',
      estimatedPortion: { quantity: gramsNum, unit: 'grams' },
      grams: gramsNum,
      confidence: 1,
      flags: [],
      included: true,
      nutrition: selectedFood.per_100g,
      calculatedNutrition: {
        calories: Math.round(selectedFood.per_100g.calories * factor),
        protein_g: Math.round(selectedFood.per_100g.protein_g * factor * 10) / 10,
        carbs_g: Math.round(selectedFood.per_100g.carbs_g * factor * 10) / 10,
        fat_g: Math.round(selectedFood.per_100g.fat_g * factor * 10) / 10,
      },
      source: 'manual',
    };
    
    addPendingItem(item);
    
    // If we came from confirm screen, go back there
    if (pendingItems.length > 0) {
      router.back();
    } else {
      // Otherwise go to confirm
      router.push('/calorie-tracker/confirm');
    }
  };
  
  const renderFoodResult = ({ item }: { item: FoodDatabaseEntry }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectFood(item)}
    >
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultMacros}>
          {item.per_100g.calories} cal • P: {item.per_100g.protein_g}g • 
          C: {item.per_100g.carbs_g}g • F: {item.per_100g.fat_g}g per 100g
        </Text>
      </View>
      <Text style={styles.categoryBadge}>{item.category}</Text>
    </TouchableOpacity>
  );
  
  const calculatedCals = selectedFood 
    ? Math.round(selectedFood.per_100g.calories * (parseInt(grams) || 0) / 100)
    : 0;
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Food</Text>
        <View style={{ width: 60 }} />
      </View>
      
      {/* Search input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search foods..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={handleSearch}
          autoFocus
          returnKeyType="search"
        />
        {loading && (
          <ActivityIndicator 
            size="small" 
            color={colors.primary} 
            style={styles.loadingIndicator}
          />
        )}
      </View>
      
      {/* Search results */}
      {results.length > 0 && (
        <Animated.View entering={FadeIn} style={styles.resultsContainer}>
          <FlatList
            data={results}
            renderItem={renderFoodResult}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </Animated.View>
      )}
      
      {/* Selected food details */}
      {selectedFood && results.length === 0 && (
        <Animated.View entering={FadeInDown} style={styles.selectedContainer}>
          <View style={styles.selectedCard}>
            <Text style={styles.selectedName}>{selectedFood.name}</Text>
            <Text style={styles.selectedPer100}>
              Per 100g: {selectedFood.per_100g.calories} cal
            </Text>
            
            {/* Portion input */}
            <View style={styles.portionSection}>
              <Text style={styles.portionLabel}>Amount</Text>
              <View style={styles.portionInput}>
                <TextInput
                  style={styles.gramsInput}
                  value={grams}
                  onChangeText={setGrams}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
                <Text style={styles.gramsUnit}>grams</Text>
              </View>
            </View>
            
            {/* Common portions */}
            {selectedFood.common_portions && selectedFood.common_portions.length > 0 && (
              <View style={styles.commonPortions}>
                <Text style={styles.commonLabel}>Quick select:</Text>
                <View style={styles.portionButtons}>
                  {selectedFood.common_portions.map((portion, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.portionButton}
                      onPress={() => setGrams(portion.grams.toString())}
                    >
                      <Text style={styles.portionButtonText}>
                        {portion.name} ({portion.grams}g)
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            {/* Calculated nutrition */}
            <View style={styles.calculatedSection}>
              <View style={styles.calculatedRow}>
                <Text style={styles.calculatedLabel}>Calories</Text>
                <Text style={styles.calculatedValue}>{calculatedCals}</Text>
              </View>
              <View style={styles.macrosPreview}>
                <View style={styles.macroPreviewItem}>
                  <Text style={styles.macroPreviewValue}>
                    {formatMacro(selectedFood.per_100g.protein_g * (parseInt(grams) || 0) / 100)}
                  </Text>
                  <Text style={styles.macroPreviewLabel}>Protein</Text>
                </View>
                <View style={styles.macroPreviewItem}>
                  <Text style={styles.macroPreviewValue}>
                    {formatMacro(selectedFood.per_100g.carbs_g * (parseInt(grams) || 0) / 100)}
                  </Text>
                  <Text style={styles.macroPreviewLabel}>Carbs</Text>
                </View>
                <View style={styles.macroPreviewItem}>
                  <Text style={styles.macroPreviewValue}>
                    {formatMacro(selectedFood.per_100g.fat_g * (parseInt(grams) || 0) / 100)}
                  </Text>
                  <Text style={styles.macroPreviewLabel}>Fat</Text>
                </View>
              </View>
            </View>
          </View>
          
          <Button
            title="Add to Meal"
            onPress={handleAddFood}
            size="large"
            fullWidth
          />
        </Animated.View>
      )}
      
      {/* Empty state */}
      {!selectedFood && results.length === 0 && query.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>Search for foods</Text>
          <Text style={styles.emptyText}>
            Type to search from 200+ foods in our database
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cancelText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  
  // Search
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingIndicator: {
    position: 'absolute',
    right: spacing.lg + spacing.md,
    top: spacing.md,
  },
  
  // Results
  resultsContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  resultMacros: {
    fontSize: 12,
    color: colors.textMuted,
  },
  categoryBadge: {
    fontSize: 10,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    textTransform: 'capitalize',
  },
  
  // Selected
  selectedContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  selectedCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  selectedPer100: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  
  // Portion
  portionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  portionLabel: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  portionInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
  },
  gramsInput: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    width: 70,
    textAlign: 'right',
    paddingVertical: spacing.sm,
  },
  gramsUnit: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  
  // Common portions
  commonPortions: {
    marginBottom: spacing.lg,
  },
  commonLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  portionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  portionButton: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  portionButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  
  // Calculated
  calculatedSection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  calculatedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  calculatedLabel: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  calculatedValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  macrosPreview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroPreviewItem: {
    alignItems: 'center',
  },
  macroPreviewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  macroPreviewLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  
  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
