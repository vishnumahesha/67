import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { useCalorieStore } from '@/store/useCalorieStore';
import { useBodyAnalyzerStore } from '@/store/useBodyAnalyzerStore';

export default function RootLayout() {
  const loadScanData = useAppStore((state) => state.loadScanData);
  const loadHistory = useAppStore((state) => state.loadHistory);
  const loadCalorieGoals = useCalorieStore((state) => state.loadGoals);
  const loadMealHistory = useCalorieStore((state) => state.loadMealHistory);
  const loadBodyHistory = useBodyAnalyzerStore((state) => state.loadHistory);

  useEffect(() => {
    loadScanData();
    loadHistory();
    loadCalorieGoals();
    loadMealHistory();
    loadBodyHistory();
  }, [loadScanData, loadHistory, loadCalorieGoals, loadMealHistory, loadBodyHistory]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="capture-front" />
        <Stack.Screen name="capture-side" />
        <Stack.Screen name="review" />
        <Stack.Screen name="analyzing" />
        <Stack.Screen name="results" />
        <Stack.Screen name="upgrade" />
        <Stack.Screen name="calorie-tracker" />
        <Stack.Screen name="body-analyzer" />
      </Stack>
    </>
  );
}
