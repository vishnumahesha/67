/**
 * Best Version Screen
 * AI-powered image enhancement that shows your best version
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { generateBestVersion, BestVersionResponse } from '../../services/bestVersion';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH - 64;

const COLORS = {
  bg: '#050508',
  surface: '#0f0f14',
  surfaceLight: '#16161d',
  surfaceAccent: '#1c1c26',
  border: '#2a2a3a',
  primary: '#a855f7',
  primaryDark: '#7c3aed',
  accent: '#06b6d4',
  accentGlow: '#22d3ee',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  gold: '#fbbf24',
  rose: '#f43f5e',
};

const LOADING_MESSAGES = [
  'Analyzing your features...',
  'Enhancing lighting...',
  'Refining skin texture...',
  'Optimizing hair styling...',
  'Adding finishing touches...',
  'Almost there...',
];

export default function BestVersionScreen() {
  const params = useLocalSearchParams<{ imageUri?: string }>();
  const [selectedImage, setSelectedImage] = useState<string | null>(params.imageUri || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [result, setResult] = useState<BestVersionResponse | null>(null);
  const [showAfter, setShowAfter] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.95))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  // Auto-generate if imageUri was passed
  useEffect(() => {
    if (params.imageUri && !result && !isGenerating) {
      handleGenerate();
    }
  }, [params.imageUri]);

  // Loading message rotation
  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isGenerating]);

  // Pulse animation for loading
  useEffect(() => {
    if (isGenerating) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isGenerating]);

  // Result animation
  useEffect(() => {
    if (result) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [result]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      alert('Permission to access photos is required!');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setSelectedImage(pickerResult.assets[0].uri);
      setResult(null);
      setError(null);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      alert('Permission to access camera is required!');
      return;
    }

    const cameraResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!cameraResult.canceled && cameraResult.assets[0]) {
      setSelectedImage(cameraResult.assets[0].uri);
      setResult(null);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage) return;

    setIsGenerating(true);
    setError(null);
    setLoadingMessageIndex(0);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);

    try {
      const response = await generateBestVersion(selectedImage);
      setResult(response);
    } catch (err) {
      setError('Generation failed. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetState = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    setShowAfter(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="sparkles" size={20} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Best Version</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        {!selectedImage && !result && (
          <View style={styles.heroSection}>
            <LinearGradient
              colors={['#a855f720', '#06b6d410', 'transparent']}
              style={styles.heroGradient}
            />
            <View style={styles.heroIconContainer}>
              <Ionicons name="sparkles" size={48} color={COLORS.primary} />
            </View>
            <Text style={styles.heroTitle}>See Your Best Self</Text>
            <Text style={styles.heroSubtitle}>
              AI-powered enhancement that preserves your identity while optimizing your presentation
            </Text>

            {/* Image Selection Options */}
            <View style={styles.selectionOptions}>
              <TouchableOpacity style={styles.optionCard} onPress={takePhoto}>
                <LinearGradient
                  colors={[COLORS.primary + '30', COLORS.primaryDark + '10']}
                  style={styles.optionGradient}
                />
                <View style={styles.optionIcon}>
                  <Ionicons name="camera" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.optionTitle}>Take Photo</Text>
                <Text style={styles.optionSubtitle}>Use camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard} onPress={pickImage}>
                <LinearGradient
                  colors={[COLORS.accent + '30', COLORS.accent + '10']}
                  style={styles.optionGradient}
                />
                <View style={[styles.optionIcon, { backgroundColor: COLORS.accent + '20' }]}>
                  <Ionicons name="images" size={28} color={COLORS.accent} />
                </View>
                <Text style={styles.optionTitle}>Choose Photo</Text>
                <Text style={styles.optionSubtitle}>From gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Selected Image - Before Generate */}
        {selectedImage && !result && !isGenerating && (
          <View style={styles.previewSection}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity 
                style={styles.changeImageButton}
                onPress={resetState}
              >
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.generateButton}
              onPress={handleGenerate}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.generateGradient}
              >
                <Ionicons name="sparkles" size={22} color={COLORS.text} />
                <Text style={styles.generateButtonText}>Generate Best Version</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.disclaimerBox}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
              <Text style={styles.disclaimerText}>
                Your identity is preserved. Only lighting, skin, hair, and grooming are enhanced.
              </Text>
            </View>
          </View>
        )}

        {/* Loading State */}
        {isGenerating && (
          <View style={styles.loadingSection}>
            <Animated.View 
              style={[
                styles.loadingImageContainer,
                { transform: [{ scale: pulseAnim }] }
              ]}
            >
              {selectedImage && (
                <Image 
                  source={{ uri: selectedImage }} 
                  style={styles.loadingImage}
                  blurRadius={3}
                />
              )}
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            </Animated.View>

            <View style={styles.loadingTextContainer}>
              <Text style={styles.loadingTitle}>Creating Your Best Version</Text>
              <Text style={styles.loadingMessage}>
                {LOADING_MESSAGES[loadingMessageIndex]}
              </Text>
            </View>

            <View style={styles.loadingProgress}>
              {LOADING_MESSAGES.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    index <= loadingMessageIndex && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Results */}
        {result && (
          <Animated.View 
            style={[
              styles.resultsSection,
              { 
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            {/* Before/After Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleButton, !showAfter && styles.toggleButtonActive]}
                onPress={() => setShowAfter(false)}
              >
                <Text style={[styles.toggleText, !showAfter && styles.toggleTextActive]}>
                  Before
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, showAfter && styles.toggleButtonActive]}
                onPress={() => setShowAfter(true)}
              >
                <Ionicons 
                  name="sparkles" 
                  size={14} 
                  color={showAfter ? COLORS.text : COLORS.textMuted} 
                />
                <Text style={[styles.toggleText, showAfter && styles.toggleTextActive]}>
                  After
                </Text>
              </TouchableOpacity>
            </View>

            {/* Image Display */}
            <View style={styles.resultImageContainer}>
              <Image
                source={{ 
                  uri: showAfter && result.resultImageUrl 
                    ? result.resultImageUrl 
                    : selectedImage || ''
                }}
                style={styles.resultImage}
              />
              {showAfter && (
                <View style={styles.enhancedBadge}>
                  <Ionicons name="sparkles" size={12} color={COLORS.gold} />
                  <Text style={styles.enhancedBadgeText}>Enhanced</Text>
                </View>
              )}
            </View>

            {/* Fallback Mode Notice */}
            {result.debug.fallbackMode && (
              <View style={styles.fallbackNotice}>
                <Ionicons name="information-circle" size={18} color={COLORS.warning} />
                <Text style={styles.fallbackText}>
                  Demo Mode: Showing enhancement plan (image generation coming soon)
                </Text>
              </View>
            )}

            {/* Changes List */}
            <View style={styles.changesSection}>
              <View style={styles.changesSectionHeader}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.changesSectionTitle}>Enhancements Applied</Text>
              </View>
              
              {result.changes.map((change, index) => (
                <View key={index} style={styles.changeItem}>
                  <View style={styles.changeNumber}>
                    <Text style={styles.changeNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.changeText}>{change}</Text>
                </View>
              ))}
            </View>

            {/* Provider Info (Debug) */}
            <View style={styles.providerInfo}>
              <Text style={styles.providerText}>
                Powered by: {result.debug.usedProvider}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={resetState}
              >
                <Ionicons name="refresh" size={20} color={COLORS.text} />
                <Text style={styles.secondaryButtonText}>Try Another Photo</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Error State */}
        {error && (
          <View style={styles.errorSection}>
            <Ionicons name="alert-circle" size={48} color={COLORS.error} />
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={handleGenerate}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  
  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  heroGradient: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    height: 300,
    borderRadius: 150,
  },
  heroIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: COLORS.primary + '30',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  
  // Selection Options
  selectionOptions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  optionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  optionGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  
  // Preview Section
  previewSection: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  previewImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
  },
  changeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bg + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  generateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  generateButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.success + '10',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.success + '20',
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  
  // Loading Section
  loadingSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingImageContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  loadingImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.bg + 'AA',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTextContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  loadingMessage: {
    fontSize: 15,
    color: COLORS.primary,
  },
  loadingProgress: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  
  // Results Section
  resultsSection: {
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  toggleTextActive: {
    color: COLORS.text,
  },
  resultImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  resultImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
  },
  enhancedBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bg + 'EE',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
  },
  enhancedBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gold,
  },
  fallbackNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.warning + '15',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
    width: '100%',
  },
  fallbackText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.warning,
    lineHeight: 18,
  },
  
  // Changes Section
  changesSection: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  changesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  changesSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 10,
  },
  changeNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  changeText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  providerInfo: {
    marginBottom: 20,
  },
  providerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  
  // Action Buttons
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  
  // Error Section
  errorSection: {
    alignItems: 'center',
    paddingTop: 60,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
});
