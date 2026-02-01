// ============================================
// CALORIE TRACKER HOME SCREEN
// Daily summary, meals list, and scan button
// ============================================

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withDelay,
  FadeInDown,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';
import { Button } from '@/components';
import { useCalorieStore } from '@/store/useCalorieStore';
import { 
  formatCalories, 
  formatMacro, 
  calculateProgress, 
  getProgressColor,
  formatMealType,
  getMealTypeEmoji,
  formatMealTime,
} from '@/src/calorieTracker/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// CIRCULAR PROGRESS COMPONENT
// ============================================
function CircularProgress({ 
  progress, 
  size = 120, 
  strokeWidth = 10,
  color = colors.primary,
  children 
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(progress, 1) * circumference);
  
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={StyleSheet.absoluteFill}>
        <View style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: colors.surfaceLight,
        }} />
      </View>
      <View style={StyleSheet.absoluteFill}>
        <View style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          borderLeftColor: 'transparent',
          borderBottomColor: 'transparent',
          transform: [{ rotate: `${-90 + (progress * 360)}deg` }],
        }} />
      </View>
      {children}
    </View>
  );
}

// ============================================
// MACRO BAR COMPONENT
// ============================================
function MacroBar({ 
  label, 
  current, 
  goal, 
  unit = 'g',
  color 
}: {
  label: string;
  current: number;
  goal: number;
  unit?: string;
  color: string;
}) {
  const progress = calculateProgress(current, goal);
  
  return (
    <View style={styles.macroBar}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>
          {Math.round(current)}<Text style={styles.macroGoal}>/{goal}{unit}</Text>
        </Text>
      </View>
      <View style={styles.macroTrack}>
        <View 
          style={[
            styles.macroFill, 
            { 
              width: `${Math.min(progress * 100, 100)}%`,
              backgroundColor: color,
            }
          ]} 
        />
      </View>
    </View>
  );
}

