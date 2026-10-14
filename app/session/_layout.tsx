import { Stack } from 'expo-router';
import { HF } from '@/constants/hf';
import { SessionProvider } from '@/hooks/use-session';

// A nested Stack doesn't inherit the root Stack's screenOptions, so
// headerShown/contentStyle are repeated here. gestureEnabled: false blocks
// the OS edge-swipe-back across the whole session flow (docs/ROADMAP.md
// → Design: screens and routes) — every screen in this group already has
// its own explicit ✕/back-link exit, so this removes no capability.
export default function SessionLayout() {
  return (
    <SessionProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: HF.bg },
          gestureEnabled: false,
        }}
      />
    </SessionProvider>
  );
}
