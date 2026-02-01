/**
 * Body Analyzer - Results Screen
 * Displays comprehensive analysis results with tabs
 */

import React from 'react';
import { useRouter } from 'expo-router';
import { BodyAnalyzerResultsScreen } from '@/src/screens/BodyAnalyzer';
import { useBodyAnalyzerStore } from '@/store/useBodyAnalyzerStore';
import { getMockBodyAnalysisResult } from '@/src/bodyAnalyzer';

export default function ResultsPage() {
  const router = useRouter();
  const {
    analysisResult,
    premiumEnabled,
    presentation,
    resetAnalysis,
  } = useBodyAnalyzerStore();

  // Use mock data as fallback if no result
  const result = analysisResult || getMockBodyAnalysisResult({
    presentation,
    sideProvided: false,
    isPremium: premiumEnabled,
  });

  const handleNewScan = () => {
    resetAnalysis();
    router.replace('/body-analyzer');
  };

  const handleUpgrade = () => {
    router.push('/upgrade');
  };

  return (
    <BodyAnalyzerResultsScreen
      result={result}
      onNewScan={handleNewScan}
      isPremium={premiumEnabled}
      onUpgrade={handleUpgrade}
    />
  );
}
