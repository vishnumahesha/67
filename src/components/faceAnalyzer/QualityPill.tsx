import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ConfidenceLevel } from '../../faceAnalyzer/types';

interface QualityPillProps {
  score: number;
  confidence: ConfidenceLevel;
  issues?: string[];
  compact?: boolean;
}

const getQualityLabel = (score: number): string => {
  if (score >= 0.8) return 'Excellent';
  if (score >= 0.7) return 'Good';
  if (score >= 0.5) return 'Fair';
  return 'Poor';
};

const getQualityColor = (score: number): string => {
  if (score >= 0.8) return '#22C55E';
  if (score >= 0.7) return '#00D9FF';
  if (score >= 0.5) return '#F59E0B';
  return '#EF4444';
};

const getConfidenceColor = (level: ConfidenceLevel): string => {
  switch (level) {
    case 'high':
      return '#22C55E';
    case 'medium':
      return '#F59E0B';
    case 'low':
      return '#EF4444';
    default:
      return '#666666';
  }
};

export const QualityPill: React.FC<QualityPillProps> = ({
  score,
  confidence,
  issues = [],
  compact = false,
}) => {
  const qualityLabel = getQualityLabel(score);
  const qualityColor = getQualityColor(score);
  const confidenceColor = getConfidenceColor(confidence);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.pill, { borderColor: qualityColor }]}>
          <View style={[styles.dot, { backgroundColor: qualityColor }]} />
          <Text style={[styles.pillText, { color: qualityColor }]}>
            {qualityLabel} Photo
          </Text>
        </View>
        <View style={[styles.pill, { borderColor: confidenceColor }]}>
          <Text style={[styles.pillText, { color: confidenceColor }]}>
            {confidence.charAt(0).toUpperCase() + confidence.slice(1)} Confidence
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.section}>
          <Text style={styles.label}>Photo Quality</Text>
          <View style={styles.scoreRow}>
            <View style={[styles.indicator, { backgroundColor: qualityColor }]} />
            <Text style={[styles.value, { color: qualityColor }]}>{qualityLabel}</Text>
            <Text style={styles.scoreNum}>{(score * 100).toFixed(0)}%</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.section}>
          <Text style={styles.label}>Confidence</Text>
          <View style={styles.scoreRow}>
            <View style={[styles.indicator, { backgroundColor: confidenceColor }]} />
            <Text style={[styles.value, { color: confidenceColor }]}>
              {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {issues.length > 0 && (
        <View style={styles.issuesContainer}>
          <Text style={styles.issuesLabel}>Issues detected:</Text>
          <View style={styles.issuesList}>
            {issues.slice(0, 3).map((issue, idx) => (
              <View key={idx} style={styles.issueTag}>
                <Text style={styles.issueText}>
                  {issue.replace(/_/g, ' ')}
                </Text>
              </View>
            ))}
            {issues.length > 3 && (
              <Text style={styles.moreIssues}>+{issues.length - 3} more</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222222',
  },
  compactContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    flex: 1,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#222222',
    marginHorizontal: 16,
  },
  label: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  scoreNum: {
    fontSize: 12,
    color: '#666666',
  },
  issuesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  issuesLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 8,
  },
  issuesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  issueTag: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  issueText: {
    fontSize: 11,
    color: '#888888',
    textTransform: 'capitalize',
  },
  moreIssues: {
    fontSize: 11,
    color: '#666666',
    alignSelf: 'center',
  },
});

export default QualityPill;
