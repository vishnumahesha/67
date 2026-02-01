/**
 * Body Analyzer Start Screen
 * Introduction and capture guidelines for body analysis
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';
import type { AppearancePresentation } from '@/types/body-analysis';

interface BodyAnalyzerStartScreenProps {
  onStartScan: () => void;
  presentation: AppearancePresentation;
  onPresentationChange: (presentation: AppearancePresentation) => void;
}

interface RuleItemProps {
  icon: string;
  title: string;
  description: string;
}

const RuleItem: React.FC<RuleItemProps> = ({ icon, title, description }) => (
  <View style={styles.ruleItem}>
    <View style={styles.ruleIcon}>
      <Text style={styles.ruleIconText}>{icon}</Text>
    </View>
    <View style={styles.ruleContent}>
      <Text style={styles.ruleTitle}>{title}</Text>
      <Text style={styles.ruleDescription}>{description}</Text>
    </View>
  </View>
);

export const BodyAnalyzerStartScreen: React.FC<BodyAnalyzerStartScreenProps> = ({
  onStartScan,
  presentation,
  onPresentationChange,
}) => {
  const captureRules = [
    {
      icon: '👕',
      title: 'Fitted Clothing',
      description: 'Wear form-fitting clothes to show body shape. Loose clothing reduces accuracy.',
    },
    {
      icon: '📸',
      title: 'Full Body in Frame',
      description: 'Stand back so your entire body from head to toe is visible in the photo.',
    },
    {
      icon: '💡',
      title: 'Good Lighting',
      description: 'Face a window or use soft, even lighting. Avoid harsh shadows.',
    },
    {
      icon: '🧍',
      title: 'Neutral Standing Pose',
      description: 'Stand straight, arms relaxed at sides, feet shoulder-width apart.',
    },
    {
      icon: '↔️',
      title: 'Side Photo (Recommended)',
      description: 'A side view significantly improves posture and proportion analysis.',
    },
    {
      icon: '📐',
      title: 'Avoid Mirror Selfies',
      description: 'Have someone take your photo or use a timer. Mirror selfies cause distortion.',
    },
  ];

  const analysisFeatures = [
    { icon: '📏', title: 'Structural Ratios', desc: 'Shoulder-to-waist, hip ratios & more' },
    { icon: '🧬', title: 'Kibbe Body Type', desc: 'Discover your body type classification' },
    { icon: '🧘', title: 'Posture Analysis', desc: 'Alignment assessment with fixes' },
    { icon: '🏋️', title: 'Workout Plan', desc: 'Personalized exercise recommendations' },
    { icon: '👔', title: 'Styling Guide', desc: 'Clothing recommendations for your type' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Body Analyzer</Text>
          <Text style={styles.subtitle}>
            Science-based proportions & Kibbe body typing with personalized workout and styling recommendations
          </Text>
        </View>

        {/* Presentation Toggle */}
        <View style={styles.presentationSection}>
          <Text style={styles.presentationLabel}>Presentation Style</Text>
          <View style={styles.presentationToggle}>
            <TouchableOpacity
              style={[
                styles.presentationOption,
                presentation === 'male-presenting' && styles.presentationOptionActive,
              ]}
              onPress={() => onPresentationChange('male-presenting')}
            >
              <Text
                style={[
                  styles.presentationOptionText,
                  presentation === 'male-presenting' && styles.presentationOptionTextActive,
                ]}
              >
                Male-Presenting
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.presentationOption,
                presentation === 'female-presenting' && styles.presentationOptionActive,
              ]}
              onPress={() => onPresentationChange('female-presenting')}
            >
              <Text
                style={[
                  styles.presentationOptionText,
                  presentation === 'female-presenting' && styles.presentationOptionTextActive,
                ]}
              >
                Female-Presenting
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.presentationHint}>
            This affects which ideal ratios are used for scoring
          </Text>
        </View>

        {/* What You'll Get */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>What You'll Get</Text>
          <View style={styles.featuresGrid}>
            {analysisFeatures.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDesc}>{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Calibration Note */}
        <View style={styles.calibrationNote}>
          <Text style={styles.calibrationIcon}>📊</Text>
          <View style={styles.calibrationContent}>
            <Text style={styles.calibrationTitle}>Honest Scoring</Text>
            <Text style={styles.calibrationText}>
              Our scoring is calibrated to a realistic distribution (mean ~5.5).
              We avoid inflated scores—a 7+ is genuinely above average (top 30%).
            </Text>
          </View>
        </View>

        {/* Capture Guidelines */}
        <View style={styles.rulesSection}>
          <Text style={styles.sectionTitle}>Capture Guidelines</Text>
          <Text style={styles.sectionSubtitle}>
            Follow these tips for the most accurate analysis
          </Text>

          <View style={styles.rulesList}>
            {captureRules.map((rule, index) => (
              <RuleItem
                key={index}
                icon={rule.icon}
                title={rule.title}
                description={rule.description}
              />
            ))}
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            This analysis is for entertainment and self-improvement purposes only.
            Not medical advice. Results are approximate visual estimates. Consult a
            professional before starting any exercise or nutrition program.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStartScan}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Body Scan</Text>
          <Text style={styles.startButtonIcon}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  // Presentation Toggle
  presentationSection: {
    marginBottom: spacing.xl,
  },
  presentationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  presentationToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 4,
  },
  presentationOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  presentationOptionActive: {
    backgroundColor: colors.primary,
  },
  presentationOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  presentationOptionTextActive: {
    color: colors.background,
  },
  presentationHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  // Features Section
  featuresSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  featuresGrid: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.textMuted,
  },

  // Calibration Note
  calibrationNote: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  calibrationIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  calibrationContent: {
    flex: 1,
  },
  calibrationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  calibrationText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Rules Section
  rulesSection: {
    marginBottom: spacing.xl,
  },
  rulesList: {
    gap: spacing.sm,
  },
  ruleItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ruleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  ruleIconText: {
    fontSize: 18,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
  },
  ruleDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Disclaimer
  disclaimer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 17,
    textAlign: 'center',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.background,
    marginRight: spacing.sm,
  },
  startButtonIcon: {
    fontSize: 18,
    color: colors.background,
  },
});

export default BodyAnalyzerStartScreen;
