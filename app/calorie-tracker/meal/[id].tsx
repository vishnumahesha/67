// ============================================
// MEAL DETAIL SCREEN
// View and edit a logged meal
// ============================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { useCalorieStore } from '@/store/useCalorieStore';
import { 
  formatMealType, 
  getMealTypeEmoji, 
  formatMealTime,
  formatDate,
  formatConfidence,
  getConfidenceColor 
} from '@/src/calorieTracker/helpers';

export default function MealDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { mealHistory } = useCalorieStore();
  
  const meal = mealHistory.find(m => m.id === id);
  
  if (!meal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🤷</Text>
          <Text style={styles.emptyTitle}>Meal not found</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const confidenceColor = meal.confidence ? getConfidenceColor(meal.confidence) : colors.textMuted;
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Meal Details</Text>
          <View style={{ width: 60 }} />
        </View>
        
        {/* Meal header card */}
        <Animated.View entering={FadeIn} style={styles.mealHeader}>
          <View style={styles.mealHeaderTop}>
            <Text style={styles.mealEmoji}>{getMealTypeEmoji(meal.meal_type)}</Text>
            <View style={styles.mealHeaderInfo}>
              <Text style={styles.mealType}>{formatMealType(meal.meal_type)}</Text>
              <Text style={styles.mealDate}>
                {formatDate(meal.eaten_at)} at {formatMealTime(meal.eaten_at)}
              </Text>
            </View>
          </View>
          
          {/* Photo if available */}
          {meal.photo_url && (
            <Image source={{ uri: meal.photo_url }} style={styles.mealPhoto} />
          )}
        </Animated.View>
        
        {/* Calories card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.caloriesCard}>
          <View style={styles.caloriesMain}>
            <Text style={styles.caloriesValue}>{meal.total_calories}</Text>
            <Text style={styles.caloriesLabel}>calories</Text>
          </View>
          
          {meal.calorie_min && meal.calorie_max && (
            <View style={styles.caloriesRange}>
              <Text style={styles.rangeLabel}>Range</Text>
              <Text style={styles.rangeValue}>
                {meal.calorie_min} - {meal.calorie_max}
              </Text>
            </View>
          )}
          
          {meal.confidence !== undefined && (
            <View style={[styles.confidenceBadge, { backgroundColor: `${confidenceColor}15` }]}>
              <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                {formatConfidence(meal.confidence)} confidence
              </Text>
            </View>
          )}
        </Animated.View>
        
        {/* Macros */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.macrosCard}>
          <Text style={styles.sectionTitle}>Macronutrients</Text>
          <View style={styles.macrosRow}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: colors.success }]}>
                {Math.round(meal.total_protein_g)}g
              </Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: colors.warning }]}>
                {Math.round(meal.total_carbs_g)}g
              </Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={[styles.macroValue, { color: colors.primary }]}>
                {Math.round(meal.total_fat_g)}g
              </Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Items list */}
        {meal.items && meal.items.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300)}>
            <Text style={styles.sectionTitle}>Items ({meal.items.length})</Text>
            <View style={styles.itemsList}>
              {meal.items.map((item, index) => (
                <Animated.View 
                  key={item.id}
                  entering={FadeInDown.delay(350 + index * 50)}
                  style={styles.itemRow}
                >
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPortion}>
                      {item.grams}g • {item.quantity} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.itemNutrition}>
                    <Text style={styles.itemCals}>{item.calories} cal</Text>
                    <Text style={styles.itemMacros}>
                      P: {Math.round(item.protein_g)}g • C: {Math.round(item.carbs_g)}g • F: {Math.round(item.fat_g)}g
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}
        
        {/* Notes */}
        {meal.notes && (
          <Animated.View entering={FadeInDown.delay(400)} style={styles.notesCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{meal.notes}</Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  
  // Meal header
  mealHeader: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  mealEmoji: {
    fontSize: 40,
  },
  mealHeaderInfo: {
    flex: 1,
  },
  mealType: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  mealDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  mealPhoto: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  
  // Calories
  caloriesCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  caloriesMain: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  caloriesValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
  },
  caloriesLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  caloriesRange: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  rangeLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  rangeValue: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  confidenceBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Macros
  macrosCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  macroLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  macroDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.border,
  },
  
  // Items
  itemsList: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  itemPortion: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemNutrition: {
    alignItems: 'flex-end',
  },
  itemCals: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  itemMacros: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  
  // Notes
  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  
  // Empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
});
