// ============================================
// CALORIE TRACKER LAYOUT
// Stack navigation for calorie tracker screens
// ============================================

import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function CalorieTrackerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="scan" />
      <Stack.Screen name="confirm" />
      <Stack.Screen name="manual-add" />
      <Stack.Screen name="history" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="meal/[id]" />
    </Stack>
  );
}
