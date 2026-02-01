import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RatioMeasurement, ConfidenceLevel } from '../../faceAnalyzer/types';

interface MeasurementRowProps {
  measurement: RatioMeasurement;
  showIdealRange?: boolean;
}

const getPositionInRange = (value: number, min: number, max: number): number => {
  const range = max - min;
  const padding = range * 0.3;
  const extendedMin = min - padding;
  const extendedMax = max + padding;
  const extendedRange = extendedMax - extendedMin;
  return Math.max(0, Math.min(100, ((value - extendedMin) / extendedRange) * 100));
};

const isInIdealRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

const getConfidenceLabel = (level: ConfidenceLevel): string => {
  switch (level) {
    case 'high':
      return 'High';
    case 'medium':
      return 'Med';
    case 'low':
      return 'Low';
    default:
      return '?';
  }
};

const getConfidenceColor = (level: ConfidenceLevel): string => {
  switch (level) {
    case 'high':
      return '#22C55E';
    case 'medium':
      return '#F59E0B';
    case 'low':
      return '#666666';
    default:
      return '#444444';
  }
};

const formatKey = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/ratio|to/gi, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim();
};

export const MeasurementRow: React.FC<MeasurementRowProps> = ({
  measurement,
  showIdealRange = true,
}) => {
  const position = getPositionInRange(
    measurement.value,
    measurement.idealMin,
    measurement.idealMax
  );
  const inRange = isInIdealRange(
    measurement.value,
    measurement.idealMin,
    measurement.idealMax
  );

  const idealStart = getPositionInRange(
    measurement.idealMin,
    measurement.idealMin,
    measurement.idealMax
  );
  const idealEnd = getPositionInRange(
    measurement.idealMax,
    measurement.idealMin,
    measurement.idealMax
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{formatKey(measurement.key)}</Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, inRange && styles.valueInRange]}>
            {measurement.value.toFixed(2)}
          </Text>
          <View style={[styles.confidenceBadge, { borderColor: getConfidenceColor(measurement.confidence) }]}>
            <Text style={[styles.confidenceText, { color: getConfidenceColor(measurement.confidence) }]}>
              {getConfidenceLabel(measurement.confidence)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.trackContainer}>
        <View style={styles.track}>
          {/* Ideal range highlight */}
          {showIdealRange && (
            <View
              style={[
                styles.idealRange,
                {
                  left: `${idealStart}%`,
                  width: `${idealEnd - idealStart}%`,
                },
              ]}
            />
          )}
          {/* Current value marker */}
          <View
            style={[
              styles.marker,
              {
                left: `${position}%`,
                backgroundColor: inRange ? '#00D9FF' : '#666666',
              },
            ]}
          />
        </View>
      </View>

      {showIdealRange && (
        <View style={styles.rangeLabels}>
          <Text style={styles.rangeLabel}>{measurement.idealMin.toFixed(2)}</Text>
          <Text style={styles.idealLabel}>ideal range</Text>
          <Text style={styles.rangeLabel}>{measurement.idealMax.toFixed(2)}</Text>
        </View>
      )}

      {measurement.note && (
        <Text style={styles.note}>{measurement.note}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111111',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888888',
    fontVariant: ['tabular-nums'],
  },
  valueInRange: {
    color: '#00D9FF',
  },
  confidenceBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  confidenceText: {
    fontSize: 9,
    fontWeight: '600',
  },
  trackContainer: {
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  track: {
    height: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    position: 'relative',
  },
  idealRange: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 217, 255, 0.15)',
    borderRadius: 4,
  },
  marker: {
    position: 'absolute',
    top: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    borderWidth: 2,
    borderColor: '#000000',
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: 10,
    color: '#555555',
    fontVariant: ['tabular-nums'],
  },
  idealLabel: {
    fontSize: 9,
    color: '#444444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  note: {
    fontSize: 11,
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default MeasurementRow;
