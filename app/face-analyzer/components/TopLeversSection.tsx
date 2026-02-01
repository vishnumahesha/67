/**
 * Top Levers Section Component
 * Shows the top 3 improvement opportunities with timelines and deltas
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

interface TopLever {
  lever: string;
  label: string;
  deltaMin: number;
  deltaMax: number;
  why: string;
  timeline: 'today' | '2_4_weeks' | '8_12_weeks';
  priority: number;
  actions: string[];
}

interface TopLeversSectionProps {
  levers: TopLever[];
  totalPotentialGain: number;
}

const LEVER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  skin_routine: 'sparkles',
  under_eye_care: 'eye',
  brow_grooming: 'remove-outline',
  hair_styling: 'cut',
  facial_hair: 'man',
  posture_correction: 'body',
  photo_optimization: 'camera',
  lip_care: 'heart',
  body_composition: 'fitness',
};

const TIMELINE_LABELS: Record<string, string> = {
  today: 'Today',
  '2_4_weeks': '2-4 weeks',
  '8_12_weeks': '8-12 weeks',
};

const PRIORITY_COLORS = [COLORS.success, COLORS.accent, COLORS.primary];

export default function TopLeversSection({ levers, totalPotentialGain }: TopLeversSectionProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="rocket" size={20} color={COLORS.success} />
          <Text style={styles.title}>Top 3 Levers</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>+{totalPotentialGain.toFixed(1)} total</Text>
        </View>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Highest-impact improvements ranked by potential gain
      </Text>

      {/* Levers list */}
      <View style={styles.leversList}>
        {levers.map((lever, index) => (
          <View key={lever.lever} style={styles.leverCard}>
            {/* Priority badge */}
            <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[index] }]}>
              <Text style={styles.priorityText}>#{lever.priority}</Text>
            </View>

            {/* Content */}
            <View style={styles.leverContent}>
              <View style={styles.leverHeader}>
                <View style={styles.leverTitleRow}>
                  <Ionicons 
                    name={LEVER_ICONS[lever.lever] || 'arrow-up'} 
                    size={16} 
                    color={PRIORITY_COLORS[index]} 
                  />
                  <Text style={styles.leverLabel}>{lever.label}</Text>
                </View>
                <View style={styles.deltaContainer}>
                  <Text style={[styles.deltaText, { color: COLORS.success }]}>
                    +{lever.deltaMin.toFixed(1)}-{lever.deltaMax.toFixed(1)}
                  </Text>
                </View>
              </View>

              <Text style={styles.leverWhy} numberOfLines={2}>{lever.why}</Text>

              {/* Timeline and actions preview */}
              <View style={styles.leverFooter}>
                <View style={styles.timelineBadge}>
                  <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.timelineText}>{TIMELINE_LABELS[lever.timeline]}</Text>
                </View>
                <Text style={styles.actionsCount}>
                  {lever.actions.length} action{lever.actions.length !== 1 ? 's' : ''}
                </Text>
              </View>

              {/* Actions preview */}
              <View style={styles.actionsPreview}>
                {lever.actions.slice(0, 2).map((action, i) => (
                  <View key={i} style={styles.actionItem}>
                    <View style={styles.actionDot} />
                    <Text style={styles.actionText} numberOfLines={1}>{action}</Text>
                  </View>
                ))}
                {lever.actions.length > 2 && (
                  <Text style={styles.moreActions}>+{lever.actions.length - 2} more</Text>
                )}
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Timeline note */}
      <View style={styles.timelineNote}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.textMuted} />
        <Text style={styles.timelineNoteText}>
          Full potential achievable in 8-12 weeks with consistent effort
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: `${COLORS.success}30`,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalBadge: {
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 20,
  },
  leversList: {
    gap: 16,
  },
  leverCard: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.bg,
  },
  leverContent: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 14,
  },
  leverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leverTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leverLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  deltaContainer: {
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  deltaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  leverWhy: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  leverFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timelineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timelineText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  actionsCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  actionsPreview: {
    gap: 6,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
  },
  actionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  moreActions: {
    fontSize: 11,
    color: COLORS.primary,
    marginLeft: 12,
    fontWeight: '500',
  },
  timelineNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  timelineNoteText: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
});
