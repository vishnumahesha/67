import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  withDelay,
  withSpring,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { Button, PremiumBanner, GenderSwitch } from '@/components';
import { useAppStore } from '@/store/useAppStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FaceAnalyzerHome() {
  const router = useRouter();
  const {
    scansRemaining,
    canScan,
    premiumEnabled,
    gender,
    setGender,
    resetScansIfNeeded,
  } = useAppStore();

  const titleScale = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const featuresOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);

  React.useEffect(() => {
    resetScansIfNeeded();
    
    titleScale.value = withSpring(1, { damping: 12, stiffness: 80 });
    subtitleOpacity.value = withDelay(200, withSpring(1));
    featuresOpacity.value = withDelay(400, withSpring(1));
    
    // Pulsing glow effect
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, [titleScale, subtitleOpacity, featuresOpacity, glowScale, resetScansIfNeeded]);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
    opacity: titleScale.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const featuresStyle = useAnimatedStyle(() => ({
    opacity: featuresOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  const handleStartScan = () => {
    if (!canScan) {
      router.push('/upgrade');
      return;
    }
    router.push('/capture-front');
  };

  const features = [
    { icon: '🎯', title: 'Overall Rating', desc: 'Get your facial aesthetics score out of 10' },
    { icon: '👁️', title: 'Feature Analysis', desc: 'Detailed breakdown of eyes, nose, lips & more' },
    { icon: '💡', title: 'Improvement Tips', desc: 'Actionable suggestions to enhance your look' },
    { icon: '⚖️', title: 'Facial Harmony', desc: 'Analysis of proportions and symmetry' },
  ];

  const handleCalorieTracker = () => {
    router.push('/calorie-tracker');
  };

  const handleBodyAnalyzer = () => {
    router.push('/body-analyzer');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Background glow */}
        <Animated.View style={[styles.backgroundGlow, glowStyle]} />

        {/* Header */}
        <View style={styles.header}>
          <Animated.View style={[styles.titleContainer, titleStyle]}>
            <Text style={styles.emoji}>✨</Text>
            <Text style={styles.title}>Face Analyzer</Text>
            <Text style={styles.tagline}>AI-Powered Facial Aesthetics</Text>
          </Animated.View>

          <Animated.Text style={[styles.subtitle, subtitleStyle]}>
            Get personalized ratings and improvement suggestions based on your unique features
          </Animated.Text>
        </View>

        {/* Premium/Free Banner */}
        <PremiumBanner
          scansRemaining={scansRemaining}
          isPremium={premiumEnabled}
          onUpgrade={() => router.push('/upgrade')}
        />

        {/* Gender Selection */}
        <View style={styles.genderSection}>
          <Text style={styles.genderLabel}>Analysis Type</Text>
          <GenderSwitch value={gender} onChange={setGender} />
        </View>

        {/* Features */}
        <Animated.View style={[styles.featuresContainer, featuresStyle]}>
          <Text style={styles.featuresTitle}>What You'll Get</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={feature.title} style={styles.featureCard}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* How it works */}
        <View style={styles.howItWorks}>
          <Text style={styles.howTitle}>How It Works</Text>
          <View style={styles.steps}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Take Front Photo</Text>
                <Text style={styles.stepDesc}>Face the camera directly with neutral expression</Text>
              </View>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Add Side Profile</Text>
                <Text style={styles.stepDesc}>Optional but recommended for better accuracy</Text>
              </View>
            </View>
            <View style={styles.stepConnector} />
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Get Results</Text>
                <Text style={styles.stepDesc}>Receive ratings, analysis, and improvement tips</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Body Analyzer Feature */}
        <View style={styles.featureSection}>
          <View style={styles.featureSectionHeader}>
            <Text style={styles.featureSectionEmoji}>🏋️</Text>
            <View>
              <Text style={styles.featureSectionTitle}>Body Analyzer</Text>
              <Text style={styles.featureSectionSubtitle}>Science + Kibbe Typing</Text>
            </View>
          </View>
          <Text style={styles.featureSectionDesc}>
            Get your body aesthetics score, Kibbe body type, personalized workouts, and styling guide
          </Text>
          <View style={styles.featureSectionFeatures}>
            <View style={styles.fsFeature}>
              <Text style={styles.fsFeatureIcon}>📐</Text>
              <Text style={styles.fsFeatureText}>Ratios</Text>
            </View>
            <View style={styles.fsFeature}>
              <Text style={styles.fsFeatureIcon}>🧬</Text>
              <Text style={styles.fsFeatureText}>Kibbe Type</Text>
            </View>
            <View style={styles.fsFeature}>
              <Text style={styles.fsFeatureIcon}>💪</Text>
              <Text style={styles.fsFeatureText}>Workouts</Text>
            </View>
            <View style={styles.fsFeature}>
              <Text style={styles.fsFeatureIcon}>👔</Text>
              <Text style={styles.fsFeatureText}>Styling</Text>
            </View>
          </View>
          <Button
            title="Open Body Analyzer"
            onPress={handleBodyAnalyzer}
            variant="secondary"
            fullWidth
          />
        </View>

        {/* Calorie Tracker Feature */}
        <View style={styles.featureSection}>
          <View style={styles.featureSectionHeader}>
            <Text style={styles.featureSectionEmoji}>🍽️</Text>
            <View>
              <Text style={styles.featureSectionTitle}>Calorie Tracker</Text>
              <Text style={styles.featureSectionSubtitle}>AI-Powered Nutrition</Text>
            </View>
          </View>
          <Text style={styles.featureSectionDesc}>
            Snap a photo of your food and get instant calorie and macro estimates with AI
          </Text>
          <View style={styles.featureSectionFeatures}>
            <View style={styles.fsFeature}>
              <Text style={styles.fsFeatureIcon}>📸</Text>
              <Text style={styles.fsFeatureText}>Photo Scan</Text>
            </View>
            <View style={styles.fsFeature}>
              <Text style={styles.fsFeatureIcon}>📊</Text>
              <Text style={styles.fsFeatureText}>Track Macros</Text>
            </View>
            <View style={styles.fsFeature}>
              <Text style={styles.fsFeatureIcon}>🎯</Text>
              <Text style={styles.fsFeatureText}>Daily Goals</Text>
            </View>
          </View>
          <Button
            title="Open Calorie Tracker"
            onPress={handleCalorieTracker}
            variant="secondary"
            fullWidth
          />
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerIcon}>ℹ️</Text>
          <Text style={styles.disclaimerText}>
            Results are estimated based on general aesthetic guidelines. Beauty is subjective and these ratings don't define your worth.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCta}>
        <Button
          title={canScan ? 'Start Analysis' : 'Upgrade to Scan'}
          onPress={handleStartScan}
          size="large"
          fullWidth
        />
        {!canScan && (
          <Text style={styles.ctaHint}>
            You've used all your free scans today
          </Text>
        )}
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
  backgroundGlow: {
    position: 'absolute',
    top: -100,
    left: SCREEN_WIDTH / 2 - 150,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.lg,
  },
  genderSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  genderLabel: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  featuresContainer: {
    marginTop: spacing.md,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  howItWorks: {
    marginTop: spacing.xl,
  },
  howTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  steps: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  stepDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  stepConnector: {
    width: 2,
    height: 24,
    backgroundColor: colors.surfaceLight,
    marginLeft: 15,
    marginVertical: spacing.xs,
  },
  featureSection: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderAccent,
  },
  featureSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  featureSectionEmoji: {
    fontSize: 36,
  },
  featureSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  featureSectionSubtitle: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  featureSectionDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  featureSectionFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  fsFeature: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  fsFeatureIcon: {
    fontSize: 24,
  },
  fsFeatureText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
  },
  disclaimerIcon: {
    fontSize: 16,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
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
  ctaHint: {
    fontSize: 12,
    color: colors.warning,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
