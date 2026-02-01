// ============================================
// SCAN MEAL SCREEN
// Camera/gallery picker for food photo scanning
// ============================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeIn, 
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, shadows } from '@/constants/theme';
import { Button } from '@/components';
import { useCalorieStore } from '@/store/useCalorieStore';
import { scanFood } from '@/src/calorieTracker/api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ScanMealScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const {
    setScanPhotoUri,
    setScanResult,
    setIsScanning,
    setScanError,
    isScanning,
    scanError,
    setPendingItems,
    setPendingMealType,
    clearScanState,
  } = useCalorieStore();
  
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState('');
  
  // Pulse animation for scanning indicator
  const pulseScale = useSharedValue(1);
  
  React.useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);
  
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Take photo with camera
  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo?.uri) {
        setPhotoUri(photo.uri);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Pick from gallery
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Analyze the photo
  const handleAnalyze = async () => {
    if (!photoUri) return;
    
    setIsScanning(true);
    setScanError(null);
    setAnalysisProgress('Uploading photo...');
    
    try {
      // Convert to base64
      const base64 = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      setAnalysisProgress('Detecting foods...');
      setScanPhotoUri(photoUri);
      
      // Call scan API
      const result = await scanFood(base64);
      
      setAnalysisProgress('Processing nutrition...');
      
      // Store result and navigate to confirm screen
      setScanResult(result);
      setPendingItems(result.items);
      
      // Suggest meal type based on time
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) setPendingMealType('breakfast');
      else if (hour >= 11 && hour < 15) setPendingMealType('lunch');
      else if (hour >= 15 && hour < 18) setPendingMealType('snack');
      else setPendingMealType('dinner');
      
      setIsScanning(false);
      router.push('/calorie-tracker/confirm');
      
    } catch (error) {
      console.error('Scan failed:', error);
      setIsScanning(false);
      setScanError(error instanceof Error ? error.message : 'Scan failed');
      
      Alert.alert(
        'Scan Failed',
        'Could not analyze the photo. Would you like to add items manually?',
        [
          { text: 'Try Again', onPress: () => setPhotoUri(null) },
          { text: 'Add Manually', onPress: () => router.push('/calorie-tracker/manual-add') },
        ]
      );
    }
  };

  // Retake photo
  const handleRetake = () => {
    setPhotoUri(null);
    clearScanState();
  };

  // Permission not granted
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionEmoji}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionText}>
            We need camera access to scan your food and calculate nutrition.
          </Text>
          <Button
            title="Grant Camera Access"
            onPress={requestPermission}
            size="large"
          />
          <TouchableOpacity 
            style={styles.galleryOption}
            onPress={handlePickImage}
          >
            <Text style={styles.galleryOptionText}>Or pick from gallery</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Scanning in progress
  if (isScanning) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scanningContainer}>
          <Animated.View style={[styles.scanningIndicator, pulseStyle]}>
            <Text style={styles.scanningEmoji}>🔍</Text>
          </Animated.View>
          <Animated.Text 
            entering={FadeIn}
            style={styles.scanningTitle}
          >
            Analyzing Food
          </Animated.Text>
          <Animated.Text 
            entering={FadeIn.delay(100)}
            style={styles.scanningProgress}
          >
            {analysisProgress}
          </Animated.Text>
          
          {photoUri && (
            <Animated.Image
              entering={FadeIn.delay(200)}
              source={{ uri: photoUri }}
              style={styles.scanningPreview}
            />
          )}
          
          <Text style={styles.scanningHint}>
            This usually takes 5-15 seconds
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Photo taken - review
  if (photoUri) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View 
          entering={FadeIn}
          style={styles.reviewContainer}
        >
          <View style={styles.reviewHeader}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.reviewTitle}>Review Photo</Text>
            <TouchableOpacity onPress={handleRetake}>
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <View style={styles.photoOverlay}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </View>
          </View>
          
          <Animated.View 
            entering={FadeInDown.delay(200)}
            style={styles.reviewActions}
          >
            <View style={styles.tipContainer}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>
                Make sure all food items are visible and well-lit for best results
              </Text>
            </View>
            
            <Button
              title="🔍  Analyze Food"
              onPress={handleAnalyze}
              size="large"
              fullWidth
            />
            
            <TouchableOpacity 
              style={styles.pickDifferent}
              onPress={handlePickImage}
            >
              <Text style={styles.pickDifferentText}>Choose different photo</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // Camera view
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          {/* Header */}
          <View style={styles.cameraHeader}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Scan Food</Text>
            <View style={{ width: 40 }} />
          </View>
          
          {/* Frame guide */}
          <View style={styles.frameGuide}>
            <View style={styles.frameLine} />
            <Text style={styles.frameText}>
              Position food within frame
            </Text>
          </View>
          
          {/* Capture controls */}
          <View style={styles.captureControls}>
            <TouchableOpacity 
              style={styles.galleryButton}
              onPress={handlePickImage}
            >
              <Text style={styles.galleryIcon}>🖼️</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.captureButton}
              onPress={handleTakePhoto}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
            
            <View style={{ width: 60 }} />
          </View>
          
          {/* Tips */}
          <View style={styles.cameraTips}>
            <Text style={styles.cameraTipText}>
              📷 Hold steady • Good lighting • All items visible
            </Text>
          </View>
        </CameraView>
      </View>
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Permission
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  permissionEmoji: {
    fontSize: 60,
    marginBottom: spacing.lg,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  permissionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  galleryOption: {
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  galleryOptionText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500',
  },
  
  // Camera
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '600',
  },
  cameraTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  
  frameGuide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  frameLine: {
    width: SCREEN_WIDTH - spacing.xl * 2,
    height: SCREEN_WIDTH - spacing.xl * 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
  },
  frameText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing.md,
  },
  
  captureControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  galleryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIcon: {
    fontSize: 28,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.text,
  },
  
  cameraTips: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  cameraTipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  
  // Review
  reviewContainer: {
    flex: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cancelText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  retakeText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  
  photoContainer: {
    flex: 1,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary,
    borderTopLeftRadius: borderRadius.md,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary,
    borderTopRightRadius: borderRadius.md,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary,
    borderBottomLeftRadius: borderRadius.md,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary,
    borderBottomRightRadius: borderRadius.md,
  },
  
  reviewActions: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  tipIcon: {
    fontSize: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  pickDifferent: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  pickDifferentText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  
  // Scanning
  scanningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  scanningIndicator: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  scanningEmoji: {
    fontSize: 48,
  },
  scanningTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  scanningProgress: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  scanningPreview: {
    width: 150,
    height: 150,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  scanningHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
});
