import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from '@/components/text';
import { router } from 'expo-router';

import { colors, fonts } from '@/constants/theme';
import { Screen } from '@/components/screen';
import { useFirstRun } from '@/hooks/use-first-run';

export default function FirstRunScreen() {
  const { markDone } = useFirstRun();
  const [busy, setBusy] = useState(false);

  const createProfile = async () => {
    setBusy(true);
    await markDone();
    router.replace('/profile');
  };

  const continueAnonymous = async () => {
    setBusy(true);
    await markDone();
    router.back();
  };

  return (
    <Screen style={styles.root} minBottomPadding={24}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.center} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>WELCOME TO SLIDEREP</Text>
        <Text style={styles.subtext}>
          Create a local profile to save your sessions, or skip for now — you can always create one later.
        </Text>
        <Pressable
          disabled={busy}
          onPress={createProfile}
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.primaryBtnText}>CREATE PROFILE</Text>
        </Pressable>
        <Pressable
          disabled={busy}
          onPress={continueAnonymous}
          style={({ pressed }) => [styles.skipBtn, pressed && styles.btnPressed]}
        >
          <Text style={styles.skipBtnText}>CONTINUE ANONYMOUS</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  // Scrolls only when its content doesn't fit, e.g. with the keyboard open (change responsive-review);
  // otherwise centered as before.
  scroll: {
    flex: 1,
  },
  center: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  primaryBtn: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    paddingHorizontal: 52,
    paddingVertical: 16,
    marginTop: 8,
  },
  primaryBtnText: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.accent,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  skipBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipBtnText: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: colors.muted,
    letterSpacing: 1.5,
  },
  btnPressed: {
    opacity: 0.55,
  },
});
