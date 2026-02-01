import { Stack } from 'expo-router';

export default function FaceAnalyzerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0f' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="capture" />
      <Stack.Screen name="loading" />
      <Stack.Screen name="results" />
    </Stack>
  );
}
