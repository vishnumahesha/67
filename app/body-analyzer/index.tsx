/**
 * Body Analyzer Start Page
 * Entry point for body analysis flow
 */

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { BodyAnalyzerStartScreen } from '@/src/screens/BodyAnalyzer';
import { useBodyAnalyzerStore } from '@/store/useBodyAnalyzerStore';

export default function BodyAnalyzerIndexPage() {
  const router = useRouter();
  const {
    presentation,
    setPresentation,
    resetAnalysis,
    loadHistory,
  } = useBodyAnalyzerStore();

  useEffect(() => {
    // Load history and reset state on mount
    loadHistory();
    resetAnalysis();
  }, []);

  const handleStartScan = () => {
    router.push('/body-analyzer/capture-front');
  };

  return (
    <BodyAnalyzerStartScreen
      onStartScan={handleStartScan}
      presentation={presentation}
      onPresentationChange={setPresentation}
    />
  );
}
