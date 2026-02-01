/**
 * Body Capture Screen
 * Camera interface for capturing front and side body photos
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface BodyCaptureScreenProps {
  photoType: 'front' | 'side';
  existingPhotoUri?: string | null;
  onCapture: (uri: string) => void;
  onSkip?: () => void;
  onBack: () => void;
}

export const BodyCaptureScreen: React.FC<BodyCaptureScreenProps> = ({
  photoType,
  existingPhotoUri,
  onCapture,
  onSkip,
  onBack,
}) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(existingPhotoUri || null);
  const cameraRef = useRef<CameraView>(null);

  const isFront = photoType === 'front';

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        if (photo?.uri) {
          setCapturedPhoto(photo.uri);
        }
      } catch (error) {
        console.error('Error taking photo:', error);
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      }
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedPhoto(result.assets[0].uri);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
    }
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  // Permission handling
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to capture your body photos for analysis.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
            <Text style={styles.galleryButtonText}>Choose from Gallery Instead</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show captured photo preview
  if (capturedPhoto) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleRetake} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>← Retake</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isFront ? 'Front Photo' : 'Side Photo'}
          </Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
          <View style={styles.overlayGuide}>
            <View style={styles.bodyOutline} />
            <Text style={styles.overlayText}>
              {isFront
                ? 'Ensure full body is visible, standing straight'
                : 'Profile view showing posture'}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>
              {isFront ? 'Continue' : 'Analyze Body'}
            </Text>
            <Text style={styles.confirmButtonIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Camera view
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isFront ? 'Front Photo' : 'Side Photo'}
        </Text>
        {onSkip && !isFront ? (
          <TouchableOpacity onPress={onSkip} style={styles.headerButton}>
            <Text style={styles.skipButtonText}>Skip →</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>

      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          {/* Body outline guide */}
          <View style={styles.guideOverlay}>
            <View style={styles.bodyGuide}>
              {isFront ? (
                <>
                  {/* Head */}
                  <View style={styles.guideHead} />
                  {/* Torso */}
                  <View style={styles.guideTorso} />
                  {/* Arms */}
                  <View style={[styles.guideArm, styles.guideArmLeft]} />
                  <View style={[styles.guideArm, styles.guideArmRight]} />
                  {/* Legs */}
                  <View style={styles.guideLegs} />
                </>
              ) : (
                <>
                  {/* Side profile outline */}
                  <View style={styles.guideSideBody} />
                </>
              )}
            </View>
            <Text style={styles.guideText}>
              {isFront
                ? 'Stand straight, arms relaxed at sides'
                : 'Side profile view for posture analysis'}
            </Text>
          </View>
        </CameraView>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlButton} onPress={handlePickImage}>
            <Text style={styles.controlButtonIcon}>🖼️</Text>
            <Text style={styles.controlButtonText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleCameraFacing}>
            <Text style={styles.controlButtonIcon}>🔄</Text>
            <Text style={styles.controlButtonText}>Flip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>📸 Tips</Text>
          <Text style={styles.tipsText}>
            {isFront
              ? '• Full body in frame • Fitted clothing • Good lighting • Neutral pose'
              : '• Stand sideways • Keep spine visible • Relax shoulders'}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  headerButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
  },
  skipButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerPlaceholder: {
    width: 80,
  },

  // Permission
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  galleryButton: {
    paddingVertical: spacing.md,
  },
  galleryButtonText: {
    fontSize: 15,
    color: colors.primary,
  },

  // Camera
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
    margin: spacing.md,
  },
  camera: {
    flex: 1,
  },
  guideOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyGuide: {
    width: '60%',
    height: '80%',
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.4)',
    borderRadius: borderRadius.lg,
    borderStyle: 'dashed',
    position: 'relative',
    alignItems: 'center',
  },
  guideHead: {
    width: 60,
    height: 70,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.4)',
    borderStyle: 'dashed',
    position: 'absolute',
    top: 20,
  },
  guideTorso: {
    width: 100,
    height: 150,
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.3)',
    borderStyle: 'dashed',
    position: 'absolute',
    top: 95,
    borderRadius: borderRadius.sm,
  },
  guideArm: {
    width: 30,
    height: 120,
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.3)',
    borderStyle: 'dashed',
    position: 'absolute',
    top: 100,
    borderRadius: 15,
  },
  guideArmLeft: {
    left: 20,
    transform: [{ rotate: '5deg' }],
  },
  guideArmRight: {
    right: 20,
    transform: [{ rotate: '-5deg' }],
  },
  guideLegs: {
    width: 90,
    height: 180,
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.3)',
    borderStyle: 'dashed',
    position: 'absolute',
    bottom: 20,
    borderRadius: borderRadius.sm,
  },
  guideSideBody: {
    width: 80,
    height: '90%',
    borderWidth: 2,
    borderColor: 'rgba(212, 165, 116, 0.4)',
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
  },
  guideText: {
    position: 'absolute',
    bottom: 20,
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },

  // Controls
  controlsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  controlButton: {
    alignItems: 'center',
    width: 70,
  },
  controlButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  controlButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.text,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.text,
  },
  tipsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipsText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Preview
  previewContainer: {
    flex: 1,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
    backgroundColor: colors.surface,
  },
  overlayGuide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  bodyOutline: {
    // Minimal overlay for preview
  },
  overlayText: {
    color: colors.text,
    fontSize: 14,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 34,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.background,
    marginRight: spacing.sm,
  },
  confirmButtonIcon: {
    fontSize: 18,
    color: colors.background,
  },
});

export default BodyCaptureScreen;
