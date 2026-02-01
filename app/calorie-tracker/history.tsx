// ============================================
// MEAL HISTORY SCREEN
// View past logged meals
// ============================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { useCalorieStore } from '@/store/useCalorieStore';
import { formatDate, formatMealTime, formatMealType, getMealTypeEmoji } from '@/src/calorieTracker/helpers';
import type { Meal } from '@/src/calorieTracker/types';

export default function HistoryScreen() {
  const router = useRouter();
  const { mealHistory } = useCalorieStore();
  
  // Group meals by date
  const groupedMeals = React.useMemo(() => {
    const groups: { [date: string]: Meal[] } = {};
    
    for (const meal of mealHistory) {
      const date = new Date(meal.eaten_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(meal);
    }
    
    return Object.entries(groups).map(([date, meals]) => ({
      date,
      displayDate: formatDate(meals[0].eaten_at),
      meals,
      totalCalories: meals.reduce((sum, m) => sum + m.total_calories, 0),
    }));
  }, [mealHistory]);
  
  const renderMeal = (meal: Meal) => (
    <TouchableOpacity
      key={meal.id}
      style={styles.mealItem}
      onPress={() => router.push(`/calorie-tracker/meal/${meal.id}`)}
    >
      <View style={styles.mealLeft}>
        <Text style={styles.mealEmoji}>{getMealTypeEmoji(meal.meal_type)}</Text>
        <View>
          <Text style={styles.mealType}>{formatMealType(meal.meal_type)}</Text>
          <Text style={styles.mealTime}>{formatMealTime(meal.eaten_at)}</Text>
        </View>
      </View>
      <View style={styles.mealRight}>
        <Text style={styles.mealCals}>{meal.total_calories}</Text>
        <Text style={styles.mealCalsLabel}>cal</Text>
      </View>
    </TouchableOpacity>
  );
  
  const renderDayGroup = ({ item, index }: { item: typeof groupedMeals[0]; index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 50)}
      style={styles.dayGroup}
    >
      <View style={styles.dayHeader}>
        <Text style={styles.dayDate}>{item.displayDate}</Text>
        <Text style={styles.dayTotal}>{item.totalCalories} cal</Text>
      </View>
      {item.meals.map(renderMeal)}
    </Animated.View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={{ width: 60 }} />
      </View>
      
      {groupedMeals.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No meals logged yet</Text>
          <Text style={styles.emptyText}>
            Start tracking your meals to see your history
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedMeals}
          renderItem={renderDayGroup}
          keyExtractor={(item) => item.date}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
  listContent: {
    padding: spacing.lg,
  },
  dayGroup: {
    marginBottom: spacing.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dayTotal: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mealEmoji: {
    fontSize: 24,
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
  mealRight: {
    alignItems: 'flex-end',
  },
  mealCals: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  mealCalsLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
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
