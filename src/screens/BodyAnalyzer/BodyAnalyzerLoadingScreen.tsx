/**
 * Body Analyzer Loading Screen
 * Shows analysis progress with animated indicators
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  Animated,
} from 'react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface BodyAnalyzerLoadingScreenProps {
  frontPhotoUri: string;
  sidePhotoUri?: string;
  progress: number;
  progressMessage: string;
}

const ANALYSIS_STAGES = [
  { key: 'upload', label: 'Uploading photos...', icon: '📤' },
  { key: 'detect', label: 'Detecting body landmarks...', icon: '🎯' },
  { key: 'ratios', label: 'Calculating structural ratios...', icon: '📐' },
  { key: 'kibbe', label: 'Determining Kibbe body type...', icon: '🧬' },
  { key: 'posture', label: 'Analyzing posture...', icon: '🧘' },
  { key: 'scoring', label: 'Computing scores...', icon: '📊' },
  { key: 'workout', label: 'Generating workout plan...', icon: '🏋️' },
  { key: 'styling', label: 'Creating styling guide...', icon: '👔' },
  { key: 'complete', label: 'Finalizing results...', icon: '✨' },
];

export const BodyAnalyzerLoadingScreen: React.FC<BodyAnalyzerLoadingScreenProps> = ({
  frontPhotoUri,
  sidePhotoUri,
  progress,
  progressMessage,
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Update stage based on progress
    const stageIndex = Math.floor((progress / 100) * ANALYSIS_STAGES.length);
    setCurrentStage(Math.min(stageIndex, ANALYSIS_STAGES.length - 1));
  }, [progress]);

  useEffect(() => {
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    // Rotate animation
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );

    pulse.start();
    rotate.start();

    return () => {
      pulse.stop();
      rotate.stop();
    };
  }, [pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Photo Preview */}
        <View style={styles.photoSection}>
          <Animated.View
            style={[
              styles.photoContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Image source={{ uri: frontPhotoUri }} style={styles.photo} />
            {sidePhotoUri && (
              <View style={styles.sidePhotoOverlay}>
                <Image source={{ uri: sidePhotoUri }} style={styles.sidePhoto} />
              </View>
            )}
            {/* Scanning overlay */}
            <Animated.View
              style={[styles.scanOverlay, { transform: [{ rotate: spin }] }]}
            >
              <View style={styles.scanLine} />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={styles.progressTitle}>Analyzing Your Body</Text>
          <Text style={styles.progressSubtitle}>
            Science-based proportions & Kibbe typing
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[styles.progressBarFill, { width: `${progress}%` }]}
              />
            </View>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
          </View>

          {/* Current Stage */}
          <View style={styles.currentStage}>
            <Text style={styles.stageIcon}>
              {ANALYSIS_STAGES[currentStage]?.icon || '⏳'}
            </Text>
            <Text style={styles.stageText}>
              {progressMessage || ANALYSIS_STAGES[currentStage]?.label || 'Processing...'}
            </Text>
          </View>

          {/* Stage List */}
          <View style={styles.stagesList}>
            {ANALYSIS_STAGES.slice(0, 5).map((stage, index) => {
              const isComplete = index < currentStage;
              const isCurrent = index === currentStage;

              return (
                <View key={stage.key} style={styles.stageItem}>
                  <View
                    style={[
                      styles.stageDot,
                      isComplete && styles.stageDotComplete,
                      isCurrent && styles.stageDotCurrent,
                    ]}
                  >
                    {isComplete && <Text style={styles.checkmark}>✓</Text>}
                    {isCurrent && (
                      <Animated.View
                        style={[
                          styles.stageDotPulse,
                          { transform: [{ scale: pulseAnim }] },
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stageLabel,
                      isComplete && styles.stageLabelComplete,
                      isCurrent && styles.stageLabelCurrent,
                    ]}
                  >
                    {stage.label.replace('...', '')}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            This may take up to 30 seconds depending on photo complexity
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },

  // Photo Section
  photoSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  photoContainer: {
    width: 200,
    height: 280,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  sidePhotoOverlay: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    width: 60,
    height: 80,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.text,
  },
  sidePhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanLine: {
    width: 150,
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.6,
  },

  // Progress Section
  progressSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  progressSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  progressBarContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.md,
    width: 45,
    textAlign: 'right',
  },

  // Current Stage
  currentStage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  stageIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  stageText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },

  // Stages List
  stagesList: {
    width: '100%',
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stageDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotComplete: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stageDotCurrent: {
    borderColor: colors.primary,
  },
  stageDotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  checkmark: {
    fontSize: 10,
    color: colors.background,
    fontWeight: '700',
  },
  stageLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  stageLabelComplete: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  stageLabelCurrent: {
    color: colors.text,
    fontWeight: '500',
  },

  // Info
  infoSection: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default BodyAnalyzerLoadingScreen;
