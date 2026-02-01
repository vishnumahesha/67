// ============================================
// APPEARANCE PROFILE CARD
// Collapsible section - starts minimized
// ============================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeOut,
  Layout,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AppearanceProfile {
  presentation: string;
  confidence: number;
  ageRange?: { min: number; max: number } | null;
  ageConfidence?: number | null;
  dimorphismScore10?: number | null;
  masculinityFemininity?: {
    masculinity: number;
    femininity: number;
  } | null;
  faceShape?: {
    label: string;
    confidence: number;
  } | null;
  photoLimitation?: string | null;
}

interface HarmonyIndex {
  score10: number;
  confidence: string;
  components: {
    facialSymmetry?: {
      score10: number;
      deviationPct?: number;
      note?: string;
    };
    facialThirds?: {
      score10: number;
      upper?: number;
      middle?: number;
      lower?: number;
      idealDeviation?: string;
      note?: string;
    };
    horizontalFifths?: {
      score10: number;
      balanced?: boolean;
      note?: string;
    };
    goldenRatioProximity?: {
      score10: number;
      faceWidthToHeight?: number;
      eyeSpacingRatio?: number;
      note?: string;
    };
  };
  overallNote?: string;
}

interface Props {
  appearanceProfile?: AppearanceProfile | null;
  harmonyIndex?: HarmonyIndex | null;
}

// Score color helper
function getScoreColor(score: number) {
  if (score >= 7.5) return colors.success;
  if (score >= 5.5) return '#10B981';
  if (score >= 4) return colors.warning;
  return colors.error;
}

// Mini stat pill for collapsed view
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={styles.miniStatValue}>{value}</Text>
    </View>
  );
}

// Profile Card component
function ProfileCard({ 
  icon, 
  label, 
  value, 
  score, 
  confidence,
  subtitle 
}: { 
  icon: string; 
  label: string; 
  value?: string;
  score?: number;
  confidence?: number;
  subtitle?: string;
}) {
  const scoreColor = score ? getScoreColor(score) : colors.primary;
  const progressWidth = score ? (score / 10) * 100 : 0;
  
  return (
    <View style={styles.profileCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardIcon}>{icon}</Text>
          <Text style={styles.cardLabel}>{label}</Text>
          {confidence !== undefined && confidence > 0 && (
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceBadgeText}>
                {confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'med' : 'low'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.cardRight}>
          {score !== undefined ? (
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>
                {score.toFixed(1)}
              </Text>
              <Text style={styles.scoreMax}>/10</Text>
            </View>
          ) : (
            <Text style={styles.valueText}>{value}</Text>
          )}
        </View>
      </View>
      
      {subtitle && (
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      )}
      
      {score !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBg}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progressWidth}%`, backgroundColor: scoreColor }
              ]} 
            />
          </View>
        </View>
      )}
    </View>
  );
}

// Harmony metric card
function HarmonyCard({ 
  icon, 
  label, 
  score, 
  note 
}: { 
  icon: string; 
  label: string; 
  score: number; 
  note?: string;
}) {
  const scoreColor = getScoreColor(score);
  const progressWidth = (score / 10) * 100;
  
  return (
    <View style={styles.harmonyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardIcon}>{icon}</Text>
          <Text style={styles.cardLabel}>{label}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>
            {score.toFixed(1)}
          </Text>
          <Text style={styles.scoreMax}>/10</Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressWidth}%`, backgroundColor: scoreColor }
            ]} 
          />
        </View>
      </View>
      
      {note && (
        <Text style={styles.harmonyNote}>{note}</Text>
      )}
    </View>
  );
}

