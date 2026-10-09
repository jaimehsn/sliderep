import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SQLiteProvider } from 'expo-sqlite';
import 'react-native-reanimated';

import { HF } from '@/constants/hf';
import { migrateDbIfNeeded } from '@/db/migrations';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: HF.bg }}>
      <SQLiteProvider databaseName="sliderep.db" onInit={migrateDbIfNeeded}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: HF.bg } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="session/wod" />
          <Stack.Screen name="session/setup" />
          <Stack.Screen name="judge/[id]" />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="light" />
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
