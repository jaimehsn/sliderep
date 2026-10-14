import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  useFonts,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

import { Screen } from '@/components/screen';
import { HF } from '@/constants/hf';
import { useProfile } from '@/hooks/use-profile';

export default function HubScreen() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
  });
  const { profile, loaded: profileLoaded } = useProfile();

  if (!fontsLoaded || !profileLoaded) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  return (
    <Screen style={styles.root} minBottomPadding={24}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.appName}>SLIDEREP</Text>
            <Text style={styles.subtitle}>judge a workout</Text>
          </View>
          <Pressable
            onPress={() => router.push(profile ? '/my-qr' : '/profile')}
            style={({ pressed }) => [styles.qrBtn, pressed && styles.qrBtnPressed]}
          >
            <Text style={styles.qrBtnText}>{profile ? 'MY QR' : 'PROFILE'}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Start a session */}
      <View style={styles.center}>
        <Pressable
          onPress={() => router.push('/session/wod')}
          style={({ pressed }) => [styles.selectBtn, pressed && styles.selectBtnPressed]}
        >
          <Text style={styles.selectBtnText}>NEW SESSION</Text>
        </Pressable>
      </View>

      <View style={styles.divider} />

      {/* Hub sections — coming in B23/B24/B25 */}
      <View style={styles.sections}>
        {[
          { label: 'HISTORY', sub: 'your sessions' },
          { label: 'LIBRARY', sub: 'wods & exercises' },
          { label: 'SETTINGS', sub: 'profile & version' },
        ].map(({ label, sub }) => (
          <Pressable key={label} style={styles.sectionBtn} disabled>
            <Text style={styles.sectionLabel}>{label}</Text>
            <Text style={styles.sectionSub}>coming soon</Text>
          </Pressable>
        ))}
      </View>

    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HF.bg,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  qrBtn: {
    borderWidth: 1,
    borderColor: HF.hairlineStrong,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
  },
  qrBtnPressed: {
    opacity: 0.5,
  },
  qrBtnText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.inkDim,
    letterSpacing: 1.5,
  },
  appName: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 32,
    color: HF.ink,
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  // ── Dividers ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: HF.hairline,
    marginHorizontal: 24,
  },

  // ── Start a session ────────────────────────────────────────────────────────
  center: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  selectBtn: {
    borderWidth: 1.5,
    borderColor: HF.accent,
    paddingHorizontal: 52,
    paddingVertical: 16,
  },
  selectBtnPressed: {
    opacity: 0.55,
  },
  selectBtnText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 18,
    color: HF.accent,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },

  // ── Hub sections ───────────────────────────────────────────────────────────
  sections: {
    flex: 1,
  },
  sectionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    opacity: 0.3,
  },
  sectionLabel: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 14,
    color: HF.ink,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  sectionSub: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 9,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
