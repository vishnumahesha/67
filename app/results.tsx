import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius } from '@/constants/theme';
import {
  DualRatingCircle,
  ConfidenceBadge,
  FeatureCard,
  PhotoQualityWarnings,
  FeatureDetailModal,
  Button,
  AppearanceProfileCard,
} from '@/components';
import { CONFIDENCE_LABELS, SCORE_CONTEXT } from '@/constants';
import { useAppStore } from '@/store/useAppStore';
import { getMockResponse } from '@/data/mock-response';
import type { Feature, Harmony, Hair, Symmetry } from '@/types/face-analysis';

export default function ResultsScreen() {
  const router = useRouter();
  const { analysisResult, premiumEnabled, clearPhotos, analysisError } = useAppStore();

  // Use mock data as fallback
  const result = analysisResult || getMockResponse(premiumEnabled);

  // Modal state
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [selectedHarmony, setSelectedHarmony] = useState<Harmony | null>(null);
  const [selectedHair, setSelectedHair] = useState<Hair | null>(null);
  const [selectedSymmetry, setSelectedSymmetry] = useState<Symmetry | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleFeaturePress = (feature: Feature) => {
    setSelectedFeature(feature);
    setSelectedHarmony(null);
    setSelectedHair(null);
    setSelectedSymmetry(null);
    setModalVisible(true);
  };

  const handleHarmonyPress = () => {
    setSelectedFeature(null);
    setSelectedHarmony(result.harmony);
    setSelectedHair(null);
    setSelectedSymmetry(null);
    setModalVisible(true);
  };

  const handleHairPress = () => {
    setSelectedFeature(null);
    setSelectedHarmony(null);
    setSelectedHair(result.hair);
    setSelectedSymmetry(null);
    setModalVisible(true);
  };

  const handleSymmetryPress = () => {
    setSelectedFeature(null);
    setSelectedHarmony(null);
    setSelectedHair(null);
    setSelectedSymmetry(result.symmetry || null);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedFeature(null);
    setSelectedHarmony(null);
    setSelectedHair(null);
    setSelectedSymmetry(null);
  };

  const handleNewScan = () => {
    clearPhotos();
    router.replace('/');
  };

  const handleUpgrade = () => {
    router.push('/upgrade');
  };

  const overallConfidenceConfig = CONFIDENCE_LABELS[result.overall.confidence];
  const currentScoreContext = SCORE_CONTEXT[Math.round(result.overall.currentScore10) as keyof typeof SCORE_CONTEXT] || 'Average';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleNewScan} style={styles.newScanButton}>
          <Text style={styles.newScanText}>← New Scan</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Results</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Error warning */}
        {analysisError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>
              Analysis had issues. Showing estimated results.
            </Text>
          </View>
        )}

        {/* Overall Rating - Current vs Potential */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.overallSection}>
          <DualRatingCircle
            currentScore={result.overall.currentScore10}
            potentialScore={result.overall.potentialScore10}
          />

          {/* Score context */}
          <View style={styles.scoreContextContainer}>
            <Text style={styles.scoreContextText}>
              {currentScoreContext}
            </Text>
            <View style={styles.confidenceRow}>
              <View style={[styles.confidenceDot, { backgroundColor: overallConfidenceConfig.color }]} />
              <Text style={[styles.confidenceText, { color: overallConfidenceConfig.color }]}>
                {overallConfidenceConfig.label}
              </Text>
            </View>
          </View>

          <Text style={styles.overallSummary}>{result.overall.summary}</Text>

          {/* Calibration note - explains the scoring */}
          {result.overall.calibrationNote && (
            <View style={styles.calibrationNote}>
              <Text style={styles.calibrationIcon}>📊</Text>
              <Text style={styles.calibrationText}>{result.overall.calibrationNote}</Text>
            </View>
          )}
        </Animated.View>

        {/* See Your Best Version CTA - Section 2 */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.bestVersionSection}>
          <TouchableOpacity 
            style={styles.bestVersionCard}
            onPress={() => router.push('/best-version')}
            activeOpacity={0.85}
          >
            <View style={styles.bestVersionGlow} />
            <View style={styles.bestVersionContent}>
              <View style={styles.bestVersionLeft}>
                <Text style={styles.bestVersionIcon}>✨</Text>
                <View>
                  <Text style={styles.bestVersionTitle}>See Your Best Version</Text>
                  <Text style={styles.bestVersionSubtitle}>
                    AI-generated visualization of your potential
                  </Text>
                </View>
              </View>
              <View style={styles.bestVersionArrow}>
                <Text style={styles.bestVersionArrowText}>→</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Appearance Profile & Harmony Index - Section 3 (Collapsible) */}
        <Animated.View entering={FadeIn.delay(350)}>
          <AppearanceProfileCard
            appearanceProfile={result.appearanceProfile}
            harmonyIndex={result.harmonyIndex}
          />
        </Animated.View>

        {/* Photo Quality - Section 4 */}
        <Animated.View entering={FadeIn.delay(500)} style={styles.qualitySection}>
          <ConfidenceBadge
            confidence={result.overall.confidence}
            photoQualityScore={result.photoQuality.score}
          />
          {result.photoQuality.issues.length > 0 && (
            <PhotoQualityWarnings
              issues={result.photoQuality.issues}
              score={result.photoQuality.score}
            />
          )}
          {result.photoQuality.assessmentLimitations && result.photoQuality.assessmentLimitations.length > 0 && (
            <View style={styles.limitationsBox}>
              <Text style={styles.limitationsTitle}>📋 Assessment Limitations</Text>
              {result.photoQuality.assessmentLimitations.map((lim, idx) => (
                <Text key={idx} style={styles.limitationItem}>• {lim}</Text>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Feature Ratings - Section 6 */}
        <View style={styles.featuresSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Feature Breakdown</Text>
            <Text style={styles.sectionSubtitle}>
              Honest ratings with evidence
            </Text>
          </View>

          <View style={styles.featuresGrid}>
            {result.features.map((feature, index) => (
              <Animated.View
                key={feature.key}
                style={styles.featureCardWrapper}
                entering={FadeInDown.delay(600 + index * 60)}
              >
                <FeatureCard
                  featureKey={feature.key}
                  rating={feature.rating10}
                  confidence={feature.confidence}
                  evidence={feature.evidence}
                  strengthsPreview={feature.strengths}
                  holdingBackPreview={feature.holdingBack}
                  photoLimitations={feature.photoLimitations}
                  hasSubFeatures={!!feature.subFeatures && feature.subFeatures.length > 0}
                  onPress={() => handleFeaturePress(feature)}
                  index={index}
                  isPremium={premiumEnabled}
                />
              </Animated.View>
            ))}

            {/* Symmetry Card */}
            {result.symmetry && (
              <Animated.View
                style={styles.featureCardWrapper}
                entering={FadeInDown.delay(600 + result.features.length * 60)}
              >
                <FeatureCard
                  featureKey="symmetry"
                  rating={result.symmetry.rating10}
                  confidence={result.symmetry.confidence}
                  evidence={result.symmetry.evidence}
                  strengthsPreview={result.symmetry.notes}
                  photoLimitations={result.symmetry.photoLimitation ? [result.symmetry.photoLimitation] : []}
                  hasSubFeatures={!!result.symmetry.asymmetries}
                  onPress={handleSymmetryPress}
                  index={result.features.length}
                  isPremium={premiumEnabled}
                />
              </Animated.View>
            )}

            {/* Harmony Card */}
            <Animated.View
              style={styles.featureCardWrapper}
              entering={FadeInDown.delay(600 + (result.features.length + 1) * 60)}
            >
              <FeatureCard
                featureKey="harmony"
                rating={result.harmony.rating10}
                confidence={result.harmony.confidence}
                evidence={result.harmony.evidence}
                strengthsPreview={result.harmony.notes}
                hasSubFeatures={!!result.harmony.facialThirds}
                onPress={handleHarmonyPress}
                index={result.features.length + 1}
                isPremium={premiumEnabled}
              />
            </Animated.View>

            {/* Hair Card */}
            <Animated.View
              style={styles.featureCardWrapper}
              entering={FadeInDown.delay(600 + (result.features.length + 2) * 60)}
            >
              <FeatureCard
                featureKey="hair"
                rating={result.hair.rating10}
                confidence={result.hair.confidence}
                evidence={result.hair.evidence}
                strengthsPreview={result.hair.notes}
                onPress={handleHairPress}
                index={result.features.length + 2}
                isPremium={premiumEnabled}
              />
            </Animated.View>
          </View>
        </View>

        {/* Premium Upsell */}
        {!premiumEnabled && (
          <View style={styles.premiumSection}>
            <View style={styles.premiumCard}>
              <Text style={styles.premiumIcon}>🔓</Text>
              <Text style={styles.premiumTitle}>Unlock Full Potential Analysis</Text>
              <Text style={styles.premiumText}>
                See all {result.potential.deltas.length} improvement levers with detailed timelines, sub-feature breakdowns, and professional options.
              </Text>
              <View style={styles.premiumFeatures}>
                <Text style={styles.premiumFeature}>✓ All improvement deltas ranked by impact</Text>
                <Text style={styles.premiumFeature}>✓ Sub-feature breakdown per category</Text>
                <Text style={styles.premiumFeature}>✓ Professional treatment options (info only)</Text>
                <Text style={styles.premiumFeature}>✓ Ceiling score estimate</Text>
              </View>
              <Button
                title="Upgrade to Premium"
                onPress={handleUpgrade}
                fullWidth
              />
            </View>
          </View>
        )}

        {/* Scoring Context */}
        <View style={styles.scoringContext}>
          <Text style={styles.scoringTitle}>📊 How We Score</Text>
          <Text style={styles.scoringText}>{result.safety.scoringContext}</Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>{result.safety.disclaimer}</Text>
        </View>
      </ScrollView>

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        visible={modalVisible}
        onClose={handleCloseModal}
        feature={selectedFeature}
        harmony={selectedHarmony}
        hair={selectedHair}
        symmetry={selectedSymmetry}
        isPremium={premiumEnabled}
      />
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
    padding: spacing.md,
  },
  newScanButton: {
    paddingVertical: spacing.xs,
  },
  newScanText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 80,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: `${colors.warning}20`,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.warning}40`,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: colors.warning,
  },
  overallSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  scoreContextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  scoreContextText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  overallSummary: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  calibrationNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  calibrationIcon: {
    fontSize: 14,
  },
  calibrationText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  leversSection: {
    marginBottom: spacing.xl,
  },
  qualitySection: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  bestVersionSection: {
    marginBottom: spacing.xl,
  },
  bestVersionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    overflow: 'hidden',
    position: 'relative',
  },
  bestVersionGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    backgroundColor: colors.primary,
    opacity: 0.1,
    borderRadius: 75,
  },
  bestVersionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bestVersionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  bestVersionIcon: {
    fontSize: 32,
  },
  bestVersionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  bestVersionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  bestVersionArrow: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestVersionArrowText: {
    fontSize: 20,
    color: colors.background,
    fontWeight: '700',
  },
  limitationsBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  limitationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  limitationItem: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  featuresSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  featuresGrid: {
    gap: spacing.sm,
  },
  featureCardWrapper: {
    width: '100%',
  },
  deltasSection: {
    marginBottom: spacing.xl,
  },
  deltasList: {
    gap: spacing.sm,
  },
  deltaCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deltaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  deltaLever: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  deltaBadge: {
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  deltaBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.success,
  },
  deltaIssue: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  deltaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deltaTimeline: {
    fontSize: 12,
    color: colors.textMuted,
  },
  deltaDifficulty: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  premiumSection: {
    marginBottom: spacing.xl,
  },
  premiumCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    alignItems: 'center',
  },
  premiumIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  premiumText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  premiumFeatures: {
    alignSelf: 'flex-start',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  premiumFeature: {
    fontSize: 14,
    color: colors.success,
  },
  scoringContext: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  scoringTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  scoringText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  disclaimer: {
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
  },
  disclaimerText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    textAlign: 'center',
  },
});
