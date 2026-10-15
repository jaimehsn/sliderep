import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import {
  useFonts,
  BarlowCondensed_600SemiBold,
} from '@expo-google-fonts/barlow-condensed';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

import { Screen } from '@/components/screen';
import { HF } from '@/constants/hf';
import { useProfile } from '@/hooks/use-profile';

export default function SettingsScreen() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold,
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
          <Text style={styles.title}>SETTINGS</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            hitSlop={12}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Settings rows */}
      <View style={styles.sections}>
        <Pressable
          style={({ pressed }) => [styles.sectionBtn, pressed && styles.sectionBtnPressed]}
          onPress={() => router.push('/profile')}
        >
          <Text style={styles.sectionLabel}>PROFILE</Text>
          <Text style={styles.sectionSub}>{profile ? `· ${profile.alias}` : 'no profile yet'}</Text>
        </Pressable>

        <View style={styles.sectionBtn}>
          <Text style={styles.sectionLabel}>VERSION</Text>
          <Text style={styles.sectionSub}>v{Constants.expoConfig?.version ?? '—'}</Text>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  closeBtn: {
    marginLeft: 16,
  },
  closeBtnPressed: {
    opacity: 0.4,
  },
  closeBtnText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 18,
    color: HF.muted,
    lineHeight: 22,
  },

  // ── Dividers ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: HF.hairline,
    marginHorizontal: 24,
  },

  // ── Settings rows ──────────────────────────────────────────────────────────
  sections: {
    flex: 1,
  },
  sectionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionBtnPressed: {
    opacity: 0.5,
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
