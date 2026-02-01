import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface DualRingScoreProps {
  currentScore: number;
  potentialMin: number;
  potentialMax: number;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const DualRingScore: React.FC<DualRingScoreProps> = ({
  currentScore,
  potentialMin,
  potentialMax,
  size = 200,
  strokeWidth = 12,
  animated = true,
}) => {
  const currentAnim = useRef(new Animated.Value(0)).current;
  const potentialAnim = useRef(new Animated.Value(0)).current;

  const radius = (size - strokeWidth * 2) / 2;
  const innerRadius = radius - strokeWidth - 8;
  const circumference = 2 * Math.PI * radius;
  const innerCircumference = 2 * Math.PI * innerRadius;

  const currentProgress = currentScore / 10;
  const potentialProgress = (potentialMin + potentialMax) / 2 / 10;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(currentAnim, {
          toValue: currentProgress,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(potentialAnim, {
          toValue: potentialProgress,
          duration: 1800,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      currentAnim.setValue(currentProgress);
      potentialAnim.setValue(potentialProgress);
    }
  }, [currentScore, potentialMin, potentialMax, animated]);

  const currentStrokeDashoffset = currentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const potentialStrokeDashoffset = potentialAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [innerCircumference, 0],
  });

  const delta = ((potentialMin + potentialMax) / 2 - currentScore).toFixed(1);
  const deltaDisplay = parseFloat(delta) > 0 ? `+${delta}` : delta;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="currentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#00D9FF" />
            <Stop offset="100%" stopColor="#0099CC" />
          </LinearGradient>
          <LinearGradient id="potentialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#3D3D3D" />
            <Stop offset="100%" stopColor="#2A2A2A" />
          </LinearGradient>
        </Defs>

        {/* Background circles */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1A1A1A"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          stroke="#1A1A1A"
          strokeWidth={strokeWidth - 4}
          fill="none"
        />

        {/* Potential ring (inner, dimmer) */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={innerRadius}
          stroke="#3D3D3D"
          strokeWidth={strokeWidth - 4}
          fill="none"
          strokeDasharray={innerCircumference}
          strokeDashoffset={potentialStrokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />

        {/* Current ring (outer, bright) */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#currentGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={currentStrokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.centerContent}>
        <Text style={styles.currentScore}>{currentScore.toFixed(1)}</Text>
        <Text style={styles.label}>Current</Text>
        <View style={styles.deltaContainer}>
          <Text style={styles.deltaText}>{deltaDisplay}</Text>
          <Text style={styles.deltaLabel}>potential</Text>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#00D9FF' }]} />
          <Text style={styles.legendText}>Current</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3D3D3D' }]} />
          <Text style={styles.legendText}>Potential ({potentialMin.toFixed(1)}-{potentialMax.toFixed(1)})</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ rotateZ: '0deg' }],
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentScore: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginTop: -4,
  },
  deltaContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deltaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D9FF',
  },
  deltaLabel: {
    fontSize: 11,
    color: '#666666',
    marginLeft: 4,
  },
  legend: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#888888',
  },
});

export default DualRingScore;
