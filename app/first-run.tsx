import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  useFonts,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

import { HF } from '@/constants/hf';
import { Screen } from '@/components/screen';
import { useFirstRun } from '@/hooks/use-first-run';

export default function FirstRunScreen() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
  });
  const { markDone } = useFirstRun();
  const [busy, setBusy] = useState(false);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

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
      <View style={styles.center}>
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
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HF.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  title: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 26,
    color: HF.ink,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 18,
  },
  primaryBtn: {
    borderWidth: 1.5,
    borderColor: HF.accent,
    paddingHorizontal: 52,
    paddingVertical: 16,
    marginTop: 8,
  },
  primaryBtnText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 18,
    color: HF.accent,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  skipBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipBtnText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 12,
    color: HF.muted,
    letterSpacing: 1.5,
  },
  btnPressed: {
    opacity: 0.55,
  },
});
