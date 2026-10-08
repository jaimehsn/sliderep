import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  useFonts,
  BarlowCondensed_400Regular,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

import { Screen } from '@/components/screen';
import { HF } from '@/constants/hf';
import { WodId, getWodConfig } from '@/constants/wods';

const WOD_KEYS: WodId[] = ['fran', 'cindy', 'everyMinute', 'filthyFifty'];

const WOD_DESCRIPTIONS: Record<WodId, string> = {
  fran:        '21-15-9 · thrusters + pull-ups',
  cindy:       '12 min · pull-ups, push-ups, air squats',
  everyMinute: '10 min · burpees + kb swings',
  filthyFifty: '10 stations · 50 reps each',
};

export default function WodSelectScreen() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_400Regular,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  return (
    <Screen style={styles.root} minBottomPadding={24}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.appName}>SLIDEREP</Text>
            <Text style={styles.subtitle}>select a workout</Text>
          </View>
          <Pressable
            onPress={() => router.push('/my-qr')}
            style={({ pressed }) => [styles.qrBtn, pressed && styles.qrBtnPressed]}
          >
            <Text style={styles.qrBtnText}>MY QR</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.divider} />

      {/* WOD list */}
      <View style={styles.list}>
        {WOD_KEYS.map((key, i) => {
          const config = getWodConfig(key);
          return (
            <View key={key}>
              <Pressable
                onPress={() => router.push(`/judge/${key}`)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <View style={styles.cardBody}>
                  <Text style={styles.cardMode}>{config.mode}</Text>
                  <Text style={styles.cardName}>{config.name}</Text>
                  <Text style={styles.cardDesc}>{WOD_DESCRIPTIONS[key]}</Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </Pressable>
              {i < WOD_KEYS.length - 1 && <View style={styles.separator} />}
            </View>
          );
        })}
      </View>

      <View style={styles.divider} />

      {/* New WOD — placeholder for later */}
      <Pressable style={styles.newWodBtn} disabled>
        <View>
          <Text style={styles.newWodLabel}>+ NEW WORKOUT</Text>
          <Text style={styles.newWodSub}>coming soon</Text>
        </View>
      </Pressable>

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

  // ── WOD list ───────────────────────────────────────────────────────────────
  list: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  cardPressed: {
    opacity: 0.5,
  },
  cardBody: {
    flex: 1,
  },
  cardMode: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 9,
    color: HF.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardName: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 28,
    color: HF.ink,
    letterSpacing: 2,
    textTransform: 'uppercase',
    lineHeight: 28,
  },
  cardDesc: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 1,
    marginTop: 4,
  },
  cardArrow: {
    fontFamily: 'BarlowCondensed_400Regular',
    fontSize: 28,
    color: HF.mutedDim,
    marginLeft: 16,
  },
  separator: {
    height: 1,
    backgroundColor: HF.hairline,
  },

  // ── Dividers ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: HF.hairline,
    marginHorizontal: 24,
  },

  // ── New WOD button ─────────────────────────────────────────────────────────
  newWodBtn: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    opacity: 0.3,
  },
  newWodLabel: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 14,
    color: HF.ink,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  newWodSub: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 9,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
