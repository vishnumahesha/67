import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import type {
  FaceAnalysisResponse,
  Feature,
  ResultsTab,
} from '../../faceAnalyzer/types';
import { DualRingScore } from '../../components/faceAnalyzer/DualRingScore';
import { QualityPill } from '../../components/faceAnalyzer/QualityPill';
import { LeverList } from '../../components/faceAnalyzer/LeverList';
import { FeatureCard } from '../../components/faceAnalyzer/FeatureCard';
import { MeasurementRow } from '../../components/faceAnalyzer/MeasurementRow';
import { FeatureDetailModal } from './FeatureDetailModal';

interface FaceAnalyzerResultsScreenProps {
  result: FaceAnalysisResponse;
  onRescan: () => void;
  onBack: () => void;
}

const TABS: { key: ResultsTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'features', label: 'Features' },
  { key: 'measurements', label: 'Measurements' },
  { key: 'style', label: 'Style' },
];

export const FaceAnalyzerResultsScreen: React.FC<FaceAnalyzerResultsScreenProps> = ({
  result,
  onRescan,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<ResultsTab>('overview');
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Dual Ring Score */}
      <View style={styles.scoreSection}>
        <DualRingScore
          currentScore={result.overall.currentScore10}
          potentialMin={result.overall.potentialScoreRange.min}
          potentialMax={result.overall.potentialScoreRange.max}
          size={220}
        />
      </View>

      {/* Quality & Confidence Pills */}
      <View style={styles.qualitySection}>
        <QualityPill
          score={result.photoQuality.score}
          confidence={result.overall.confidence}
          issues={result.photoQuality.issues}
        />
      </View>

      {/* Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryText}>{result.overall.summary}</Text>
        <Text style={styles.calibrationNote}>{result.overall.calibrationNote}</Text>
      </View>

      {/* Face Shape */}
      <View style={styles.faceShapeSection}>
        <Text style={styles.sectionTitle}>Face Shape</Text>
        <View style={styles.faceShapeCard}>
          <Text style={styles.faceShapeLabel}>{result.faceShape.label}</Text>
          <Text style={styles.faceShapeDescription}>{result.faceShape.description}</Text>
        </View>
      </View>

      {/* Top Levers */}
      <View style={styles.leversSection}>
        <LeverList
          levers={result.topLevers}
          onLeverPress={(lever) => {
            // Could expand to show actions
          }}
        />
      </View>
    </View>
  );

  const renderFeaturesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Feature Breakdown</Text>
      <Text style={styles.sectionSubtitle}>
        Tap any feature for detailed insights
      </Text>
      <View style={styles.featuresList}>
        {result.features.map((feature) => (
          <FeatureCard
            key={feature.key}
            feature={feature}
            onPress={() => setSelectedFeature(feature)}
          />
        ))}
      </View>
    </View>
  );

  const renderMeasurementsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Key Ratios</Text>
      <Text style={styles.sectionSubtitle}>
        How your proportions compare to reference ranges
      </Text>
      <View style={styles.measurementsList}>
        {result.measurements.ratios.map((ratio) => (
          <MeasurementRow key={ratio.key} measurement={ratio} />
        ))}
      </View>

      {/* Symmetry Section */}
      <View style={styles.symmetrySection}>
        <Text style={styles.sectionTitle}>Symmetry Analysis</Text>
        <View style={styles.symmetryCard}>
          <View style={styles.symmetryScoreRow}>
            <Text style={styles.symmetryLabel}>Overall Symmetry</Text>
            <Text style={styles.symmetryScore}>
              {(result.measurements.symmetry.overall * 10).toFixed(1)}/10
            </Text>
          </View>
          <View style={styles.symmetryBar}>
            <View
              style={[
                styles.symmetryBarFill,
                { width: `${result.measurements.symmetry.overall * 100}%` },
              ]}
            />
          </View>
          {result.measurements.symmetry.notes.map((note, idx) => (
            <Text key={idx} style={styles.symmetryNote}>
              • {note}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStyleTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Style Recommendations</Text>
      <Text style={styles.sectionSubtitle}>
        Personalized suggestions based on your face shape and features
      </Text>

      {/* Haircuts */}
      <View style={styles.styleCategory}>
        <View style={styles.styleCategoryHeader}>
          <Text style={styles.styleCategoryIcon}>💇</Text>
          <Text style={styles.styleCategoryTitle}>Haircuts</Text>
        </View>
        <View style={styles.styleList}>
          {result.styleTips.haircuts.map((tip, idx) => (
            <View key={idx} style={styles.styleItem}>
              <Text style={styles.styleItemText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Glasses */}
      <View style={styles.styleCategory}>
        <View style={styles.styleCategoryHeader}>
          <Text style={styles.styleCategoryIcon}>👓</Text>
          <Text style={styles.styleCategoryTitle}>Glasses Frames</Text>
        </View>
        <View style={styles.styleList}>
          {result.styleTips.glasses.map((tip, idx) => (
            <View key={idx} style={styles.styleItem}>
              <Text style={styles.styleItemText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Facial Hair */}
      {result.styleTips.facialHair.length > 0 && (
        <View style={styles.styleCategory}>
          <View style={styles.styleCategoryHeader}>
            <Text style={styles.styleCategoryIcon}>🧔</Text>
            <Text style={styles.styleCategoryTitle}>Facial Hair</Text>
          </View>
          <View style={styles.styleList}>
            {result.styleTips.facialHair.map((tip, idx) => (
              <View key={idx} style={styles.styleItem}>
                <Text style={styles.styleItemText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Grooming */}
      <View style={styles.styleCategory}>
        <View style={styles.styleCategoryHeader}>
          <Text style={styles.styleCategoryIcon}>✨</Text>
          <Text style={styles.styleCategoryTitle}>Grooming Tips</Text>
        </View>
        <View style={styles.styleList}>
          {result.styleTips.grooming.map((tip, idx) => (
            <View key={idx} style={styles.styleItem}>
              <Text style={styles.styleItemText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'features':
        return renderFeaturesTab();
      case 'measurements':
        return renderMeasurementsTab();
      case 'style':
        return renderStyleTab();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Results</Text>
        <TouchableOpacity onPress={onRescan} style={styles.rescanButton}>
          <Text style={styles.rescanButtonText}>Rescan</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>{result.safety.disclaimer}</Text>
        </View>
      </ScrollView>

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <FeatureDetailModal
          feature={selectedFeature}
          visible={!!selectedFeature}
          onClose={() => setSelectedFeature(null)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rescanButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rescanButtonText: {
    fontSize: 14,
    color: '#00D9FF',
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#00D9FF',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#00D9FF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  tabContent: {
    padding: 20,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qualitySection: {
    marginBottom: 20,
  },
  summarySection: {
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  summaryText: {
    fontSize: 15,
    color: '#CCCCCC',
    lineHeight: 22,
    marginBottom: 12,
  },
  calibrationNote: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  faceShapeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 16,
  },
  faceShapeCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  faceShapeLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#00D9FF',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  faceShapeDescription: {
    fontSize: 14,
    color: '#888888',
    lineHeight: 20,
  },
  leversSection: {
    marginTop: 8,
  },
  featuresList: {
    gap: 14,
  },
  measurementsList: {
    gap: 10,
  },
  symmetrySection: {
    marginTop: 28,
  },
  symmetryCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  symmetryScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  symmetryLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  symmetryScore: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00D9FF',
  },
  symmetryBar: {
    height: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  symmetryBarFill: {
    height: '100%',
    backgroundColor: '#00D9FF',
    borderRadius: 4,
  },
  symmetryNote: {
    fontSize: 13,
    color: '#888888',
    lineHeight: 20,
    marginTop: 4,
  },
  styleCategory: {
    marginBottom: 24,
  },
  styleCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  styleCategoryIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  styleCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  styleList: {
    gap: 8,
  },
  styleItem: {
    backgroundColor: '#111111',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  styleItemText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  disclaimer: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#555555',
    lineHeight: 17,
    textAlign: 'center',
  },
});

export default FaceAnalyzerResultsScreen;
