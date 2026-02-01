/**
 * Body Analyzer - Loading Screen
 * Shows analysis progress and handles API call
 */

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { BodyAnalyzerLoadingScreen } from '@/src/screens/BodyAnalyzer';
import { useBodyAnalyzerStore } from '@/store/useBodyAnalyzerStore';
import { getMockBodyAnalysisResult } from '@/src/bodyAnalyzer';
// import { analyzeBody } from '@/src/bodyAnalyzer'; // Uncomment for real API

export default function LoadingPage() {
  const router = useRouter();
  const {
    frontPhotoUri,
    sidePhotoUri,
    presentation,
    height,
    weight,
    age,
    premiumEnabled,
    analysisProgress,
    analysisProgressMessage,
    setAnalysisProgress,
    setAnalysisProgressMessage,
    setAnalysisResult,
    setAnalysisError,
    setStatus,
    addToHistory,
  } = useBodyAnalyzerStore();

  const analysisStarted = useRef(false);

  useEffect(() => {
    if (analysisStarted.current) return;
    if (!frontPhotoUri) {
      router.replace('/body-analyzer');
      return;
    }

    analysisStarted.current = true;
    runAnalysis();
  }, [frontPhotoUri]);

  const runAnalysis = async () => {
    try {
      // Simulate progress stages
      const stages = [
        { progress: 10, message: 'Uploading photos...' },
        { progress: 20, message: 'Detecting body landmarks...' },
        { progress: 35, message: 'Calculating structural ratios...' },
        { progress: 50, message: 'Determining Kibbe body type...' },
        { progress: 65, message: 'Analyzing posture...' },
        { progress: 75, message: 'Computing scores...' },
        { progress: 85, message: 'Generating workout plan...' },
        { progress: 92, message: 'Creating styling guide...' },
        { progress: 98, message: 'Finalizing results...' },
      ];

      // Animate through stages
      for (const stage of stages) {
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));
        setAnalysisProgress(stage.progress);
        setAnalysisProgressMessage(stage.message);
      }

      // Get analysis result (using mock for now)
      // For real API:
      // const result = await analyzeBody({
      //   frontImage: frontPhotoUri,
      //   sideImage: sidePhotoUri || undefined,
      //   presentation,
      //   height: height || undefined,
      //   weight: weight || undefined,
      //   age: age || undefined,
      //   premiumEnabled,
      // });

      const result = getMockBodyAnalysisResult({
        presentation,
        sideProvided: !!sidePhotoUri,
        isPremium: premiumEnabled,
      });

      // Complete progress
      setAnalysisProgress(100);
      setAnalysisProgressMessage('Analysis complete!');

      // Store result
      setAnalysisResult(result);

      // Add to history
      await addToHistory({
        id: result.analysisId,
        timestamp: result.timestamp,
        presentation,
        overallScore: result.overall.currentScore10,
        kibbeType: result.kibbeAssessment.primaryType,
        thumbnailUri: frontPhotoUri,
      });

      // Navigate to results
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStatus('complete');
      router.replace('/body-analyzer/results');
    } catch (error) {
      console.error('Body analysis error:', error);
      setAnalysisError(
        error instanceof Error ? error.message : 'Analysis failed. Please try again.'
      );
      setStatus('error');

      // Navigate to results with error state (will show fallback)
      const mockResult = getMockBodyAnalysisResult({
        presentation,
        sideProvided: !!sidePhotoUri,
        isPremium: premiumEnabled,
      });
      setAnalysisResult(mockResult);
      router.replace('/body-analyzer/results');
    }
  };

  if (!frontPhotoUri) {
    return null;
  }

  return (
    <BodyAnalyzerLoadingScreen
      frontPhotoUri={frontPhotoUri}
      sidePhotoUri={sidePhotoUri || undefined}
      progress={analysisProgress}
      progressMessage={analysisProgressMessage}
    />
  );
}
