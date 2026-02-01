import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

interface FaceCaptureScreenProps {
  onCapture: (frontImage: string, sideImage?: string) => void;
  onBack: () => void;
}

interface ChecklistItemProps {
  label: string;
  checked: boolean;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ label, checked }) => (
  <View style={styles.checklistItem}>
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
    <Text style={[styles.checklistLabel, checked && styles.checklistLabelChecked]}>
      {label}
    </Text>
  </View>
);

export const FaceCaptureScreen: React.FC<FaceCaptureScreenProps> = ({
  onCapture,
  onBack,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<'front' | 'side'>('front');
  const cameraRef = useRef<CameraView>(null);

  const checklist = [
    { label: 'Good lighting', key: 'lighting' },
    { label: 'Neutral expression', key: 'expression' },
    { label: 'Face centered', key: 'centered' },
    { label: 'No obstructions', key: 'clear' },
  ];

  const handleTakePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });

      if (photo?.base64) {
        if (captureMode === 'front') {
          setFrontImage(`data:image/jpeg;base64,${photo.base64}`);
        } else {
          setSideImage(`data:image/jpeg;base64,${photo.base64}`);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const imageData = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (captureMode === 'front') {
        setFrontImage(imageData);
      } else {
        setSideImage(imageData);
      }
    }
  };

  const handleRetake = () => {
    if (captureMode === 'front') {
      setFrontImage(null);
    } else {
      setSideImage(null);
    }
  };

  const handleContinue = () => {
    if (frontImage) {
      onCapture(frontImage, sideImage || undefined);
    }
  };

  const handleSkipSide = () => {
    if (frontImage) {
      onCapture(frontImage, undefined);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to capture your photos for analysis.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryButton} onPress={handlePickImage}>
            <Text style={styles.galleryButtonText}>Or pick from gallery</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentImage = captureMode === 'front' ? frontImage : sideImage;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {captureMode === 'front' ? 'Front Photo' : 'Side Photo'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {captureMode === 'front' ? 'Required' : 'Optional but recommended'}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Mode Tabs */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.modeTab, captureMode === 'front' && styles.modeTabActive]}
          onPress={() => setCaptureMode('front')}
        >
          <Text style={[styles.modeTabText, captureMode === 'front' && styles.modeTabTextActive]}>
            Front {frontImage ? '✓' : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, captureMode === 'side' && styles.modeTabActive]}
          onPress={() => setCaptureMode('side')}
        >
          <Text style={[styles.modeTabText, captureMode === 'side' && styles.modeTabTextActive]}>
            Side {sideImage ? '✓' : '(Optional)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Camera/Preview Area */}
      <View style={styles.cameraContainer}>
        {currentImage ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: currentImage }} style={styles.previewImage} />
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          >
            <View style={styles.cameraOverlay}>
              {/* Face guide */}
              <View style={styles.faceGuide}>
                {captureMode === 'front' ? (
                  <View style={styles.ovalGuide} />
                ) : (
                  <View style={styles.profileGuide} />
                )}
              </View>

              {/* Checklist */}
              <View style={styles.checklist}>
                {checklist.map((item) => (
                  <ChecklistItem
                    key={item.key}
                    label={item.label}
                    checked={false}
                  />
                ))}
              </View>
            </View>
          </CameraView>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {!currentImage ? (
          <>
            <TouchableOpacity style={styles.galleryIcon} onPress={handlePickImage}>
              <Text style={styles.galleryIconText}>🖼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
            >
              <Text style={styles.flipButtonText}>🔄</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {captureMode === 'front' && !sideImage ? (
              <View style={styles.nextActions}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleSkipSide}
                >
                  <Text style={styles.secondaryButtonText}>Skip Side Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setCaptureMode('side')}
                >
                  <Text style={styles.primaryButtonText}>Add Side Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.analyzeButton}
                onPress={handleContinue}
              >
                <Text style={styles.analyzeButtonText}>Analyze Now</Text>
                <Text style={styles.analyzeButtonIcon}>→</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Preview thumbnails */}
      {(frontImage || sideImage) && (
        <View style={styles.thumbnails}>
          {frontImage && (
            <View style={styles.thumbnail}>
              <Image source={{ uri: frontImage }} style={styles.thumbnailImage} />
              <Text style={styles.thumbnailLabel}>Front</Text>
            </View>
          )}
          {sideImage && (
            <View style={styles.thumbnail}>
              <Image source={{ uri: sideImage }} style={styles.thumbnailImage} />
              <Text style={styles.thumbnailLabel}>Side</Text>
            </View>
          )}
        </View>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  modeTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#111111',
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#00D9FF20',
    borderWidth: 1,
    borderColor: '#00D9FF',
  },
  modeTabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  modeTabTextActive: {
    color: '#00D9FF',
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  faceGuide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ovalGuide: {
    width: 200,
    height: 280,
    borderWidth: 2,
    borderColor: 'rgba(0, 217, 255, 0.4)',
    borderRadius: 100,
    borderStyle: 'dashed',
  },
  profileGuide: {
    width: 160,
    height: 280,
    borderWidth: 2,
    borderColor: 'rgba(0, 217, 255, 0.4)',
    borderRadius: 80,
    borderStyle: 'dashed',
  },
  checklist: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#444444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#00D9FF',
    borderColor: '#00D9FF',
  },
  checkmark: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '700',
  },
  checklistLabel: {
    fontSize: 13,
    color: '#888888',
  },
  checklistLabelChecked: {
    color: '#00D9FF',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  retakeButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 40,
  },
  galleryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIconText: {
    fontSize: 22,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButtonText: {
    fontSize: 22,
  },
  nextActions: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#888888',
    fontSize: 15,
    fontWeight: '500',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#00D9FF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '600',
  },
  analyzeButton: {
    flex: 1,
    backgroundColor: '#00D9FF',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzeButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '600',
    marginRight: 8,
  },
  analyzeButtonIcon: {
    color: '#000000',
    fontSize: 18,
  },
  thumbnails: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 20,
  },
  thumbnail: {
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 50,
    height: 66,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#00D9FF',
  },
  thumbnailLabel: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#00D9FF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  galleryButton: {
    paddingVertical: 10,
  },
  galleryButtonText: {
    color: '#00D9FF',
    fontSize: 14,
  },
});

export default FaceCaptureScreen;
