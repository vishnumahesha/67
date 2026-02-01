/**
 * Dual Score Ring Component
 * Shows Current vs Potential scores with animated rings
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const COLORS = {
  bg: '#0a0a0f',
  surface: '#12121a',
  border: '#2a2a3a',
  primary: '#6366f1',
  accent: '#22d3ee',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
};

interface DualScoreRingProps {
  currentScore: number;
  potentialMin: number;
  potentialMax: number;
  confidence: 'low' | 'medium' | 'high';
  size?: number;
  animated?: boolean;
}

function getScoreColor(score: number): string {
  if (score >= 7) return COLORS.success;
  if (score >= 5.5) return COLORS.accent;
  if (score >= 4) return COLORS.warning;
  return COLORS.error;
}

function getScoreLabel(score: number): string {
  if (score >= 8) return 'Exceptional';
  if (score >= 7) return 'Above Average';
  if (score >= 6) return 'Slightly Above';
  if (score >= 5) return 'Average';
  if (score >= 4) return 'Slightly Below';
  return 'Below Average';
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function DualScoreRing({
  currentScore,
  potentialMin,
  potentialMax,
  confidence,
  size = 200,
  animated = true,
}: DualScoreRingProps) {
  const currentAnim = useRef(new Animated.Value(0)).current;
  const potentialAnim = useRef(new Animated.Value(0)).current;

  const strokeWidth = 12;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const potentialRadius = radius - strokeWidth - 8;
  const potentialCircumference = 2 * Math.PI * potentialRadius;

  const currentColor = getScoreColor(currentScore);
  const potentialColor = getScoreColor(potentialMax);
  const delta = potentialMax - currentScore;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(currentAnim, {
          toValue: currentScore / 10,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(potentialAnim, {
          toValue: potentialMax / 10,
          duration: 1800,
          delay: 300,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      currentAnim.setValue(currentScore / 10);
      potentialAnim.setValue(potentialMax / 10);
    }
  }, [currentScore, potentialMax, animated]);

  const currentStrokeDashoffset = currentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const potentialStrokeDashoffset = potentialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [potentialCircumference, 0],
  });

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background ring - current */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={COLORS.border}
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Current score ring */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={currentColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={currentStrokeDashoffset}
          />
          
          {/* Background ring - potential */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={potentialRadius}
            stroke={`${COLORS.border}60`}
            strokeWidth={strokeWidth - 4}
            fill="none"
          />
          
          {/* Potential score ring */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={potentialRadius}
            stroke={`${potentialColor}80`}
            strokeWidth={strokeWidth - 4}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={potentialCircumference}
            strokeDashoffset={potentialStrokeDashoffset}
            strokeOpacity={0.6}
          />
        </G>
      </Svg>
      
      {/* Center content */}
      <View style={[styles.centerContent, { width: size, height: size }]}>
        <Text style={styles.label}>CURRENT</Text>
        <Text style={[styles.currentScore, { color: currentColor }]}>
          {currentScore.toFixed(1)}
        </Text>
        <Text style={styles.maxScore}>/10</Text>
        <Text style={styles.scoreLabel}>{getScoreLabel(currentScore)}</Text>
        
        {/* Delta badge */}
        {delta > 0 && (
          <View style={[styles.deltaBadge, { backgroundColor: `${COLORS.success}20` }]}>
            <Text style={[styles.deltaText, { color: COLORS.success }]}>
              +{delta.toFixed(1)} possible
            </Text>
          </View>
        )}
      </View>

      {/* Confidence indicator */}
      <View style={styles.confidenceContainer}>
        <View style={[styles.confidenceDot, { 
          backgroundColor: confidence === 'high' ? COLORS.success : 
                          confidence === 'medium' ? COLORS.warning : COLORS.error 
        }]} />
        <Text style={styles.confidenceText}>
          {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
        </Text>
      </View>

      {/* Potential range */}
      <View style={styles.potentialRange}>
        <Text style={styles.potentialLabel}>POTENTIAL</Text>
        <Text style={[styles.potentialValue, { color: potentialColor }]}>
          {potentialMin.toFixed(1)} - {potentialMax.toFixed(1)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  currentScore: {
    fontSize: 48,
    fontWeight: '700',
  },
  maxScore: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: -4,
  },
  scoreLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  deltaBadge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  deltaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  potentialRange: {
    alignItems: 'center',
    marginTop: 12,
  },
  potentialLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 2,
  },
  potentialValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
