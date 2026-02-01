/**
 * Face Analyzer Start Screen
 * Instructions and capture tips before starting analysis
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
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  bg: '#0a0a0f',
  surface: '#12121a',
  surfaceLight: '#1a1a24',
  border: '#2a2a3a',
  primary: '#6366f1',
  primaryDim: '#4f46e5',
  accent: '#22d3ee',
  success: '#10b981',
  warning: '#f59e0b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
};

interface TipCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  importance: 'required' | 'recommended' | 'optional';
}

function TipCard({ icon, title, description, importance }: TipCardProps) {
  const importanceColors = {
    required: COLORS.warning,
    recommended: COLORS.accent,
    optional: COLORS.textMuted,
  };

  return (
    <View style={styles.tipCard}>
      <View style={[styles.tipIcon, { backgroundColor: `${importanceColors[importance]}20` }]}>
        <Ionicons name={icon} size={24} color={importanceColors[importance]} />
      </View>
      <View style={styles.tipContent}>
        <View style={styles.tipHeader}>
          <Text style={styles.tipTitle}>{title}</Text>
          <Text style={[styles.tipBadge, { color: importanceColors[importance] }]}>
            {importance.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.tipDescription}>{description}</Text>
      </View>
    </View>
  );
}

export default function FaceAnalyzerStartScreen() {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');

  const handleStart = () => {
    router.push({
      pathname: '/face-analyzer/capture',
      params: { gender: selectedGender },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Face Analysis</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroIconContainer}>
            <Ionicons name="scan-outline" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>Honest Facial Analysis</Text>
          <Text style={styles.heroSubtitle}>
            Get your current score, realistic potential, and actionable improvement plan
          </Text>
        </View>

        {/* What You'll Get */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You'll Get</Text>
          <View style={styles.featureGrid}>
            <View style={styles.featureItem}>
              <Ionicons name="analytics-outline" size={24} color={COLORS.accent} />
              <Text style={styles.featureText}>Current Score</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="trending-up-outline" size={24} color={COLORS.success} />
              <Text style={styles.featureText}>Potential Range</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="layers-outline" size={24} color={COLORS.primary} />
              <Text style={styles.featureText}>Feature Breakdown</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="rocket-outline" size={24} color={COLORS.warning} />
              <Text style={styles.featureText}>Top 3 Levers</Text>
            </View>
          </View>
        </View>

        {/* Photo Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo Tips</Text>
          <View style={styles.tipsContainer}>
            <TipCard
              icon="sunny-outline"
              title="Natural Lighting"
              description="Face a window for soft, even lighting. Avoid harsh overhead lights or shadows."
              importance="required"
            />
            <TipCard
              icon="camera-reverse-outline"
              title="Use Back Camera"
              description="Back camera has less distortion than front camera for accurate proportions."
              importance="recommended"
            />
            <TipCard
              icon="happy-outline"
              title="Neutral Expression"
              description="Relax your face. Neutral mouth, eyes forward, natural brow position."
              importance="required"
            />
            <TipCard
              icon="body-outline"
              title="Side Profile"
              description="Optional but improves jaw/chin analysis accuracy significantly."
              importance="optional"
            />
          </View>
        </View>

        {/* Gender Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Profile</Text>
          <View style={styles.genderSelector}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                selectedGender === 'male' && styles.genderButtonActive,
              ]}
              onPress={() => setSelectedGender('male')}
            >
              <Ionicons
                name="male"
                size={24}
                color={selectedGender === 'male' ? COLORS.text : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.genderText,
                  selectedGender === 'male' && styles.genderTextActive,
                ]}
              >
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                selectedGender === 'female' && styles.genderButtonActive,
              ]}
              onPress={() => setSelectedGender('female')}
            >
              <Ionicons
                name="female"
                size={24}
                color={selectedGender === 'female' ? COLORS.text : COLORS.textMuted}
              />
              <Text
                style={[
                  styles.genderText,
                  selectedGender === 'female' && styles.genderTextActive,
                ]}
              >
                Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calibration Note */}
        <View style={styles.calibrationNote}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.textMuted} />
          <Text style={styles.calibrationText}>
            Scores are calibrated realistically. Average is ~5.5/10. Most people score 4.5-6.5. 
            This isn't flattery - it's honest feedback for real improvement.
          </Text>
        </View>
      </ScrollView>

      {/* Start Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>Start Analysis</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  placeholder: {
    width: 40,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureItem: {
    flexBasis: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  tipsContainer: {
    gap: 12,
  },
  tipCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: {
    flex: 1,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  tipBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tipDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  genderSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  genderButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  genderTextActive: {
    color: COLORS.text,
  },
  calibrationNote: {
    marginHorizontal: 16,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calibrationText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textMuted,
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
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
});
