/**
 * Body Analyzer - Side Photo Capture
 * Captures the optional side body photo
 */

import React from 'react';
import { useRouter } from 'expo-router';
import { BodyCaptureScreen } from '@/src/screens/BodyAnalyzer';
import { useBodyAnalyzerStore } from '@/store/useBodyAnalyzerStore';

export default function CaptureSidePage() {
  const router = useRouter();
  const { sidePhotoUri, setSidePhotoUri, setStatus } = useBodyAnalyzerStore();

  const handleCapture = (uri: string) => {
    setSidePhotoUri(uri);
    startAnalysis();
  };

  const handleSkip = () => {
    startAnalysis();
  };

  const handleBack = () => {
    router.back();
  };

  const startAnalysis = () => {
    setStatus('analyzing');
    router.push('/body-analyzer/loading');
  };

  return (
    <BodyCaptureScreen
      photoType="side"
      existingPhotoUri={sidePhotoUri}
      onCapture={handleCapture}
      onSkip={handleSkip}
      onBack={handleBack}
    />
  );
}
