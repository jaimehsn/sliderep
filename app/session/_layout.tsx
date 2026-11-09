import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';
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
          contentStyle: { backgroundColor: colors.bg },
          gestureEnabled: false,
        }}
      />
    </SessionProvider>
  );
}
