// ============================================
// GOALS SCREEN
// Set daily nutrition goals
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { Button } from '@/components';
import { useCalorieStore } from '@/store/useCalorieStore';

export default function GoalsScreen() {
  const router = useRouter();
  const { goals, setGoals } = useCalorieStore();
  
  const [calories, setCalories] = useState(goals.calories.toString());
  const [protein, setProtein] = useState(goals.protein_g.toString());
  const [carbs, setCarbs] = useState(goals.carbs_g.toString());
  const [fat, setFat] = useState(goals.fat_g.toString());
  
  const handleSave = async () => {
    const cals = parseInt(calories) || 2000;
    const prot = parseInt(protein) || 150;
    const carb = parseInt(carbs) || 200;
    const fatG = parseInt(fat) || 65;
    
    if (cals < 1000 || cals > 8000) {
      Alert.alert('Invalid calories', 'Please enter a value between 1000 and 8000');
      return;
    }
    
    await setGoals({
      calories: cals,
      protein_g: prot,
      carbs_g: carb,
      fat_g: fatG,
    });
    
    Alert.alert('Goals Saved', 'Your nutrition goals have been updated.');
    router.back();
  };
  
  const GoalInput = ({ 
    label, 
    value, 
    onChange, 
    unit,
    color,
  }: { 
    label: string; 
    value: string; 
    onChange: (v: string) => void;
    unit: string;
    color: string;
  }) => (
    <Animated.View entering={FadeInDown} style={styles.inputContainer}>
      <View style={styles.inputHeader}>
        <View style={[styles.colorDot, { backgroundColor: color }]} />
        <Text style={styles.inputLabel}>{label}</Text>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          selectTextOnFocus
        />
        <Text style={styles.inputUnit}>{unit}</Text>
      </View>
    </Animated.View>
  );
  
  // Calculate macro percentages
  const totalMacroCals = (parseInt(protein) || 0) * 4 + (parseInt(carbs) || 0) * 4 + (parseInt(fat) || 0) * 9;
  const proteinPct = Math.round(((parseInt(protein) || 0) * 4 / (parseInt(calories) || 2000)) * 100);
  const carbsPct = Math.round(((parseInt(carbs) || 0) * 4 / (parseInt(calories) || 2000)) * 100);
  const fatPct = Math.round(((parseInt(fat) || 0) * 9 / (parseInt(calories) || 2000)) * 100);
  
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
          <Text style={styles.headerTitle}>Daily Goals</Text>
          <View style={{ width: 60 }} />
        </View>
        
        {/* Main goal */}
        <GoalInput
          label="Daily Calories"
          value={calories}
          onChange={setCalories}
          unit="cal"
          color={colors.primary}
        />
        
        {/* Macros */}
        <Text style={styles.sectionTitle}>Macronutrients</Text>
        
        <GoalInput
          label="Protein"
          value={protein}
          onChange={setProtein}
          unit="g"
          color={colors.success}
        />
        
        <GoalInput
          label="Carbohydrates"
          value={carbs}
          onChange={setCarbs}
          unit="g"
          color={colors.warning}
        />
        
        <GoalInput
          label="Fat"
          value={fat}
          onChange={setFat}
          unit="g"
          color={colors.primary}
        />
        
        {/* Macro breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Macro Breakdown</Text>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownPct, { color: colors.success }]}>{proteinPct}%</Text>
              <Text style={styles.breakdownLabel}>Protein</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownPct, { color: colors.warning }]}>{carbsPct}%</Text>
              <Text style={styles.breakdownLabel}>Carbs</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownPct, { color: colors.primary }]}>{fatPct}%</Text>
              <Text style={styles.breakdownLabel}>Fat</Text>
            </View>
          </View>
          <View style={styles.breakdownBar}>
            <View style={[styles.breakdownFill, { flex: proteinPct, backgroundColor: colors.success }]} />
            <View style={[styles.breakdownFill, { flex: carbsPct, backgroundColor: colors.warning }]} />
            <View style={[styles.breakdownFill, { flex: fatPct, backgroundColor: colors.primary }]} />
          </View>
        </View>
        
        {/* Presets */}
        <Text style={styles.sectionTitle}>Quick Presets</Text>
        <View style={styles.presets}>
          <TouchableOpacity 
            style={styles.presetButton}
            onPress={() => {
              setCalories('1500');
              setProtein('120');
              setCarbs('130');
              setFat('50');
            }}
          >
            <Text style={styles.presetTitle}>Weight Loss</Text>
            <Text style={styles.presetCals}>1500 cal</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.presetButton}
            onPress={() => {
              setCalories('2000');
              setProtein('150');
              setCarbs('200');
              setFat('65');
            }}
          >
            <Text style={styles.presetTitle}>Maintain</Text>
            <Text style={styles.presetCals}>2000 cal</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.presetButton}
            onPress={() => {
              setCalories('2500');
              setProtein('180');
              setCarbs('280');
              setFat('80');
            }}
          >
            <Text style={styles.presetTitle}>Muscle Gain</Text>
            <Text style={styles.presetCals}>2500 cal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <View style={styles.bottomCta}>
        <Button
          title="Save Goals"
          onPress={handleSave}
          size="large"
          fullWidth
        />
      </View>
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
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  inputUnit: {
    fontSize: 16,
    color: colors.textMuted,
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownPct: {
    fontSize: 20,
    fontWeight: '700',
  },
  breakdownLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  breakdownBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.surfaceLight,
  },
  breakdownFill: {
    height: '100%',
  },
  presets: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  presetCals: {
    fontSize: 12,
    color: colors.textMuted,
  },
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