// Gender bar component
function GenderBar({ masculinity, femininity }: { masculinity: number; femininity: number }) {
  const total = masculinity + femininity;
  const femPct = total > 0 ? (femininity / total) * 100 : 50;
  
  return (
    <View style={styles.genderCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardIcon}>⚤</Text>
          <Text style={styles.cardLabel}>Masc / Fem Balance</Text>
        </View>
      </View>
      
      <View style={styles.genderBarWrapper}>
        <View style={styles.genderLabels}>
          <View style={styles.genderLabelItem}>
            <Text style={styles.genderEmoji}>♂️</Text>
            <Text style={styles.genderValue}>{masculinity}</Text>
          </View>
          <View style={styles.genderLabelItem}>
            <Text style={styles.genderValue}>{femininity}</Text>
            <Text style={styles.genderEmoji}>♀️</Text>
          </View>
        </View>
        <View style={styles.genderBar}>
          <LinearGradient
            colors={['#5B8DEF', '#E879A9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.genderBarGradient}
          />
          <View style={[styles.genderIndicator, { left: `${femPct}%` }]} />
        </View>
        <View style={styles.genderTextLabels}>
          <Text style={styles.genderText}>Masculine</Text>
          <Text style={styles.genderText}>Feminine</Text>
        </View>
      </View>
    </View>
  );
}

export function AppearanceProfileCard({ appearanceProfile, harmonyIndex }: Props) {
  const [expanded, setExpanded] = useState(false);
  
  if (!appearanceProfile && !harmonyIndex) return null;
  
  const formatPresentation = (p: string) => {
    const clean = p.replace('-presenting', '');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  // Summary values for collapsed view
  const summaryItems = [];
  if (appearanceProfile?.presentation) {
    summaryItems.push({ 
      label: 'Presentation', 
      value: formatPresentation(appearanceProfile.presentation) 
    });
  }
  if (appearanceProfile?.ageRange) {
    summaryItems.push({ 
      label: 'Age', 
      value: `${appearanceProfile.ageRange.min}-${appearanceProfile.ageRange.max}` 
    });
  }
  if (harmonyIndex) {
    summaryItems.push({ 
      label: 'Harmony', 
      value: `${harmonyIndex.score10.toFixed(1)}/10` 
    });
  }
  if (appearanceProfile?.faceShape) {
    summaryItems.push({ 
      label: 'Shape', 
      value: appearanceProfile.faceShape.label.charAt(0).toUpperCase() + 
             appearanceProfile.faceShape.label.slice(1) 
    });
  }
  
  return (
    <Animated.View layout={Layout.springify()} style={styles.container}>
      {/* Collapsible Header */}
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>👤</Text>
          <View>
            <Text style={styles.headerTitle}>Appearance Profile</Text>
            <Text style={styles.headerSubtitle}>Demographics & facial harmony</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.expandButton, expanded && styles.expandButtonActive]}>
            <Text style={[styles.expandIcon, expanded && styles.expandIconActive]}>
              {expanded ? '−' : '+'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Collapsed Summary View */}
      {!expanded && (
        <Animated.View 
          entering={FadeIn.duration(200)} 
          exiting={FadeOut.duration(100)}
          style={styles.collapsedContent}
        >
          <View style={styles.miniStatsRow}>
            {summaryItems.slice(0, 4).map((item, idx) => (
              <MiniStat key={idx} label={item.label} value={item.value} />
            ))}
          </View>
          <Text style={styles.tapHint}>Tap to expand for full details</Text>
        </Animated.View>
      )}
      
      {/* Expanded Full View */}
      {expanded && (
        <Animated.View 
          entering={FadeInDown.duration(300)} 
          exiting={FadeOut.duration(150)}
          style={styles.expandedContent}
        >
          {/* Profile Cards */}
          {appearanceProfile && (
            <View style={styles.cardsGrid}>
              {/* Presentation Card */}
              <ProfileCard
                icon="👤"
                label="Presentation"
                value={`${formatPresentation(appearanceProfile.presentation)} ${Math.round(appearanceProfile.confidence * 100)}%`}
                confidence={appearanceProfile.confidence}
              />
              
              {/* Age Estimate Card */}
              {appearanceProfile.ageRange && (
                <ProfileCard
                  icon="📅"
                  label="Age Estimate"
                  value={`${appearanceProfile.ageRange.min}-${appearanceProfile.ageRange.max} years`}
                  confidence={appearanceProfile.ageConfidence || undefined}
                />
              )}
              
              {/* Dimorphism Score Card */}
              {appearanceProfile.dimorphismScore10 && (
                <ProfileCard
                  icon="💎"
                  label="Dimorphism Score"
                  score={appearanceProfile.dimorphismScore10}
                  subtitle={
                    appearanceProfile.dimorphismScore10 >= 7 ? 'Pronounced features' : 
                    appearanceProfile.dimorphismScore10 >= 5 ? 'Balanced features' : 'Subtle features'
                  }
                  confidence={0.75}
                />
              )}
              
              {/* Face Shape Card */}
              {appearanceProfile.faceShape && (
                <ProfileCard
                  icon="🔲"
                  label="Face Shape"
                  value={appearanceProfile.faceShape.label.charAt(0).toUpperCase() + 
                         appearanceProfile.faceShape.label.slice(1)}
                  confidence={appearanceProfile.faceShape.confidence}
                />
              )}
              
              {/* Masculinity / Femininity */}
              {appearanceProfile.masculinityFemininity && (
                <GenderBar 
                  masculinity={appearanceProfile.masculinityFemininity.masculinity}
                  femininity={appearanceProfile.masculinityFemininity.femininity}
                />
              )}
            </View>
          )}
          
          {/* Harmony Index Section */}
          {harmonyIndex && (
            <View style={styles.harmonySection}>
              <View style={styles.harmonySectionHeader}>
                <View style={styles.harmonyTitleRow}>
                  <Text style={styles.harmonyIcon}>📐</Text>
                  <Text style={styles.harmonySectionTitle}>Harmony Index</Text>
                </View>
                <View style={styles.harmonyOverallBadge}>
                  <Text style={[styles.harmonyOverallScore, { color: getScoreColor(harmonyIndex.score10) }]}>
                    {harmonyIndex.score10.toFixed(1)}
                  </Text>
                  <Text style={styles.harmonyOverallMax}>/10</Text>
                </View>
              </View>
              
              <View style={styles.harmonyGrid}>
                {harmonyIndex.components.facialSymmetry && (
                  <HarmonyCard
                    icon="⚖️"
                    label="Facial Symmetry"
                    score={harmonyIndex.components.facialSymmetry.score10}
                    note={harmonyIndex.components.facialSymmetry.note}
                  />
                )}
                
                {harmonyIndex.components.facialThirds && (
                  <HarmonyCard
                    icon="📏"
                    label="Facial Thirds"
                    score={harmonyIndex.components.facialThirds.score10}
                    note={harmonyIndex.components.facialThirds.note}
                  />
                )}
                
                {harmonyIndex.components.horizontalFifths && (
                  <HarmonyCard
                    icon="↔️"
                    label="Horizontal Fifths"
                    score={harmonyIndex.components.horizontalFifths.score10}
                    note={harmonyIndex.components.horizontalFifths.note}
                  />
                )}
                
                {harmonyIndex.components.goldenRatioProximity && (
                  <HarmonyCard
                    icon="✨"
                    label="Golden Ratio"
                    score={harmonyIndex.components.goldenRatioProximity.score10}
                    note={harmonyIndex.components.goldenRatioProximity.note}
                  />
                )}
              </View>
              
              {harmonyIndex.overallNote && (
                <Text style={styles.harmonyOverallNote}>{harmonyIndex.overallNote}</Text>
              )}
            </View>
          )}
          
          {/* Disclaimer */}
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerIcon}>ℹ️</Text>
            <Text style={styles.disclaimerText}>
              Estimates based on this photo. Lighting, angle, and expression can affect results.
            </Text>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  expandButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  expandIcon: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  expandIconActive: {
    color: colors.background,
  },
  
  // Collapsed Content
  collapsedContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  miniStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  miniStat: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  miniStatLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  miniStatValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '700',
  },
  tapHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  
  // Expanded Content
  expandedContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  
  // Cards Grid
  cardsGrid: {
    gap: spacing.sm,
  },
  
  // Profile Card
  profileCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  cardIcon: {
    fontSize: 16,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  confidenceBadge: {
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  confidenceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.success,
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  scoreMax: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 2,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginLeft: 28,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBg: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  // Gender Card
  genderCard: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  genderBarWrapper: {
    marginTop: spacing.sm,
  },
  genderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  genderLabelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  genderEmoji: {
    fontSize: 14,
  },
  genderValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  genderBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  genderBarGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  genderIndicator: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.text,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: colors.background,
    ...shadows.md,
  },
  genderTextLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  genderText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  
  // Harmony Section
  harmonySection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  harmonySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  harmonyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  harmonyIcon: {
    fontSize: 16,
  },
  harmonySectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  harmonyOverallBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  harmonyOverallScore: {
    fontSize: 18,
    fontWeight: '800',
  },
  harmonyOverallMax: {
    fontSize: 11,
    color: colors.textMuted,
  },
  
  // Harmony Grid
  harmonyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  harmonyCard: {
    width: (SCREEN_WIDTH - spacing.md * 4 - spacing.sm) / 2,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  harmonyNote: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.xs,
    lineHeight: 14,
  },
  harmonyOverallNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  
  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
  disclaimerIcon: {
    fontSize: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
});

export default AppearanceProfileCard;
