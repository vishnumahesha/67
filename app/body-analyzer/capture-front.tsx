/**
 * Body Analyzer - Front Photo Capture
 * Captures the front body photo
 */

import React from 'react';
import { useRouter } from 'expo-router';
import { BodyCaptureScreen } from '@/src/screens/BodyAnalyzer';
import { useBodyAnalyzerStore } from '@/store/useBodyAnalyzerStore';

export default function CaptureFrontPage() {
  const router = useRouter();
  const { frontPhotoUri, setFrontPhotoUri, setStatus } = useBodyAnalyzerStore();

  const handleCapture = (uri: string) => {
    setFrontPhotoUri(uri);
    setStatus('capturing_side');
    router.push('/body-analyzer/capture-side');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <BodyCaptureScreen
      photoType="front"
      existingPhotoUri={frontPhotoUri}
      onCapture={handleCapture}
      onBack={handleBack}
    />
  );
}
