import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Feature, ConfidenceLevel } from '../../faceAnalyzer/types';

interface FeatureCardProps {
  feature: Feature;
  onPress?: () => void;
}

const getScoreColor = (score: number): string => {
  if (score >= 7.5) return '#22C55E';
  if (score >= 6.0) return '#00D9FF';
  if (score >= 4.5) return '#F59E0B';
  return '#EF4444';
};

const getConfidenceDots = (level: ConfidenceLevel): boolean[] => {
  switch (level) {
    case 'high':
      return [true, true, true];
    case 'medium':
      return [true, true, false];
    case 'low':
      return [true, false, false];
    default:
      return [false, false, false];
  }
};

const getFeatureIcon = (key: string): string => {
  const icons: Record<string, string> = {
    eyes: '👁',
    brows: '🪮',
    nose: '👃',
    lips: '👄',
    cheekbones: '✨',
    jawline: '💎',
    skin: '🌟',
    hair: '💇',
    harmony: '⚖️',
  };
  return icons[key] || '📊';
};

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature, onPress }) => {
  const scoreColor = getScoreColor(feature.rating10);
  const confidenceDots = getConfidenceDots(feature.confidence);
  const barWidth = (feature.rating10 / 10) * 100;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{getFeatureIcon(feature.key)}</Text>
          <Text style={styles.label}>{feature.label}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: scoreColor }]}>
            {feature.rating10.toFixed(1)}
          </Text>
          <View style={styles.confidenceDots}>
            {confidenceDots.map((active, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  { backgroundColor: active ? scoreColor : '#333333' },
                ]}
              />
            ))}
          </View>
        </View>
      </View>

      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View
            style={[
              styles.barFill,
              { width: `${barWidth}%`, backgroundColor: scoreColor },
            ]}
          />
        </View>
      </View>

      <Text style={styles.summary} numberOfLines={2}>
        {feature.summary}
      </Text>

      {feature.strengths.length > 0 && (
        <View style={styles.tagsRow}>
          {feature.strengths.slice(0, 2).map((strength, idx) => (
            <View key={idx} style={styles.strengthTag}>
              <Text style={styles.strengthText}>✓ {strength}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.tapHint}>Tap for details</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222222',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scoreContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  confidenceDots: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  barContainer: {
    marginBottom: 12,
  },
  barBackground: {
    height: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  summary: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  strengthTag: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 11,
    color: '#22C55E',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  tapHint: {
    fontSize: 12,
    color: '#555555',
  },
  chevron: {
    fontSize: 20,
    color: '#444444',
    fontWeight: '300',
  },
});

export default FeatureCard;
