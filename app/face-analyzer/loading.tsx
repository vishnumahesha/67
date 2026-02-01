/**
 * Face Analyzer Loading Screen
 * Shows progress: Uploading -> Analyzing -> Building Plan
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0a0a0f',
  surface: '#12121a',
  surfaceLight: '#1a1a24',
  border: '#2a2a3a',
  primary: '#6366f1',
  accent: '#22d3ee',
  success: '#10b981',
  warning: '#f59e0b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
};

interface LoadingStage {
  key: string;
  label: string;
  sublabel: string;
  icon: keyof typeof Ionicons.glyphMap;
  duration: number;
}

const STAGES: LoadingStage[] = [
  {
    key: 'uploading',
    label: 'Uploading Photos',
    sublabel: 'Securing your images...',
    icon: 'cloud-upload-outline',
    duration: 1500,
  },
  {
    key: 'detecting',
    label: 'Detecting Landmarks',
    sublabel: 'Finding facial features...',
    icon: 'scan-outline',
    duration: 2000,
  },
  {
    key: 'measuring',
    label: 'Measuring Proportions',
    sublabel: 'Calculating ratios...',
    icon: 'resize-outline',
    duration: 2000,
  },
  {
    key: 'scoring',
    label: 'Computing Scores',
    sublabel: 'Applying calibration...',
    icon: 'calculator-outline',
    duration: 1500,
  },
  {
    key: 'potential',
    label: 'Calculating Potential',
    sublabel: 'Finding improvement levers...',
    icon: 'trending-up-outline',
    duration: 1500,
  },
  {
    key: 'building',
    label: 'Building Your Plan',
    sublabel: 'Generating recommendations...',
    icon: 'construct-outline',
    duration: 1500,
  },
];

export default function FaceAnalyzerLoadingScreen() {
  const params = useLocalSearchParams();
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const spinAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Continuous spin animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Progress through stages
    let stageIndex = 0;
    let overallProgress = 0;
    const progressPerStage = 100 / STAGES.length;

    const advanceStage = () => {
      if (stageIndex < STAGES.length) {
        setCurrentStage(stageIndex);
        
        // Animate progress
        const targetProgress = (stageIndex + 1) * progressPerStage;
        Animated.timing(progressAnim, {
          toValue: targetProgress / 100,
          duration: STAGES[stageIndex].duration * 0.8,
          useNativeDriver: false,
        }).start();

        setTimeout(() => {
          stageIndex++;
          advanceStage();
        }, STAGES[stageIndex].duration);
      } else {
        // All stages complete - navigate to results
        setTimeout(() => {
          router.replace('/face-analyzer/results');
        }, 500);
      }
    };

    advanceStage();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const stage = STAGES[currentStage];

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Spinner */}
        <Animated.View style={[styles.spinnerContainer, { transform: [{ rotate: spin }] }]}>
          <View style={styles.spinnerOuter}>
            <View style={styles.spinnerInner} />
          </View>
        </Animated.View>

        {/* Stage icon */}
        <View style={styles.stageIconContainer}>
          <Ionicons name={stage.icon} size={40} color={COLORS.primary} />
        </View>

        {/* Stage text */}
        <Text style={styles.stageLabel}>{stage.label}</Text>
        <Text style={styles.stageSublabel}>{stage.sublabel}</Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.progressText}>
            {currentStage + 1} of {STAGES.length}
          </Text>
        </View>

        {/* Stage indicators */}
        <View style={styles.stagesIndicator}>
          {STAGES.map((s, index) => (
            <View
              key={s.key}
              style={[
                styles.stageDot,
                index < currentStage && styles.stageDotComplete,
                index === currentStage && styles.stageDotActive,
              ]}
            />
          ))}
        </View>

        {/* Info note */}
        <View style={styles.infoNote}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
          <Text style={styles.infoText}>
            Your photos are processed securely and not stored permanently
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  spinnerContainer: {
    width: 120,
    height: 120,
    marginBottom: 32,
  },
  spinnerOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.border,
    borderTopColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
  },
  stageIconContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  stageLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  stageSublabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  stagesIndicator: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 48,
  },
  stageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  stageDotComplete: {
    backgroundColor: COLORS.success,
  },
  stageDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
});
