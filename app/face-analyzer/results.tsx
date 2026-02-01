/**
 * Face Analyzer Results Screen
 * Shows comprehensive analysis with tabs: Overview, Features, Measurements, Style
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import DualScoreRing from './components/DualScoreRing';
import FeatureCard from './components/FeatureCard';
import TopLeversSection from './components/TopLeversSection';
import FeatureDetailModal from './components/FeatureDetailModal';
import { useAppStore } from '../../store/useAppStore';

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

type TabKey = 'overview' | 'features' | 'measurements' | 'style';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'overview', label: 'Overview', icon: 'analytics-outline' },
  { key: 'features', label: 'Features', icon: 'layers-outline' },
  { key: 'measurements', label: 'Measurements', icon: 'resize-outline' },
  { key: 'style', label: 'Style', icon: 'shirt-outline' },
];

// Mock data - in production this would come from the analysis
const MOCK_RESULT = {
  overall: {
    currentScore10: 5.6,
    potentialScoreRange: { min: 6.4, max: 7.1 },
    confidence: 'medium' as const,
    summary: 'Average overall with good structural foundation. Significant improvement potential through grooming and skincare.',
  },
  photoQuality: {
    score: 0.72,
    issues: ['side_missing'],
  },
  faceShape: {
    label: 'oval',
    description: 'Your face shape appears to be oval, which is versatile for most styles.',
  },
  topLevers: [
    {
      lever: 'skin_routine',
      label: 'Skincare Routine',
      deltaMin: 0.3,
      deltaMax: 0.7,
      why: 'Visible texture improvements possible with consistent routine',
      timeline: '8_12_weeks' as const,
      priority: 1,
      actions: ['Morning: cleanser + moisturizer + SPF', 'Evening: cleanser + moisturizer', 'Consider retinol after 4 weeks'],
    },
    {
      lever: 'hair_styling',
      label: 'Hair Styling',
      deltaMin: 0.2,
      deltaMax: 0.5,
      why: 'Hairstyle optimization for face shape offers quick impact',
      timeline: 'today' as const,
      priority: 2,
      actions: ['Research styles for oval face', 'Consult with stylist', 'Try styling products'],
    },
    {
      lever: 'brow_grooming',
      label: 'Brow Grooming',
      deltaMin: 0.1,
      deltaMax: 0.3,
      why: 'Clean-up and definition can enhance eye area framing',
      timeline: 'today' as const,
      priority: 3,
      actions: ['Brush brows up, trim strays', 'Clean below arch', 'Consider professional shaping'],
    },
  ],
  features: [
    {
      key: 'eyes',
      label: 'Eyes',
      rating10: 6.2,
      confidence: 'high' as const,
      summary: 'Above average eye presentation',
      strengths: ['Good symmetry', 'Positive canthal tilt'],
      whatLimitsIt: ['Under-eye darkness visible'],
      why: ['Eye spacing within ideal range', 'Good palpebral fissure shape'],
      fixes: [
        {
          title: 'Under-eye care routine',
          type: 'routine',
          difficulty: 'easy',
          timeline: '2_4_weeks',
          steps: ['Apply caffeine eye cream morning and night', 'Get 7-9 hours consistent sleep', 'Stay hydrated'],
          expectedDelta: 0.2,
        },
      ],
    },
    {
      key: 'brows',
      label: 'Brows',
      rating10: 5.4,
      confidence: 'medium' as const,
      summary: 'Average brow presentation',
      strengths: ['Natural fullness'],
      whatLimitsIt: ['Could benefit from shaping', 'Minor asymmetry'],
      why: ['Adequate thickness', 'Position acceptable'],
      fixes: [
        {
          title: 'Professional brow shaping',
          type: 'low_cost',
          difficulty: 'easy',
          timeline: 'today',
          steps: ['Find experienced specialist', 'Request natural enhancement', 'Maintain shape at home'],
          expectedDelta: 0.3,
        },
      ],
    },
    {
      key: 'nose',
      label: 'Nose',
      rating10: 5.8,
      confidence: 'medium' as const,
      summary: 'Average nose proportions',
      strengths: ['Proportionate to face'],
      whatLimitsIt: ['Side view needed for full assessment'],
      why: ['Width within normal range', 'Bridge definition adequate'],
      fixes: [],
    },
    {
      key: 'lips',
      label: 'Lips',
      rating10: 5.5,
      confidence: 'medium' as const,
      summary: 'Average lip presentation',
      strengths: ['Natural shape', 'Good width proportion'],
      whatLimitsIt: ['Could use hydration'],
      why: ['Mouth width proportionate', 'Lip ratio normal'],
      fixes: [
        {
          title: 'Lip care routine',
          type: 'no_cost',
          difficulty: 'easy',
          timeline: '2_4_weeks',
          steps: ['Regular lip balm', 'Weekly gentle exfoliation', 'Stay hydrated'],
          expectedDelta: 0.1,
        },
      ],
    },
    {
      key: 'jawline',
      label: 'Jawline/Chin',
      rating10: 5.2,
      confidence: 'low' as const,
      summary: 'Below average definition (limited by photo quality)',
      strengths: ['Basic structure present'],
      whatLimitsIt: ['Definition affected by posture', 'Side view would improve assessment'],
      why: ['Jaw width normal', 'Chin assessment limited'],
      fixes: [
        {
          title: 'Posture exercises',
          type: 'no_cost',
          difficulty: 'easy',
          timeline: '2_4_weeks',
          steps: ['Chin tucks: 2 sets of 10 daily', 'Hold 2-3 seconds each', 'Check posture hourly'],
          expectedDelta: 0.2,
        },
      ],
    },
    {
      key: 'skin',
      label: 'Skin',
      rating10: 5.0,
      confidence: 'low' as const,
      summary: 'Below average skin presentation (lighting affects assessment)',
      strengths: ['No major concerns visible'],
      whatLimitsIt: ['Texture visible', 'Tone could be more even'],
      why: ['Photo quality limits accurate assessment', 'General texture notes'],
      fixes: [
        {
          title: 'Basic skincare routine',
          type: 'low_cost',
          difficulty: 'easy',
          timeline: '8_12_weeks',
          steps: ['Morning: cleanser, moisturizer, SPF', 'Evening: cleanser, moisturizer', 'Be consistent'],
          expectedDelta: 0.5,
        },
      ],
    },
    {
      key: 'hair',
      label: 'Hair',
      rating10: 5.6,
      confidence: 'medium' as const,
      summary: 'Average hair presentation',
      strengths: ['Natural texture'],
      whatLimitsIt: ['Style could better complement face shape'],
      why: ['Hair visible and assessable', 'Style has room for optimization'],
      fixes: [
        {
          title: 'Face-shape haircut',
          type: 'low_cost',
          difficulty: 'easy',
          timeline: 'today',
          steps: ['Research oval face styles', 'Bring references to stylist', 'Consider maintenance routine'],
          expectedDelta: 0.4,
        },
      ],
    },
    {
      key: 'harmony',
      label: 'Harmony',
      rating10: 5.8,
      confidence: 'medium' as const,
      summary: 'Above average facial harmony',
      strengths: ['Features work together', 'Reasonable symmetry'],
      whatLimitsIt: ['Minor asymmetries (normal)'],
      why: ['Proportions within acceptable ranges', 'No major imbalances'],
      fixes: [],
    },
  ],
  measurements: {
    ratios: [
      { key: 'Eye Spacing', value: '0.31', ideal: '0.28-0.35', status: 'ideal' },
      { key: 'Nose Width', value: '0.27', ideal: '0.22-0.30', status: 'ideal' },
      { key: 'Mouth Width', value: '0.45', ideal: '0.38-0.50', status: 'ideal' },
      { key: 'Face W/H', value: '0.68', ideal: '0.62-0.72', status: 'ideal' },
      { key: 'Jaw/Cheek', value: '0.81', ideal: '0.75-0.90', status: 'ideal' },
    ],
    symmetry: {
      score: 7.2,
      notes: ['Minor eye height difference', 'Nose slightly off-center (common)'],
    },
  },
  styleTips: {
    haircuts: ['Most styles work for oval face', 'Add volume on top for balance', 'Side parts complement'],
    glasses: ['Most frame shapes work', 'Avoid overly large frames'],
    facialHair: ['Most beard styles work', 'Define neckline cleanly'],
    grooming: ['Keep brows groomed naturally', 'Regular skincare routine'],
  },
};

export default function FaceAnalyzerResultsScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedFeature, setSelectedFeature] = useState<typeof MOCK_RESULT.features[0] | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const frontPhotoUri = useAppStore((state) => state.frontPhotoUri);

  const handleFeaturePress = (feature: typeof MOCK_RESULT.features[0]) => {
    setSelectedFeature(feature);
    setModalVisible(true);
  };

  const handleBestVersion = () => {
    router.push({
      pathname: '/best-version',
      params: { imageUri: frontPhotoUri || '' },
    });
  };

  const totalPotentialGain = MOCK_RESULT.topLevers.reduce((sum, l) => sum + l.deltaMax, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Analysis Results</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'overview' && (
          <>
            {/* Photo quality warning */}
            {MOCK_RESULT.photoQuality.issues.length > 0 && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning" size={18} color={COLORS.warning} />
                <Text style={styles.warningText}>
                  Side photo missing - some assessments have reduced confidence
                </Text>
              </View>
            )}

            {/* Dual score ring */}
            <View style={styles.scoreSection}>
              <DualScoreRing
                currentScore={MOCK_RESULT.overall.currentScore10}
                potentialMin={MOCK_RESULT.overall.potentialScoreRange.min}
                potentialMax={MOCK_RESULT.overall.potentialScoreRange.max}
                confidence={MOCK_RESULT.overall.confidence}
                size={220}
              />
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryText}>{MOCK_RESULT.overall.summary}</Text>
            </View>

            {/* Best Version CTA */}
            <TouchableOpacity 
              style={styles.bestVersionCard}
              onPress={handleBestVersion}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#a855f7', '#6366f1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bestVersionGradient}
              >
                <View style={styles.bestVersionContent}>
                  <View style={styles.bestVersionIconContainer}>
                    <Ionicons name="sparkles" size={24} color="#fff" />
                  </View>
                  <View style={styles.bestVersionTextContainer}>
                    <Text style={styles.bestVersionTitle}>See Your Best Version!</Text>
                    <Text style={styles.bestVersionSubtitle}>
                      AI-enhanced photo with optimized lighting, skin & styling
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.8)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Face shape */}
            <View style={styles.faceShapeCard}>
              <Ionicons name="ellipse-outline" size={20} color={COLORS.accent} />
              <View style={styles.faceShapeContent}>
                <Text style={styles.faceShapeLabel}>Face Shape: {MOCK_RESULT.faceShape.label}</Text>
                <Text style={styles.faceShapeDesc}>{MOCK_RESULT.faceShape.description}</Text>
              </View>
            </View>

            {/* Top Levers */}
            <TopLeversSection
              levers={MOCK_RESULT.topLevers}
              totalPotentialGain={totalPotentialGain}
            />

            {/* Calibration note */}
            <View style={styles.calibrationNote}>
              <Ionicons name="information-circle" size={16} color={COLORS.textMuted} />
              <Text style={styles.calibrationText}>
                Scores calibrated realistically (avg ~5.5). Most people score 4.5-6.5.
              </Text>
            </View>
          </>
        )}

        {activeTab === 'features' && (
          <View style={styles.featuresGrid}>
            {MOCK_RESULT.features.map((feature) => (
              <FeatureCard
                key={feature.key}
                featureKey={feature.key}
                label={feature.label}
                rating={feature.rating10}
                confidence={feature.confidence}
                summary={feature.summary}
                onPress={() => handleFeaturePress(feature)}
              />
            ))}
          </View>
        )}

        {activeTab === 'measurements' && (
          <>
            {/* Ratios */}
            <View style={styles.measurementsSection}>
              <Text style={styles.measurementsTitle}>Key Ratios</Text>
              {MOCK_RESULT.measurements.ratios.map((ratio) => (
                <View key={ratio.key} style={styles.ratioRow}>
                  <Text style={styles.ratioLabel}>{ratio.key}</Text>
                  <View style={styles.ratioValues}>
                    <Text style={[styles.ratioValue, {
                      color: ratio.status === 'ideal' ? COLORS.success : COLORS.warning
                    }]}>
                      {ratio.value}
                    </Text>
                    <Text style={styles.ratioIdeal}>({ratio.ideal})</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Symmetry */}
            <View style={styles.symmetrySection}>
              <Text style={styles.measurementsTitle}>Symmetry Analysis</Text>
              <View style={styles.symmetryScoreRow}>
                <Text style={styles.symmetryLabel}>Overall Symmetry</Text>
                <Text style={[styles.symmetryScore, { color: COLORS.success }]}>
                  {MOCK_RESULT.measurements.symmetry.score.toFixed(1)}/10
                </Text>
              </View>
              <View style={styles.symmetryNotes}>
                {MOCK_RESULT.measurements.symmetry.notes.map((note, i) => (
                  <View key={i} style={styles.symmetryNoteItem}>
                    <View style={styles.noteDot} />
                    <Text style={styles.noteText}>{note}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {activeTab === 'style' && (
          <>
            <View style={styles.styleSection}>
              <View style={styles.styleSectionHeader}>
                <Ionicons name="cut" size={20} color={COLORS.primary} />
                <Text style={styles.styleSectionTitle}>Haircuts</Text>
              </View>
              {MOCK_RESULT.styleTips.haircuts.map((tip, i) => (
                <View key={i} style={styles.tipItem}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            <View style={styles.styleSection}>
              <View style={styles.styleSectionHeader}>
                <Ionicons name="glasses" size={20} color={COLORS.accent} />
                <Text style={styles.styleSectionTitle}>Glasses</Text>
              </View>
              {MOCK_RESULT.styleTips.glasses.map((tip, i) => (
                <View key={i} style={styles.tipItem}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            <View style={styles.styleSection}>
              <View style={styles.styleSectionHeader}>
                <Ionicons name="man" size={20} color={COLORS.success} />
                <Text style={styles.styleSectionTitle}>Facial Hair</Text>
              </View>
              {MOCK_RESULT.styleTips.facialHair.map((tip, i) => (
                <View key={i} style={styles.tipItem}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            <View style={styles.styleSection}>
              <View style={styles.styleSectionHeader}>
                <Ionicons name="sparkles" size={20} color={COLORS.warning} />
                <Text style={styles.styleSectionTitle}>Grooming Tips</Text>
              </View>
              {MOCK_RESULT.styleTips.grooming.map((tip, i) => (
                <View key={i} style={styles.tipItem}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* New Scan Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.newScanButton}
          onPress={() => router.replace('/face-analyzer')}
        >
          <Ionicons name="refresh" size={20} color={COLORS.text} />
          <Text style={styles.newScanText}>New Analysis</Text>
        </TouchableOpacity>
      </View>

      {/* Feature Detail Modal */}
      <FeatureDetailModal
        visible={modalVisible}
        feature={selectedFeature}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
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
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
  },
  tabActive: {
    backgroundColor: `${COLORS.primary}20`,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
    gap: 20,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${COLORS.warning}15`,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: `${COLORS.warning}30`,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.warning,
  },
  scoreSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  // Best Version Card
  bestVersionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  bestVersionGradient: {
    padding: 1,
    borderRadius: 16,
  },
  bestVersionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    padding: 16,
    gap: 14,
  },
  bestVersionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestVersionTextContainer: {
    flex: 1,
  },
  bestVersionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  bestVersionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  faceShapeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  faceShapeContent: {
    flex: 1,
  },
  faceShapeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  faceShapeDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  calibrationNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
  },
  calibrationText: {
    fontSize: 12,
    color: COLORS.textMuted,
    flex: 1,
  },
  featuresGrid: {
    gap: 12,
  },
  measurementsSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  measurementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  ratioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ratioLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  ratioValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratioValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  ratioIdeal: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  symmetrySection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  symmetryScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  symmetryLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  symmetryScore: {
    fontSize: 18,
    fontWeight: '700',
  },
  symmetryNotes: {
    gap: 8,
  },
  symmetryNoteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
    marginTop: 6,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  styleSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  styleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  styleSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
  },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  newScanButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  newScanText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});
