import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';

interface FaceAnalyzerLoadingScreenProps {
  progress: number;
  status: string;
}

interface StepIndicatorProps {
  step: number;
  currentStep: number;
  label: string;
  isLast?: boolean;
}

const steps = [
  { label: 'Uploading photo', description: 'Preparing image data...' },
  { label: 'Detecting landmarks', description: 'Finding facial features...' },
  { label: 'Computing measurements', description: 'Calculating ratios and proportions...' },
  { label: 'Analyzing features', description: 'Evaluating individual traits...' },
  { label: 'Scoring calibration', description: 'Applying honest scoring model...' },
  { label: 'Building your plan', description: 'Generating personalized insights...' },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({
  step,
  currentStep,
  label,
  isLast = false,
}) => {
  const isActive = currentStep >= step;
  const isCurrent = currentStep === step;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCurrent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isCurrent]);

  return (
    <View style={styles.stepContainer}>
      <View style={styles.stepIndicatorWrapper}>
        <Animated.View
          style={[
            styles.stepDot,
            isActive && styles.stepDotActive,
            isCurrent && styles.stepDotCurrent,
            isCurrent && { transform: [{ scale: pulseAnim }] },
          ]}
        >
          {isActive && !isCurrent && (
            <Text style={styles.checkmark}>✓</Text>
          )}
          {isCurrent && (
            <View style={styles.innerDot} />
          )}
        </Animated.View>
        {!isLast && (
          <View style={[styles.stepLine, isActive && styles.stepLineActive]} />
        )}
      </View>
      <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
        {label}
      </Text>
    </View>
  );
};

export const FaceAnalyzerLoadingScreen: React.FC<FaceAnalyzerLoadingScreenProps> = ({
  progress,
  status,
}) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    // Map progress to step
    const step = Math.min(Math.floor(progress / (100 / steps.length)), steps.length - 1);
    setCurrentStep(step);
  }, [progress]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={styles.content}>
        {/* Animated spinner */}
        <View style={styles.spinnerContainer}>
          <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
            <View style={styles.spinnerArc} />
          </Animated.View>
          <View style={styles.spinnerCenter}>
            <Text style={styles.percentage}>{Math.round(progress)}%</Text>
          </View>
        </View>

        {/* Status text */}
        <Text style={styles.statusText}>{status || steps[currentStep]?.description}</Text>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>

        {/* Step indicators */}
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <StepIndicator
              key={index}
              step={index}
              currentStep={currentStep}
              label={step.label}
              isLast={index === steps.length - 1}
            />
          ))}
        </View>

        {/* Tips */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Tip: Our scoring is calibrated to avoid score inflation. 
            A 6.5+ means genuinely above average.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  spinnerContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  spinner: {
    position: 'absolute',
    width: 140,
    height: 140,
  },
  spinnerArc: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: '#00D9FF',
    borderRightColor: '#00D9FF50',
  },
  spinnerCenter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  percentage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  statusText: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 24,
    minHeight: 24,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 40,
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00D9FF',
    borderRadius: 3,
  },
  stepsContainer: {
    width: '100%',
    gap: 0,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 44,
  },
  stepIndicatorWrapper: {
    width: 40,
    alignItems: 'center',
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#00D9FF',
    borderColor: '#00D9FF',
  },
  stepDotCurrent: {
    backgroundColor: '#000000',
    borderColor: '#00D9FF',
    borderWidth: 2,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00D9FF',
  },
  checkmark: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '700',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#1A1A1A',
    marginTop: 4,
  },
  stepLineActive: {
    backgroundColor: '#00D9FF',
  },
  stepLabel: {
    fontSize: 14,
    color: '#555555',
    marginLeft: 12,
    paddingTop: 1,
  },
  stepLabelActive: {
    color: '#FFFFFF',
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
    borderRadius: 10,
    padding: 14,
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  tipIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#666666',
    lineHeight: 19,
  },
});

export default FaceAnalyzerLoadingScreen;
