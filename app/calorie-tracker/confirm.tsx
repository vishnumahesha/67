// ============================================
// CONFIRM MEAL SCREEN
// Cal AI–style editable items, portion sliders, hidden calories prompts
// ============================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  Layout,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';
import { Button } from '@/components';
import { useCalorieStore } from '@/store/useCalorieStore';
import {
  formatCalories,
  formatMacro,
  formatConfidence,
  getConfidenceColor,
  formatMealType,
  getMealTypeEmoji,
  getFlagLabel,
  shouldShowOilQuestion,
  shouldShowSauceQuestion,
} from '@/src/calorieTracker/helpers';
import type { FoodItemWithNutrition, MealType, FollowUpQuestion } from '@/src/calorieTracker/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// FOOD ITEM ROW COMPONENT
// ============================================
function FoodItemRow({
  item,
  onToggle,
  onUpdateGrams,
  onRemove,
}: {
  item: FoodItemWithNutrition;
  onToggle: () => void;
  onUpdateGrams: (grams: number) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [localGrams, setLocalGrams] = useState(item.grams.toString());
  
  const confidenceColor = getConfidenceColor(item.confidence);
  
  const handleGramsChange = (value: string) => {
    setLocalGrams(value);
    const grams = parseInt(value) || 0;
    if (grams > 0 && grams < 5000) {
      onUpdateGrams(grams);
    }
  };
  
  const handleSliderChange = (value: number) => {
    const grams = Math.round(value);
    setLocalGrams(grams.toString());
    onUpdateGrams(grams);
  };
  
  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOut}
      layout={Layout.springify()}
      style={[styles.itemRow, !item.included && styles.itemRowExcluded]}
    >
      <View style={styles.itemHeader}>
        {/* Checkbox */}
        <TouchableOpacity 
          style={[styles.checkbox, item.included && styles.checkboxChecked]}
          onPress={onToggle}
        >
          {item.included && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>
        
        {/* Name and macros */}
        <TouchableOpacity 
          style={styles.itemInfo}
          onPress={() => setExpanded(!expanded)}
        >
          <View style={styles.itemNameRow}>
            <Text style={[styles.itemName, !item.included && styles.itemNameExcluded]}>
              {item.name}
            </Text>
            <View style={[styles.confidenceBadge, { backgroundColor: `${confidenceColor}20` }]}>
              <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
              <Text style={[styles.confidenceText, { color: confidenceColor }]}>
                {formatConfidence(item.confidence)}
              </Text>
            </View>
          </View>
          
          <View style={styles.itemMacros}>
            <Text style={styles.itemCalories}>{item.calculatedNutrition.calories} cal</Text>
            <Text style={styles.itemMacroText}>
              P: {Math.round(item.calculatedNutrition.protein_g)}g • 
              C: {Math.round(item.calculatedNutrition.carbs_g)}g • 
              F: {Math.round(item.calculatedNutrition.fat_g)}g
            </Text>
          </View>
          
          {/* Flags */}
          {item.flags && item.flags.length > 0 && (
            <View style={styles.flagsRow}>
              {item.flags.slice(0, 2).map(flag => (
                <View key={flag} style={styles.flagBadge}>
                  <Text style={styles.flagText}>{getFlagLabel(flag)}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
        
        {/* Remove button */}
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Text style={styles.removeText}>×</Text>
        </TouchableOpacity>
      </View>
      
      {/* Expanded section with slider */}
      {expanded && item.included && (
        <Animated.View 
          entering={FadeIn}
          style={styles.expandedSection}
        >
          <View style={styles.portionControl}>
            <Text style={styles.portionLabel}>Portion</Text>
            <View style={styles.gramsInput}>
              <TextInput
                style={styles.gramsTextInput}
                value={localGrams}
                onChangeText={handleGramsChange}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Text style={styles.gramsUnit}>g</Text>
            </View>
          </View>
          
          <Slider
            style={styles.slider}
            minimumValue={10}
            maximumValue={Math.max(item.grams * 2, 500)}
            value={item.grams}
            onValueChange={handleSliderChange}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.surfaceLight}
            thumbTintColor={colors.primary}
          />
          
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>Less</Text>
            <Text style={styles.sliderLabel}>More</Text>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// ============================================
// HIDDEN CALORIES QUESTION COMPONENT
// ============================================
function HiddenCaloriesQuestion({
  question,
  selectedOption,
  onSelect,
}: {
  question: FollowUpQuestion;
  selectedOption?: string;
  onSelect: (option: string) => void;
}) {
  return (
    <Animated.View 
      entering={FadeInDown}
      style={styles.questionContainer}
    >
      <View style={styles.questionHeader}>
        <Text style={styles.questionIcon}>⚠️</Text>
        <Text style={styles.questionText}>{question.question}</Text>
      </View>
      <View style={styles.optionsRow}>
        {question.options.map(option => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              selectedOption === option && styles.optionButtonSelected
            ]}
            onPress={() => onSelect(option)}
          >
            <Text style={[
              styles.optionText,
              selectedOption === option && styles.optionTextSelected
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

// ============================================
// MEAL TYPE SELECTOR
// ============================================
function MealTypeSelector({
  selected,
  onSelect,
}: {
  selected: MealType;
  onSelect: (type: MealType) => void;
}) {
  const types: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  return (
    <View style={styles.mealTypeContainer}>
      {types.map(type => (
        <TouchableOpacity
          key={type}
          style={[
            styles.mealTypeButton,
            selected === type && styles.mealTypeButtonSelected
          ]}
          onPress={() => onSelect(type)}
        >
          <Text style={styles.mealTypeEmoji}>{getMealTypeEmoji(type)}</Text>
          <Text style={[
            styles.mealTypeText,
            selected === type && styles.mealTypeTextSelected
          ]}>
            {formatMealType(type)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function ConfirmMealScreen() {
  const router = useRouter();
  const {
    scanPhotoUri,
    scanResult,
    pendingItems,
    pendingAnswers,
    pendingMealType,
    pendingTotals,
    pendingCalorieRange,
    pendingConfidence,
    updatePendingItem,
    removePendingItem,
    setPendingAnswer,
    setPendingMealType,
    recalculatePendingTotals,
    logMeal,
    isLogging,
    clearPendingMeal,
  } = useCalorieStore();
  
  const handleToggleItem = useCallback((id: string) => {
    const item = pendingItems.find(i => i.id === id);
    if (item) {
      updatePendingItem(id, { included: !item.included });
    }
  }, [pendingItems, updatePendingItem]);
  
  const handleUpdateGrams = useCallback((id: string, grams: number) => {
    updatePendingItem(id, { grams });
  }, [updatePendingItem]);
  
  const handleRemoveItem = useCallback((id: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removePendingItem(id) }
      ]
    );
  }, [removePendingItem]);
  
  const handleLog = async () => {
    const includedCount = pendingItems.filter(i => i.included).length;
    
    if (includedCount === 0) {
      Alert.alert('No Items', 'Please include at least one item to log.');
      return;
    }
    
    const mealId = await logMeal();
    
    if (mealId) {
      router.replace('/calorie-tracker');
    } else {
      Alert.alert('Error', 'Failed to log meal. Please try again.');
    }
  };
  
  const handleCancel = () => {
    Alert.alert(
      'Discard Scan?',
      'Your scanned items will not be saved.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => {
            clearPendingMeal();
            router.replace('/calorie-tracker');
          }
        }
      ]
    );
  };
  
  // Build questions based on flags
  const questions: FollowUpQuestion[] = [];
  if (shouldShowOilQuestion(pendingItems)) {
    questions.push({
      key: 'oil_used',
      question: 'Was oil or butter used in cooking?',
      options: ['none', 'a little', 'normal', 'a lot']
    });
  }
  if (shouldShowSauceQuestion(pendingItems)) {
    questions.push({
      key: 'sauce_amount',
      question: 'How much sauce or dressing?',
      options: ['none', 'light', 'normal', 'heavy']
    });
  }
  
  const includedCount = pendingItems.filter(i => i.included).length;
  const confidenceColor = getConfidenceColor(pendingConfidence);
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Meal</Text>
          <View style={{ width: 60 }} />
        </View>
        
        {/* Photo thumbnail */}
        {scanPhotoUri && (
          <Animated.View 
            entering={FadeIn}
            style={styles.photoSection}
          >
            <Image source={{ uri: scanPhotoUri }} style={styles.photoThumb} />
            <View style={styles.photoInfo}>
              <Text style={styles.itemsDetected}>
                {pendingItems.length} items detected
              </Text>
              <View style={[styles.confidenceBadgeLarge, { backgroundColor: `${confidenceColor}15` }]}>
                <Text style={[styles.confidenceTextLarge, { color: confidenceColor }]}>
                  {formatConfidence(pendingConfidence)} confidence
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
        
        {/* Meal type selector */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={styles.sectionTitle}>Meal Type</Text>
          <MealTypeSelector
            selected={pendingMealType}
            onSelect={setPendingMealType}
          />
        </Animated.View>
        
        {/* Detected items */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <View style={styles.itemsHeader}>
            <Text style={styles.sectionTitle}>Detected Items</Text>
            <TouchableOpacity 
              style={styles.addItemButton}
              onPress={() => router.push('/calorie-tracker/manual-add')}
            >
              <Text style={styles.addItemText}>+ Add Item</Text>
            </TouchableOpacity>
          </View>
          
          {pendingItems.length === 0 ? (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyText}>No items detected</Text>
              <TouchableOpacity onPress={() => router.push('/calorie-tracker/manual-add')}>
                <Text style={styles.addManualText}>Add items manually</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {pendingItems.map(item => (
                <FoodItemRow
                  key={item.id}
                  item={item}
                  onToggle={() => handleToggleItem(item.id)}
                  onUpdateGrams={(grams) => handleUpdateGrams(item.id, grams)}
                  onRemove={() => handleRemoveItem(item.id)}
                />
              ))}
            </View>
          )}
        </Animated.View>
        
        {/* Hidden calories questions */}
        {questions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300)}>
            <Text style={styles.sectionTitle}>Hidden Calories</Text>
            <Text style={styles.sectionSubtitle}>
              These affect calorie accuracy
            </Text>
            {questions.map(q => (
              <HiddenCaloriesQuestion
                key={q.key}
                question={q}
                selectedOption={pendingAnswers[q.key]}
                onSelect={(option) => setPendingAnswer(q.key, option)}
              />
            ))}
          </Animated.View>
        )}
        
        {/* Totals card */}
        <Animated.View 
          entering={FadeInDown.delay(400)}
          style={styles.totalsCard}
        >
          <View style={styles.totalCaloriesRow}>
            <View>
              <Text style={styles.totalLabel}>Total Calories</Text>
              <Text style={styles.totalCalories}>{pendingTotals.calories}</Text>
            </View>
            <View style={styles.calorieRange}>
              <Text style={styles.rangeLabel}>Range</Text>
              <Text style={styles.rangeValue}>
                {pendingCalorieRange.min} - {pendingCalorieRange.max}
              </Text>
            </View>
          </View>
          
          <View style={styles.macrosRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(pendingTotals.protein_g)}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(pendingTotals.carbs_g)}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroDivider} />
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{Math.round(pendingTotals.fat_g)}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Suggestions */}
        {scanResult?.suggestedEdits && scanResult.suggestedEdits.length > 0 && (
          <Animated.View 
            entering={FadeInDown.delay(500)}
            style={styles.suggestionsContainer}
          >
            <Text style={styles.suggestionsTitle}>💡 Tips</Text>
            {scanResult.suggestedEdits.map((tip, i) => (
              <Text key={i} style={styles.suggestionText}>• {tip}</Text>
            ))}
          </Animated.View>
        )}
      </ScrollView>
      
      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <Button
          title={`Log ${formatMealType(pendingMealType)} (${includedCount} items)`}
          onPress={handleLog}
          loading={isLogging}
          disabled={includedCount === 0}
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
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
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
  
  // Photo section
  photoSection: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.sm,
  },
  photoInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  itemsDetected: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  confidenceBadgeLarge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  confidenceTextLarge: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Sections
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
  },
  
  // Meal type
  mealTypeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  mealTypeButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealTypeButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  mealTypeEmoji: {
    fontSize: 20,
    marginBottom: spacing.xs,
  },
  mealTypeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  mealTypeTextSelected: {
    color: colors.primary,
  },
  
  // Items
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addItemButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  addItemText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  itemsList: {
    gap: spacing.sm,
  },
  emptyItems: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  addManualText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  
  // Item row
  itemRow: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemRowExcluded: {
    opacity: 0.5,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  itemNameExcluded: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
  },
  itemMacros: {
    marginTop: 4,
  },
  itemCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  itemMacroText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  flagsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  flagBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  flagText: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: '500',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: '300',
    marginTop: -2,
  },
  
  // Expanded section
  expandedSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  portionControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  portionLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  gramsInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
  },
  gramsTextInput: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    width: 60,
    textAlign: 'right',
    paddingVertical: spacing.xs,
  },
  gramsUnit: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: 2,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  
  // Questions
  questionContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  questionIcon: {
    fontSize: 16,
  },
  questionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: colors.text,
  },
  
  // Totals card
  totalsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalCaloriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  totalCalories: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
  },
  calorieRange: {
    alignItems: 'flex-end',
  },
  rangeLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  rangeValue: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  macroLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  macroDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.border,
  },
  
  // Suggestions
  suggestionsContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  suggestionText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
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
