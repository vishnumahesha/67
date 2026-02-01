/**
 * Body Analyzer Results Screen
 * Comprehensive results with tabs for Overview, Features, Workout, and Styling
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '@/constants/theme';
import type {
  BodyAnalysisResponse,
  BodyFeature,
  KibbeType,
} from '@/types/body-analysis';
import { KibbeMetadata, BODY_SCORE_CONTEXT, BODY_FEATURE_METADATA } from '@/types/body-analysis';

const { width } = Dimensions.get('window');

// ============ TYPES ============

type Tab = 'overview' | 'features' | 'workout' | 'styling';

interface BodyAnalyzerResultsScreenProps {
  result: BodyAnalysisResponse;
  onNewScan: () => void;
  isPremium: boolean;
  onUpgrade?: () => void;
}

// ============ SCORE RING COMPONENT ============

const ScoreRing: React.FC<{
  current: number;
  potential: { min: number; max: number };
  size?: number;
}> = ({ current, potential, size = 160 }) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const currentProgress = (current / 10) * circumference;
  const potentialProgress = (potential.max / 10) * circumference;

  return (
    <View style={[styles.scoreRingContainer, { width: size, height: size }]}>
      <View style={styles.scoreRingCenter}>
        <Text style={styles.scoreRingCurrent}>{current.toFixed(1)}</Text>
        <Text style={styles.scoreRingLabel}>Current</Text>
        <View style={styles.scoreRingDivider} />
        <Text style={styles.scoreRingPotential}>
          {potential.min.toFixed(1)} - {potential.max.toFixed(1)}
        </Text>
        <Text style={styles.scoreRingPotentialLabel}>Potential</Text>
      </View>
    </View>
  );
};

// ============ RATIO BAR COMPONENT ============

const RatioBar: React.FC<{
  label: string;
  value: number;
  idealMin: number;
  idealMax: number;
  status: 'below' | 'ideal' | 'above';
  confidence: string;
}> = ({ label, value, idealMin, idealMax, status, confidence }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'ideal':
        return colors.success;
      case 'below':
        return colors.warning;
      case 'above':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'ideal':
        return '✓ Ideal';
      case 'below':
        return '↓ Below ideal';
      case 'above':
        return '↑ Above ideal';
      default:
        return '';
    }
  };

  return (
    <View style={styles.ratioBar}>
      <View style={styles.ratioBarHeader}>
        <Text style={styles.ratioBarLabel}>{label}</Text>
        <Text style={[styles.ratioBarStatus, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
      <View style={styles.ratioBarValues}>
        <Text style={styles.ratioBarValue}>{value.toFixed(2)}</Text>
        <Text style={styles.ratioBarIdeal}>
          Ideal: {idealMin.toFixed(2)} - {idealMax.toFixed(2)}
        </Text>
      </View>
      <View style={styles.ratioBarTrack}>
        <View style={styles.ratioBarIdealZone} />
        <View
          style={[
            styles.ratioBarMarker,
            { left: `${Math.min(Math.max((value / (idealMax * 1.3)) * 100, 5), 95)}%` },
            { backgroundColor: getStatusColor() },
          ]}
        />
      </View>
    </View>
  );
};

// ============ FEATURE CARD COMPONENT ============

const FeatureCard: React.FC<{
  feature: BodyFeature;
  index: number;
  onPress: () => void;
}> = ({ feature, index, onPress }) => {
  const metadata = BODY_FEATURE_METADATA[feature.key] || {
    icon: '📊',
    label: feature.label,
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return colors.success;
    if (score >= 5) return colors.warning;
    return colors.error;
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80)}>
      <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.featureCardHeader}>
          <Text style={styles.featureCardIcon}>{metadata.icon}</Text>
          <View style={styles.featureCardTitleSection}>
            <Text style={styles.featureCardTitle}>{feature.label}</Text>
            <Text style={styles.featureCardConfidence}>{feature.confidence} confidence</Text>
          </View>
          <View style={[styles.featureCardScore, { backgroundColor: `${getScoreColor(feature.rating10)}20` }]}>
            <Text style={[styles.featureCardScoreText, { color: getScoreColor(feature.rating10) }]}>
              {feature.rating10.toFixed(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.featureCardSummary} numberOfLines={2}>
          {feature.summary}
        </Text>
        {feature.fixes && feature.fixes.length > 0 && (
          <View style={styles.featureCardFixes}>
            <Text style={styles.featureCardFixesLabel}>
              {feature.fixes.length} improvement{feature.fixes.length > 1 ? 's' : ''} available →
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============ EXERCISE CARD COMPONENT ============

const ExerciseCard: React.FC<{
  exercise: {
    name: string;
    targetArea: string;
    sets: string;
    reps: string;
    notes: string;
    priority: string;
  };
  index: number;
}> = ({ exercise, index }) => {
  const getPriorityColor = () => {
    switch (exercise.priority) {
      case 'essential':
        return colors.primary;
      case 'recommended':
        return colors.success;
      default:
        return colors.textMuted;
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60)} style={styles.exerciseCard}>
      <View style={styles.exerciseCardHeader}>
        <View style={[styles.exercisePriorityBadge, { backgroundColor: `${getPriorityColor()}20` }]}>
          <Text style={[styles.exercisePriorityText, { color: getPriorityColor() }]}>
            {exercise.priority}
          </Text>
        </View>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
      </View>
      <Text style={styles.exerciseTarget}>{exercise.targetArea}</Text>
      <View style={styles.exerciseDetails}>
        <View style={styles.exerciseDetailItem}>
          <Text style={styles.exerciseDetailLabel}>Sets</Text>
          <Text style={styles.exerciseDetailValue}>{exercise.sets}</Text>
        </View>
        <View style={styles.exerciseDetailItem}>
          <Text style={styles.exerciseDetailLabel}>Reps</Text>
          <Text style={styles.exerciseDetailValue}>{exercise.reps}</Text>
        </View>
      </View>
      <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
    </Animated.View>
  );
};

// ============ CLOTHING CARD COMPONENT ============

const ClothingCard: React.FC<{
  item: {
    category: string;
    recommendations: string[];
    avoid: string[];
    why: string;
  };
  index: number;
}> = ({ item, index }) => {
  const getCategoryIcon = () => {
    switch (item.category) {
      case 'tops':
        return '👕';
      case 'bottoms':
        return '👖';
      case 'outerwear':
        return '🧥';
      case 'dresses':
        return '👗';
      case 'suits':
        return '🤵';
      case 'accessories':
        return '⌚';
      default:
        return '👔';
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 80)} style={styles.clothingCard}>
      <View style={styles.clothingCardHeader}>
        <Text style={styles.clothingCardIcon}>{getCategoryIcon()}</Text>
        <Text style={styles.clothingCardCategory}>
          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
        </Text>
      </View>
      
      <View style={styles.clothingSection}>
        <Text style={styles.clothingSectionTitle}>✓ Recommended</Text>
        {item.recommendations.map((rec, idx) => (
          <Text key={idx} style={styles.clothingItem}>• {rec}</Text>
        ))}
      </View>

      <View style={styles.clothingSection}>
        <Text style={[styles.clothingSectionTitle, { color: colors.error }]}>✕ Avoid</Text>
        {item.avoid.map((av, idx) => (
          <Text key={idx} style={[styles.clothingItem, { color: colors.textMuted }]}>• {av}</Text>
        ))}
      </View>

      <Text style={styles.clothingWhy}>{item.why}</Text>
    </Animated.View>
  );
};

// ============ MAIN COMPONENT ============

export const BodyAnalyzerResultsScreen: React.FC<BodyAnalyzerResultsScreenProps> = ({
  result,
  onNewScan,
  isPremium,
  onUpgrade,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedFeature, setSelectedFeature] = useState<BodyFeature | null>(null);

  const kibbeType = result.kibbeAssessment.primaryType as KibbeType;
  const kibbeMeta = KibbeMetadata[kibbeType];
  const scoreContext = BODY_SCORE_CONTEXT[Math.round(result.overall.currentScore10)] || 'Average';

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'features', label: 'Features', icon: '🎯' },
    { key: 'workout', label: 'Workout', icon: '🏋️' },
    { key: 'styling', label: 'Styling', icon: '👔' },
  ];

  // ============ TAB CONTENT ============

  const renderOverviewTab = () => (
    <>
      {/* Score Section */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.scoreSection}>
        <ScoreRing
          current={result.overall.currentScore10}
          potential={result.overall.potentialScoreRange}
        />
        <Text style={styles.scoreContext}>{scoreContext}</Text>
        <Text style={styles.scoreSummary}>{result.overall.summary}</Text>
        <View style={styles.calibrationNote}>
          <Text style={styles.calibrationIcon}>📊</Text>
          <Text style={styles.calibrationText}>{result.overall.calibrationNote}</Text>
        </View>
      </Animated.View>

      {/* Kibbe Type */}
      <Animated.View entering={FadeIn.delay(200)} style={styles.kibbeSection}>
        <View style={styles.kibbeHeader}>
          <Text style={styles.kibbeIcon}>{kibbeMeta?.icon || '🧬'}</Text>
          <View style={styles.kibbeTitleSection}>
            <Text style={styles.kibbeLabel}>Kibbe Body Type</Text>
            <Text style={styles.kibbeType}>{kibbeMeta?.label || kibbeType}</Text>
          </View>
          <View style={styles.kibbeConfidence}>
            <Text style={styles.kibbeConfidenceText}>
              {result.kibbeAssessment.confidence} confidence
            </Text>
          </View>
        </View>
        <Text style={styles.kibbeDescription}>
          {kibbeMeta?.description || 'Body type classification based on bone structure and flesh characteristics.'}
        </Text>
        
        {/* Yin/Yang Balance */}
        <View style={styles.yinYangSection}>
          <Text style={styles.yinYangLabel}>Yin/Yang Balance</Text>
          <View style={styles.yinYangBar}>
            <View
              style={[
                styles.yinYangYin,
                { width: `${result.kibbeAssessment.yinYangBalance.yin}%` },
              ]}
            />
            <View
              style={[
                styles.yinYangYang,
                { width: `${result.kibbeAssessment.yinYangBalance.yang}%` },
              ]}
            />
          </View>
          <View style={styles.yinYangLabels}>
            <Text style={styles.yinYangLabelText}>
              Yin {result.kibbeAssessment.yinYangBalance.yin}%
            </Text>
            <Text style={styles.yinYangLabelText}>
              Yang {result.kibbeAssessment.yinYangBalance.yang}%
            </Text>
          </View>
        </View>

        {/* Dominant Traits */}
        <View style={styles.dominantTraits}>
          <Text style={styles.dominantTraitsLabel}>Dominant Traits</Text>
          {result.kibbeAssessment.dominantTraits.map((trait, idx) => (
            <Text key={idx} style={styles.dominantTraitItem}>• {trait}</Text>
          ))}
        </View>
      </Animated.View>

      {/* Top Levers */}
      <Animated.View entering={FadeIn.delay(300)} style={styles.leversSection}>
        <Text style={styles.sectionTitle}>Top Improvement Levers</Text>
        <Text style={styles.sectionSubtitle}>
          Combined potential: +{result.potential.totalPossibleGain.min.toFixed(1)} to +{result.potential.totalPossibleGain.max.toFixed(1)} points
        </Text>
        {result.potential.top3Levers.map((lever, index) => (
          <View key={lever.lever} style={styles.leverCard}>
            <View style={styles.leverHeader}>
              <View style={styles.leverPriority}>
                <Text style={styles.leverPriorityText}>#{index + 1}</Text>
              </View>
              <View style={styles.leverTitleSection}>
                <Text style={styles.leverTitle}>{lever.title}</Text>
                <Text style={styles.leverTimeline}>⏱️ {lever.timeline}</Text>
              </View>
              <View style={styles.leverDelta}>
                <Text style={styles.leverDeltaText}>
                  +{lever.deltaMin.toFixed(1)}-{lever.deltaMax.toFixed(1)}
                </Text>
              </View>
            </View>
            <Text style={styles.leverWhy}>{lever.why}</Text>
            <View style={styles.leverActions}>
              {lever.actions.slice(0, 3).map((action, idx) => (
                <Text key={idx} style={styles.leverAction}>• {action}</Text>
              ))}
            </View>
          </View>
        ))}
      </Animated.View>

      {/* Structural Ratios */}
      <Animated.View entering={FadeIn.delay(400)} style={styles.ratiosSection}>
        <Text style={styles.sectionTitle}>Structural Ratios</Text>
        <RatioBar
          label="Shoulder-to-Waist"
          value={result.structuralRatios.shoulderToWaist.value}
          idealMin={result.structuralRatios.shoulderToWaist.idealMin}
          idealMax={result.structuralRatios.shoulderToWaist.idealMax}
          status={result.structuralRatios.shoulderToWaist.status}
          confidence={result.structuralRatios.shoulderToWaist.confidence}
        />
        <RatioBar
          label="Waist-to-Hip"
          value={result.structuralRatios.waistToHip.value}
          idealMin={result.structuralRatios.waistToHip.idealMin}
          idealMax={result.structuralRatios.waistToHip.idealMax}
          status={result.structuralRatios.waistToHip.status}
          confidence={result.structuralRatios.waistToHip.confidence}
        />
        <RatioBar
          label="Leg-to-Torso"
          value={result.structuralRatios.legToTorso.value}
          idealMin={result.structuralRatios.legToTorso.idealMin}
          idealMax={result.structuralRatios.legToTorso.idealMax}
          status={result.structuralRatios.legToTorso.status}
          confidence={result.structuralRatios.legToTorso.confidence}
        />
      </Animated.View>
    </>
  );

  const renderFeaturesTab = () => (
    <>
      <Text style={styles.sectionTitle}>Feature Breakdown</Text>
      <Text style={styles.sectionSubtitle}>Tap any feature for detailed fixes</Text>
      {result.features.map((feature, index) => (
        <FeatureCard
          key={feature.key}
          feature={feature}
          index={index}
          onPress={() => setSelectedFeature(feature)}
        />
      ))}
    </>
  );

  const renderWorkoutTab = () => (
    <>
      <Text style={styles.sectionTitle}>Your Workout Plan</Text>
      <Text style={styles.sectionSubtitle}>
        Personalized for your body analysis results
      </Text>

      {/* Focus Areas */}
      <View style={styles.focusAreasCard}>
        <Text style={styles.focusAreasTitle}>🎯 Focus Areas</Text>
        <View style={styles.focusAreasTags}>
          {result.workoutPlan.focusAreas.map((area, idx) => (
            <View key={idx} style={styles.focusAreaTag}>
              <Text style={styles.focusAreaTagText}>{area}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Split & Frequency */}
      <View style={styles.workoutMeta}>
        <View style={styles.workoutMetaItem}>
          <Text style={styles.workoutMetaLabel}>Frequency</Text>
          <Text style={styles.workoutMetaValue}>{result.workoutPlan.weeklyFrequency}</Text>
        </View>
        <View style={styles.workoutMetaItem}>
          <Text style={styles.workoutMetaLabel}>Split</Text>
          <Text style={styles.workoutMetaValue}>{result.workoutPlan.splitSuggestion}</Text>
        </View>
      </View>

      {/* Exercises */}
      <Text style={styles.exercisesTitle}>Exercises</Text>
      {result.workoutPlan.exercises.map((exercise, index) => (
        <ExerciseCard key={exercise.name} exercise={exercise} index={index} />
      ))}

      {/* Cardio */}
      {result.workoutPlan.cardioRecommendation && (
        <View style={styles.cardioCard}>
          <Text style={styles.cardioTitle}>🏃 Cardio Recommendation</Text>
          <Text style={styles.cardioText}>{result.workoutPlan.cardioRecommendation}</Text>
        </View>
      )}

      {/* Mobility */}
      <View style={styles.mobilityCard}>
        <Text style={styles.mobilityTitle}>🧘 Mobility Work</Text>
        {result.workoutPlan.mobilityWork.map((item, idx) => (
          <Text key={idx} style={styles.mobilityItem}>• {item}</Text>
        ))}
      </View>

      {/* Timeline */}
      <View style={styles.timelineCard}>
        <Text style={styles.timelineTitle}>⏱️ Expected Results</Text>
        <Text style={styles.timelineText}>{result.workoutPlan.estimatedResultsTimeline}</Text>
      </View>
    </>
  );

  const renderStylingTab = () => (
    <>
      <Text style={styles.sectionTitle}>Your Styling Guide</Text>
      <Text style={styles.sectionSubtitle}>
        Based on your {kibbeMeta?.label || kibbeType} body type
      </Text>

      {/* Kibbe Style Summary */}
      <View style={styles.stylesSummaryCard}>
        <Text style={styles.stylesSummaryIcon}>{kibbeMeta?.icon || '👔'}</Text>
        <Text style={styles.stylesSummaryText}>{result.stylingGuide.kibbeStyleSummary}</Text>
      </View>

      {/* Silhouette Principle */}
      <View style={styles.silhouetteCard}>
        <Text style={styles.silhouetteTitle}>📐 Silhouette Principle</Text>
        <Text style={styles.silhouetteText}>{result.stylingGuide.silhouettePrinciple}</Text>
      </View>

      {/* Clothing Recommendations */}
      <Text style={styles.clothingTitle}>Clothing by Category</Text>
      {result.stylingGuide.clothingRecommendations.map((item, index) => (
        <ClothingCard key={item.category} item={item} index={index} />
      ))}

      {/* Fabric & Pattern Advice */}
      <View style={styles.adviceSection}>
        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>🧵 Fabrics</Text>
          {result.stylingGuide.fabricAdvice.map((advice, idx) => (
            <Text key={idx} style={styles.adviceItem}>• {advice}</Text>
          ))}
        </View>
        <View style={styles.adviceCard}>
          <Text style={styles.adviceTitle}>🎨 Patterns</Text>
          {result.stylingGuide.patternAdvice.map((advice, idx) => (
            <Text key={idx} style={styles.adviceItem}>• {advice}</Text>
          ))}
        </View>
      </View>

      {/* Accessory Tips */}
      <View style={styles.accessoriesCard}>
        <Text style={styles.accessoriesTitle}>⌚ Accessory Tips</Text>
        {result.stylingGuide.accessoryTips.map((tip, idx) => (
          <Text key={idx} style={styles.accessoryItem}>• {tip}</Text>
        ))}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onNewScan} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>← New Scan</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Body Analysis</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'features' && renderFeaturesTab()}
        {activeTab === 'workout' && renderWorkoutTab()}
        {activeTab === 'styling' && renderStylingTab()}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>{result.safety.disclaimer}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============ STYLES ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerButton: {
    paddingVertical: spacing.xs,
  },
  headerButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerPlaceholder: {
    width: 80,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: `${colors.primary}20`,
  },
  tabIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: colors.primary,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  // Section Titles
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },

  // Score Section
  scoreSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  scoreRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 4,
    borderColor: colors.primary,
    borderRadius: 80,
  },
  scoreRingCenter: {
    alignItems: 'center',
  },
  scoreRingCurrent: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
  },
  scoreRingLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  scoreRingDivider: {
    width: 40,
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  scoreRingPotential: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
  },
  scoreRingPotentialLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  scoreContext: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  scoreSummary: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  calibrationNote: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calibrationIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  calibrationText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },

  // Kibbe Section
  kibbeSection: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  kibbeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  kibbeIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  kibbeTitleSection: {
    flex: 1,
  },
  kibbeLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  kibbeType: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  kibbeConfidence: {
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  kibbeConfidenceText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '500',
  },
  kibbeDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  yinYangSection: {
    marginBottom: spacing.md,
  },
  yinYangLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  yinYangBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  yinYangYin: {
    backgroundColor: colors.accent,
  },
  yinYangYang: {
    backgroundColor: colors.primary,
  },
  yinYangLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yinYangLabelText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  dominantTraits: {
    marginTop: spacing.sm,
  },
  dominantTraitsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  dominantTraitItem: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },

  // Levers Section
  leversSection: {
    marginBottom: spacing.xl,
  },
  leverCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  leverPriority: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  leverPriorityText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.background,
  },
  leverTitleSection: {
    flex: 1,
  },
  leverTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  leverTimeline: {
    fontSize: 12,
    color: colors.textMuted,
  },
  leverDelta: {
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  leverDeltaText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  leverWhy: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 19,
  },
  leverActions: {
    marginTop: spacing.xs,
  },
  leverAction: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },

  // Ratios Section
  ratiosSection: {
    marginBottom: spacing.xl,
  },
  ratioBar: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  ratioBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ratioBarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  ratioBarStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  ratioBarValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  ratioBarValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  ratioBarIdeal: {
    fontSize: 12,
    color: colors.textMuted,
  },
  ratioBarTrack: {
    height: 6,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 3,
    position: 'relative',
  },
  ratioBarIdealZone: {
    position: 'absolute',
    left: '30%',
    right: '30%',
    top: 0,
    bottom: 0,
    backgroundColor: `${colors.success}30`,
    borderRadius: 3,
  },
  ratioBarMarker: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    top: -3,
    marginLeft: -6,
  },

  // Feature Card
  featureCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureCardIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  featureCardTitleSection: {
    flex: 1,
  },
  featureCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  featureCardConfidence: {
    fontSize: 11,
    color: colors.textMuted,
  },
  featureCardScore: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  featureCardScoreText: {
    fontSize: 16,
    fontWeight: '700',
  },
  featureCardSummary: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  featureCardFixes: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  featureCardFixesLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },

  // Workout Tab
  focusAreasCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  focusAreasTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  focusAreasTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  focusAreaTag: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  focusAreaTagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  workoutMetaItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  workoutMetaLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  workoutMetaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  exercisesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  exercisePriorityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  exercisePriorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  exerciseTarget: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  exerciseDetailItem: {},
  exerciseDetailLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  exerciseDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  exerciseNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  cardioCard: {
    backgroundColor: `${colors.success}10`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  cardioTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    marginBottom: spacing.xs,
  },
  cardioText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  mobilityCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  mobilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  mobilityItem: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  timelineCard: {
    backgroundColor: `${colors.primary}10`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  timelineText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Styling Tab
  stylesSummaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    alignItems: 'center',
  },
  stylesSummaryIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  stylesSummaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  silhouetteCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  silhouetteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  silhouetteText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  clothingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  clothingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  clothingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  clothingCardIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  clothingCardCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  clothingSection: {
    marginBottom: spacing.sm,
  },
  clothingSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    marginBottom: 4,
  },
  clothingItem: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  clothingWhy: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  adviceSection: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  adviceCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  adviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  adviceItem: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  accessoriesCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  accessoriesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  accessoryItem: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },

  // Disclaimer
  disclaimer: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
});

export default BodyAnalyzerResultsScreen;
