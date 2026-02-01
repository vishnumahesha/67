/**
 * Body Analyzer Layout
 * Stack navigation for body analyzer screens
 */

import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function BodyAnalyzerLayout() {
  return (
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
      <Stack.Screen name="loading" />
      <Stack.Screen name="results" />
    </Stack>
  );
}
