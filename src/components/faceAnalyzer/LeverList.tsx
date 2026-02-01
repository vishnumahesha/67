import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { TopLever, Timeline } from '../../faceAnalyzer/types';

interface LeverListProps {
  levers: TopLever[];
  onLeverPress?: (lever: TopLever) => void;
}

const getTimelineLabel = (timeline: Timeline): string => {
  switch (timeline) {
    case 'today':
      return 'Today';
    case '2_4_weeks':
      return '2-4 weeks';
    case '8_12_weeks':
      return '8-12 weeks';
    default:
      return timeline;
  }
};

const getTimelineColor = (timeline: Timeline): string => {
  switch (timeline) {
    case 'today':
      return '#22C55E';
    case '2_4_weeks':
      return '#F59E0B';
    case '8_12_weeks':
      return '#8B5CF6';
    default:
      return '#666666';
  }
};

const getLeverIcon = (lever: string): string => {
  const icons: Record<string, string> = {
    skin_routine: '✨',
    under_eye_care: '👁',
    brow_grooming: '🪮',
    hair_styling: '💇',
    facial_hair: '🧔',
    posture_correction: '🧘',
    photo_optimization: '📸',
    lip_care: '💋',
    body_composition: '💪',
  };
  return icons[lever] || '⚡';
};

export const LeverList: React.FC<LeverListProps> = ({ levers, onLeverPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Top 3 Ways to Improve</Text>
      
      {levers.map((lever, index) => (
        <TouchableOpacity
          key={lever.lever}
          style={styles.leverCard}
          onPress={() => onLeverPress?.(lever)}
          activeOpacity={0.7}
        >
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
          
          <View style={styles.content}>
            <View style={styles.topRow}>
              <Text style={styles.icon}>{getLeverIcon(lever.lever)}</Text>
              <Text style={styles.label}>{lever.label}</Text>
              <View style={[styles.timelineBadge, { backgroundColor: getTimelineColor(lever.timeline) + '20' }]}>
                <Text style={[styles.timelineText, { color: getTimelineColor(lever.timeline) }]}>
                  {getTimelineLabel(lever.timeline)}
                </Text>
              </View>
            </View>
            
            <Text style={styles.why} numberOfLines={2}>{lever.why}</Text>
            
            <View style={styles.deltaRow}>
              <View style={styles.deltaBar}>
                <View 
                  style={[
                    styles.deltaFill, 
                    { width: `${(lever.deltaMax / 1.5) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.deltaText}>
                +{lever.deltaMin.toFixed(1)} to +{lever.deltaMax.toFixed(1)}
              </Text>
            </View>
          </View>
          
          <View style={styles.chevron}>
            <Text style={styles.chevronText}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  leverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#222222',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#00D9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  content: {
    flex: 1,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  timelineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  timelineText: {
    fontSize: 10,
    fontWeight: '600',
  },
  why: {
    fontSize: 13,
    color: '#888888',
    lineHeight: 18,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  deltaBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  deltaFill: {
    height: '100%',
    backgroundColor: '#00D9FF',
    borderRadius: 2,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00D9FF',
    minWidth: 80,
    textAlign: 'right',
  },
  chevron: {
    marginLeft: 8,
  },
  chevronText: {
    fontSize: 24,
    color: '#444444',
    fontWeight: '300',
  },
});

export default LeverList;
