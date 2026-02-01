/**
 * Face Capture Screen
 * Captures front and optional side photos
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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const COLORS = {
  bg: '#0a0a0f',
  surface: '#12121a',
  surfaceLight: '#1a1a24',
  border: '#2a2a3a',
  primary: '#6366f1',
  accent: '#22d3ee',
  success: '#10b981',
  warning: '#f59e0b',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
};

type PhotoType = 'front' | 'side';

export default function FaceCaptureScreen() {
  const { gender } = useLocalSearchParams<{ gender: string }>();
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [sidePhoto, setSidePhoto] = useState<string | null>(null);
  const [activeCapture, setActiveCapture] = useState<PhotoType>('front');

  const pickImage = async (type: PhotoType) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'front') {
        setFrontPhoto(result.assets[0].uri);
        setActiveCapture('side');
      } else {
        setSidePhoto(result.assets[0].uri);
      }
    }
  };

  const takePhoto = async (type: PhotoType) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'front') {
        setFrontPhoto(result.assets[0].uri);
        setActiveCapture('side');
      } else {
        setSidePhoto(result.assets[0].uri);
      }
    }
  };

  const handleAnalyze = () => {
    if (!frontPhoto) {
      Alert.alert('Photo Required', 'Please add a front-facing photo to continue');
      return;
    }

    router.push({
      pathname: '/face-analyzer/loading',
      params: {
        gender,
        hasSide: sidePhoto ? 'true' : 'false',
      },
    });
  };

  const removePhoto = (type: PhotoType) => {
    if (type === 'front') {
      setFrontPhoto(null);
      setActiveCapture('front');
    } else {
      setSidePhoto(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Capture Photos</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Photo Cards */}
      <View style={styles.content}>
        {/* Front Photo Card */}
        <View style={styles.photoSection}>
          <View style={styles.photoHeader}>
            <View style={styles.photoLabelContainer}>
              <View style={[styles.photoBadge, { backgroundColor: COLORS.warning }]}>
                <Text style={styles.badgeText}>REQUIRED</Text>
              </View>
              <Text style={styles.photoLabel}>Front Photo</Text>
            </View>
            <Text style={styles.photoHint}>Face camera directly</Text>
          </View>

          {frontPhoto ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: frontPhoto }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto('front')}
              >
                <Ionicons name="close-circle" size={28} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.photoStatus}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.statusText}>Ready</Text>
              </View>
            </View>
          ) : (
            <View style={styles.photoPlaceholder}>
              <View style={styles.captureButtons}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={() => takePhoto('front')}
                >
                  <Ionicons name="camera" size={28} color={COLORS.primary} />
                  <Text style={styles.captureText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={() => pickImage('front')}
                >
                  <Ionicons name="images" size={28} color={COLORS.accent} />
                  <Text style={styles.captureText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Side Photo Card */}
        <View style={styles.photoSection}>
          <View style={styles.photoHeader}>
            <View style={styles.photoLabelContainer}>
              <View style={[styles.photoBadge, { backgroundColor: COLORS.textMuted }]}>
                <Text style={styles.badgeText}>OPTIONAL</Text>
              </View>
              <Text style={styles.photoLabel}>Side Profile</Text>
            </View>
            <Text style={styles.photoHint}>Improves jaw/chin analysis</Text>
          </View>

          {sidePhoto ? (
            <View style={styles.photoPreview}>
              <Image source={{ uri: sidePhoto }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto('side')}
              >
                <Ionicons name="close-circle" size={28} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.photoStatus}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                <Text style={styles.statusText}>Ready</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.photoPlaceholder, styles.sidePhotoPlaceholder]}>
              <View style={styles.captureButtons}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={() => takePhoto('side')}
                >
                  <Ionicons name="camera" size={28} color={COLORS.primary} />
                  <Text style={styles.captureText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={() => pickImage('side')}
                >
                  <Ionicons name="images" size={28} color={COLORS.accent} />
                  <Text style={styles.captureText}>Gallery</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.skipText}>You can skip this step</Text>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Quick Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Ionicons name="sunny" size={16} color={COLORS.warning} />
              <Text style={styles.tipText}>Face natural light</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="happy" size={16} color={COLORS.accent} />
              <Text style={styles.tipText}>Neutral expression</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="expand" size={16} color={COLORS.success} />
              <Text style={styles.tipText}>Step back for less distortion</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.analyzeButton, !frontPhoto && styles.analyzeButtonDisabled]}
          onPress={handleAnalyze}
          disabled={!frontPhoto}
        >
          <Ionicons name="scan" size={20} color={frontPhoto ? COLORS.bg : COLORS.textMuted} />
          <Text style={[styles.analyzeText, !frontPhoto && styles.analyzeTextDisabled]}>
            {frontPhoto ? 'Analyze Now' : 'Add Front Photo'}
          </Text>
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
  content: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  photoSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photoHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  photoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  photoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.bg,
    letterSpacing: 0.5,
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  photoHint: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  photoPlaceholder: {
    padding: 24,
    alignItems: 'center',
  },
  sidePhotoPlaceholder: {
    opacity: 0.8,
  },
  captureButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  captureButton: {
    alignItems: 'center',
    gap: 8,
    padding: 20,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    minWidth: 100,
  },
  captureText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  skipText: {
    marginTop: 16,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  photoPreview: {
    height: 200,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
  },
  photoStatus: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  tipsSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  tipsList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  analyzeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzeButtonDisabled: {
    backgroundColor: COLORS.surface,
  },
  analyzeText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.bg,
  },
  analyzeTextDisabled: {
    color: COLORS.textMuted,
  },
});
