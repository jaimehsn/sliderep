import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { HF } from '@/constants/hf';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: HF.bg }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: HF.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="session/wod" />
        <Stack.Screen name="session/setup" />
        <Stack.Screen name="judge/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}
