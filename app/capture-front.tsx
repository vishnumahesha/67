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
import { useRouter } from 'expo-router';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { Button } from '@/components';
import { PHOTO_TIPS } from '@/constants';
import { useAppStore } from '@/store/useAppStore';

export default function CaptureFrontPhoto() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  const { setFrontPhotoUri } = useAppStore();

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      if (photo?.uri) {
        setCapturedUri(photo.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleConfirm = () => {
    if (capturedUri) {
      setFrontPhotoUri(capturedUri);
      router.push('/capture-side');
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to capture your photo for analysis. Your photos are processed securely and never stored permanently.
          </Text>
          <Button
            title="Grant Camera Access"
            onPress={requestPermission}
            size="large"
          />
          <TouchableOpacity onPress={handlePickImage} style={styles.altOption}>
            <Text style={styles.altOptionText}>Or choose from gallery</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (capturedUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Review Front Photo</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedUri }} style={styles.previewImage} />
          <View style={styles.previewOverlay}>
            <View style={styles.faceGuide} />
          </View>
        </View>

        <View style={styles.previewTips}>
          <Text style={styles.tipTitle}>Check your photo:</Text>
          <Text style={styles.tipItem}>✓ Face is centered and clearly visible</Text>
          <Text style={styles.tipItem}>✓ Good, even lighting</Text>
          <Text style={styles.tipItem}>✓ Neutral expression</Text>
        </View>

        <View style={styles.previewActions}>
          <Button
            title="Retake"
            onPress={handleRetake}
            variant="outline"
            fullWidth
          />
          <Button
            title="Use This Photo"
            onPress={handleConfirm}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Front Photo</Text>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>1/2</Text>
        </View>
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
        >
          <View style={styles.overlay}>
            {/* Face guide overlay */}
            <View style={styles.faceGuide}>
              <View style={styles.guideCorner} />
              <View style={[styles.guideCorner, styles.guideCornerTR]} />
              <View style={[styles.guideCorner, styles.guideCornerBL]} />
              <View style={[styles.guideCorner, styles.guideCornerBR]} />
            </View>
            <Text style={styles.guideText}>Position your face within the frame</Text>
          </View>
        </CameraView>
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Tips for best results:</Text>
        {PHOTO_TIPS.front.slice(0, 3).map((tip, index) => (
          <Text key={index} style={styles.tip}>• {tip}</Text>
        ))}
      </View>

      {/* Upload from files option */}
      <TouchableOpacity onPress={handlePickImage} style={styles.uploadButton}>
        <Text style={styles.uploadIcon}>📁</Text>
        <Text style={styles.uploadText}>Upload from Files</Text>
      </TouchableOpacity>

      <View style={styles.controls}>
        <TouchableOpacity onPress={handlePickImage} style={styles.galleryButton}>
          <Text style={styles.galleryIcon}>🖼️</Text>
          <Text style={styles.galleryText}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleCapture} style={styles.captureButton}>
          <View style={styles.captureInner} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
          style={styles.flipButton}
        >
          <Text style={styles.flipIcon}>🔄</Text>
          <Text style={styles.flipText}>Flip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: colors.text,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  stepBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  placeholder: {
    width: 40,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceGuide: {
    width: 250,
    height: 320,
    borderRadius: 125,
    borderWidth: 2,
    borderColor: 'rgba(139, 92, 246, 0.6)',
    borderStyle: 'dashed',
    position: 'relative',
  },
  guideCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: colors.primary,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    top: -5,
    left: -5,
  },
  guideCornerTR: {
    left: undefined,
    right: -5,
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  guideCornerBL: {
    top: undefined,
    bottom: -5,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  guideCornerBR: {
    top: undefined,
    bottom: -5,
    left: undefined,
    right: -5,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  guideText: {
    position: 'absolute',
    bottom: -40,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  tipsContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tip: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    gap: spacing.sm,
  },
  uploadIcon: {
    fontSize: 20,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.xl,
  },
  galleryButton: {
    alignItems: 'center',
    gap: 4,
  },
  galleryIcon: {
    fontSize: 24,
  },
  galleryText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.text,
    borderWidth: 3,
    borderColor: colors.background,
  },
  flipButton: {
    alignItems: 'center',
    gap: 4,
  },
  flipIcon: {
    fontSize: 24,
  },
  flipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  permissionIcon: {
    fontSize: 64,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  altOption: {
    marginTop: spacing.md,
  },
  altOptionText: {
    fontSize: 15,
    color: colors.primary,
  },
  previewContainer: {
    flex: 1,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTips: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipItem: {
    fontSize: 13,
    color: colors.success,
    marginTop: 4,
  },
  previewActions: {
    flexDirection: 'column',
    gap: spacing.sm,
    padding: spacing.lg,
  },
});
