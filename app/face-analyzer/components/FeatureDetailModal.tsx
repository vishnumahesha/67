/**
 * Feature Detail Modal
 * Expanded view of a feature with strengths, limitations, and fixes
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
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

interface Fix {
  title: string;
  type: string;
  difficulty: string;
  timeline: string;
  steps: string[];
  expectedDelta?: number;
  caution?: string;
}

interface Feature {
  key: string;
  label: string;
  rating10: number;
  confidence: 'low' | 'medium' | 'high';
  summary: string;
  strengths: string[];
  whatLimitsIt: string[];
  why: string[];
  fixes: Fix[];
}

interface FeatureDetailModalProps {
  visible: boolean;
  feature: Feature | null;
  onClose: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 7) return COLORS.success;
  if (score >= 5.5) return COLORS.accent;
  if (score >= 4) return COLORS.warning;
  return COLORS.error;
}

const TIMELINE_LABELS: Record<string, string> = {
  today: '⚡ Today',
  '2_4_weeks': '📅 2-4 weeks',
  '8_12_weeks': '🎯 8-12 weeks',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: COLORS.success,
  medium: COLORS.warning,
  hard: COLORS.error,
};

export default function FeatureDetailModal({
  visible,
  feature,
  onClose,
}: FeatureDetailModalProps) {
  if (!feature) return null;

  const scoreColor = getScoreColor(feature.rating10);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{feature.label}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Score section */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>
                {feature.rating10.toFixed(1)}
              </Text>
              <Text style={styles.scoreMax}>/10</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreSummary}>{feature.summary}</Text>
              <View style={styles.confidenceBadge}>
                <View style={[styles.confidenceDot, {
                  backgroundColor: feature.confidence === 'high' ? COLORS.success :
                                  feature.confidence === 'medium' ? COLORS.warning : COLORS.textMuted
                }]} />
                <Text style={styles.confidenceText}>
                  {feature.confidence.charAt(0).toUpperCase() + feature.confidence.slice(1)} Confidence
                </Text>
              </View>
            </View>
          </View>

          {/* Why section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why This Score</Text>
            <View style={styles.whyList}>
              {feature.why.map((reason, index) => (
                <View key={index} style={styles.whyItem}>
                  <Ionicons name="information-circle" size={16} color={COLORS.textMuted} />
                  <Text style={styles.whyText}>{reason}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Strengths section */}
          {feature.strengths.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} /> Strengths
              </Text>
              <View style={styles.tagList}>
                {feature.strengths.map((strength, index) => (
                  <View key={index} style={[styles.tag, styles.strengthTag]}>
                    <Text style={styles.strengthTagText}>{strength}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* What limits it section */}
          {feature.whatLimitsIt.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="alert-circle" size={16} color={COLORS.warning} /> What Limits It
              </Text>
              <View style={styles.tagList}>
                {feature.whatLimitsIt.map((limitation, index) => (
                  <View key={index} style={[styles.tag, styles.limitationTag]}>
                    <Text style={styles.limitationTagText}>{limitation}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Fixes section */}
          {feature.fixes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="construct" size={16} color={COLORS.primary} /> Improvement Options
              </Text>
              <View style={styles.fixesList}>
                {feature.fixes.map((fix, index) => (
                  <View key={index} style={styles.fixCard}>
                    <View style={styles.fixHeader}>
                      <Text style={styles.fixTitle}>{fix.title}</Text>
                      {fix.expectedDelta && (
                        <Text style={styles.fixDelta}>+{fix.expectedDelta.toFixed(1)}</Text>
                      )}
                    </View>
                    
                    <View style={styles.fixMeta}>
                      <Text style={styles.fixTimeline}>
                        {TIMELINE_LABELS[fix.timeline] || fix.timeline}
                      </Text>
                      <View style={[styles.difficultyBadge, {
                        backgroundColor: `${DIFFICULTY_COLORS[fix.difficulty] || COLORS.textMuted}20`
                      }]}>
                        <Text style={[styles.difficultyText, {
                          color: DIFFICULTY_COLORS[fix.difficulty] || COLORS.textMuted
                        }]}>
                          {fix.difficulty.charAt(0).toUpperCase() + fix.difficulty.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.fixSteps}>
                      {fix.steps.map((step, stepIndex) => (
                        <View key={stepIndex} style={styles.stepItem}>
                          <Text style={styles.stepNumber}>{stepIndex + 1}</Text>
                          <Text style={styles.stepText}>{step}</Text>
                        </View>
                      ))}
                    </View>

                    {fix.caution && (
                      <View style={styles.cautionBox}>
                        <Ionicons name="warning" size={14} color={COLORS.warning} />
                        <Text style={styles.cautionText}>{fix.caution}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  scoreMax: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: -2,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreSummary: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  whyList: {
    gap: 10,
  },
  whyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
  },
  whyText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  strengthTag: {
    backgroundColor: `${COLORS.success}15`,
  },
  strengthTagText: {
    fontSize: 13,
    color: COLORS.success,
    fontWeight: '500',
  },
  limitationTag: {
    backgroundColor: `${COLORS.warning}15`,
  },
  limitationTagText: {
    fontSize: 13,
    color: COLORS.warning,
    fontWeight: '500',
  },
  fixesList: {
    gap: 16,
  },
  fixCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fixHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fixTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  fixDelta: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fixMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  fixTimeline: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  fixSteps: {
    gap: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  cautionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 12,
    padding: 10,
    backgroundColor: `${COLORS.warning}10`,
    borderRadius: 8,
  },
  cautionText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.warning,
    lineHeight: 18,
  },
});
