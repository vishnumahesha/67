/**
 * Feature Card Component
 * Displays a single feature with score, summary, and tap-to-expand
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  error: '#ef4444',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
};

interface FeatureCardProps {
  featureKey: string;
  label: string;
  rating: number;
  confidence: 'low' | 'medium' | 'high';
  summary: string;
  onPress: () => void;
}

const FEATURE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  eyes: 'eye-outline',
  brows: 'remove-outline',
  nose: 'triangle-outline',
  lips: 'heart-outline',
  cheekbones: 'diamond-outline',
  jawline: 'square-outline',
  skin: 'sparkles-outline',
  hair: 'leaf-outline',
  harmony: 'git-merge-outline',
};

function getScoreColor(score: number): string {
  if (score >= 7) return COLORS.success;
  if (score >= 5.5) return COLORS.accent;
  if (score >= 4) return COLORS.warning;
  return COLORS.error;
}

function getScoreBarWidth(score: number): number {
  return Math.min(100, Math.max(0, score * 10));
}

export default function FeatureCard({
  featureKey,
  label,
  rating,
  confidence,
  summary,
  onPress,
}: FeatureCardProps) {
  const scoreColor = getScoreColor(rating);
  const barWidth = getScoreBarWidth(rating);
  const iconName = FEATURE_ICONS[featureKey] || 'ellipse-outline';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <View style={[styles.iconContainer, { backgroundColor: `${scoreColor}15` }]}>
            <Ionicons name={iconName} size={18} color={scoreColor} />
          </View>
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: scoreColor }]}>{rating.toFixed(1)}</Text>
          <Text style={styles.maxScore}>/10</Text>
        </View>
      </View>

      {/* Score bar */}
      <View style={styles.barContainer}>
        <View style={styles.barBackground}>
          <View 
            style={[
              styles.barFill, 
              { 
                width: `${barWidth}%`,
                backgroundColor: scoreColor,
              }
            ]} 
          />
        </View>
      </View>

      {/* Summary and confidence */}
      <View style={styles.footer}>
        <Text style={styles.summary} numberOfLines={1}>{summary}</Text>
        <View style={styles.confidenceContainer}>
          <View style={[styles.confidenceDot, { 
            backgroundColor: confidence === 'high' ? COLORS.success : 
                            confidence === 'medium' ? COLORS.warning : COLORS.textMuted 
          }]} />
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
  },
  maxScore: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 2,
  },
  barContainer: {
    marginBottom: 12,
  },
  barBackground: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summary: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
