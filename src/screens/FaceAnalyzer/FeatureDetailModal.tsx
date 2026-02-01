import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import type { Feature, Fix, Timeline, ConfidenceLevel } from '../../faceAnalyzer/types';

interface FeatureDetailModalProps {
  feature: Feature;
  visible: boolean;
  onClose: () => void;
}

const getScoreColor = (score: number): string => {
  if (score >= 7.5) return '#22C55E';
  if (score >= 6.0) return '#00D9FF';
  if (score >= 4.5) return '#F59E0B';
  return '#EF4444';
};

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

const getDifficultyLabel = (difficulty: string): string => {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
};

const getTypeLabel = (type: string): string => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const getConfidenceLabel = (level: ConfidenceLevel): string => {
  switch (level) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Medium confidence';
    case 'low':
      return 'Low confidence';
    default:
      return 'Unknown';
  }
};

const FixCard: React.FC<{ fix: Fix; index: number }> = ({ fix, index }) => (
  <View style={styles.fixCard}>
    <View style={styles.fixHeader}>
      <View style={styles.fixTitleRow}>
        <View style={styles.fixNumber}>
          <Text style={styles.fixNumberText}>{index + 1}</Text>
        </View>
        <Text style={styles.fixTitle}>{fix.title}</Text>
      </View>
      <View style={styles.fixBadges}>
        <View style={[styles.badge, { backgroundColor: getTimelineColor(fix.timeline) + '20' }]}>
          <Text style={[styles.badgeText, { color: getTimelineColor(fix.timeline) }]}>
            {getTimelineLabel(fix.timeline)}
          </Text>
        </View>
        <View style={styles.badgeOutline}>
          <Text style={styles.badgeOutlineText}>{getDifficultyLabel(fix.difficulty)}</Text>
        </View>
      </View>
    </View>

    <View style={styles.fixMeta}>
      <Text style={styles.fixType}>{getTypeLabel(fix.type)}</Text>
      {fix.expectedDelta && (
        <Text style={styles.fixDelta}>+{fix.expectedDelta.toFixed(1)} potential</Text>
      )}
    </View>

    <View style={styles.fixSteps}>
      {fix.steps.map((step, idx) => (
        <View key={idx} style={styles.fixStep}>
          <View style={styles.stepDot} />
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </View>

    {fix.caution && (
      <View style={styles.cautionBox}>
        <Text style={styles.cautionIcon}>⚠️</Text>
        <Text style={styles.cautionText}>{fix.caution}</Text>
      </View>
    )}
  </View>
);

export const FeatureDetailModal: React.FC<FeatureDetailModalProps> = ({
  feature,
  visible,
  onClose,
}) => {
  const scoreColor = getScoreColor(feature.rating10);
  const barWidth = (feature.rating10 / 10) * 100;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{feature.label}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Score Section */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>
                {feature.rating10.toFixed(1)}
              </Text>
              <Text style={styles.scoreMax}>/10</Text>
            </View>
            <View style={styles.scoreBarContainer}>
              <View style={styles.scoreBarBackground}>
                <View
                  style={[
                    styles.scoreBarFill,
                    { width: `${barWidth}%`, backgroundColor: scoreColor },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.confidenceText}>
              {getConfidenceLabel(feature.confidence)}
            </Text>
          </View>

          {/* Summary */}
          <View style={styles.section}>
            <Text style={styles.summaryText}>{feature.summary}</Text>
          </View>

          {/* Strengths */}
          {feature.strengths.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Strengths</Text>
              {feature.strengths.map((strength, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <Text style={styles.bulletIconGreen}>✓</Text>
                  <Text style={styles.bulletText}>{strength}</Text>
                </View>
              ))}
            </View>
          )}

          {/* What Limits It */}
          {feature.whatLimitsIt.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What Limits This</Text>
              {feature.whatLimitsIt.map((item, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <Text style={styles.bulletIconYellow}>→</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Why */}
          {feature.why.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Why This Score</Text>
              {feature.why.map((reason, idx) => (
                <View key={idx} style={styles.bulletItem}>
                  <Text style={styles.bulletIconBlue}>•</Text>
                  <Text style={styles.bulletText}>{reason}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Fixes */}
          {feature.fixes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>How to Improve</Text>
              <View style={styles.fixesList}>
                {feature.fixes.map((fix, idx) => (
                  <FixCard key={idx} fix={fix} index={idx} />
                ))}
              </View>
            </View>
          )}

          {/* Sub-traits */}
          {feature.subTraits && feature.subTraits.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sub-Traits</Text>
              <View style={styles.subTraitsList}>
                {feature.subTraits.map((trait) => (
                  <View key={trait.key} style={styles.subTraitRow}>
                    <Text style={styles.subTraitName}>{trait.name}</Text>
                    <View style={styles.subTraitScoreContainer}>
                      <View style={styles.subTraitBar}>
                        <View
                          style={[
                            styles.subTraitBarFill,
                            { width: `${(trait.score / 10) * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.subTraitScore}>{trait.score.toFixed(1)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Close Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: '#333333',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: '#888888',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scoreMax: {
    fontSize: 24,
    color: '#555555',
    marginLeft: 4,
  },
  scoreBarContainer: {
    width: '100%',
    marginBottom: 8,
  },
  scoreBarBackground: {
    height: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 13,
    color: '#666666',
  },
  section: {
    marginBottom: 24,
  },
  summaryText: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bulletIconGreen: {
    fontSize: 14,
    color: '#22C55E',
    width: 24,
  },
  bulletIconYellow: {
    fontSize: 14,
    color: '#F59E0B',
    width: 24,
  },
  bulletIconBlue: {
    fontSize: 16,
    color: '#00D9FF',
    width: 24,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 21,
  },
  fixesList: {
    gap: 14,
  },
  fixCard: {
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  fixHeader: {
    marginBottom: 12,
  },
  fixTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fixNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#00D9FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  fixNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  fixTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  fixBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeOutline: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  badgeOutlineText: {
    fontSize: 11,
    color: '#888888',
  },
  fixMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fixType: {
    fontSize: 12,
    color: '#666666',
  },
  fixDelta: {
    fontSize: 12,
    color: '#00D9FF',
    fontWeight: '500',
  },
  fixSteps: {
    gap: 8,
  },
  fixStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333333',
    marginTop: 6,
    marginRight: 10,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#AAAAAA',
    lineHeight: 20,
  },
  cautionBox: {
    flexDirection: 'row',
    backgroundColor: '#1A1500',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  cautionIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  cautionText: {
    flex: 1,
    fontSize: 12,
    color: '#F59E0B',
    lineHeight: 18,
  },
  subTraitsList: {
    gap: 12,
  },
  subTraitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subTraitName: {
    flex: 1,
    fontSize: 14,
    color: '#CCCCCC',
  },
  subTraitScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 120,
  },
  subTraitBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  subTraitBarFill: {
    height: '100%',
    backgroundColor: '#00D9FF',
    borderRadius: 2,
  },
  subTraitScore: {
    fontSize: 13,
    color: '#888888',
    width: 30,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  doneButton: {
    backgroundColor: '#00D9FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});

export default FeatureDetailModal;