// ============================================
// MEAL CARD COMPONENT
// ============================================
function MealCard({ meal, onPress }: { meal: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.mealCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.mealCardLeft}>
        <Text style={styles.mealEmoji}>{getMealTypeEmoji(meal.meal_type)}</Text>
        <View>
          <Text style={styles.mealType}>{formatMealType(meal.meal_type)}</Text>
          <Text style={styles.mealTime}>{formatMealTime(meal.eaten_at)}</Text>
        </View>
      </View>
      <View style={styles.mealCardRight}>
        <Text style={styles.mealCalories}>{meal.total_calories}</Text>
        <Text style={styles.mealCaloriesLabel}>cal</Text>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function CalorieTrackerHomeScreen() {
  const router = useRouter();
  const { 
    goals, 
    todayMeals, 
    todayTotals, 
    loadGoals, 
    loadMealHistory,
    refreshTodayData,
    clearPendingMeal,
  } = useCalorieStore();
  
  const [refreshing, setRefreshing] = React.useState(false);
  
  const calorieProgress = calculateProgress(todayTotals.calories, goals.calories);
  const progressColor = getProgressColor(calorieProgress);
  
  // Animation values
  const headerScale = useSharedValue(0);
  
  useEffect(() => {
    loadGoals();
    loadMealHistory();
    clearPendingMeal();
    
    headerScale.value = withSpring(1, { damping: 12 });
  }, []);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshTodayData();
    setRefreshing(false);
  }, [refreshTodayData]);
  
  const handleScanMeal = () => {
    router.push('/calorie-tracker/scan');
  };
  
  const handleMealPress = (mealId: string) => {
    router.push(`/calorie-tracker/meal/${mealId}`);
  };
  
  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
    opacity: headerScale.value,
  }));
  
  const remaining = Math.max(0, goals.calories - todayTotals.calories);
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerEmoji}>🍽️</Text>
          <Text style={styles.title}>Calorie Tracker</Text>
          <Text style={styles.subtitle}>AI-Powered Nutrition</Text>
        </Animated.View>
        
        {/* Calorie Circle */}
        <Animated.View 
          entering={FadeInDown.delay(100).springify()}
          style={styles.calorieSection}
        >
          <View style={styles.calorieCircle}>
            <LinearGradient
              colors={[colors.surface, colors.surfaceLight]}
              style={styles.circleBackground}
            >
              <View style={styles.circleInner}>
                <Text style={styles.calorieValue}>{todayTotals.calories}</Text>
                <Text style={styles.calorieLabel}>eaten</Text>
                <View style={styles.calorieDivider} />
                <Text style={[styles.remainingValue, { color: progressColor }]}>
                  {remaining}
                </Text>
                <Text style={styles.remainingLabel}>remaining</Text>
              </View>
            </LinearGradient>
            <View style={[styles.progressRing, { borderColor: progressColor }]}>
              <View 
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: progressColor,
                    transform: [{ rotate: `${calorieProgress * 360}deg` }],
                  }
                ]}
              />
            </View>
          </View>
          <Text style={styles.goalText}>
            Goal: {formatCalories(goals.calories)} cal
          </Text>
        </Animated.View>
        
        {/* Macros */}
        <Animated.View 
          entering={FadeInDown.delay(200).springify()}
          style={styles.macrosSection}
        >
          <Text style={styles.sectionTitle}>Macros</Text>
          <View style={styles.macrosContainer}>
            <MacroBar
              label="Protein"
              current={todayTotals.protein_g}
              goal={goals.protein_g}
              color={colors.success}
            />
            <MacroBar
              label="Carbs"
              current={todayTotals.carbs_g}
              goal={goals.carbs_g}
              color={colors.warning}
            />
            <MacroBar
              label="Fat"
              current={todayTotals.fat_g}
              goal={goals.fat_g}
              color={colors.primary}
            />
          </View>
        </Animated.View>
        
        {/* Today's Meals */}
        <Animated.View 
          entering={FadeInDown.delay(300).springify()}
          style={styles.mealsSection}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Meals</Text>
            <Text style={styles.mealCount}>
              {todayMeals.length} {todayMeals.length === 1 ? 'meal' : 'meals'}
            </Text>
          </View>
          
          {todayMeals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📷</Text>
              <Text style={styles.emptyText}>No meals logged yet</Text>
              <Text style={styles.emptySubtext}>
                Snap a photo to track your first meal
              </Text>
            </View>
          ) : (
            <View style={styles.mealsList}>
              {todayMeals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onPress={() => handleMealPress(meal.id)}
                />
              ))}
            </View>
          )}
        </Animated.View>
        
        {/* Quick Add Section */}
        <Animated.View 
          entering={FadeInDown.delay(400).springify()}
          style={styles.quickAddSection}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/calorie-tracker/manual-add')}
            >
              <Text style={styles.quickActionIcon}>✏️</Text>
              <Text style={styles.quickActionLabel}>Manual Add</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/calorie-tracker/history')}
            >
              <Text style={styles.quickActionIcon}>📊</Text>
              <Text style={styles.quickActionLabel}>History</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/calorie-tracker/goals')}
            >
              <Text style={styles.quickActionIcon}>🎯</Text>
              <Text style={styles.quickActionLabel}>Goals</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
      
      {/* Scan Button */}
      <View style={styles.bottomCta}>
        <Button
          title="📸  Scan Meal"
          onPress={handleScanMeal}
          size="large"
          fullWidth
        />
      </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: spacing.sm,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  
  // Calorie Circle
  calorieSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  calorieCircle: {
    width: 200,
    height: 200,
    position: 'relative',
  },
  circleBackground: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  circleInner: {
    alignItems: 'center',
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
  },
  calorieLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  calorieDivider: {
    width: 40,
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  remainingValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  remainingLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  progressRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 100,
    borderWidth: 6,
    borderColor: colors.primary,
    opacity: 0.3,
  },
  progressFill: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: -3,
    left: '50%',
    marginLeft: -5,
  },
  goalText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  
  // Macros
  macrosSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  macrosContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  macroBar: {
    gap: spacing.xs,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  macroGoal: {
    color: colors.textMuted,
    fontWeight: '400',
  },
  macroTrack: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  // Meals
  mealsSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mealCount: {
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  mealsList: {
    gap: spacing.sm,
  },
  mealCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mealEmoji: {
    fontSize: 28,
  },
  mealType: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  mealTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  mealCardRight: {
    alignItems: 'flex-end',
  },
  mealCalories: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  mealCaloriesLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  
  // Quick Actions
  quickAddSection: {
    marginBottom: spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  quickActionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  
  // Bottom CTA
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
