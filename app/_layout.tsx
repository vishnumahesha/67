import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { colors } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { useCalorieStore } from '@/store/useCalorieStore';

export default function RootLayout() {
  const loadScanData = useAppStore((state) => state.loadScanData);
  const loadHistory = useAppStore((state) => state.loadHistory);
  const loadCalorieGoals = useCalorieStore((state) => state.loadGoals);
  const loadMealHistory = useCalorieStore((state) => state.loadMealHistory);

  useEffect(() => {
    loadScanData();
    loadHistory();
    loadCalorieGoals();
    loadMealHistory();
  }, [loadScanData, loadHistory, loadCalorieGoals, loadMealHistory]);

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
      </Stack>
    </>
  );
}
